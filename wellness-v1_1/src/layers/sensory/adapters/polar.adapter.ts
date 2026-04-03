import type { SensoryAdapterContract, SessionSource, SignalSnapshot } from '../../../core/contracts';
import type { WearableAdapterContext, WearableAdapterSession, WearableTelemetry } from './wearable.adapter.contract';
import { createSimSnapshot } from './sim.adapter';
import { WearableAdapterStub } from './wearable.adapter.contract';

const HEART_RATE_SERVICE = 0x180d;
const HEART_RATE_MEASUREMENT = 0x2a37;
const BATTERY_SERVICE = 0x180f;
const BATTERY_LEVEL = 0x2a19;

type BluetoothValueLike = {
  value?: DataView | null;
  readValue?: () => Promise<DataView>;
  startNotifications?: () => Promise<void>;
  stopNotifications?: () => Promise<void>;
  addEventListener?: (type: string, listener: (event: Event) => void) => void;
  removeEventListener?: (type: string, listener: (event: Event) => void) => void;
};

type BluetoothServiceLike = {
  getCharacteristic: (characteristic: number) => Promise<BluetoothValueLike>;
};

type BluetoothServerLike = {
  getPrimaryService: (service: number) => Promise<BluetoothServiceLike>;
};

type BluetoothDeviceLike = {
  name?: string;
  gatt?: {
    connect: () => Promise<BluetoothServerLike>;
    disconnect: () => void;
  } | null;
};

type BluetoothNavigatorLike = Navigator & {
  bluetooth?: {
    requestDevice: (options: unknown) => Promise<BluetoothDeviceLike>;
  };
};

export class PolarAdapter extends WearableAdapterStub {
  readonly descriptor: SensoryAdapterContract = {
    id: 'polar-h10',
    label: 'Polar H10 Adapter',
    kind: 'wearable',
    status: 'standby',
    wearableReady: true,
    transport: 'web-bluetooth',
    channels: ['hr', 'rr', 'hrv'],
    integrationStatus: 'pairing-ready',
    requirements: [
      'Chromium browser with Web Bluetooth enabled',
      'Secure context (https or localhost)',
      'User gesture required for requestDevice()',
    ],
    nextStep: 'Pair with Polar H10, subscribe to heart rate measurement notifications, and convert RR intervals into HRV features.',
    notes: 'Real-device-ready skeleton with UUIDs, pairing path, notification entry points, and telemetry hooks for battery and transport health.',
  };

  readonly source: SessionSource = {
    kind: 'wearable',
    label: 'Polar H10 Wearable Runtime',
    adapterId: this.descriptor.id,
    wearableReady: true,
  };

  private device: BluetoothDeviceLike | null = null;
  private characteristic: BluetoothValueLike | null = null;
  private batteryCharacteristic: BluetoothValueLike | null = null;
  private notifyHandler: ((event: Event) => void) | null = null;
  private onSnapshot?: (snapshot: SignalSnapshot) => void;
  private onTelemetry?: (telemetry: WearableTelemetry) => void;

  async isSupported(): Promise<boolean> {
    const nav = typeof navigator !== 'undefined' ? (navigator as BluetoothNavigatorLike) : undefined;
    return typeof nav?.bluetooth?.requestDevice === 'function';
  }

  async connect(context: WearableAdapterContext): Promise<WearableAdapterSession> {
    const nav = navigator as BluetoothNavigatorLike;
    if (!(await this.isSupported()) || !nav.bluetooth) {
      throw new Error('Web Bluetooth is not available in this browser context.');
    }

    this.onSnapshot = context.onSnapshot;
    this.onTelemetry = context.onTelemetry;
    this.device = await nav.bluetooth.requestDevice({
      filters: [{ services: [HEART_RATE_SERVICE] }],
      optionalServices: [BATTERY_SERVICE],
    });

    const server = await this.device.gatt?.connect();
    if (!server) {
      throw new Error('Unable to connect to the Polar H10 GATT server.');
    }

    const heartRateService = await server.getPrimaryService(HEART_RATE_SERVICE);
    this.characteristic = await heartRateService.getCharacteristic(HEART_RATE_MEASUREMENT);

    try {
      const batteryService = await server.getPrimaryService(BATTERY_SERVICE);
      this.batteryCharacteristic = await batteryService.getCharacteristic(BATTERY_LEVEL);
    } catch {
      this.batteryCharacteristic = null;
    }

    this.connected = true;
    const telemetry = await this.readTelemetry('stable');
    this.onTelemetry?.(telemetry);

    return {
      source: this.source,
      connectedAt: new Date().toISOString(),
      streaming: this.streaming,
      telemetry,
    };
  }

  async startStream(context: WearableAdapterContext): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Polar H10 characteristic is not ready. Connect first.');
    }

    this.onSnapshot = context.onSnapshot;
    this.onTelemetry = context.onTelemetry;
    this.notifyHandler = (event: Event) => {
      const target = event.target as BluetoothValueLike | null;
      const value = target?.value;
      if (!value) return;
      const reading = this.parseHeartRateMeasurement(value);
      const snapshot = this.mapReadingToSnapshot(reading.heartRate, reading.rrIntervalsMs[0] ?? null);
      this.onSnapshot?.(snapshot);
      this.onTelemetry?.({
        deviceName: this.device?.name ?? this.descriptor.label,
        batteryLevel: null,
        signalStrength: this.estimateSignalStrength(reading.rrIntervalsMs.length, reading.heartRate),
        transportHealth: reading.rrIntervalsMs.length > 0 ? 'stable' : 'watch',
        firmwareLabel: 'Polar H10 BLE',
        lastSeenAt: new Date().toISOString(),
      });
    };

    await this.characteristic.startNotifications?.();
    this.characteristic.addEventListener?.('characteristicvaluechanged', this.notifyHandler);
    this.streaming = true;
  }

  async stopStream(): Promise<void> {
    if (this.characteristic && this.notifyHandler) {
      this.characteristic.removeEventListener?.('characteristicvaluechanged', this.notifyHandler);
      await this.characteristic.stopNotifications?.();
    }
    this.notifyHandler = null;
    this.streaming = false;
  }

  async disconnect(): Promise<void> {
    await this.stopStream();
    this.device?.gatt?.disconnect();
    this.characteristic = null;
    this.batteryCharacteristic = null;
    this.device = null;
    this.connected = false;
  }

  private async readTelemetry(transportHealth: WearableTelemetry['transportHealth']): Promise<WearableTelemetry> {
    let batteryLevel: number | null = null;

    try {
      const value = await this.batteryCharacteristic?.readValue?.();
      if (value && value.byteLength > 0) {
        batteryLevel = value.getUint8(0);
      }
    } catch {
      batteryLevel = null;
    }

    return {
      deviceName: this.device?.name ?? this.descriptor.label,
      batteryLevel,
      signalStrength: batteryLevel !== null ? Math.max(58, Math.min(98, batteryLevel + 8)) : 72,
      transportHealth,
      firmwareLabel: 'Polar H10 BLE',
      lastSeenAt: new Date().toISOString(),
    };
  }

  private parseHeartRateMeasurement(view: DataView) {
    const flags = view.getUint8(0);
    const isUint16 = (flags & 0x01) !== 0;
    let offset = 1;
    const heartRate = isUint16 ? view.getUint16(offset, true) : view.getUint8(offset);
    offset += isUint16 ? 2 : 1;

    if ((flags & 0x08) !== 0) {
      offset += 2;
    }
    if ((flags & 0x10) !== 0) {
      offset += 2;
    }

    const rrIntervalsMs: number[] = [];
    while (offset + 1 < view.byteLength) {
      const rr = view.getUint16(offset, true);
      rrIntervalsMs.push(Number(((rr / 1024) * 1000).toFixed(2)));
      offset += 2;
    }

    return { heartRate, rrIntervalsMs };
  }

  private estimateSignalStrength(rrCount: number, heartRate: number) {
    const base = rrCount > 0 ? 82 : 68;
    const rhythmBias = heartRate > 44 && heartRate < 180 ? 6 : -10;
    return Math.max(18, Math.min(100, base + rhythmBias));
  }

  private mapReadingToSnapshot(heartRate: number, rrMs: number | null): SignalSnapshot {
    const seed = Date.now();
    const base = createSimSnapshot(seed);
    const rr = rrMs ? Number((60000 / rrMs).toFixed(2)) : base.rr;
    const hrv = rrMs ? Number((Math.abs(rrMs - 820) / 8 + 24).toFixed(2)) : base.hrv;

    return {
      ...base,
      hr: heartRate,
      rr,
      hrv,
      coherence: Number((Math.min(0.95, base.coherence + 0.04)).toFixed(2)),
      stressIndex: Number((Math.max(0.12, base.stressIndex - 0.05)).toFixed(2)),
      timestamp: new Date(seed).toISOString(),
    };
  }
}

export const polarAdapter = new PolarAdapter();
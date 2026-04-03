import type { SensoryAdapterContract, SessionSource, SignalSnapshot } from '../../../core/contracts';

export type WearableTelemetry = {
  deviceName?: string;
  batteryLevel?: number | null;
  signalStrength?: number | null;
  transportHealth?: 'stable' | 'watch' | 'degraded';
  firmwareLabel?: string | null;
  lastSeenAt?: string;
};

export type WearableAdapterSession = {
  source: SessionSource;
  connectedAt: string | null;
  streaming: boolean;
  telemetry?: WearableTelemetry;
};

export type WearableAdapterContext = {
  profileId: string;
  onSnapshot?: (snapshot: SignalSnapshot) => void;
  onTelemetry?: (telemetry: WearableTelemetry) => void;
};

export interface WearableAdapter {
  readonly descriptor: SensoryAdapterContract;
  readonly source: SessionSource;
  isSupported(): Promise<boolean>;
  connect(context: WearableAdapterContext): Promise<WearableAdapterSession>;
  disconnect(): Promise<void>;
  startStream(context: WearableAdapterContext): Promise<void>;
  stopStream(): Promise<void>;
}

export abstract class WearableAdapterStub implements WearableAdapter {
  abstract readonly descriptor: SensoryAdapterContract;
  abstract readonly source: SessionSource;

  protected connected = false;
  protected streaming = false;

  async isSupported(): Promise<boolean> {
    return true;
  }

  async connect(_context: WearableAdapterContext): Promise<WearableAdapterSession> {
    this.connected = true;
    return {
      source: this.source,
      connectedAt: new Date().toISOString(),
      streaming: this.streaming,
    };
  }

  async disconnect(): Promise<void> {
    this.streaming = false;
    this.connected = false;
  }

  async startStream(_context: WearableAdapterContext): Promise<void> {
    this.streaming = true;
  }

  async stopStream(): Promise<void> {
    this.streaming = false;
  }
}
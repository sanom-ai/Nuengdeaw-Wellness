import type { SensoryAdapterContract, SessionSource } from '../../../core/contracts';
import { WearableAdapterStub } from './wearable.adapter.contract';

export class MuseAdapter extends WearableAdapterStub {
  readonly descriptor: SensoryAdapterContract = {
    id: 'muse-s',
    label: 'Muse S Adapter',
    kind: 'wearable',
    status: 'standby',
    wearableReady: true,
    transport: 'web-bluetooth',
    channels: ['theta', 'alpha', 'beta', 'gamma', 'coherence'],
    integrationStatus: 'stub-ready',
    requirements: [
      'Muse BLE characteristic map',
      'Browser or bridge that can access BLE notifications',
      'EEG frame normalization pipeline',
    ],
    nextStep: 'Implement BLE characteristic mapping for EEG frames and derived coherence metrics.',
    notes: 'Prepared for headband-based neurofeedback and explainable cognition traces.',
  };

  readonly source: SessionSource = {
    kind: 'wearable',
    label: 'Muse Wearable Runtime',
    adapterId: this.descriptor.id,
    wearableReady: true,
  };
}

export const museAdapter = new MuseAdapter();
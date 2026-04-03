import type { SensoryAdapterContract, SessionSource } from '../../../core/contracts';
import { WearableAdapterStub } from './wearable.adapter.contract';

export class EmpaticaAdapter extends WearableAdapterStub {
  readonly descriptor: SensoryAdapterContract = {
    id: 'empatica-e4',
    label: 'Empatica E4 Adapter',
    kind: 'wearable',
    status: 'standby',
    wearableReady: true,
    transport: 'sdk-bridge',
    channels: ['hr', 'hrv', 'gsr', 'rr', 'stress'],
    integrationStatus: 'stub-ready',
    requirements: [
      'Empatica SDK bridge or desktop relay',
      'Authenticated device session',
      'EDA/BVP feature extraction mapping',
    ],
    nextStep: 'Implement SDK bridge ingestion for BVP, EDA, temperature, and derived stress features.',
    notes: 'Prepared for multimodal autonomic sensing and research-grade artifact review.',
  };

  readonly source: SessionSource = {
    kind: 'wearable',
    label: 'Empatica Wearable Runtime',
    adapterId: this.descriptor.id,
    wearableReady: true,
  };
}

export const empaticaAdapter = new EmpaticaAdapter();
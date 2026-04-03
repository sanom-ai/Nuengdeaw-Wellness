import { empaticaAdapter } from './empatica.adapter';
import { museAdapter } from './muse.adapter';
import { polarAdapter } from './polar.adapter';

export const wearableAdapters = [polarAdapter, museAdapter, empaticaAdapter];
export const wearableAdapterContracts = wearableAdapters.map((adapter) => adapter.descriptor);
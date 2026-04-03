import type { AssessmentDecision, SignalSnapshot } from '../../core/contracts';

export type AuraState = {
  primary: string;
  secondary: string;
  tertiary: string;
  pulse: number;
  density: number;
  turbulence: number;
  breath: number;
  halo: number;
  meshDrift: number;
  harmonicBias: 'grounded' | 'rising' | 'intense';
};

export function mapAuraState(snapshot: SignalSnapshot, decision: AssessmentDecision): AuraState {
  const pulse = Math.max(0.2, Math.min(0.95, snapshot.stressIndex + 0.2));
  const coherenceHigh = snapshot.coherence > 0.72;
  const turbulence = Math.max(0.12, Math.min(0.96, 1 - snapshot.coherence + snapshot.stressIndex * 0.35));
  const breath = Math.max(0.18, Math.min(0.92, snapshot.rr / 18));
  const halo = Math.max(0.28, Math.min(0.98, snapshot.hrv / 120 + snapshot.coherence * 0.25));
  const meshDrift = Math.max(0.18, Math.min(0.88, snapshot.hr / 120));

  let primary = '#52f7d4';
  let secondary = coherenceHigh ? '#efc36d' : '#4da7ff';
  let tertiary = '#f7f3e8';
  let harmonicBias: AuraState['harmonicBias'] = 'grounded';

  if (decision.severity === 'warning') {
    primary = '#ff7a88';
    secondary = '#ffb36b';
    tertiary = '#ffe5c2';
    harmonicBias = 'rising';
  }

  if (decision.severity === 'critical') {
    primary = '#ff5f7a';
    secondary = '#8d6bff';
    tertiary = '#ffd6de';
    harmonicBias = 'intense';
  }

  if (decision.severity === 'normal' && snapshot.coherence >= 0.78) {
    secondary = '#7ee081';
    tertiary = '#f6edc7';
  }

  return {
    primary,
    secondary,
    tertiary,
    pulse,
    density: Math.max(18, Math.round(26 + snapshot.hr / 4 + snapshot.coherence * 10)),
    turbulence,
    breath,
    halo,
    meshDrift,
    harmonicBias,
  };
}
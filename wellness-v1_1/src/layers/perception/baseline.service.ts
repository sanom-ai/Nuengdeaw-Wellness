import type { SignalSnapshot } from '../../core/contracts';

export function deriveBaselineWindow(samples: SignalSnapshot[]) {
  const count = Math.max(samples.length, 1);
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / count;

  return {
    hr: mean(samples.map((s) => s.hr)),
    hrv: mean(samples.map((s) => s.hrv)),
    gsr: mean(samples.map((s) => s.gsr)),
    rr: mean(samples.map((s) => s.rr)),
  };
}

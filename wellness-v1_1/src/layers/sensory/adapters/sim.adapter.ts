import type { SignalSnapshot } from '../../../core/contracts';

export function createSimSnapshot(seed = Date.now()): SignalSnapshot {
  const t = seed / 1000;
  const wobble = (base: number, swing: number, speed: number) =>
    Number((base + Math.sin(t * speed) * swing).toFixed(2));

  return {
    hr: wobble(78, 10, 1.1),
    hrv: wobble(34, 12, 0.7),
    gsr: wobble(7.5, 2.2, 0.8),
    rr: wobble(16, 4, 0.6),
    theta: wobble(1.2, 0.4, 0.9),
    alpha: wobble(1.6, 0.3, 0.5),
    beta: wobble(1.1, 0.25, 1.2),
    gamma: wobble(0.55, 0.12, 1.4),
    coherence: wobble(0.72, 0.16, 0.45),
    stressIndex: wobble(0.36, 0.22, 0.95),
    timestamp: new Date(seed).toISOString(),
  };
}

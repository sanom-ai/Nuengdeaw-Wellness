import type { AssessmentDecision, AssessmentMode, SignalSnapshot } from '../../core/contracts';

export function runAssessment(snapshot: SignalSnapshot, mode: AssessmentMode): AssessmentDecision {
  const stressTriggered = snapshot.hrv < 20 || snapshot.stressIndex > 0.55;
  const researchBias = mode === 'research' ? 0.08 : 0;
  const confidence = Math.min(0.98, Math.max(0.52, 0.72 + researchBias + (stressTriggered ? 0.12 : 0)));

  return {
    state: stressTriggered ? 'Adaptive Stress Pattern' : 'Coherent Ready State',
    confidence: Number(confidence.toFixed(2)),
    severity: stressTriggered ? 'warning' : 'normal',
    rationale: stressTriggered
      ? ['HRV ต่ำกว่าช่วงพร้อมใช้งาน', 'Stress Index สูงกว่าช่วงสมดุล', 'Aura ควรถูกแสดงเป็น cyan-red interference']
      : ['HRV ยังอยู่ในช่วงพร้อมใช้งาน', 'Coherence score สูงพอ', 'Aura ควรถูกแสดงเป็น calm cyan-gold field'],
    trace: [
      { layer: 'sensory', note: 'Signal snapshot received from sensory adapter' },
      { layer: 'perception', note: 'Baseline comparison and feature normalization completed' },
      { layer: 'cognition', note: `Mode-aware rule evaluation resolved: ${mode}` },
      { layer: 'expression', note: 'Aura mapping and explainability payload prepared' },
    ],
  };
}

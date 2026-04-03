export type SignalSnapshot = {
  hr: number;
  hrv: number;
  gsr: number;
  rr: number;
  theta: number;
  alpha: number;
  beta: number;
  gamma: number;
  coherence: number;
  stressIndex: number;
  timestamp: string;
};

export type AssessmentMode = 'personal' | 'clinic' | 'research';

export type ConsciousnessLayer = 'sensory' | 'perception' | 'cognition' | 'expression' | 'memory';

export type AssessmentDecision = {
  state: string;
  confidence: number;
  severity: 'normal' | 'warning' | 'critical';
  rationale: string[];
  trace: Array<{ layer: ConsciousnessLayer; note: string }>;
};

export type BioStreamEvent = {
  type: 'signal.snapshot' | 'assessment.updated' | 'mode.changed';
  layer: ConsciousnessLayer;
  payload: unknown;
  at: number;
};

export type RawSignalChannel = {
  id: 'hr' | 'hrv' | 'gsr' | 'rr' | 'theta' | 'alpha' | 'beta' | 'gamma' | 'coherence' | 'stress';
  label: string;
  value: number;
  unit: string;
  normalized: number;
  quality: 'clean' | 'watch' | 'artifact';
};

export type ArtifactFlag = {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  status: 'stable' | 'watch' | 'artifact';
  note: string;
};

export type ConfidenceSlice = {
  id: string;
  label: string;
  value: number;
  note: string;
};

export type ExplainableTimelineEntry = {
  id: string;
  at: number;
  stage: ConsciousnessLayer;
  title: string;
  detail: string;
  weight: number;
};

export type WaveformPoint = {
  at: number;
  value: number;
};

export type WaveformSeries = {
  id: 'hr' | 'hrv' | 'gsr' | 'rr' | 'coherence' | 'stress';
  label: string;
  unit: string;
  color: string;
  points: WaveformPoint[];
};

export type SessionSource = {
  kind: 'human-sim' | 'wearable';
  label: string;
  adapterId: string;
  wearableReady: boolean;
};

export type SensoryAdapterContract = {
  id: string;
  label: string;
  kind: SessionSource['kind'];
  status: 'active' | 'connected' | 'standby';
  wearableReady: boolean;
  transport: 'sim' | 'web-bluetooth' | 'web-serial' | 'sdk-bridge';
  channels: string[];
  integrationStatus: 'live' | 'stub-ready' | 'planned' | 'pairing-ready';
  requirements: string[];
  nextStep: string;
  notes: string;
};

export type ReplayState = {
  active: boolean;
  label: string;
  importedAt: string | null;
};

export type BaselineProfile = {
  profileType: 'human-sim-baseline' | 'wearable-runtime' | 'replay-baseline';
  hrResting: number;
  hrvReference: number;
  respirationReference: number;
  coherenceReference: number;
  stressReference: number;
};

export type ResearchSessionSummary = {
  sessionLabel: string;
  sourceLabel: string;
  readinessScore: number;
  state: string;
  confidence: number;
  severity: AssessmentDecision['severity'];
  artifactLoad: number;
  artifactStatus: 'stable' | 'watch' | 'artifact-heavy';
  recommendation: string;
  handoffPriority: 'routine' | 'watch' | 'priority';
  generatedAt: string;
};

export type ResearchExportPayload = {
  schemaVersion: '1.2';
  exportedAt: string;
  mode: AssessmentMode;
  source: SessionSource;
  summary: {
    state: string;
    confidence: number;
    severity: AssessmentDecision['severity'];
    ticks: number;
  };
  baselineProfile: BaselineProfile;
  sessionSummary: ResearchSessionSummary;
  latestSnapshot: SignalSnapshot;
  rawSignals: RawSignalChannel[];
  artifacts: ArtifactFlag[];
  confidenceMap: ConfidenceSlice[];
  timeline: ExplainableTimelineEntry[];
  waveformSeries: WaveformSeries[];
  recentEvents: BioStreamEvent[];
};

export type ResearchDiagnostics = {
  source: SessionSource;
  adapters: SensoryAdapterContract[];
  replay: ReplayState;
  rawSignals: RawSignalChannel[];
  artifacts: ArtifactFlag[];
  confidenceMap: ConfidenceSlice[];
  timeline: ExplainableTimelineEntry[];
  waveformSeries: WaveformSeries[];
  baselineProfile: BaselineProfile;
  sessionSummary: ResearchSessionSummary;
  exportPayload: ResearchExportPayload;
};
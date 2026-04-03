import { writable } from 'svelte/store';
import type {
  ArtifactFlag,
  BaselineProfile,
  AssessmentDecision,
  AssessmentMode,
  BioStreamEvent,
  ConfidenceSlice,
  RawSignalChannel,
  ResearchSessionSummary,
  ResearchDiagnostics,
  ResearchExportPayload,
  ReplayState,
  SensoryAdapterContract,
  SessionSource,
  SignalSnapshot,
  ExplainableTimelineEntry,
  WaveformSeries,
} from '../core/contracts';
import { createSimSnapshot } from '../layers/sensory/adapters/sim.adapter';
import { wearableAdapters, wearableAdapterContracts } from '../layers/sensory/adapters/wearable.registry';
import { runAssessment } from '../layers/cognition/assessment.pipeline';
import { mapAuraState } from '../layers/expression/aura.presenter';
import { createSessionLog } from '../layers/memory/session-log';
import { bioStream } from '../core/biostream/BioStream';
import type { WearableTelemetry } from '../layers/sensory/adapters/wearable.adapter.contract';

type StreamStats = {
  ticks: number;
  lastLatencyMs: number;
  coherenceBand: 'low' | 'medium' | 'high';
  activeModeLabel: string;
};

type MeshNode = {
  id: string;
  label: string;
  layer: 'sensory' | 'perception' | 'cognition' | 'expression' | 'memory';
  intensity: number;
  status: 'calm' | 'active' | 'alert';
};

type DeviceLogEntry = {
  at: number;
  level: 'info' | 'warn' | 'error';
  message: string;
};

type DeviceConsoleState = {
  activeAdapterId: string;
  activeLabel: string;
  connectionState: 'live-sim' | 'pairing' | 'connected' | 'mock-connected' | 'replay';
  browserBluetoothAvailable: boolean;
  permissionState: 'unknown' | 'ready' | 'prompt-required' | 'unsupported' | 'denied';
  batteryLevel: number | null;
  signalStrength: number | null;
  deviceName: string | null;
  transportHealth: 'stable' | 'watch' | 'degraded' | 'unknown';
  firmwareLabel: string | null;
  lastSeenAt: string | null;
  lastFailureReason: string | null;
  readinessScore: number;
  troubleshootingSteps: string[];
  logs: DeviceLogEntry[];
};

type AppState = {
  mode: AssessmentMode;
  snapshot: SignalSnapshot;
  decision: AssessmentDecision;
  aura: ReturnType<typeof mapAuraState>;
  traceLog: Array<{ snapshot: SignalSnapshot; decision: AssessmentDecision }>;
  eventFeed: BioStreamEvent[];
  streamStats: StreamStats;
  signalMesh: MeshNode[];
  diagnostics: ResearchDiagnostics;
  deviceConsole: DeviceConsoleState;
};

const log = createSessionLog();
const initialMode: AssessmentMode = 'personal';
const initialSnapshot = createSimSnapshot();
const initialDecision = runAssessment(initialSnapshot, initialMode);
const maxWaveformPoints = 40;
const maxDeviceLogs = 12;
const humanSimDescriptor: SensoryAdapterContract = {
  id: 'humansim-v1',
  label: 'HumanSim Primary Runtime',
  kind: 'human-sim',
  status: 'active',
  wearableReady: true,
  transport: 'sim',
  channels: ['hr', 'hrv', 'gsr', 'rr', 'theta', 'alpha', 'beta', 'gamma', 'coherence', 'stress'],
  integrationStatus: 'live',
  requirements: ['No hardware required', 'Browser runtime only', 'Acts as baseline for comparison against wearable streams'],
  nextStep: 'Keep HumanSim as the baseline runtime while wearable adapters are activated progressively.',
  notes: 'Primary simulation stream for design, diagnostics, and research handoff.',
};
const initialSource: SessionSource = {
  kind: 'human-sim',
  label: humanSimDescriptor.label,
  adapterId: humanSimDescriptor.id,
  wearableReady: true,
};
const defaultReplayState: ReplayState = {
  active: false,
  label: 'Live runtime',
  importedAt: null,
};

let currentMode: AssessmentMode = initialMode;
let tickCount = 0;
let streamTimer: number | null = null;
let waveformHistory = createEmptyWaveforms();
let replayState: ReplayState = { ...defaultReplayState };
let currentSource: SessionSource = { ...initialSource };
let currentConnectionState: DeviceConsoleState['connectionState'] = 'live-sim';
let browserBluetoothAvailable = false;
let permissionState: DeviceConsoleState['permissionState'] = 'unknown';
let batteryLevel: number | null = null;
let signalStrength: number | null = null;
let deviceName: string | null = null;
let transportHealth: DeviceConsoleState['transportHealth'] = 'unknown';
let firmwareLabel: string | null = null;
let lastSeenAt: string | null = null;
let lastFailureReason: string | null = null;
let deviceLogs: DeviceLogEntry[] = [{ at: Date.now(), level: 'info', message: 'HumanSim baseline runtime active.' }];
let adapterRegistry: SensoryAdapterContract[] = createAdapterRegistry(initialSource.adapterId, currentConnectionState);

function createAdapterRegistry(activeAdapterId: string, connectionState: DeviceConsoleState['connectionState']): SensoryAdapterContract[] {
  return [humanSimDescriptor, ...wearableAdapterContracts].map((adapter) => ({
    ...adapter,
    status: adapter.id === activeAdapterId
      ? adapter.kind === 'wearable'
        ? connectionState === 'connected' ? 'connected' : 'active'
        : 'active'
      : 'standby',
  }));
}

function applyActiveAdapter(adapterId: string, connectionState: DeviceConsoleState['connectionState']) {
  adapterRegistry = createAdapterRegistry(adapterId, connectionState);
}

function findAdapter(adapterId: string) {
  return wearableAdapters.find((adapter) => adapter.descriptor.id === adapterId);
}

function pushDeviceLog(level: DeviceLogEntry['level'], message: string) {
  deviceLogs = [{ at: Date.now(), level, message }, ...deviceLogs].slice(0, maxDeviceLogs);
}

function createDeviceConsole(): DeviceConsoleState {
  return {
    activeAdapterId: currentSource.adapterId,
    activeLabel: currentSource.label,
    connectionState: currentConnectionState,
    browserBluetoothAvailable,
    permissionState,
    batteryLevel,
    signalStrength,
    deviceName,
    transportHealth,
    firmwareLabel,
    lastSeenAt,
    lastFailureReason,
    readinessScore: computeReadinessScore(),
    troubleshootingSteps: buildTroubleshootingSteps(),
    logs: deviceLogs,
  };
}

function computeReadinessScore() {
  if (currentConnectionState === 'connected') {
    const batteryScore = batteryLevel !== null ? 62 + Math.round(batteryLevel * 0.22) : 78;
    const signalScore = signalStrength !== null ? Math.round(signalStrength * 0.18) : 12;
    const healthBonus = transportHealth === 'stable' ? 8 : transportHealth === 'watch' ? 2 : -6;
    return Math.max(20, Math.min(100, batteryScore + signalScore + healthBonus));
  }
  if (currentConnectionState === 'live-sim') return 100;
  if (currentConnectionState === 'replay') return 96;

  let score = 30;
  if (browserBluetoothAvailable) score += 22;
  if (permissionState === 'prompt-required') score += 14;
  if (permissionState === 'ready') score += 24;
  if (batteryLevel !== null) score += Math.min(24, Math.round(batteryLevel * 0.24));
  if (lastFailureReason) score -= 18;

  return Math.max(8, Math.min(100, score));
}

function buildTroubleshootingSteps() {
  const steps: string[] = [];

  if (currentSource.kind === 'human-sim') {
    steps.push('HumanSim is active and healthy. Use this baseline to validate the research surface before pairing hardware.');
    steps.push('When ready for wearable testing, choose an adapter from Research Diagnostics and trigger Pair / Connect.');
    return steps;
  }

  if (!browserBluetoothAvailable) {
    steps.push('Open the app in a Chromium-based browser that supports Web Bluetooth.');
    steps.push('Serve the app from localhost or HTTPS so device APIs are available.');
  }

  if (permissionState === 'prompt-required') {
    steps.push('Trigger Pair / Connect from a direct user gesture so the browser can open the device picker.');
  }

  if (permissionState === 'denied') {
    steps.push('Reset Bluetooth permissions for this site, then retry pairing from the Device Console.');
  }

  if (currentConnectionState === 'pairing') {
    steps.push('Keep the wearable awake and within range while the handshake is in progress.');
  }

  if (signalStrength !== null && signalStrength < 45) {
    steps.push('Signal strength is low. Move the wearable closer and reduce radio interference before collecting a session.');
  }

  if (transportHealth === 'degraded') {
    steps.push('Transport health is degraded. Reconnect the adapter and confirm that heart-rate notifications are still arriving.');
  }

  if (batteryLevel !== null && batteryLevel < 25) {
    steps.push('Charge the wearable before clinical or research use because the battery is below the recommended threshold.');
  }

  if (currentConnectionState === 'mock-connected') {
    steps.push('Mock runtime is active. Live ingestion did not arm, so diagnostics are using adapter-shaped simulation.');
  }

  if (lastFailureReason) {
    steps.push(`Review the latest failure reason: ${lastFailureReason}`);
  }

  if (lastSeenAt && currentConnectionState === 'connected') {
    steps.push('Last telemetry heartbeat: ' + lastSeenAt);
  }

  if (!steps.length) {
    steps.push('Runtime posture looks healthy. Proceed with live acquisition and monitor the event log for incoming frames.');
  }

  return steps;
}

function createEmptyWaveforms(): WaveformSeries[] {
  return [
    { id: 'hr', label: 'Heart Rate', unit: 'bpm', color: '#52f7d4', points: [] },
    { id: 'hrv', label: 'HRV', unit: 'ms', color: '#efc36d', points: [] },
    { id: 'gsr', label: 'GSR', unit: 'uS', color: '#ff7a88', points: [] },
    { id: 'rr', label: 'Respiration', unit: 'br/min', color: '#a48dff', points: [] },
    { id: 'coherence', label: 'Coherence', unit: 'score', color: '#7ee081', points: [] },
    { id: 'stress', label: 'Stress Index', unit: 'score', color: '#4da7ff', points: [] },
  ];
}

function deriveCoherenceBand(snapshot: SignalSnapshot): StreamStats['coherenceBand'] {
  if (snapshot.coherence >= 0.76) return 'high';
  if (snapshot.coherence >= 0.5) return 'medium';
  return 'low';
}

function createMesh(snapshot: SignalSnapshot, decision: AssessmentDecision): MeshNode[] {
  const alert = decision.severity === 'critical' || decision.severity === 'warning';
  return [
    { id: 'sensory', label: 'Sensory Intake', layer: 'sensory', intensity: snapshot.hr / 120, status: 'active' },
    { id: 'perception', label: 'Perception Gate', layer: 'perception', intensity: snapshot.coherence, status: snapshot.coherence > 0.72 ? 'calm' : 'active' },
    { id: 'cognition', label: 'Cognition Core', layer: 'cognition', intensity: decision.confidence, status: alert ? 'alert' : 'active' },
    { id: 'expression', label: 'Aura Expression', layer: 'expression', intensity: Math.min(1, snapshot.stressIndex + 0.28), status: alert ? 'alert' : 'active' },
    { id: 'memory', label: 'Memory Lattice', layer: 'memory', intensity: Math.min(1, 0.35 + tickCount / 40), status: 'calm' },
  ];
}

function createAdapterSnapshot(source: SessionSource, seed = Date.now()): SignalSnapshot {
  const base = createSimSnapshot(seed);

  if (source.adapterId === 'polar-h10') {
    return {
      ...base,
      hr: Number((base.hr + 4).toFixed(2)),
      hrv: Number((base.hrv + 8).toFixed(2)),
      rr: Number((base.rr - 2).toFixed(2)),
      coherence: Number((Math.min(0.94, base.coherence + 0.06)).toFixed(2)),
      stressIndex: Number((Math.max(0.12, base.stressIndex - 0.08)).toFixed(2)),
    };
  }

  if (source.adapterId === 'muse-s') {
    return {
      ...base,
      theta: Number((base.theta + 0.32).toFixed(2)),
      alpha: Number((base.alpha + 0.28).toFixed(2)),
      beta: Number((base.beta - 0.12).toFixed(2)),
      gamma: Number((base.gamma + 0.08).toFixed(2)),
      coherence: Number((Math.min(0.96, base.coherence + 0.09)).toFixed(2)),
      stressIndex: Number((Math.max(0.1, base.stressIndex - 0.1)).toFixed(2)),
    };
  }

  if (source.adapterId === 'empatica-e4') {
    return {
      ...base,
      gsr: Number((base.gsr + 1.1).toFixed(2)),
      hrv: Number((base.hrv - 4).toFixed(2)),
      rr: Number((base.rr + 1.4).toFixed(2)),
      coherence: Number((Math.max(0.28, base.coherence - 0.05)).toFixed(2)),
      stressIndex: Number((Math.min(0.92, base.stressIndex + 0.08)).toFixed(2)),
    };
  }

  return base;
}

function toChannel(id: RawSignalChannel['id'], label: string, value: number, unit: string, normalized: number, quality: RawSignalChannel['quality']): RawSignalChannel {
  return { id, label, value, unit, normalized: Math.max(0, Math.min(1, normalized)), quality };
}

function inferArtifacts(snapshot: SignalSnapshot, decision: AssessmentDecision): ArtifactFlag[] {
  const hrvDrop = snapshot.hrv < 28;
  const gsrSpike = snapshot.gsr > 8.4;
  const coherenceDrop = snapshot.coherence < 0.42;
  const breathSkew = snapshot.rr < 7 || snapshot.rr > 17;

  return [
    {
      id: 'motion',
      label: 'Motion Noise',
      severity: gsrSpike && coherenceDrop ? 'high' : gsrSpike ? 'medium' : 'low',
      status: gsrSpike ? 'artifact' : 'stable',
      note: gsrSpike ? 'GSR spike suggests movement or contact instability.' : 'Electrodermal channel is stable.',
    },
    {
      id: 'contact',
      label: 'Sensor Contact',
      severity: coherenceDrop ? 'medium' : 'low',
      status: coherenceDrop ? 'watch' : 'stable',
      note: coherenceDrop ? 'Coherence fell below expected band, contact quality should be reviewed.' : 'Signal coupling is within expected range.',
    },
    {
      id: 'physiology',
      label: 'Physiology Shift',
      severity: decision.severity === 'critical' || hrvDrop ? 'high' : breathSkew ? 'medium' : 'low',
      status: hrvDrop || breathSkew ? 'watch' : 'stable',
      note: hrvDrop ? 'Reduced HRV may reflect strong autonomic load.' : breathSkew ? 'Respiratory rhythm drift detected.' : 'No major physiological artifact markers.',
    },
  ];
}

function buildConfidenceMap(snapshot: SignalSnapshot, decision: AssessmentDecision, artifacts: ArtifactFlag[]): ConfidenceSlice[] {
  const stableCount = artifacts.filter((item) => item.status === 'stable').length;
  const signalIntegrity = Math.max(0.22, Math.min(0.98, snapshot.coherence * 0.58 + stableCount * 0.12));
  const physiologicalAgreement = Math.max(0.2, Math.min(0.98, 1 - Math.abs(snapshot.stressIndex - (1 - snapshot.coherence)) * 0.7));
  const artifactPenalty = Math.max(0.12, Math.min(0.95, 1 - artifacts.filter((item) => item.status === 'artifact').length * 0.28));
  const modelCertainty = Math.max(0.2, Math.min(0.99, decision.confidence));

  return [
    { id: 'integrity', label: 'Signal Integrity', value: signalIntegrity, note: 'Measures coherence with channel stability and continuity.' },
    { id: 'agreement', label: 'Physiology Agreement', value: physiologicalAgreement, note: 'Checks whether stress, breathing, and variability align.' },
    { id: 'artifact', label: 'Artifact Penalty', value: artifactPenalty, note: 'Reduces confidence when movement or contact noise appears.' },
    { id: 'model', label: 'Model Certainty', value: modelCertainty, note: 'Current cognition layer confidence for the assessed state.' },
  ];
}

function buildTimeline(snapshot: SignalSnapshot, decision: AssessmentDecision, confidenceMap: ConfidenceSlice[]): ExplainableTimelineEntry[] {
  const time = Date.now();
  const strongestConfidence = confidenceMap.reduce((best, current) => current.value > best.value ? current : best, confidenceMap[0]);
  return [
    {
      id: `sensory-${time}`,
      at: time - 1400,
      stage: 'sensory',
      title: 'Raw signal frame captured',
      detail: `HR ${snapshot.hr}, HRV ${snapshot.hrv}, GSR ${snapshot.gsr}, RR ${snapshot.rr} entered the sensory stream.`,
      weight: 0.74,
    },
    {
      id: `perception-${time}`,
      at: time - 980,
      stage: 'perception',
      title: 'Signal quality and baseline alignment evaluated',
      detail: `Coherence ${snapshot.coherence} and stress ${snapshot.stressIndex} were normalized against the active profile.`,
      weight: 0.68,
    },
    {
      id: `cognition-${time}`,
      at: time - 520,
      stage: 'cognition',
      title: 'Assessment confidence assembled',
      detail: `${strongestConfidence.label} became the strongest confidence contributor for state ${decision.state}.`,
      weight: decision.confidence,
    },
    {
      id: `expression-${time}`,
      at: time - 160,
      stage: 'expression',
      title: 'Aura and signal mesh updated',
      detail: `Expression layer received severity ${decision.severity} and refreshed the visual field.`,
      weight: 0.64,
    },
    {
      id: `memory-${time}`,
      at: time,
      stage: 'memory',
      title: 'Trace persisted to living session log',
      detail: 'This frame is available for downstream handoff, diagnostics, and research inspection.',
      weight: 0.58,
    },
  ];
}

function updateWaveforms(snapshot: SignalSnapshot) {
  const at = Date.now();
  const valueMap: Record<WaveformSeries['id'], number> = {
    hr: snapshot.hr,
    hrv: snapshot.hrv,
    gsr: snapshot.gsr,
    rr: snapshot.rr,
    coherence: snapshot.coherence,
    stress: snapshot.stressIndex,
  };

  waveformHistory = waveformHistory.map((series) => ({
    ...series,
    points: [...series.points, { at, value: valueMap[series.id] }].slice(-maxWaveformPoints),
  }));

  return waveformHistory;
}

function createBaselineProfile(snapshot: SignalSnapshot, source: SessionSource): BaselineProfile {
  return {
    profileType: replayState.active ? 'replay-baseline' : source.kind === 'wearable' ? 'wearable-runtime' : 'human-sim-baseline',
    hrResting: Number(Math.max(52, Math.min(92, snapshot.hr - 6)).toFixed(2)),
    hrvReference: Number(Math.max(24, snapshot.hrv).toFixed(2)),
    respirationReference: Number(Math.max(8, Math.min(18, snapshot.rr)).toFixed(2)),
    coherenceReference: Number(Math.max(0.35, snapshot.coherence).toFixed(2)),
    stressReference: Number(Math.max(0.12, Math.min(0.78, snapshot.stressIndex)).toFixed(2)),
  };
}

function createSessionSummary(
  mode: AssessmentMode,
  snapshot: SignalSnapshot,
  decision: AssessmentDecision,
  artifacts: ArtifactFlag[],
  source: SessionSource,
): ResearchSessionSummary {
  const artifactLoad = Number((artifacts.reduce((sum, item) => {
    if (item.status === 'artifact') return sum + 0.4;
    if (item.status === 'watch') return sum + 0.2;
    return sum + 0.05;
  }, 0) / Math.max(artifacts.length, 1)).toFixed(2));
  const artifactStatus = artifactLoad >= 0.34 ? 'artifact-heavy' : artifactLoad >= 0.18 ? 'watch' : 'stable';
  const recommendation = decision.severity === 'critical'
    ? 'Escalate to clinician review and verify the signal with a repeat acquisition.'
    : decision.severity === 'warning'
      ? 'Repeat the session after stabilization and review artifact drivers before handoff.'
      : mode === 'research'
        ? 'Session is stable enough for research handoff and replay review.'
        : 'Session is stable and suitable for continued observation.';
  const handoffPriority = decision.severity === 'critical' ? 'priority' : decision.severity === 'warning' || artifactStatus !== 'stable' ? 'watch' : 'routine';

  return {
    sessionLabel: mode.toUpperCase() + ' | ' + source.label,
    sourceLabel: source.label,
    readinessScore: computeReadinessScore(),
    state: decision.state,
    confidence: decision.confidence,
    severity: decision.severity,
    artifactLoad,
    artifactStatus,
    recommendation,
    handoffPriority,
    generatedAt: snapshot.timestamp,
  };
}

function createExportPayload(
  mode: AssessmentMode,
  snapshot: SignalSnapshot,
  decision: AssessmentDecision,
  rawSignals: RawSignalChannel[],
  artifacts: ArtifactFlag[],
  confidenceMap: ConfidenceSlice[],
  timeline: ExplainableTimelineEntry[],
  waveformSeries: WaveformSeries[],
  recentEvents: BioStreamEvent[],
  source: SessionSource,
): ResearchExportPayload {
  const baselineProfile = createBaselineProfile(snapshot, source);
  const sessionSummary = createSessionSummary(mode, snapshot, decision, artifacts, source);

  return {
    schemaVersion: '1.2',
    exportedAt: new Date().toISOString(),
    mode,
    source,
    summary: {
      state: decision.state,
      confidence: decision.confidence,
      severity: decision.severity,
      ticks: tickCount,
    },
    baselineProfile,
    sessionSummary,
    latestSnapshot: snapshot,
    rawSignals,
    artifacts,
    confidenceMap,
    timeline,
    waveformSeries,
    recentEvents,
  };
}
function buildDiagnostics(
  snapshot: SignalSnapshot,
  decision: AssessmentDecision,
  mode: AssessmentMode,
  recentEvents: BioStreamEvent[],
  source: SessionSource = currentSource,
): ResearchDiagnostics {
  const rawSignals: RawSignalChannel[] = [
    toChannel('hr', 'Heart Rate', snapshot.hr, 'bpm', snapshot.hr / 120, snapshot.hr > 102 ? 'watch' : 'clean'),
    toChannel('hrv', 'HRV', snapshot.hrv, 'ms', snapshot.hrv / 120, snapshot.hrv < 30 ? 'artifact' : snapshot.hrv < 42 ? 'watch' : 'clean'),
    toChannel('gsr', 'GSR', snapshot.gsr, 'uS', snapshot.gsr / 10, snapshot.gsr > 8.4 ? 'artifact' : snapshot.gsr > 6.4 ? 'watch' : 'clean'),
    toChannel('rr', 'Respiration', snapshot.rr, 'br/min', snapshot.rr / 20, snapshot.rr < 7 || snapshot.rr > 17 ? 'watch' : 'clean'),
    toChannel('theta', 'Theta', snapshot.theta, 'a.u.', snapshot.theta / 100, 'clean'),
    toChannel('alpha', 'Alpha', snapshot.alpha, 'a.u.', snapshot.alpha / 100, snapshot.alpha < 28 ? 'watch' : 'clean'),
    toChannel('beta', 'Beta', snapshot.beta, 'a.u.', snapshot.beta / 100, snapshot.beta > 76 ? 'watch' : 'clean'),
    toChannel('gamma', 'Gamma', snapshot.gamma, 'a.u.', snapshot.gamma / 100, snapshot.gamma > 82 ? 'watch' : 'clean'),
    toChannel('coherence', 'Coherence', snapshot.coherence, 'score', snapshot.coherence, snapshot.coherence < 0.42 ? 'artifact' : snapshot.coherence < 0.62 ? 'watch' : 'clean'),
    toChannel('stress', 'Stress Index', snapshot.stressIndex, 'score', snapshot.stressIndex, snapshot.stressIndex > 0.72 ? 'artifact' : snapshot.stressIndex > 0.54 ? 'watch' : 'clean'),
  ];

  const artifacts = inferArtifacts(snapshot, decision);
  const confidenceMap = buildConfidenceMap(snapshot, decision, artifacts);
  const timeline = buildTimeline(snapshot, decision, confidenceMap);
  const waveformSeries = updateWaveforms(snapshot).map((series) => ({ ...series, points: [...series.points] }));
  const exportPayload = createExportPayload(mode, snapshot, decision, rawSignals, artifacts, confidenceMap, timeline, waveformSeries, recentEvents, source);

  return {
    source,
    adapters: adapterRegistry,
    replay: replayState,
    rawSignals,
    artifacts,
    confidenceMap,
    timeline,
    waveformSeries,
    baselineProfile: exportPayload.baselineProfile,
    sessionSummary: exportPayload.sessionSummary,
    exportPayload,
  };
}

function buildState(snapshot: SignalSnapshot, decision: AssessmentDecision, mode: AssessmentMode, recentEvents: BioStreamEvent[], latencyMs: number): AppState {
  const aura = mapAuraState(snapshot, decision);
  return {
    mode,
    snapshot,
    decision,
    aura,
    traceLog: log.list(),
    eventFeed: recentEvents,
    streamStats: {
      ticks: tickCount,
      lastLatencyMs: latencyMs,
      coherenceBand: deriveCoherenceBand(snapshot),
      activeModeLabel: `${mode.toUpperCase()} | ${currentSource.label}`,
    },
    signalMesh: createMesh(snapshot, decision),
    diagnostics: buildDiagnostics(snapshot, decision, mode, recentEvents),
    deviceConsole: createDeviceConsole(),
  };
}

const baseState = buildState(initialSnapshot, initialDecision, initialMode, [], 16);
export const appStore = writable<AppState>(baseState);

function emit(event: BioStreamEvent) {
  bioStream.publish(event);
}

function emitAndCreateFeed(snapshot: SignalSnapshot, decision: AssessmentDecision, mode: AssessmentMode, previousFeed: BioStreamEvent[]) {
  const snapshotEvent: BioStreamEvent = {
    type: 'signal.snapshot',
    layer: 'sensory',
    payload: snapshot,
    at: Date.now(),
  };
  const assessmentEvent: BioStreamEvent = {
    type: 'assessment.updated',
    layer: 'cognition',
    payload: decision,
    at: Date.now(),
  };
  const modeEvent: BioStreamEvent = {
    type: 'mode.changed',
    layer: 'memory',
    payload: { mode },
    at: Date.now(),
  };

  emit(snapshotEvent);
  emit(assessmentEvent);
  emit(modeEvent);

  return [assessmentEvent, snapshotEvent, ...previousFeed].slice(0, 14);
}

function applyTelemetry(telemetry?: WearableTelemetry) {
  if (!telemetry) return;

  if (telemetry.batteryLevel !== undefined) batteryLevel = telemetry.batteryLevel;
  if (telemetry.signalStrength !== undefined) signalStrength = telemetry.signalStrength;
  if (telemetry.deviceName !== undefined) deviceName = telemetry.deviceName ?? null;
  if (telemetry.transportHealth !== undefined) transportHealth = telemetry.transportHealth ?? 'unknown';
  if (telemetry.firmwareLabel !== undefined) firmwareLabel = telemetry.firmwareLabel ?? null;
  if (telemetry.lastSeenAt !== undefined) lastSeenAt = telemetry.lastSeenAt ?? null;
}

function ingestSnapshot(snapshot: SignalSnapshot, options?: { mode?: AssessmentMode; latencyMs?: number; logMessage?: string }) {
  tickCount += 1;
  const mode = options?.mode ?? currentMode;
  const latencyMs = options?.latencyMs ?? (currentSource.kind === 'wearable' ? 28 : 12 + (tickCount % 5) * 3);
  const decision = runAssessment(snapshot, mode);
  log.push({ snapshot, decision });
  if (options?.logMessage) {
    pushDeviceLog('info', options.logMessage);
  }

  appStore.update((state) => {
    const eventFeed = emitAndCreateFeed(snapshot, decision, mode, state.eventFeed);
    return buildState(snapshot, decision, mode, eventFeed, latencyMs);
  });
}

function buildStateFromPayload(payload: ResearchExportPayload): AppState {
  replayState = {
    active: true,
    label: `Replay ${payload.source.label}`,
    importedAt: new Date().toISOString(),
  };
  currentSource = payload.source;
  currentConnectionState = 'replay';
  deviceName = payload.source.label;
  signalStrength = null;
  transportHealth = 'stable';
  firmwareLabel = 'Research Replay';
  lastSeenAt = payload.exportedAt;
  lastFailureReason = null;
  pushDeviceLog('info', `Replay loaded for ${payload.source.label}.`);
  applyActiveAdapter(payload.source.adapterId, currentConnectionState);
  waveformHistory = payload.waveformSeries.map((series) => ({ ...series, points: [...series.points] }));

  const snapshot = payload.latestSnapshot;
  const decision: AssessmentDecision = {
    state: payload.summary.state,
    confidence: payload.summary.confidence,
    severity: payload.summary.severity,
    rationale: payload.confidenceMap.map((item) => `${item.label}: ${Math.round(item.value * 100)}%`),
    trace: payload.timeline.map((item) => ({ layer: item.stage, note: item.detail })),
  };

  return {
    mode: payload.mode,
    snapshot,
    decision,
    aura: mapAuraState(snapshot, decision),
    traceLog: log.list(),
    eventFeed: payload.recentEvents,
    streamStats: {
      ticks: payload.summary.ticks,
      lastLatencyMs: 0,
      coherenceBand: deriveCoherenceBand(snapshot),
      activeModeLabel: `${payload.mode.toUpperCase()} REPLAY | ${payload.source.label}`,
    },
    signalMesh: createMesh(snapshot, decision),
    diagnostics: {
      source: payload.source,
      adapters: adapterRegistry,
      replay: replayState,
      rawSignals: payload.rawSignals,
      artifacts: payload.artifacts,
      confidenceMap: payload.confidenceMap,
      timeline: payload.timeline,
      waveformSeries: payload.waveformSeries,
      baselineProfile: payload.baselineProfile,
      sessionSummary: payload.sessionSummary,
      exportPayload: payload,
    },
    deviceConsole: createDeviceConsole(),
  };
}

function nextFrame(mode: AssessmentMode, seed = Date.now()) {
  const snapshot = createAdapterSnapshot(currentSource, seed + (tickCount + 1) * 1337);
  ingestSnapshot(snapshot, { mode });
}

async function activateSource(source: SessionSource, connectionState: DeviceConsoleState['connectionState'], startLoop = true) {
  stopBioLoop();
  waveformHistory = createEmptyWaveforms();
  replayState = { ...defaultReplayState };
  currentSource = source;
  currentConnectionState = connectionState;
  applyActiveAdapter(source.adapterId, connectionState);

  if (startLoop) {
    startBioLoop(currentMode);
    return;
  }

  const seededSnapshot = createAdapterSnapshot(source);
  ingestSnapshot(seededSnapshot, {
    mode: currentMode,
    latencyMs: connectionState === 'connected' ? 24 : 28,
    logMessage: `${source.label} is ready and waiting for live frames.`,
  });
}

export async function connectMockAdapter(adapterId: string) {
  const adapter = findAdapter(adapterId);
  if (!adapter) return;

  browserBluetoothAvailable = await adapter.isSupported();
  permissionState = browserBluetoothAvailable ? 'prompt-required' : 'unsupported';
  lastFailureReason = null;
  batteryLevel = adapterId === 'polar-h10' ? 87 : null;
  signalStrength = adapterId === 'polar-h10' ? 74 : 68;
  deviceName = adapter.descriptor.label;
  transportHealth = browserBluetoothAvailable ? 'watch' : 'degraded';
  firmwareLabel = browserBluetoothAvailable ? 'Pending handshake' : null;
  lastSeenAt = new Date().toISOString();
  pushDeviceLog('info', 'Preparing ' + adapter.descriptor.label + '. Browser capability: ' + (browserBluetoothAvailable ? 'available' : 'unavailable') + '.');

  let connectionState: DeviceConsoleState['connectionState'] = 'mock-connected';
  let startLoop = true;

  try {
    currentConnectionState = 'pairing';
    applyActiveAdapter(adapter.descriptor.id, currentConnectionState);
    pushDeviceLog('info', 'Attempting handshake with ' + adapter.descriptor.label + '.');

    if (browserBluetoothAvailable) {
      permissionState = 'ready';
      const session = await adapter.connect({
        profileId: currentMode,
        onSnapshot: (snapshot) => {
          ingestSnapshot(snapshot, {
            mode: currentMode,
            latencyMs: 22,
            logMessage: adapter.descriptor.label + ' delivered a live frame.',
          });
        },
        onTelemetry: (telemetry) => {
          applyTelemetry(telemetry);
        },
      });
      applyTelemetry(session.telemetry);
      await adapter.startStream({
        profileId: currentMode,
        onSnapshot: (snapshot) => {
          ingestSnapshot(snapshot, {
            mode: currentMode,
            latencyMs: 22,
            logMessage: adapter.descriptor.label + ' delivered a live frame.',
          });
        },
        onTelemetry: (telemetry) => {
          applyTelemetry(telemetry);
        },
      });
      connectionState = 'connected';
      transportHealth = 'stable';
      startLoop = false;
      pushDeviceLog('info', adapter.descriptor.label + ' connected through ' + adapter.descriptor.transport + '. Live ingestion path armed.');
    } else {
      lastFailureReason = 'Web Bluetooth is unavailable in this browser context.';
      transportHealth = 'degraded';
      pushDeviceLog('warn', adapter.descriptor.label + ' is not supported in this browser context. Falling back to mock mode.');
    }
  } catch (error) {
    connectionState = 'mock-connected';
    startLoop = true;
    permissionState = browserBluetoothAvailable ? 'denied' : permissionState;
    lastFailureReason = error instanceof Error ? error.message : 'Unknown adapter handshake failure.';
    batteryLevel = null;
    signalStrength = 52;
    transportHealth = 'degraded';
    firmwareLabel = 'Mock fallback';
    lastSeenAt = new Date().toISOString();
    pushDeviceLog('warn', adapter.descriptor.label + ' handshake fell back to mock mode.');
    console.warn('Adapter handshake fell back to mock mode.', error);
  }

  await activateSource(adapter.source, connectionState, startLoop);
}

export async function switchToHumanSim() {
  for (const adapter of wearableAdapters) {
    await adapter.stopStream();
    await adapter.disconnect();
  }
  browserBluetoothAvailable = false;
  permissionState = 'unknown';
  batteryLevel = null;
  signalStrength = null;
  deviceName = null;
  transportHealth = 'unknown';
  firmwareLabel = null;
  lastSeenAt = null;
  lastFailureReason = null;
  pushDeviceLog('info', 'Switched back to HumanSim runtime.');
  await activateSource({ ...initialSource }, 'live-sim', true);
}
export function importResearchSession(payload: ResearchExportPayload) {
  stopBioLoop();
  tickCount = payload.summary.ticks;
  appStore.set(buildStateFromPayload(payload));
}

export function exitReplayMode() {
  replayState = { ...defaultReplayState };
  waveformHistory = createEmptyWaveforms();
  currentConnectionState = currentSource.kind === 'wearable' ? 'mock-connected' : 'live-sim';
  pushDeviceLog('info', 'Exited replay mode and resumed live runtime.');
  startBioLoop(currentMode);
}

export function setMode(mode: AssessmentMode) {
  currentMode = mode;
  nextFrame(currentMode);
}

export function startBioLoop(mode: AssessmentMode = currentMode) {
  replayState = { ...defaultReplayState };
  currentMode = mode;
  if (streamTimer !== null) {
    clearInterval(streamTimer);
  }
  nextFrame(currentMode);
  streamTimer = window.setInterval(() => nextFrame(currentMode), 1800);
}

export function stopBioLoop() {
  if (streamTimer !== null) {
    clearInterval(streamTimer);
    streamTimer = null;
  }
}

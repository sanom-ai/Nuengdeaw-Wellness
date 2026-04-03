<script lang="ts">
  import { onMount } from 'svelte';
  import AuraStage from '../panels/AuraStage.svelte';
  import DeviceConsolePanel from '../panels/DeviceConsolePanel.svelte';
  import ExplainabilityPanel from '../panels/ExplainabilityPanel.svelte';
  import ResearchDiagnosticsPanel from '../panels/ResearchDiagnosticsPanel.svelte';
  import ResearchHandoffViewer from '../panels/ResearchHandoffViewer.svelte';
  import { appStore, setMode, startBioLoop, stopBioLoop } from '../../stores/app.store';
  import { appIdentity } from '../../lib/theme/tokens';
  import type { AssessmentMode } from '../../core/contracts';

  onMount(() => {
    startBioLoop('personal');
    return () => {
      stopBioLoop();
    };
  });

  const modes: AssessmentMode[] = ['personal', 'clinic', 'research'];
</script>

<svelte:head>
  <title>{appIdentity.name}</title>
</svelte:head>

<div class="shell">
  <aside class="rail">
    <div class="brand">
      <div class="eyebrow">TAWAN Living Signal Architecture</div>
      <h1>{appIdentity.name}</h1>
      <p>{appIdentity.architecture} - {appIdentity.latticeName}</p>
    </div>

    <div class="mode-card glass">
      <div class="section-title">Adaptive Modes</div>
      <div class="mode-list">
        {#each modes as mode}
          <button class:active={$appStore.mode === mode} onclick={() => setMode(mode)}>{mode}</button>
        {/each}
      </div>
    </div>

    <div class="signal-card glass">
      <div class="section-title">Living Snapshot</div>
      <div class="metric-grid">
        <div><span>HR</span><strong>{$appStore.snapshot.hr}</strong></div>
        <div><span>HRV</span><strong>{$appStore.snapshot.hrv}</strong></div>
        <div><span>GSR</span><strong>{$appStore.snapshot.gsr}</strong></div>
        <div><span>RR</span><strong>{$appStore.snapshot.rr}</strong></div>
        <div><span>Stress Index</span><strong>{$appStore.snapshot.stressIndex}</strong></div>
        <div><span>Coherence</span><strong>{$appStore.snapshot.coherence}</strong></div>
      </div>
    </div>

    <div class="stream-card glass">
      <div class="section-title">Conscious Signal Mesh</div>
      <div class="stream-stat"><span>Mode</span><strong>{$appStore.streamStats.activeModeLabel}</strong></div>
      <div class="stream-stat"><span>Latency</span><strong>{$appStore.streamStats.lastLatencyMs} ms</strong></div>
      <div class="stream-stat"><span>Band</span><strong>{$appStore.streamStats.coherenceBand}</strong></div>
      <div class="stream-divider"></div>
      <p>Release candidate flow now includes diagnostics, device telemetry, replay import, and a handoff viewer that turns the live session into a downstream-ready summary.</p>
    </div>
  </aside>

  <main class="main-grid">
    <section class="hero glass">
      <div>
        <div class="eyebrow">Layered Consciousness Architecture</div>
        <h2>Not just a dashboard, but a living surface that responds to biometric rhythm in real time.</h2>
        <p>
          v1.1 now combines the aura, diagnostics, device runtime, and a release-ready handoff viewer from the same runtime so research export and replay feel like one coherent system.
        </p>
      </div>
      <div class="hero-badges">
        <span>Explainable by Design</span>
        <span>Thai Futuristic Minimalism</span>
        <span>Bio-Aura Ready</span>
        <span>Research Diagnostics</span>
        <span>Device Console</span>
        <span>Handoff Viewer</span>
      </div>
    </section>

    <AuraStage snapshotState={$appStore} />
    <ExplainabilityPanel snapshotState={$appStore} />
    <ResearchHandoffViewer snapshotState={$appStore} />
    <DeviceConsolePanel snapshotState={$appStore} />
    <ResearchDiagnosticsPanel snapshotState={$appStore} />
  </main>
</div>

<style>
  .shell {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    min-height: 100vh;
    gap: 24px;
    padding: 24px;
  }
  .rail { display: flex; flex-direction: column; gap: 18px; }
  .main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
    gap: 20px;
    align-content: start;
  }
  .hero { grid-column: 1 / -1; padding: 24px; }
  .glass {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 24px;
    box-shadow: var(--shadow);
    backdrop-filter: blur(18px);
  }
  .brand h1, h2 { font-family: 'Prompt', sans-serif; margin: 0; }
  .brand p, .hero p, .stream-card p { color: var(--text-soft); }
  .eyebrow {
    font-size: 0.82rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--aura-cyan);
    margin-bottom: 10px;
  }
  .mode-card, .signal-card, .stream-card { padding: 18px; }
  .section-title {
    margin-bottom: 12px;
    color: var(--text-soft);
    font-size: 0.84rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .mode-list { display: grid; gap: 10px; }
  .mode-list button {
    border: 1px solid var(--line);
    background: rgba(255,255,255,0.02);
    color: var(--text);
    border-radius: 14px;
    padding: 12px 14px;
    text-transform: capitalize;
    cursor: pointer;
  }
  .mode-list button.active {
    border-color: rgba(82, 247, 212, 0.65);
    box-shadow: inset 0 0 0 1px rgba(82, 247, 212, 0.35), 0 0 24px rgba(82, 247, 212, 0.12);
  }
  .metric-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .metric-grid div, .stream-stat {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 12px;
  }
  .metric-grid span, .stream-stat span {
    display: block;
    color: var(--text-soft);
    font-size: 0.85rem;
  }
  .metric-grid strong, .stream-stat strong {
    font-size: 1.3rem;
    font-family: 'Prompt', sans-serif;
  }
  .stream-card { display:grid; gap:10px; }
  .stream-divider { height:1px; background: var(--line); margin: 4px 0 2px; }
  .hero-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }
  .hero-badges span {
    border-radius: 999px;
    border: 1px solid var(--line);
    padding: 8px 12px;
    color: var(--text-soft);
    background: rgba(255,255,255,0.03);
  }
  @media (max-width: 1120px) {
    .shell, .main-grid { grid-template-columns: 1fr; }
  }
</style>
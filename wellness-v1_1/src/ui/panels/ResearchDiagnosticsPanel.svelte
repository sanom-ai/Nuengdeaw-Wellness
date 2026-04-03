<script lang="ts">
  import { connectMockAdapter, exitReplayMode, importResearchSession, switchToHumanSim } from '../../stores/app.store';

  export let snapshotState: any;

  $: diagnostics = snapshotState?.diagnostics;
  $: mode = snapshotState?.mode;

  function pct(value: number) {
    return `${Math.round(value * 100)}%`;
  }

  function minMax(points: Array<{ value: number }>) {
    if (!points.length) return { min: 0, max: 1 };
    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { min, max: max === min ? min + 1 : max };
  }

  function seriesPath(points: Array<{ value: number }>, width = 280, height = 82) {
    if (!points.length) return '';
    const { min, max } = minMax(points);
    return points
      .map((point, index) => {
        const x = (index / Math.max(points.length - 1, 1)) * width;
        const y = height - ((point.value - min) / (max - min)) * height;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }

  function downloadSession() {
    if (!diagnostics?.exportPayload) return;
    const blob = new Blob([JSON.stringify(diagnostics.exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = diagnostics.exportPayload.exportedAt.replace(/[:.]/g, '-');
    anchor.href = url;
    anchor.download = `nuengdeaw-research-handoff-${stamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function loadReplay(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      importResearchSession(payload);
      input.value = '';
    } catch (error) {
      console.error('Failed to load replay payload', error);
      input.value = '';
    }
  }
</script>

<section class:active={mode === 'research'} class="diagnostics glass">
  <div class="head">
    <div>
      <div class="eyebrow">Research / Diagnostics Mode</div>
      <h3>Raw Signal Lab</h3>
      <p>Expose raw channels, artifact markers, confidence composition, explainable timeline, and handoff-ready session data from the HumanSim runtime.</p>
    </div>
    <div class="head-actions">
      <div class="status-pill">{mode === 'research' ? 'Research active' : 'Research ready'}</div>
      <button class="export-button" onclick={downloadSession}>Export Session</button>
    </div>
  </div>

  <div class="source-card">
    <div>
      <span class="source-label">Current Source</span>
      <strong>{diagnostics?.source?.label ?? 'Unknown source'}</strong>
      <p>Adapter: {diagnostics?.source?.adapterId ?? '-'} | Wearable Ready: {diagnostics?.source?.wearableReady ? 'Yes' : 'No'}</p>
    </div>
    <div class="source-actions">
      <div class="source-pill">{diagnostics?.source?.kind ?? 'n/a'}</div>
      <button class="secondary-button" onclick={switchToHumanSim}>Use HumanSim</button>
    </div>
  </div>

  <div class="replay-card">
    <div>
      <span class="source-label">Replay Lab</span>
      <strong>{diagnostics?.replay?.active ? diagnostics?.replay?.label : 'Live runtime streaming'}</strong>
      <p>{diagnostics?.replay?.active ? `Imported at ${diagnostics?.replay?.importedAt}` : 'Load a research handoff JSON to inspect a previous session without backend infrastructure.'}</p>
    </div>
    <div class="replay-actions">
      <label class="file-button">
        <input type="file" accept="application/json" onchange={loadReplay} />
        Import Replay
      </label>
      {#if diagnostics?.replay?.active}
        <button class="secondary-button" onclick={exitReplayMode}>Return To Live</button>
      {/if}
    </div>
  </div>

  <div class="panel-block wide">
    <div class="block-title">Adapter Registry</div>
    <div class="adapter-grid">
      {#each diagnostics?.adapters ?? [] as adapter}
        <div class:standby={adapter.status === 'standby'} class:active-card={adapter.status !== 'standby'} class="adapter-card">
          <div class="adapter-top">
            <strong>{adapter.label}</strong>
            <span>{adapter.integrationStatus}</span>
          </div>
          <p>{adapter.notes}</p>
          <div class="adapter-meta">{adapter.kind} | {adapter.id}</div>
          <div class="adapter-meta">Transport: {adapter.transport}</div>
          <div class="adapter-meta">Channels: {adapter.channels.join(', ')}</div>
          <div class="adapter-meta">Requirements: {adapter.requirements.join(' | ')}</div>
          <div class="adapter-meta">Next: {adapter.nextStep}</div>
          <div class="adapter-actions">
            <span class="status-badge">{adapter.status}</span>
            {#if adapter.kind === 'wearable'}
              <button class="connect-button" onclick={() => connectMockAdapter(adapter.id)}>{adapter.id === 'polar-h10' ? 'Pair / Connect' : 'Mock Connect'}</button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="diagnostic-grid">
    <section class="panel-block">
      <div class="block-title">Raw Signal Channels</div>
      <div class="signal-list">
        {#each diagnostics?.rawSignals ?? [] as signal}
          <div class:artifact={signal.quality === 'artifact'} class:watch={signal.quality === 'watch'} class="signal-row">
            <div>
              <strong>{signal.label}</strong>
              <span>{signal.value} {signal.unit}</span>
            </div>
            <div class="bar-shell"><div class="bar-fill" style={`width:${pct(signal.normalized)}`}></div></div>
            <div class="quality">{signal.quality}</div>
          </div>
        {/each}
      </div>
    </section>

    <section class="panel-block">
      <div class="block-title">Artifact Watch</div>
      <div class="artifact-list">
        {#each diagnostics?.artifacts ?? [] as artifact}
          <div class:artifact={artifact.status === 'artifact'} class:watch={artifact.status === 'watch'} class="artifact-card">
            <div class="artifact-top">
              <strong>{artifact.label}</strong>
              <span>{artifact.severity}</span>
            </div>
            <p>{artifact.note}</p>
          </div>
        {/each}
      </div>
    </section>

    <section class="panel-block wide">
      <div class="block-title">Raw Signal Strip Chart</div>
      <div class="waveform-grid">
        {#each diagnostics?.waveformSeries ?? [] as series}
          <div class="waveform-card">
            <div class="waveform-head">
              <div>
                <strong>{series.label}</strong>
                <span>{series.unit}</span>
              </div>
              <span class="waveform-count">{series.points.length} pts</span>
            </div>
            <svg viewBox="0 0 280 82" class="waveform-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`gradient-${series.id}`} x1="0" x2="1">
                  <stop offset="0%" stop-color={series.color} stop-opacity="0.95"></stop>
                  <stop offset="100%" stop-color="#ffffff" stop-opacity="0.4"></stop>
                </linearGradient>
              </defs>
              <path d={seriesPath(series.points)} fill="none" stroke={`url(#gradient-${series.id})`} stroke-width="2.2" stroke-linecap="round"></path>
            </svg>
          </div>
        {/each}
      </div>
    </section>

    <section class="panel-block wide">
      <div class="block-title">Confidence Composition</div>
      <div class="confidence-list">
        {#each diagnostics?.confidenceMap ?? [] as item}
          <div class="confidence-row">
            <div>
              <strong>{item.label}</strong>
              <p>{item.note}</p>
            </div>
            <div class="confidence-meter">
              <div class="confidence-fill" style={`width:${pct(item.value)}`}></div>
            </div>
            <span>{pct(item.value)}</span>
          </div>
        {/each}
      </div>
    </section>

    <section class="panel-block wide">
      <div class="block-title">Explainable Timeline</div>
      <div class="timeline">
        {#each diagnostics?.timeline ?? [] as item}
          <div class="timeline-item">
            <div class="time-col">
              <span>{new Date(item.at).toLocaleTimeString('th-TH')}</span>
              <strong>{item.stage}</strong>
            </div>
            <div class="timeline-body">
              <div class="timeline-head">
                <strong>{item.title}</strong>
                <span>{pct(item.weight)}</span>
              </div>
              <p>{item.detail}</p>
            </div>
          </div>
        {/each}
      </div>
    </section>
  </div>
</section>

<style>
  .glass {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 24px;
    box-shadow: var(--shadow);
    backdrop-filter: blur(18px);
  }
  .diagnostics {
    grid-column: 1 / -1;
    padding: 22px;
    border-color: rgba(239, 195, 109, 0.18);
  }
  .diagnostics.active {
    box-shadow: 0 18px 55px rgba(239, 195, 109, 0.08);
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
  }
  .head-actions,
  .replay-actions,
  .source-actions,
  .adapter-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .eyebrow {
    font-size: 0.8rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--aura-gold);
  }
  h3 {
    margin: 8px 0 0;
    font-family: 'Prompt', sans-serif;
    font-size: 1.35rem;
  }
  p { color: var(--text-soft); }
  .status-pill,
  .source-pill,
  .file-button,
  .secondary-button,
  .export-button,
  .connect-button,
  .status-badge {
    padding: 10px 14px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .status-pill,
  .source-pill,
  .status-badge {
    border: 1px solid var(--line);
    background: rgba(255,255,255,0.03);
    color: var(--text-soft);
  }
  .export-button,
  .file-button,
  .connect-button {
    border: 1px solid rgba(82, 247, 212, 0.35);
    background: rgba(82, 247, 212, 0.08);
    color: var(--text);
    cursor: pointer;
  }
  .secondary-button {
    border: 1px solid var(--line);
    background: rgba(255,255,255,0.03);
    color: var(--text);
    cursor: pointer;
  }
  .file-button input {
    display: none;
  }
  .source-card,
  .replay-card {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: rgba(255,255,255,0.025);
    padding: 16px;
    margin-bottom: 16px;
  }
  .source-label,
  .block-title {
    color: var(--text-soft);
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }
  .source-card strong,
  .replay-card strong {
    display: block;
    margin-top: 6px;
    font-family: 'Prompt', sans-serif;
  }
  .adapter-grid,
  .signal-list,
  .artifact-list,
  .confidence-list,
  .timeline,
  .waveform-grid {
    display: grid;
    gap: 10px;
  }
  .adapter-grid,
  .waveform-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .diagnostic-grid {
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: 16px;
  }
  .panel-block {
    border: 1px solid var(--line);
    border-radius: 18px;
    background: rgba(255,255,255,0.025);
    padding: 16px;
  }
  .panel-block.wide {
    grid-column: 1 / -1;
  }
  .adapter-card,
  .signal-row,
  .artifact-card,
  .confidence-row,
  .timeline-item,
  .waveform-card {
    border: 1px solid var(--line);
    border-radius: 14px;
    background: rgba(7, 18, 30, 0.65);
    padding: 12px;
  }
  .adapter-card.standby {
    opacity: 0.9;
  }
  .adapter-card.active-card {
    border-color: rgba(82, 247, 212, 0.35);
    box-shadow: inset 0 0 0 1px rgba(82, 247, 212, 0.08);
  }
  .adapter-top,
  .artifact-top,
  .timeline-head,
  .waveform-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: baseline;
  }
  .adapter-meta,
  .signal-row span,
  .artifact-top span,
  .quality,
  .timeline-head span,
  .time-col span,
  .waveform-head span,
  .waveform-count {
    color: var(--text-soft);
    font-size: 0.82rem;
    text-transform: capitalize;
  }
  .signal-row,
  .confidence-row {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(110px, 1fr) 72px;
    gap: 12px;
    align-items: center;
  }
  .adapter-card strong,
  .signal-row strong,
  .artifact-card strong,
  .confidence-row strong,
  .timeline-head strong,
  .time-col strong,
  .waveform-head strong {
    display: block;
    font-family: 'Prompt', sans-serif;
  }
  .bar-shell,
  .confidence-meter {
    height: 10px;
    background: rgba(255,255,255,0.06);
    border-radius: 999px;
    overflow: hidden;
  }
  .bar-fill,
  .confidence-fill {
    height: 100%;
    background: linear-gradient(90deg, rgba(82,247,212,0.85), rgba(239,195,109,0.95));
    border-radius: 999px;
  }
  .signal-row.watch,
  .artifact-card.watch {
    border-color: rgba(239, 195, 109, 0.35);
  }
  .signal-row.artifact,
  .artifact-card.artifact {
    border-color: rgba(255, 122, 136, 0.45);
    box-shadow: inset 0 0 0 1px rgba(255, 122, 136, 0.08);
  }
  .waveform-svg {
    width: 100%;
    height: 82px;
    margin-top: 10px;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  }
  .timeline-item {
    display: grid;
    grid-template-columns: 140px minmax(0, 1fr);
    gap: 14px;
  }
  .time-col {
    border-right: 1px solid var(--line);
    padding-right: 12px;
  }
  .timeline-body p,
  .confidence-row p,
  .artifact-card p,
  .source-card p,
  .replay-card p,
  .adapter-card p {
    margin: 6px 0 0;
    color: var(--text-soft);
  }
  @media (max-width: 1100px) {
    .diagnostic-grid,
    .signal-row,
    .confidence-row,
    .timeline-item,
    .waveform-grid,
    .adapter-grid {
      grid-template-columns: 1fr;
    }
    .source-card,
    .replay-card,
    .head {
      flex-direction: column;
      align-items: stretch;
    }
    .time-col {
      border-right: 0;
      padding-right: 0;
      border-bottom: 1px solid var(--line);
      padding-bottom: 10px;
    }
  }
</style>
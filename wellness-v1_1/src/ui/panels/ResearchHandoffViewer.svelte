<script lang="ts">
  export let snapshotState: any;

  $: diagnostics = snapshotState?.diagnostics;
  $: summary = diagnostics?.sessionSummary;
  $: baseline = diagnostics?.baselineProfile;
  $: payload = diagnostics?.exportPayload;
  $: tone = summary?.handoffPriority === 'priority' ? 'priority' : summary?.handoffPriority === 'watch' ? 'watch' : 'routine';

  function pct(value?: number) {
    return typeof value === 'number' ? `${Math.round(value * 100)}%` : '-';
  }
</script>

<section class="handoff glass tone-{tone}">
  <div class="head">
    <div>
      <div class="eyebrow">Research Handoff Viewer</div>
      <h3>Release-Ready Session Summary</h3>
      <p>Translate the active session into a concise handoff artifact with baseline references, recommendation, and downstream priority.</p>
    </div>
    <div class="priority-pill {tone}">{summary?.handoffPriority ?? 'routine'}</div>
  </div>

  <div class="summary-grid">
    <div class="hero-card">
      <span>Session Label</span>
      <strong>{summary?.sessionLabel ?? 'No session loaded'}</strong>
      <p>{summary?.recommendation ?? 'Awaiting runtime summary.'}</p>
    </div>
    <div class="stat-card">
      <span>State</span>
      <strong>{summary?.state ?? '-'}</strong>
    </div>
    <div class="stat-card">
      <span>Confidence</span>
      <strong>{pct(summary?.confidence)}</strong>
    </div>
    <div class="stat-card">
      <span>Readiness</span>
      <strong>{summary?.readinessScore ?? 0}%</strong>
    </div>
    <div class="stat-card">
      <span>Artifact Load</span>
      <strong>{pct(summary?.artifactLoad)}</strong>
    </div>
    <div class="stat-card">
      <span>Severity</span>
      <strong>{summary?.severity ?? '-'}</strong>
    </div>
  </div>

  <div class="detail-grid">
    <section class="panel-block">
      <div class="block-title">Baseline Profile</div>
      <div class="baseline-grid">
        <div><span>Type</span><strong>{baseline?.profileType ?? '-'}</strong></div>
        <div><span>HR Resting</span><strong>{baseline?.hrResting ?? '-'} bpm</strong></div>
        <div><span>HRV Ref</span><strong>{baseline?.hrvReference ?? '-'} ms</strong></div>
        <div><span>Respiration Ref</span><strong>{baseline?.respirationReference ?? '-'} br/min</strong></div>
        <div><span>Coherence Ref</span><strong>{baseline?.coherenceReference ?? '-'}</strong></div>
        <div><span>Stress Ref</span><strong>{baseline?.stressReference ?? '-'}</strong></div>
      </div>
    </section>

    <section class="panel-block">
      <div class="block-title">Handoff Guidance</div>
      <div class="guidance-list">
        <div class="guidance-item">Source: {payload?.source?.label ?? '-'}</div>
        <div class="guidance-item">Priority: {summary?.handoffPriority ?? '-'}</div>
        <div class="guidance-item">Artifact Status: {summary?.artifactStatus ?? '-'}</div>
        <div class="guidance-item">Generated: {summary?.generatedAt ?? '-'}</div>
      </div>
    </section>

    <section class="panel-block wide">
      <div class="block-title">Clinical / Research Note</div>
      <div class="note-card">
        <p>{summary?.recommendation ?? 'No handoff note generated yet.'}</p>
        <p>Use this summary alongside the export JSON for replay, audit, or downstream review.</p>
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
  .handoff {
    grid-column: 1 / -1;
    padding: 22px;
  }
  .handoff.tone-priority { border-color: rgba(255,122,136,0.35); }
  .handoff.tone-watch { border-color: rgba(239,195,109,0.35); }
  .handoff.tone-routine { border-color: rgba(82,247,212,0.28); }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }
  .eyebrow {
    font-size: 0.8rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--aura-cyan);
  }
  h3 {
    margin: 8px 0 0;
    font-family: 'Prompt', sans-serif;
    font-size: 1.35rem;
  }
  p { color: var(--text-soft); }
  .priority-pill {
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    text-transform: capitalize;
    background: rgba(255,255,255,0.03);
  }
  .priority-pill.priority { border-color: rgba(255,122,136,0.4); }
  .priority-pill.watch { border-color: rgba(239,195,109,0.4); }
  .priority-pill.routine { border-color: rgba(82,247,212,0.4); }
  .summary-grid,
  .detail-grid,
  .baseline-grid,
  .guidance-list {
    display: grid;
    gap: 12px;
  }
  .summary-grid {
    margin-top: 18px;
    grid-template-columns: 1.5fr repeat(5, minmax(0, 1fr));
  }
  .hero-card,
  .stat-card,
  .panel-block,
  .baseline-grid > div,
  .guidance-item,
  .note-card {
    border: 1px solid var(--line);
    border-radius: 16px;
    background: rgba(255,255,255,0.03);
    padding: 14px;
  }
  .hero-card span,
  .stat-card span,
  .block-title,
  .baseline-grid span {
    color: var(--text-soft);
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .hero-card strong,
  .stat-card strong,
  .baseline-grid strong {
    display: block;
    margin-top: 6px;
    font-family: 'Prompt', sans-serif;
    font-size: 1rem;
  }
  .hero-card strong { font-size: 1.15rem; }
  .detail-grid {
    margin-top: 16px;
    grid-template-columns: 1fr 1fr;
  }
  .panel-block.wide {
    grid-column: 1 / -1;
  }
  .baseline-grid {
    margin-top: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .guidance-list,
  .note-card {
    margin-top: 12px;
  }
  .guidance-item,
  .note-card p {
    color: var(--text);
    line-height: 1.55;
  }
  .note-card p { margin: 0; }
  .note-card p + p { margin-top: 10px; }
  @media (max-width: 1200px) {
    .summary-grid,
    .detail-grid,
    .baseline-grid {
      grid-template-columns: 1fr;
    }
    .head {
      flex-direction: column;
    }
  }
</style>
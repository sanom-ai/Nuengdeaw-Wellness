<script lang="ts">
  export let snapshotState: any;

  $: decision = snapshotState?.decision;
  $: feed = snapshotState?.eventFeed ?? [];
  $: stats = snapshotState?.streamStats;
</script>

<section class="trace glass">
  <div class="eyebrow">Explainable by Design</div>
  <h3>Assessment Trace</h3>

  <div class="decision-card">
    <div>
      <span class="label">State</span>
      <strong>{decision?.state ?? '—'}</strong>
    </div>
    <div>
      <span class="label">Confidence</span>
      <strong>{Math.round((decision?.confidence ?? 0) * 100)}%</strong>
    </div>
    <div>
      <span class="label">Stream Ticks</span>
      <strong>{stats?.ticks ?? 0}</strong>
    </div>
    <div>
      <span class="label">Coherence Band</span>
      <strong>{stats?.coherenceBand ?? '—'}</strong>
    </div>
  </div>

  <div class="block">
    <div class="block-title">Rationale</div>
    <ul>
      {#each decision?.rationale ?? [] as reason}
        <li>{reason}</li>
      {/each}
    </ul>
  </div>

  <div class="block">
    <div class="block-title">Layer Trace</div>
    <div class="timeline">
      {#each decision?.trace ?? [] as item}
        <div class="trace-item">
          <div class="trace-layer">{item.layer}</div>
          <div class="trace-note">{item.note}</div>
        </div>
      {/each}
    </div>
  </div>

  <div class="block">
    <div class="block-title">Live Event Feed</div>
    <div class="feed-list">
      {#each feed as item}
        <div class="feed-item">
          <div>
            <div class="trace-layer">{item.layer}</div>
            <div class="trace-note">{item.type}</div>
          </div>
          <span>{new Date(item.at).toLocaleTimeString('th-TH')}</span>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .glass { background: var(--panel); border: 1px solid var(--line); border-radius: 24px; box-shadow: var(--shadow); backdrop-filter: blur(18px); }
  .trace { padding: 22px; }
  .eyebrow { font-size:.8rem; letter-spacing:.18em; text-transform:uppercase; color: var(--aura-gold); }
  h3 { margin:8px 0 18px; font-family:'Prompt', sans-serif; font-size:1.4rem; }
  .decision-card { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px; }
  .decision-card > div, .trace-item, .feed-item { border:1px solid var(--line); background:rgba(255,255,255,.03); border-radius:16px; padding:14px; }
  .label, .block-title { color: var(--text-soft); font-size:.84rem; text-transform:uppercase; letter-spacing:.12em; }
  strong { display:block; margin-top:6px; font-size:1.1rem; font-family:'Prompt', sans-serif; text-transform: capitalize; }
  .block { margin-top:18px; }
  ul { margin:12px 0 0 18px; padding:0; color: var(--text); }
  .timeline, .feed-list { display:grid; gap:10px; margin-top:12px; }
  .trace-layer { color: var(--aura-cyan); text-transform:uppercase; letter-spacing:.12em; font-size:.8rem; margin-bottom:4px; }
  .trace-note { color: var(--text-soft); }
  .feed-item { display:flex; justify-content:space-between; align-items:center; gap:14px; }
  .feed-item span { color: var(--text-soft); font-size:.84rem; white-space:nowrap; }
  @media (max-width: 900px) { .decision-card { grid-template-columns:1fr; } }
</style>

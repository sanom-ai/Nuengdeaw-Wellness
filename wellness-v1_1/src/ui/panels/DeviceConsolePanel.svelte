<script lang="ts">
  export let snapshotState: any;

  $: device = snapshotState?.deviceConsole;
  $: diagnostics = snapshotState?.diagnostics;
  $: readinessTone = (device?.readinessScore ?? 0) >= 85 ? 'good' : (device?.readinessScore ?? 0) >= 55 ? 'watch' : 'risk';

  function timeLabel(at: number) {
    return new Date(at).toLocaleTimeString('th-TH');
  }

  function heartbeatLabel(value?: string | null) {
    return value ? new Date(value).toLocaleTimeString('th-TH') : '-';
  }
</script>

<section class="console glass">
  <div class="head">
    <div>
      <div class="eyebrow">Device Console</div>
      <h3>Pairing, Capability, and Runtime Health</h3>
      <p>Track the active source, browser readiness, permission posture, device telemetry, and the latest adapter-side events from the same runtime that drives the research surface.</p>
    </div>
    <div class="state-pill {device?.connectionState ?? 'live-sim'}">{device?.connectionState ?? 'unknown'}</div>
  </div>

  <div class="overview-grid">
    <div class="overview-card accent-{readinessTone}">
      <span>Readiness</span>
      <strong>{device?.readinessScore ?? 0}%</strong>
      <div class="meter"><i style={`width:${device?.readinessScore ?? 0}%`}></i></div>
    </div>
    <div class="overview-card">
      <span>Active Adapter</span>
      <strong>{device?.activeLabel ?? 'Unknown runtime'}</strong>
    </div>
    <div class="overview-card">
      <span>Device Name</span>
      <strong>{device?.deviceName ?? '-'}</strong>
    </div>
    <div class="overview-card">
      <span>Battery</span>
      <strong>{device?.batteryLevel ?? '-'}{#if device?.batteryLevel !== null}%{/if}</strong>
    </div>
    <div class="overview-card">
      <span>Signal Strength</span>
      <strong>{device?.signalStrength ?? '-'}{#if device?.signalStrength !== null}%{/if}</strong>
    </div>
    <div class="overview-card">
      <span>Transport Health</span>
      <strong>{device?.transportHealth ?? '-'}</strong>
    </div>
    <div class="overview-card">
      <span>Browser Bluetooth</span>
      <strong>{device?.browserBluetoothAvailable ? 'Available' : 'Unavailable'}</strong>
    </div>
    <div class="overview-card">
      <span>Last Heartbeat</span>
      <strong>{heartbeatLabel(device?.lastSeenAt)}</strong>
    </div>
  </div>

  <div class="console-grid">
    <section class="panel-block">
      <div class="block-title">Runtime Checklist</div>
      <div class="check-list">
        {#each diagnostics?.adapters?.find((adapter: any) => adapter.id === device?.activeAdapterId)?.requirements ?? [] as requirement}
          <div class="check-item">{requirement}</div>
        {/each}
      </div>
    </section>

    <section class="panel-block">
      <div class="block-title">Troubleshooting</div>
      <div class="transport-card">
        <div><span>Permission State</span><strong>{device?.permissionState ?? '-'}</strong></div>
        <div><span>Firmware</span><strong>{device?.firmwareLabel ?? '-'}</strong></div>
        <div><span>Last Failure</span><strong>{device?.lastFailureReason ?? 'No active failure'}</strong></div>
      </div>
      <div class="next-actions">
        {#each device?.troubleshootingSteps ?? [] as step}
          <div class="action-item">{step}</div>
        {/each}
      </div>
    </section>

    <section class="panel-block wide">
      <div class="block-title">Transport Profile</div>
      {#if diagnostics?.adapters}
        {@const activeAdapter = diagnostics.adapters.find((adapter: any) => adapter.id === device?.activeAdapterId)}
        <div class="transport-grid">
          <div><span>Adapter Id</span><strong>{device?.activeAdapterId ?? '-'}</strong></div>
          <div><span>Transport</span><strong>{activeAdapter?.transport ?? '-'}</strong></div>
          <div><span>Status</span><strong>{activeAdapter?.integrationStatus ?? '-'}</strong></div>
          <div><span>Channels</span><strong>{activeAdapter?.channels?.join(', ') ?? '-'}</strong></div>
          <div><span>Next Step</span><strong>{activeAdapter?.nextStep ?? '-'}</strong></div>
          <div><span>Runtime Mode</span><strong>{device?.connectionState ?? '-'}</strong></div>
        </div>
      {/if}
    </section>

    <section class="panel-block wide">
      <div class="block-title">Device Event Log</div>
      <div class="log-list">
        {#each device?.logs ?? [] as item}
          <div class="log-item {item.level}">
            <span class="log-time">{timeLabel(item.at)}</span>
            <span class="log-level">{item.level}</span>
            <p>{item.message}</p>
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
  .console {
    grid-column: 1 / -1;
    padding: 22px;
  }
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
  .state-pill {
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: rgba(255,255,255,0.03);
    color: var(--text-soft);
    text-transform: capitalize;
  }
  .state-pill.connected { border-color: rgba(82,247,212,0.4); color: var(--text); }
  .state-pill.pairing { border-color: rgba(239,195,109,0.45); color: var(--text); }
  .state-pill.mock-connected { border-color: rgba(164,141,255,0.45); color: var(--text); }
  .state-pill.replay { border-color: rgba(255,122,136,0.45); color: var(--text); }
  .overview-grid,
  .console-grid,
  .check-list,
  .log-list,
  .transport-grid,
  .next-actions {
    display: grid;
    gap: 12px;
  }
  .overview-grid {
    margin-top: 18px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .overview-card,
  .panel-block,
  .check-item,
  .action-item,
  .log-item,
  .transport-card > div,
  .transport-grid > div {
    border: 1px solid var(--line);
    border-radius: 16px;
    background: rgba(255,255,255,0.03);
    padding: 12px;
  }
  .overview-card span,
  .transport-card span,
  .transport-grid span,
  .block-title,
  .log-time,
  .log-level {
    color: var(--text-soft);
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .overview-card strong,
  .transport-card strong,
  .transport-grid strong {
    display: block;
    margin-top: 6px;
    font-family: 'Prompt', sans-serif;
    font-size: 1rem;
  }
  .meter {
    margin-top: 12px;
    height: 8px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    overflow: hidden;
  }
  .meter i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, rgba(77,167,255,0.9), rgba(82,247,212,0.95));
  }
  .overview-card.accent-good { border-color: rgba(82,247,212,0.35); }
  .overview-card.accent-watch { border-color: rgba(239,195,109,0.35); }
  .overview-card.accent-risk { border-color: rgba(255,122,136,0.35); }
  .console-grid {
    margin-top: 16px;
    grid-template-columns: 1fr 1fr;
  }
  .panel-block.wide {
    grid-column: 1 / -1;
  }
  .transport-card,
  .transport-grid {
    display: grid;
    gap: 10px;
    margin-top: 12px;
  }
  .transport-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .next-actions {
    margin-top: 12px;
  }
  .action-item {
    color: var(--text);
    line-height: 1.55;
  }
  .log-item {
    display: grid;
    grid-template-columns: 120px 96px minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }
  .log-item.info { border-color: rgba(82,247,212,0.22); }
  .log-item.warn { border-color: rgba(239,195,109,0.28); }
  .log-item.error { border-color: rgba(255,122,136,0.35); }
  .log-item p {
    margin: 0;
    color: var(--text);
  }
  @media (max-width: 1100px) {
    .overview-grid,
    .console-grid,
    .log-item,
    .transport-grid {
      grid-template-columns: 1fr;
    }
    .head {
      flex-direction: column;
    }
  }
</style>
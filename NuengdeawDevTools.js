'use strict';

/**
 * NuengdeawDevTools.js  v1.0.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper เปิด/ปิดฟีเจอร์จาก Nuengdeaw_Sim_Human2.js ผ่าน UI toggle
 *
 * ฟีเจอร์ที่ wrap:
 *   A. DeceptionEngine  — ตรวจจับการปลอมแปลง Biosignal
 *   B. DeceptionScorer  — คำนวณ PCI (Physiological Coherence Index)
 *   C. ArtifactDetector — ตรวจ Motion Artifact / Electrode Pop / Drift
 *   D. ABTestManager    — A/B Testing framework (สำหรับ researcher)
 *   E. ModelPortability — Export/Import TF.js model weights (advanced)
 *
 * USAGE ใน demo:
 *   NuengdeawDevTools.enable('deception')  // เปิด Deception Engine
 *   NuengdeawDevTools.enable('artifact')   // เปิด Artifact Detector
 *   NuengdeawDevTools.process(bio, bands, state) → { bio, bands, flags }
 *
 * TOGGLE ใน UI:
 *   เรียก NuengdeawDevTools.injectPanel('#target-element')
 *   จะ render toggle panel ที่ผู้ใช้เปิด/ปิดได้เอง
 * ─────────────────────────────────────────────────────────────────────────────
 */

const NuengdeawDevTools = (() => {

  // ── Feature flags ─────────────────────────────────────────────────────────
  const _flags = {
    deception: false,
    artifact:  false,
    abtest:    false,
  };

  // ── Dependency check ──────────────────────────────────────────────────────
  const _require = (name) => {
    const map = {
      DeceptionEngine:  () => typeof DeceptionEngine  !== 'undefined',
      DeceptionScorer:  () => typeof DeceptionScorer  !== 'undefined',
      ArtifactDetector: () => typeof ArtifactDetector !== 'undefined',
      ABTestManager:    () => typeof ABTestManager     !== 'undefined',
      ModelPortability: () => typeof ModelPortability  !== 'undefined',
    };
    if (map[name] && !map[name]()) {
      console.warn(`[NuengdeawDevTools] ${name} ไม่พบ — ตรวจสอบว่าโหลด Nuengdeaw_Sim_Human2.js แล้ว`);
      return false;
    }
    return true;
  };

  // ── enable / disable ──────────────────────────────────────────────────────
  const enable  = (feature) => { if (feature in _flags) { _flags[feature] = true;  _syncPanel(); } };
  const disable = (feature) => { if (feature in _flags) { _flags[feature] = false; _syncPanel(); } };
  const toggle  = (feature) => { _flags[feature] ? disable(feature) : enable(feature); };
  const isEnabled = (feature) => !!_flags[feature];

  // ── process — เรียก 1 ครั้งต่อ scan ─────────────────────────────────────
  /**
   * @param {object} bio    { hr, hrv, gsr, rr, eeg }
   * @param {object} bands  EEG band object
   * @param {string} state  emotion state name
   * @returns {{ bio, bands, artifactReport, deceptionReport }}
   */
  const process = (bio, bands, state) => {
    let outBio = { ...bio }, outBands = bands ? { ...bands } : null;
    let artifactReport = null, deceptionReport = null;

    // A. Artifact Detector
    if (_flags.artifact && _require('ArtifactDetector')) {
      artifactReport = ArtifactDetector.check(outBio, outBands);
    }

    // B. Deception Engine (modifies bio/bands in-place)
    if (_flags.deception && _require('DeceptionEngine')) {
      const r = DeceptionEngine.applyDeception(outBio, outBands);
      outBio   = r.bio;
      outBands = r.bands;
    }

    // C. Deception Scorer
    if (_flags.deception && _require('DeceptionScorer')) {
      deceptionReport = DeceptionScorer.score(outBio, outBands, state);
    }

    return { bio: outBio, bands: outBands, artifactReport, deceptionReport };
  };

  // ── A/B Test helpers (researcher API) ────────────────────────────────────
  const abtest = {
    create:  (...a) => _require('ABTestManager') && ABTestManager.createTest(...a),
    assign:  (...a) => _require('ABTestManager') && ABTestManager.assign(...a),
    record:  (...a) => _require('ABTestManager') && ABTestManager.record(...a),
    result:  (...a) => _require('ABTestManager') && ABTestManager.getResult(...a),
    list:    ()     => _require('ABTestManager') && ABTestManager.listTests(),
  };

  // ── UI Panel ──────────────────────────────────────────────────────────────
  let _panelEl = null;

  const PANEL_FEATURES = [
    { key: 'artifact',  label: 'Artifact Detector', desc: 'ตรวจ Motion / Electrode / Drift' },
    { key: 'deception', label: 'Deception Engine',  desc: 'PCI · ตรวจ Biosignal ปลอม' },
    { key: 'abtest',    label: 'A/B Test Manager',  desc: 'Researcher Mode (console API)' },
  ];

  const injectPanel = (selectorOrEl) => {
    const target = typeof selectorOrEl === 'string'
      ? document.querySelector(selectorOrEl)
      : selectorOrEl;
    if (!target) { console.warn('[NuengdeawDevTools] injectPanel: target not found'); return; }

    const panel = document.createElement('div');
    panel.id = 'nd-devtools-panel';
    panel.style.cssText = [
      'background:#fff;border:1px solid rgba(0,0,0,.09);border-radius:12px;',
      'padding:14px 16px;margin-top:12px;box-shadow:0 2px 10px rgba(13,21,38,.07);',
      'font-family:\'Share Tech Mono\',monospace;',
    ].join('');

    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(0,0,0,.07);">
        <div style="width:3px;height:13px;border-radius:2px;background:#7c3aed;flex-shrink:0;"></div>
        <span style="font-size:.53rem;letter-spacing:.22em;text-transform:uppercase;color:#8a9bba;">Dev Tools</span>
        <span style="margin-left:auto;font-size:.46rem;color:#c4b5fd;letter-spacing:.10em;">Sim_Human2</span>
      </div>
      <div id="nd-devtools-toggles" style="display:flex;flex-direction:column;gap:9px;"></div>
    `;
    target.appendChild(panel);
    _panelEl = panel;
    _syncPanel();
  };

  const _syncPanel = () => {
    if (!_panelEl) return;
    const container = _panelEl.querySelector('#nd-devtools-toggles');
    if (!container) return;
    container.innerHTML = PANEL_FEATURES.map(f => `
      <div style="display:flex;align-items:center;gap:10px;">
        <button
          id="ndt-btn-${f.key}"
          onclick="NuengdeawDevTools.toggle('${f.key}')"
          style="
            flex-shrink:0;width:36px;height:20px;border-radius:12px;border:none;cursor:pointer;
            background:${_flags[f.key] ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'rgba(0,0,0,.08)'};
            position:relative;transition:all .2s;
          "
          title="${_flags[f.key] ? 'ปิด' : 'เปิด'} ${f.label}"
        >
          <div style="
            position:absolute;top:2px;
            left:${_flags[f.key] ? '18px' : '2px'};
            width:16px;height:16px;border-radius:50%;
            background:${_flags[f.key] ? '#fff' : '#aaa'};
            transition:left .2s;
          "></div>
        </button>
        <div style="flex:1;min-width:0;">
          <div style="font-size:.52rem;letter-spacing:.12em;color:${_flags[f.key] ? '#5b21b6' : '#3d4f6e'};">${f.label}</div>
          <div style="font-size:.46rem;letter-spacing:.08em;color:#8a9bba;margin-top:1px;">${f.desc}</div>
        </div>
        <div style="
          font-size:.44rem;letter-spacing:.12em;padding:2px 7px;border-radius:4px;
          background:${_flags[f.key] ? 'rgba(124,58,237,.10)' : 'rgba(0,0,0,.04)'};
          color:${_flags[f.key] ? '#7c3aed' : '#aab'};
          flex-shrink:0;
        ">${_flags[f.key] ? 'ON' : 'OFF'}</div>
      </div>
    `).join('');
  };

  // ── public ─────────────────────────────────────────────────────────────────
  return {
    enable, disable, toggle, isEnabled,
    process,
    abtest,
    injectPanel,
    getFlags: () => ({ ..._flags }),
    version: '1.0.0',
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = NuengdeawDevTools;
else if (typeof window !== 'undefined') window.NuengdeawDevTools = NuengdeawDevTools;

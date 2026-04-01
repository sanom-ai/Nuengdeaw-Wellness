'use strict';

/**
 * NuengdeawStore.js
 * เก็บ scan record ทุกครั้งที่กด SCAN → export CSV
 *
 * API:
 *   NuengdeawStore.push(result, bio, bands, meta)  ← เรียกหลัง diagnose()
 *   NuengdeawStore.exportCSV()               ← download ทันที
 *   NuengdeawStore.getAll()                  ← [{...row}]
 *   NuengdeawStore.clear()                   ← ล้างทั้งหมด
 *   NuengdeawStore.count()                   ← จำนวน row
 */

const NuengdeawStore = (() => {
  const LS_KEY = 'nuengdeaw_scan_log';
  const MAX_ROWS = 500;

  // โหลดจาก localStorage (ข้ามหน้า refresh)
  let _rows = (() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
    catch { return []; }
  })();

  const _save = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(_rows.slice(-MAX_ROWS))); }
    catch { /* storage full — skip */ }
  };

  // ── columns ──────────────────────────────────────────────────────────
  const COLS = [
    'scan_no', 'timestamp', 'elapsed_sec',
    'input_mode', 'profile_mode', 'subject_id', 'baseline_source', 'profile_id', 'profile_version',
    'state', 'severity', 'confidence_pct',
    'hr_bpm', 'hrv_ms', 'gsr_us', 'rr_bpm', 'eeg_uv2',
    'theta', 'alpha', 'beta', 'gamma', 'theta_alpha_ratio',
    'microstate', 'iaf_hz',
    'critical_alerts', 'medical_findings',
    'summary',
  ];

  // ── sessionStart: wall-clock เมื่อโหลดหน้า ───────────────────────────
  const _sessionStart = Date.now();

  // ── push ─────────────────────────────────────────────────────────────
  const push = (result, bio, bands, meta = {}) => {
    if (!result) return;
    const now = Date.now();
    const b = bio  || result.signals || {};
    const bd = bands || result.signals?.bands || {};
    const profile = meta.profileContext || result._profileContext || {};

    const row = {
      scan_no:            _rows.length + 1,
      timestamp:          new Date(now).toISOString(),
      elapsed_sec:        Math.round((now - _sessionStart) / 1000),
      input_mode:         meta.inputMode ?? '',
      profile_mode:       profile.profileMode ?? '',
      subject_id:         profile.subjectId ?? '',
      baseline_source:    profile.baselineSource ?? '',
      profile_id:         profile.profileId ?? '',
      profile_version:    profile.profileVersion ?? '',

      state:              result.state?.name       ?? '',
      severity:           result.state?.severity   ?? '',
      confidence_pct:     result.state?.confidence != null
                          ? Math.round(result.state.confidence * 100)
                          : '',

      hr_bpm:             _r(b.hr),
      hrv_ms:             _r(b.hrv),
      gsr_us:             _r(b.gsr),
      rr_bpm:             _r(b.rr),
      eeg_uv2:            _r(b.eeg),

      theta:              _r(bd.theta),
      alpha:              _r(bd.alpha),
      beta:               _r(bd.beta),
      gamma:              _r(bd.gamma),
      theta_alpha_ratio:  _r(bd.thetaAlphaRatio),
      microstate:         bd.microstate ?? '',
      iaf_hz:             _r(bd.iaf),

      critical_alerts:    (result.criticalAlerts || []).map(a => a.id).join(';'),
      medical_findings:   (result.medicalFindings || []).map(m => m.id).join(';'),
      summary:            result.summary ?? '',
    };

    _rows.push(row);
    _save();
    return row;
  };

  // round helper
  const _r = (v) => v != null ? +Number(v).toFixed(2) : '';

  // ── exportCSV ─────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (_rows.length === 0) { alert('ยังไม่มีข้อมูล — กด SCAN ก่อนอย่างน้อย 1 ครั้ง'); return; }

    const escape = (v) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? '"' + s.replace(/"/g, '""') + '"'
        : s;
    };

    const header = COLS.join(',');
    const body   = _rows.map(row => COLS.map(c => escape(row[c])).join(',')).join('\n');
    const csv    = '\uFEFF' + header + '\n' + body; // BOM สำหรับ Excel Thai

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `nuengdeaw_scan_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── public ────────────────────────────────────────────────────────────
  return {
    push,
    exportCSV,
    getAll:  () => [..._rows],
    getLast: (n = 20) => _rows.slice(-n),
    clear:   () => { _rows = []; localStorage.removeItem(LS_KEY); },
    count:   () => _rows.length,
    sessionStartTime: _sessionStart,
    COLS,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = NuengdeawStore;
else if (typeof window !== 'undefined') window.NuengdeawStore = NuengdeawStore;

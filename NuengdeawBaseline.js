'use strict';

/**
 * NuengdeawBaseline.js  v1.0.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Personal Baseline Calibration — เก็บค่า HR, HRV, GSR, RR ในสภาวะ "อยู่นิ่ง"
 * ของผู้ใช้แต่ละคน แล้วคำนวณ Adaptive Threshold ที่ใช้แทน Static AT
 *
 * API (public):
 *   NuengdeawBaseline.addCalibrationSample(bio)   ← เพิ่ม 1 sample ระหว่าง Calibration
 *   NuengdeawBaseline.finalizeCalibration()        ← คำนวณ baseline จาก samples ที่เก็บไว้
 *   NuengdeawBaseline.isCalibrated()               ← true / false
 *   NuengdeawBaseline.getOffset()                  ← { hr, hrv, gsr, rr } ค่า mean ของผู้ใช้
 *   NuengdeawBaseline.getAdaptiveAT()              ← AT object ที่ผสม static + personal
 *   NuengdeawBaseline.getStatus()                  ← { calibrated, sampleCount, mean, std }
 *   NuengdeawBaseline.reset()                      ← ล้าง calibration ทั้งหมด
 *   NuengdeawBaseline.clearPending()               ← ล้าง samples ที่รวบรวมอยู่ (ยังไม่ finalize)
 *
 * Blended Threshold Formula:
 *   effective = (STATIC_AT × STATIC_WEIGHT) + (personal_mean × PERSONAL_WEIGHT)
 *   default weights: STATIC=0.4, PERSONAL=0.6
 * ─────────────────────────────────────────────────────────────────────────────
 */

const NuengdeawBaseline = (() => {
  // ── Config ────────────────────────────────────────────────────────────────
  const LS_KEY        = 'nuengdeaw_baseline_v1';
  const DEFAULT_SUBJECT_ID = 'SELF';
  const MIN_SAMPLES   = 8;    // ต้องการ sample อย่างน้อยกี่ตัวจึง finalize ได้
  const MAX_SAMPLES   = 120;  // เก็บได้สูงสุดกี่ sample (2 นาที × 1 sample/วิ = 120)
  const STATIC_WEIGHT = 0.4;
  const PERSONAL_WEIGHT = 0.6;

  // ── Static AT (reference จาก NuengdeawWellnessCore) ───────────────────────
  // คัดลอกค่าที่ใช้ใน _checkSignalAnomalies() ไว้ที่นี่เพื่อคำนวณ Blended AT
  const STATIC_AT = {
    HRV_LOW:    10,
    HRV_STRESS: 20,
    HRV_READY:  50,
    HR_BRADY:   45,
    HR_TACHY:   120,
    HR_EXTREME: 140,
    GSR_LOW:    0.5,
    GSR_HIGH:   15,
    GSR_EXTREME:20,
    RESP_APNEA: 5,
    RESP_HIGH:  30,
  };

  // ── In-memory state ────────────────────────────────────────────────────────
  let _pending  = [];   // samples ระหว่าง calibration ยังไม่ finalize
  let _activeSubjectId = DEFAULT_SUBJECT_ID;
  let _subjects = {};   // { SUBJECT_ID: { mean,std,sampleCount,calibratedAt } }

  // ── โหลดจาก localStorage ──────────────────────────────────────────────────
  const _load = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.subjects && typeof parsed.subjects === 'object') {
        _subjects = parsed.subjects;
        _activeSubjectId = parsed.activeSubjectId || DEFAULT_SUBJECT_ID;
        return;
      }
      // Backward compatibility: old schema stored one baseline object.
      if (parsed && parsed.mean && parsed.std) {
        _subjects = { [DEFAULT_SUBJECT_ID]: parsed };
        _activeSubjectId = DEFAULT_SUBJECT_ID;
      }
    } catch {
      _subjects = {};
      _activeSubjectId = DEFAULT_SUBJECT_ID;
    }
  };
  _load();

  // ── save ──────────────────────────────────────────────────────────────────
  const _save = () => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        activeSubjectId: _activeSubjectId,
        subjects: _subjects,
      }));
    } catch { /* storage full */ }
  };

  const _getBaseline = () => _subjects[_activeSubjectId] || null;

  // ── math helpers ──────────────────────────────────────────────────────────
  const _mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const _std  = (arr, mean) => {
    const m = mean ?? _mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
  };
  const _r2 = (v) => +Number(v).toFixed(2);

  // ── addCalibrationSample ──────────────────────────────────────────────────
  /**
   * เรียกทุกครั้งที่ได้ bio sample ระหว่างช่วง Calibration
   * @param {object} bio  { hr, hrv, gsr, rr }
   * @returns {number}    จำนวน sample ที่เก็บได้แล้ว
   */
  const addCalibrationSample = (bio) => {
    if (!bio) return _pending.length;
    if (_pending.length >= MAX_SAMPLES) return _pending.length; // เต็มแล้ว
    _pending.push({
      hr:  +Number(bio.hr  ?? 72).toFixed(2),
      hrv: +Number(bio.hrv ?? 38).toFixed(2),
      gsr: +Number(bio.gsr ?? 4.5).toFixed(2),
      rr:  +Number(bio.rr  ?? 15).toFixed(2),
    });
    return _pending.length;
  };

  // ── finalizeCalibration ───────────────────────────────────────────────────
  /**
   * คำนวณ baseline จาก pending samples แล้วบันทึก
   * @returns {{ ok:boolean, mean:object, std:object, sampleCount:number } | { ok:false, reason:string }}
   */
  const finalizeCalibration = () => {
    if (_pending.length < MIN_SAMPLES) {
      return { ok: false, reason: `ต้องการอย่างน้อย ${MIN_SAMPLES} samples (มีแค่ ${_pending.length})` };
    }

    const keys = ['hr', 'hrv', 'gsr', 'rr'];
    const mean = {}, std = {}, sampleCount = _pending.length;

    for (const k of keys) {
      const vals = _pending.map(s => s[k]);
      const m = _mean(vals);
      mean[k] = _r2(m);
      std[k]  = _r2(_std(vals, m));
    }

    _subjects[_activeSubjectId] = { mean, std, sampleCount, calibratedAt: Date.now() };
    _pending  = [];
    _save();

    return { ok: true, mean, std, sampleCount };
  };

  // ── isCalibrated ──────────────────────────────────────────────────────────
  const isCalibrated = () => !!_getBaseline();

  // ── getOffset ─────────────────────────────────────────────────────────────
  /**
   * คืน mean ของผู้ใช้ (personal resting baseline)
   * ถ้ายังไม่ calibrate จะคืน null
   */
  const getOffset = () => {
    const baseline = _getBaseline();
    return baseline ? { ...baseline.mean } : null;
  };

  // ── getAdaptiveAT ─────────────────────────────────────────────────────────
  /**
   * คำนวณ AT ที่ผสม Static × 0.4 + Personal × 0.6
   * ถ้ายังไม่ calibrate คืน STATIC_AT เดิมทั้งหมด
   * @returns {object} AT object ที่พร้อมส่งเข้า WellnessCore.assess()
   */
  const getAdaptiveAT = () => {
    const baseline = _getBaseline();
    if (!baseline) return { ...STATIC_AT };

    const b = baseline.mean;
    const sw = STATIC_WEIGHT;
    const pw = PERSONAL_WEIGHT;

    // helper: blend ค่า static กับ personal mean แล้วปรับทิศทาง
    const blend = (staticVal, personalVal) => _r2(staticVal * sw + personalVal * pw);

    // HRV thresholds — ยิ่ง HRV สูง ยิ่งดี; threshold ขยับตาม baseline
    const hrvBase = b.hrv;
    const adaptedHRV_LOW    = _r2(blend(STATIC_AT.HRV_LOW,    hrvBase * 0.30));  // 30% ของ resting
    const adaptedHRV_STRESS = _r2(blend(STATIC_AT.HRV_STRESS, hrvBase * 0.55));  // 55% ของ resting
    const adaptedHRV_READY  = _r2(blend(STATIC_AT.HRV_READY,  hrvBase * 1.15));  // 115% ของ resting

    // HR thresholds — threshold Tachy/Brady ขยับตาม resting HR
    const hrBase = b.hr;
    const adaptedHR_BRADY   = _r2(blend(STATIC_AT.HR_BRADY,   hrBase  * 0.72));  // 72% of resting
    const adaptedHR_TACHY   = _r2(blend(STATIC_AT.HR_TACHY,   hrBase  * 1.65));  // 165% of resting
    const adaptedHR_EXTREME = _r2(blend(STATIC_AT.HR_EXTREME, hrBase  * 1.90));  // 190% of resting

    // GSR thresholds
    const gsrBase = b.gsr;
    const adaptedGSR_LOW    = _r2(blend(STATIC_AT.GSR_LOW,    gsrBase * 0.25));
    const adaptedGSR_HIGH   = _r2(blend(STATIC_AT.GSR_HIGH,   gsrBase * 2.80));
    const adaptedGSR_EXTREME= _r2(blend(STATIC_AT.GSR_EXTREME,gsrBase * 3.50));

    // RR thresholds
    const rrBase = b.rr;
    const adaptedRESP_APNEA = _r2(blend(STATIC_AT.RESP_APNEA, rrBase  * 0.35));
    const adaptedRESP_HIGH  = _r2(blend(STATIC_AT.RESP_HIGH,  rrBase  * 1.90));

    return {
      // Adaptive thresholds
      HRV_LOW:     adaptedHRV_LOW,
      HRV_STRESS:  adaptedHRV_STRESS,
      HRV_READY:   adaptedHRV_READY,
      HR_BRADY:    adaptedHR_BRADY,
      HR_TACHY:    adaptedHR_TACHY,
      HR_EXTREME:  adaptedHR_EXTREME,
      GSR_LOW:     adaptedGSR_LOW,
      GSR_HIGH:    adaptedGSR_HIGH,
      GSR_EXTREME: adaptedGSR_EXTREME,
      RESP_APNEA:  adaptedRESP_APNEA,
      RESP_HIGH:   adaptedRESP_HIGH,
      // ค่าที่ไม่มี personal signal ให้ใช้ static เดิม
      N400_VETO:        4.0,
      THETA_ALPHA_HIGH: 2.5,
      SESSION_MAX:      7200,
      CONFIDENCE_MIN:   0.50,
      // metadata
      _isAdaptive:      true,
      _baselineDate:    baseline.calibratedAt,
    };
  };

  // ── getStatus ─────────────────────────────────────────────────────────────
  const getStatus = () => ({
    activeSubjectId: _activeSubjectId,
    calibrated:   isCalibrated(),
    sampleCount:  _pending.length,
    minSamples:   MIN_SAMPLES,
    maxSamples:   MAX_SAMPLES,
    mean:         _getBaseline()?.mean   ?? null,
    std:          _getBaseline()?.std    ?? null,
    calibratedAt: _getBaseline()?.calibratedAt ? new Date(_getBaseline().calibratedAt).toLocaleString('th-TH') : null,
    adaptiveAT:   isCalibrated() ? getAdaptiveAT() : null,
  });

  // ── reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    delete _subjects[_activeSubjectId];
    _pending  = [];
    _save();
  };

  // ── clearPending ──────────────────────────────────────────────────────────
  const clearPending = () => { _pending = []; };

  const setActiveSubject = (subjectId) => {
    const normalized = String(subjectId || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
    _activeSubjectId = normalized || DEFAULT_SUBJECT_ID;
    _pending = [];
    _save();
    return _activeSubjectId;
  };

  const getActiveSubject = () => _activeSubjectId;

  const listSubjects = () => Object.keys(_subjects);

  // ── public ────────────────────────────────────────────────────────────────
  return {
    addCalibrationSample,
    finalizeCalibration,
    isCalibrated,
    getOffset,
    getAdaptiveAT,
    getStatus,
    reset,
    clearPending,
    setActiveSubject,
    getActiveSubject,
    listSubjects,
    MIN_SAMPLES,
    MAX_SAMPLES,
    version: '1.0.0',
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = NuengdeawBaseline;
else if (typeof window !== 'undefined') window.NuengdeawBaseline = NuengdeawBaseline;

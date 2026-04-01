'use strict';

/**
 * WearableDriver  v1.0.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Adapter layer สำหรับอุปกรณ์ Wearable จริง
 *
 * HOW TO INTEGRATE:
 *   1. เลือก DEVICE_TYPE ให้ตรงกับอุปกรณ์ที่ใช้
 *   2. ถ้าอุปกรณ์ใช้ Web Bluetooth → implement _connectBluetooth()
 *   3. ถ้าอุปกรณ์ใช้ REST/WebSocket SDK → implement _connectSDK()
 *   4. map ค่าที่ได้จาก SDK เข้า _state.bio / _state.bands
 *
 * SUPPORTED DEVICE TYPES (ขยายได้):
 *   'polar'     — Polar H10 / Verity Sense via Web Bluetooth (HR, HRV RMSSD)
 *   'empatica'  — Empatica E4 via REST API (HR, HRV, GSR/EDA, RR)
 *   'muse'      — Muse 2 / Muse S via mind.js SDK (EEG bands, HR)
 *   'generic'   — Generic BLE device — implement _mapGenericData() ด้วยตัวเอง
 *   'mock'      — Debug mode คืนค่า hardcoded สำหรับทดสอบโดยไม่มีอุปกรณ์จริง
 * ─────────────────────────────────────────────────────────────────────────────
 */
const WearableDriver = (() => {

  // ── Config — แก้ตรงนี้เพื่อเลือกอุปกรณ์ ──────────────────────────────────
  const DEVICE_TYPE          = 'mock';   // 'polar' | 'empatica' | 'muse' | 'generic' | 'mock'
  const RECONNECT_MAX_TRIES  = 3;
  const RECONNECT_DELAY_MS   = 2000;
  const CONNECTION_TIMEOUT_MS= 10000;

  // ── Internal state ────────────────────────────────────────────────────────
  let _status    = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'error'
  let _device    = null;           // BLE device handle หรือ SDK instance
  let _lastErr   = null;
  let _retryCount= 0;
  let _state = {
    bio:   { hr: null, hrv: null, gsr: null, rr: null, eeg: null },
    bands: { theta: null, alpha: null, beta: null, gamma: null,
             thetaAlphaRatio: null, iaf: null, microstate: 'A' },
    emotionState: 'NEUTRAL',
    lastUpdated: null,
  };

  // ── Device-specific connectors ────────────────────────────────────────────

  /** Polar H10 / Verity Sense — Web Bluetooth API */
  const _connectPolar = async () => {
    if (!navigator.bluetooth) throw new Error('Web Bluetooth ไม่รองรับใน Browser นี้');
    _device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'Polar' }],
      optionalServices: ['heart_rate', '0000180d-0000-1000-8000-00805f9b34fb'],
    });
    const server  = await _device.gatt.connect();
    const svc     = await server.getPrimaryService('heart_rate');
    const char    = await svc.getCharacteristic('heart_rate_measurement');
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', (e) => {
      const val  = e.target.value;
      const flag = val.getUint8(0);
      const hr   = (flag & 0x01) ? val.getUint16(1, true) : val.getUint8(1);
      // RR intervals (ms) → HRV RMSSD approximation
      let hrv = null;
      if ((flag & 0x10) && val.byteLength >= 4) {
        const rr1 = val.getUint16(2, true) / 1024 * 1000;
        const rr2 = val.byteLength >= 6 ? val.getUint16(4, true) / 1024 * 1000 : rr1;
        hrv = Math.round(Math.sqrt(Math.pow(rr2 - rr1, 2)));
      }
      _state.bio.hr  = hr;
      _state.bio.hrv = hrv ?? _state.bio.hrv;
      _state.lastUpdated = Date.now();
    });
    _device.addEventListener('gattserverdisconnected', () => {
      _status = 'disconnected';
      console.warn('[WearableDriver] Polar disconnected — auto-reconnect...');
      reconnect();
    });
  };

  /** Empatica E4 — REST API (ต้องเปิด E4 Streaming Server ก่อน) */
  const _connectEmpatica = async () => {
    const E4_SERVER = 'ws://127.0.0.1:28000';  // แก้ host/port ตาม E4 Streaming Server
    const ws = new WebSocket(E4_SERVER);
    await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('Empatica E4: Connection timeout')), CONNECTION_TIMEOUT_MS);
      ws.onopen  = () => { clearTimeout(t); res(); };
      ws.onerror = (e) => { clearTimeout(t); rej(new Error('Empatica E4: WebSocket error')); };
    });
    ws.send('device_connect_btle\r\n');
    ws.send('device_subscribe gsr ON\r\n');
    ws.send('device_subscribe bvp ON\r\n');  // BVP → HR/HRV
    ws.send('device_subscribe rsp ON\r\n');  // Respiration rate
    ws.onmessage = (e) => {
      const parts = e.data.trim().split(' ');
      if (parts[0] === 'E4_Gsr')  { _state.bio.gsr = parseFloat(parts[2]); }
      if (parts[0] === 'E4_Bvp')  { /* compute HR/HRV from BVP peaks — ต้อง implement peak detector */ }
      if (parts[0] === 'E4_Hr')   { _state.bio.hr  = parseFloat(parts[2]); }
      _state.lastUpdated = Date.now();
    };
    ws.onclose = () => { _status = 'disconnected'; reconnect(); };
    _device = ws;
  };

  /** Muse 2 / Muse S — mind.js / muse-js SDK */
  const _connectMuse = async () => {
    // npm: muse-js  →  import { MuseClient } from 'muse-js'
    // ถ้าโหลดจาก CDN ให้ตรวจ window.MuseClient
    if (typeof window.MuseClient === 'undefined') throw new Error('Muse SDK (muse-js) ยังไม่ได้โหลด');
    const client = new window.MuseClient();
    await client.connect();
    await client.start();
    _device = client;
    client.eegReadings.subscribe((r) => {
      // r.electrode: 0=TP9 1=AF7 2=AF8 3=TP10 4=AUX
      // r.samples: Float32Array 12 samples @ 256Hz
      // ── ตัวอย่าง: ใช้ electrode 1(AF7) คำนวณ band power แบบง่าย ──
      // สำหรับ production ให้ใช้ FFT library (e.g. fft.js)
      // ที่นี่ map ตัวอย่างเท่านั้น
      _state.bands.lastRaw = r.samples;
      _state.lastUpdated   = Date.now();
    });
    client.telemetryData.subscribe((t) => {
      _state.bio.hr = t.heartRate;
      _state.lastUpdated = Date.now();
    });
  };

  /** Generic — ขยายตรงนี้สำหรับอุปกรณ์อื่น */
  const _connectGeneric = async () => {
    throw new Error(
      'WearableDriver (generic): ยังไม่ได้ implement\n' +
      'กรุณา implement _connectGeneric() ใน NuengdeawInput.js\n' +
      'แล้ว map ค่าเข้า _state.bio และ _state.bands'
    );
  };

  /** Mock — สำหรับ debug โดยไม่มีอุปกรณ์จริง */
  const _connectMock = async () => {
    // สร้าง fake streaming interval
    _device = setInterval(() => {
      _state.bio = {
        hr:  60 + Math.random() * 20,
        hrv: 30 + Math.random() * 20,
        gsr:  3 + Math.random() * 4,
        rr:  14 + Math.random() * 4,
        eeg:  0.8 + Math.random() * 0.4,
      };
      _state.bands = {
        theta: 0.8 + Math.random() * 0.4,
        alpha: 1.5 + Math.random() * 0.5,
        beta:  1.0 + Math.random() * 0.6,
        gamma: 0.4 + Math.random() * 0.2,
        thetaAlphaRatio: null,
        iaf: 10.0, microstate: 'A',
      };
      _state.bands.thetaAlphaRatio = _state.bands.theta / (_state.bands.alpha || 1);
      _state.lastUpdated = Date.now();
    }, 500);
  };

  // ── connect ────────────────────────────────────────────────────────────────
  const connect = async () => {
    if (_status === 'connected') return;
    _status = 'connecting';
    _lastErr = null;
    const fn = { polar:_connectPolar, empatica:_connectEmpatica, muse:_connectMuse, generic:_connectGeneric, mock:_connectMock }[DEVICE_TYPE];
    if (!fn) throw new Error(`WearableDriver: ไม่รู้จัก DEVICE_TYPE '${DEVICE_TYPE}'`);
    await fn();
    _status = 'connected';
    _retryCount = 0;
    console.info(`[WearableDriver] Connected (${DEVICE_TYPE})`);
  };

  // ── checkConnection ────────────────────────────────────────────────────────
  const checkConnection = () => {
    const staleSec = _state.lastUpdated ? (Date.now() - _state.lastUpdated) / 1000 : Infinity;
    return {
      status: _status,
      deviceType: DEVICE_TYPE,
      lastUpdatedSec: staleSec === Infinity ? null : +staleSec.toFixed(1),
      isStale: staleSec > 5,      // ไม่มีข้อมูลใหม่เกิน 5 วิ = stale
      lastError: _lastErr,
      retryCount: _retryCount,
    };
  };

  // ── reconnect ──────────────────────────────────────────────────────────────
  const reconnect = async () => {
    if (_status === 'connecting') return;
    if (_retryCount >= RECONNECT_MAX_TRIES) {
      _status  = 'error';
      _lastErr = `เกินจำนวน retry สูงสุด (${RECONNECT_MAX_TRIES} ครั้ง)`;
      console.error('[WearableDriver] Max retries reached:', _lastErr);
      return;
    }
    _retryCount++;
    _status = 'disconnected';
    console.warn(`[WearableDriver] Reconnecting... (try ${_retryCount}/${RECONNECT_MAX_TRIES})`);
    await new Promise(r => setTimeout(r, RECONNECT_DELAY_MS));
    try { await connect(); }
    catch (e) {
      _lastErr = e.message;
      _status  = 'error';
      console.error('[WearableDriver] Reconnect failed:', e.message);
    }
  };

  // ── disconnect ─────────────────────────────────────────────────────────────
  const disconnect = () => {
    if (DEVICE_TYPE === 'mock' && _device) { clearInterval(_device); }
    else if (_device?.gatt?.connected)     { _device.gatt.disconnect(); }
    else if (_device?.close)               { _device.close(); }
    else if (_device?.disconnect)          { _device.disconnect(); }
    _device = null; _status = 'disconnected';
    console.info('[WearableDriver] Disconnected');
  };

  // ── getBio ─────────────────────────────────────────────────────────────────
  const getBio = async () => {
    if (_status !== 'connected') {
      await connect(); // auto-connect ถ้ายังไม่ได้ต่อ
    }
    const { bio } = _state;
    const missing = ['hr','hrv','gsr','rr'].filter(k => bio[k] === null);
    if (missing.length > 0) {
      throw new Error(`WearableDriver.getBio(): ยังไม่มีข้อมูล [${missing.join(', ')}] — รอ Wearable ส่งค่า`);
    }
    return { ...bio };
  };

  // ── getEEGBands ────────────────────────────────────────────────────────────
  const getEEGBands = async () => {
    if (_status !== 'connected') await connect();
    const { bands } = _state;
    if (bands.theta === null) {
      throw new Error('WearableDriver.getEEGBands(): ยังไม่มีข้อมูล EEG — ตรวจสอบ EEG Sensor');
    }
    return { ...bands };
  };

  // ── getState ───────────────────────────────────────────────────────────────
  const getState = () => _state.emotionState;

  // ── public ─────────────────────────────────────────────────────────────────
  return { getBio, getEEGBands, getState, connect, disconnect, checkConnection, reconnect, DEVICE_TYPE };
})();

const NuengdeawInput = {
  mode: 'sim',

  setMode(mode) {
    if(!['sim','wearable'].includes(mode)){console.warn(`NuengdeawInput.setMode: โหมด '${mode}' ไม่ถูกต้อง`);return false;}
    this.mode = mode;
    return true;
  },

  getMode() {
    return this.mode;
  },

  _fromSim() {
    if(typeof HumanSim==='undefined')throw new Error('NuengdeawInput: HumanSim ไม่พร้อม — โหลด Nuengdeaw_Sim_Human1.js ก่อน');
    HumanSim.tick();
    return{bio:HumanSim.generateBio(),bands:HumanSim.generateEEGBands(),state:HumanSim.getState(),history:HumanSim.getHistory().slice(-10).map(x=>x.state)};
  },

  _fromSimForced(forcedState) {
    if(typeof HumanSim==='undefined')throw new Error('NuengdeawInput: HumanSim ไม่พร้อม');
    HumanSim.force(forcedState);
    for(let i=0;i<4;i++)HumanSim.tick();
    return{bio:HumanSim.generateBio(),bands:HumanSim.generateEEGBands(),state:HumanSim.getState(),history:HumanSim.getHistory().slice(-10).map(x=>x.state)};
  },

  async _fromWearable() {
    const[bio,bands]=await Promise.all([WearableDriver.getBio(),WearableDriver.getEEGBands()]);
    return{bio,bands,state:WearableDriver.getState(),history:[]};
  },

  async get(options={}) {
    if(this.mode==='sim')return options.forceState?this._fromSimForced(options.forceState):this._fromSim();
    if(this.mode==='wearable')return await this._fromWearable();
    throw new Error(`NuengdeawInput.get(): โหมด '${this.mode}' ไม่รู้จัก`);
  },

  status(){
    const connection = typeof WearableDriver!=='undefined' && typeof WearableDriver.checkConnection==='function'
      ? WearableDriver.checkConnection()
      : null;
    const wearableReady = !!connection && connection.status==='connected' && !connection.isStale;
    return {
      mode:this.mode,
      simAvailable:typeof HumanSim!=='undefined',
      wearableReady,
      wearable:connection,
    };
  },
};

if(typeof module!=='undefined'&&module.exports){module.exports={NuengdeawInput,WearableDriver};}
else if(typeof window!=='undefined'){window.NuengdeawInput=NuengdeawInput;window.WearableDriver=WearableDriver;}

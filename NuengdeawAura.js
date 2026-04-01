'use strict';

const LIBRA_TOKENS = {
  severity:{
    critical:{ bg:'#1a0000', border:'#ff3b3b', text:'#ff6b6b', badge:'#ff3b3b', badgeText:'#fff' },
    warning: { bg:'#1a1000', border:'#ffaa00', text:'#ffcc44', badge:'#ffaa00', badgeText:'#000' },
    mild:    { bg:'#0d0d1a', border:'#8888ff', text:'#aaaaff', badge:'#5555dd', badgeText:'#fff' },
    neutral: { bg:'#0d1017', border:'#4488aa', text:'#66aacc', badge:'#336688', badgeText:'#fff' },
    normal:  { bg:'#0d1117', border:'#334455', text:'#99aabb', badge:'#223344', badgeText:'#fff' },
    positive:{ bg:'#001a0d', border:'#00cc77', text:'#00ffaa', badge:'#00aa55', badgeText:'#fff' },
  },
  signal:{ good:'#00cc77', warning:'#ffaa00', critical:'#ff3b3b', normal:'#557799' },
  font:{ display:"'JetBrains Mono','Courier New',monospace", body:"'Sarabun','Noto Sans Thai',sans-serif" },
};

const _CSS_ID='nuengdeaw-libra-style';
const _injectCSS=()=>{
  if(typeof document==='undefined'||document.getElementById(_CSS_ID))return;
  const style=document.createElement('style');
  style.id=_CSS_ID;
  style.textContent=`
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600&family=JetBrains+Mono:wght@400;600&display=swap');
    .nd-card{font-family:'Sarabun','Noto Sans Thai',sans-serif;background:#0d1117;border-radius:12px;border:1px solid #223344;padding:20px;color:#c9d1d9;max-width:720px;box-sizing:border-box;}
    .nd-card *{box-sizing:border-box;}
    .nd-critical-banner{background:#1a0000;border:2px solid #ff3b3b;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;}
    .nd-critical-banner .nd-icon{font-size:20px;flex-shrink:0;margin-top:2px;}
    .nd-critical-banner .nd-body{flex:1;}
    .nd-critical-banner .nd-title{color:#ff6b6b;font-weight:600;font-size:14px;margin:0 0 4px;}
    .nd-critical-banner .nd-msg{color:#ffaaaa;font-size:13px;margin:0 0 4px;font-family:'JetBrains Mono',monospace;}
    .nd-critical-banner .nd-act{color:#ff3b3b;font-size:12px;font-weight:600;margin:0;}
    .nd-state-header{display:flex;align-items:center;gap:14px;margin-bottom:16px;padding:14px 16px;border-radius:10px;border:1px solid;}
    .nd-state-emoji{font-size:36px;flex-shrink:0;}
    .nd-state-info{flex:1;}
    .nd-state-label{font-size:20px;font-weight:600;margin:0 0 2px;}
    .nd-state-labelTH{font-size:13px;opacity:0.7;margin:0 0 4px;}
    .nd-state-desc{font-size:13px;opacity:0.8;margin:0;line-height:1.5;}
    .nd-state-meta{text-align:right;flex-shrink:0;}
    .nd-confidence{font-family:'JetBrains Mono',monospace;font-size:24px;font-weight:600;margin:0;}
    .nd-conf-label{font-size:11px;opacity:0.6;margin:0;}
    .nd-action-badge{display:inline-block;margin-top:8px;padding:3px 8px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;}
    .nd-section{margin-bottom:14px;}
    .nd-section-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#557799;margin:0 0 8px;padding-bottom:4px;border-bottom:1px solid #1a2533;}
    .nd-signal-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;}
    .nd-signal-item{background:#111b27;border-radius:8px;padding:10px 12px;border-left:3px solid;}
    .nd-signal-name{font-size:11px;color:#6688aa;margin:0 0 3px;font-family:'JetBrains Mono',monospace;}
    .nd-signal-value{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:600;margin:0 0 2px;}
    .nd-anomaly-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;margin-bottom:5px;font-size:13px;}
    .nd-anomaly-item.critical{background:#1a0000;color:#ff8888;}
    .nd-anomaly-item.warning{background:#1a1000;color:#ffcc77;}
    .nd-anomaly-item.good{background:#001a0d;color:#55ffaa;}
    .nd-anomaly-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
    .nd-firstaid-list{list-style:none;padding:0;margin:0;}
    .nd-firstaid-list li{padding:7px 10px 7px 28px;position:relative;font-size:13px;line-height:1.5;border-radius:5px;margin-bottom:4px;background:#111b27;}
    .nd-firstaid-list li::before{content:'→';position:absolute;left:10px;color:#3399ff;font-weight:600;}
    .nd-firstaid-list li.critical-step{background:#1a0005;color:#ffaaaa;}
    .nd-firstaid-list li.critical-step::before{content:'⚠️';left:8px;}
    .nd-medical-item{background:#111b27;border-radius:8px;padding:12px 14px;margin-bottom:8px;border-left:3px solid;}
    .nd-medical-header{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
    .nd-medical-icd{font-family:'JetBrains Mono',monospace;font-size:11px;padding:2px 6px;border-radius:3px;background:#1e2d3d;color:#6699bb;}
    .nd-medical-label{font-size:14px;font-weight:600;}
    .nd-medical-desc{font-size:12px;color:#8899aa;margin:0 0 8px;line-height:1.5;}
    .nd-medical-symptoms{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;}
    .nd-symptom-tag{font-family:'JetBrains Mono',monospace;font-size:11px;background:#1e2d3d;color:#aabbcc;padding:2px 8px;border-radius:99px;}
    .nd-ref-item{font-size:11px;font-family:'JetBrains Mono',monospace;color:#446677;margin-bottom:6px;line-height:1.6;}
    .nd-ref-author{color:#557799;}
    .nd-ref-year{color:#446677;}
    .nd-footer{display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:10px;color:#334455;margin-top:16px;padding-top:10px;border-top:1px solid #1a2533;}
    .nd-ambiguous{background:#1a1000;border:1px solid #ffaa00;border-radius:8px;padding:12px 16px;margin-bottom:16px;color:#ffcc44;font-size:13px;}
    .nd-toggle{cursor:pointer;display:flex;justify-content:space-between;align-items:center;}
    .nd-toggle-arrow{transition:transform 0.2s;}
    .nd-toggle.open .nd-toggle-arrow{transform:rotate(90deg);}
    .nd-collapsible{overflow:hidden;max-height:0;transition:max-height 0.3s ease;}
    .nd-collapsible.open{max-height:9999px;}
  `;
  document.head.appendChild(style);
};

const _esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

const _buildCriticalAlerts=(alerts)=>{
  if(!alerts||alerts.length===0)return'';
  return alerts.map(a=>`<div class="nd-critical-banner"><div class="nd-icon">🚨</div><div class="nd-body"><p class="nd-title">${_esc(a.label)}</p><p class="nd-msg">${_esc(a.message)}</p><p class="nd-act">▶ ${_esc(a.action)}</p></div></div>`).join('');
};

const _buildStateHeader=(state)=>{
  if(!state)return'';
  const tok=LIBRA_TOKENS.severity[state.severity]||LIBRA_TOKENS.severity.normal;
  const confPct=Math.round((state.confidence||0)*100);
  const ambiguousNote=state.isAmbiguous?`<span style="color:#ffaa00;font-size:11px"> ⚠️ Confidence ต่ำ — ผลวินิจฉัยอาจไม่แม่นยำ</span>`:'';
  return`<div class="nd-state-header" style="background:${tok.bg};border-color:${tok.border}"><div class="nd-state-emoji">${_esc(state.emoji)}</div><div class="nd-state-info"><p class="nd-state-label" style="color:${tok.text}">${_esc(state.label)}</p><p class="nd-state-labelTH">${_esc(state.labelTH)} ${ambiguousNote}</p><p class="nd-state-desc">${_esc(state.description)}</p><span class="nd-action-badge" style="background:${tok.badge};color:${tok.badgeText}">${_esc(state.action)}</span><span style="font-size:12px;color:${tok.text};margin-left:6px">${_esc(state.actionDesc)}</span></div><div class="nd-state-meta"><p class="nd-confidence" style="color:${tok.text}">${confPct}%</p><p class="nd-conf-label">confidence</p><div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#446677;margin-top:4px">${_esc(state.code)}</div></div></div>`;
};

const _buildSignalGrid=(signals)=>{
  if(!signals)return'';
  const items=[
    {key:'hrv',label:'HRV RMSSD (ms)',unit:'ms',   value:signals.hrv},
    {key:'hr', label:'Heart Rate (HR)',unit:'bpm',  value:signals.hr },
    {key:'gsr',label:'GSR / EDA',     unit:'µS',   value:signals.gsr},
    {key:'rr', label:'Resp. Rate (RR)',unit:'br/min',value:signals.rr},
    {key:'eeg',label:'EEG Power (µV²)',unit:'µV²', value:signals.eeg},
  ].filter(i=>i.value!==undefined&&i.value!==null);
  if(signals.bands?.thetaAlphaRatio!==undefined)items.push({key:'tar',label:'θ/α Ratio',unit:'',value:+signals.bands.thetaAlphaRatio.toFixed(2)});
  if(items.length===0)return'';

  const cells=items.map(item=>{
    const val=typeof item.value==='number'?item.value.toFixed(item.key==='tar'?2:1):_esc(item.value);
    let color=LIBRA_TOKENS.signal.normal;
    if(item.key==='hrv')color=item.value<10?LIBRA_TOKENS.signal.critical:item.value<20?LIBRA_TOKENS.signal.warning:item.value>50?LIBRA_TOKENS.signal.good:LIBRA_TOKENS.signal.normal;
    else if(item.key==='hr')color=item.value>140?LIBRA_TOKENS.signal.critical:item.value>120||item.value<45?LIBRA_TOKENS.signal.warning:LIBRA_TOKENS.signal.normal;
    else if(item.key==='gsr')color=item.value>20?LIBRA_TOKENS.signal.critical:item.value>15?LIBRA_TOKENS.signal.warning:LIBRA_TOKENS.signal.normal;
    else if(item.key==='rr')color=item.value<5?LIBRA_TOKENS.signal.critical:item.value>30?LIBRA_TOKENS.signal.warning:LIBRA_TOKENS.signal.normal;
    else if(item.key==='tar')color=item.value>2.5?LIBRA_TOKENS.signal.warning:LIBRA_TOKENS.signal.normal;
    return`<div class="nd-signal-item" style="border-color:${color}"><p class="nd-signal-name">${_esc(item.label)}</p><p class="nd-signal-value" style="color:${color}">${val}<span style="font-size:12px;font-weight:400;color:#446677"> ${_esc(item.unit)}</span></p></div>`;
  }).join('');
  return`<div class="nd-section"><p class="nd-section-title">สัญญาณชีพ (Biometric Signals)</p><div class="nd-signal-grid">${cells}</div></div>`;
};

const _buildAnomalies=(anomalies)=>{
  if(!anomalies||anomalies.length===0)return'';
  const items=anomalies.map(a=>{
    const dotColor=a.status==='critical'?'#ff3b3b':a.status==='warning'?'#ffaa00':'#00cc77';
    const val=typeof a.value==='number'?a.value.toFixed(1):a.value;
    return`<div class="nd-anomaly-item ${_esc(a.status)}"><div class="nd-anomaly-dot" style="background:${dotColor}"></div><span style="font-family:'JetBrains Mono',monospace;font-size:12px;flex-shrink:0">${_esc(a.signal)}</span><span style="font-family:'JetBrains Mono',monospace;font-weight:600">${val} ${_esc(a.unit)}</span><span style="opacity:0.85">${_esc(a.note)}</span></div>`;
  }).join('');
  return`<div class="nd-section"><p class="nd-section-title">ค่าสัญญาณผิดปกติ (Signal Anomalies)</p>${items}</div>`;
};

const _buildSuggestedActions=(firstAid)=>{
  if(!firstAid||firstAid.length===0)return'';
  const items=firstAid.map(fa=>`<li class="${fa.startsWith('⚠️')||fa.startsWith('🚨')?'critical-step':''}">${_esc(fa)}</li>`).join('');
  return`<div class="nd-section"><p class="nd-section-title">คำแนะนำสุขภาวะ (Wellness Guidance)</p><ul class="nd-firstaid-list">${items}</ul></div>`;
};

const _buildMedicalFindings=(findings)=>{
  if(!findings||findings.length===0)return'';
  const cards=findings.map(f=>{
    const tok=LIBRA_TOKENS.severity[f.severity]||LIBRA_TOKENS.severity.warning;
    const symptoms=(f.symptoms||[]).map(s=>`<span class="nd-symptom-tag">${_esc(s)}</span>`).join('');
    const icd=f.refCode?`<span class="nd-medical-icd">REF: ${_esc(f.refCode)}</span>`:'';
    return`<div class="nd-medical-item" style="border-color:${tok.border}"><div class="nd-medical-header">${icd}<span class="nd-medical-label" style="color:${tok.text}">${_esc(f.label)}</span></div><p class="nd-medical-desc">${_esc(f.description)}</p><div class="nd-medical-symptoms">${symptoms}</div></div>`;
  }).join('');
  return`<div class="nd-section"><p class="nd-section-title">ผลการประเมินสุขภาวะ (Wellness Observations)</p>${cards}</div>`;
};

const _buildReferences=(refs)=>{
  if(!refs||refs.length===0)return'';
  const items=refs.map(r=>`<div class="nd-ref-item"><span class="nd-ref-author">${_esc(r.author)}</span><span class="nd-ref-year"> (${_esc(r.year)}). </span>${_esc(r.title)}. <em style="color:#3a5066">${_esc(r.source)}</em></div>`).join('');
  const uid='nd-refs-'+Date.now();
  return`<div class="nd-section"><p class="nd-section-title nd-toggle" id="${uid}-toggle" onclick="var t=document.getElementById('${uid}-toggle');var c=document.getElementById('${uid}-body');t.classList.toggle('open');c.classList.toggle('open');">เอกสารอ้างอิง (References) (${refs.length} รายการ)<span class="nd-toggle-arrow">▶</span></p><div class="nd-collapsible" id="${uid}-body">${items}</div></div>`;
};

const _buildAmbiguousWarning=()=>`<div class="nd-ambiguous">⚠️ Confidence < 50% — สัญญาณชีพยังไม่เพียงพอสำหรับการวินิจฉัย<br><span style="font-size:11px;color:#556677">รอสัญญาณเพิ่มเติม หรือตรวจสอบการเชื่อมต่อ Sensor</span></div>`;

const _buildFooter=(result)=>{
  const ts=result.timestamp?new Date(result.timestamp).toLocaleTimeString('th-TH'):'—';
  const sessionMin=result.sessionSec?Math.round(result.sessionSec/60):0;
  return`<div class="nd-footer"><span>${_esc(result.engine||'NuengdeawWellnessCore')} v${_esc(result.version||'1.0.0')}</span><span>⏱ ${sessionMin} นาที</span><span>${ts}</span></div>`;
};

const renderHTML=(result)=>{
  if(!result)return'<div class="nd-card"><p style="color:#ff6b6b">ไม่มีข้อมูล</p></div>';
  const parts=[
    _buildCriticalAlerts(result.criticalAlerts),
    result.state?.isAmbiguous?_buildAmbiguousWarning():_buildStateHeader(result.state),
    _buildSignalGrid(result.signals),
    _buildAnomalies(result.anomalies),
    _buildSuggestedActions(result.suggestedActions),
    _buildMedicalFindings(result.wellnessObservations),
    _buildReferences(result.references),
    _buildFooter(result),
  ];
  return`<div class="nd-card">${parts.join('')}</div>`;
};

const render=(result,target)=>{
  if(typeof document==='undefined')return;
  _injectCSS();
  const el=typeof target==='string'?document.querySelector(target):target;
  if(!el){console.warn('NuengdeawAura: target element not found:',target);return;}
  el.innerHTML=renderHTML(result);
};

const renderSignalBar=(result,target)=>{
  if(typeof document==='undefined')return;
  _injectCSS();
  const el=typeof target==='string'?document.querySelector(target):target;
  if(!el)return;
  el.innerHTML=`<div class="nd-card" style="padding:12px">${_buildSignalGrid(result?.signals||{})}</div>`;
};

const renderCompact=(result,target)=>{
  if(typeof document==='undefined')return;
  _injectCSS();
  const el=typeof target==='string'?document.querySelector(target):target;
  if(!el)return;
  const state=result?.state;
  const tok=LIBRA_TOKENS.severity[state?.severity||'normal'];
  const confPct=Math.round((state?.confidence||0)*100);
  const critHtml=result?.hasCritical?`<div style="margin-top:8px">${_buildCriticalAlerts(result.criticalAlerts)}</div>`:'';
  el.innerHTML=`<div class="nd-card" style="padding:12px"><div style="display:flex;align-items:center;gap:10px;padding:10px;background:${tok.bg};border-radius:8px;border:1px solid ${tok.border}"><span style="font-size:28px">${_esc(state?.emoji||'—')}</span><div style="flex:1"><div style="color:${tok.text};font-weight:600;font-size:15px">${_esc(state?.labelTH||'—')} <span style="font-size:12px;opacity:0.7">${_esc(state?.label||'')}</span></div><div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#446677">${_esc(state?.code||'')}</div></div><div style="text-align:right"><div style="font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:600;color:${tok.text}">${confPct}%</div><div style="font-size:10px;color:#446677">confidence</div></div></div>${critHtml}</div>`;
};

const startLive=(options={})=>{
  const{getInput,target,mode='full',interval=1000,onUpdate}=options;
  if(typeof getInput!=='function'){console.error('NuengdeawAura.startLive: getInput must be a function');return()=>{};}
  const core=(typeof window!=='undefined'&&window.NuengdeawWellnessCore)||(typeof NuengdeawWellnessCore!=='undefined'&&NuengdeawWellnessCore)||null;
  if(!core){console.error('NuengdeawAura.startLive: NuengdeawWellnessCore not found');return()=>{};}
  const renderFn=mode==='compact'?renderCompact:mode==='signal'?renderSignalBar:render;
  const _tick=()=>{try{const input=getInput();const result=core.assess(input);if(target)renderFn(result,target);if(typeof onUpdate==='function')onUpdate(result);}catch(err){console.error('NuengdeawAura live tick error:',err);}};
  _tick();
  const timer=setInterval(_tick,interval);
  return()=>clearInterval(timer);
};

const NuengdeawAura={render,renderHTML,renderCompact,renderSignalBar,startLive,injectCSS:_injectCSS,TOKENS:LIBRA_TOKENS,version:'1.0.0'};

if(typeof module!=='undefined'&&module.exports)module.exports=NuengdeawAura;
else if(typeof window!=='undefined')window.NuengdeawAura=NuengdeawAura;

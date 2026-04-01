'use strict';

// ─── StorageManager (แก้ไข: เพิ่มที่นี่แทนที่จะ reference ที่ไม่มีอยู่) ───
const StorageManager = {
  KEYS: { ABTESTS:'nuengdeaw_abtests', MODEL:'nuengdeaw_model_' },
  getJSON(key,def){try{const v=localStorage.getItem(key);return v?JSON.parse(v):def;}catch{return def;}},
  setJSON(key,val){try{localStorage.setItem(key,JSON.stringify(val));return true;}catch{return false;}},
  get(key){return localStorage.getItem(key);},
  set(key,val){localStorage.setItem(key,val);},
};

// ─── logSys stub (แก้ไข: นิยามให้ไฟล์อื่นใช้ได้) ───
if(typeof window!=='undefined'&&typeof window.logSys==='undefined'){
  window.logSys=(...args)=>console.log('[Nuengdeaw]',...args);
}

// ─────────────────────────────────────────────────────────────
// A. DECEPTION ENGINE
// ─────────────────────────────────────────────────────────────
const DeceptionEngine=(() => {
  let _level=0,_active=false,_tick=0,_autoTimer=null,_reboundCd=0,_flatCount=0;
  const _lerp=(a,b,t)=>a+(b-a)*t;
  const _randn=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};

  const _level1=(bio,bands)=>{
    const s=typeof HumanSim!=='undefined'?HumanSim.getState():'NEUTRAL';
    if(['STRESS','CONFUSION','EXCITEMENT'].includes(s)){
      bio.hr=_lerp(bio.hr,72,0.55);bio.hrv=_lerp(bio.hrv,40,0.50);bio.hrv=Math.max(bio.hrv,28);
      if(_tick%(7+Math.floor(Math.random()*6))===0)bio.gsr=Math.min(bio.gsr*1.35+0.8,22);
      else bio.gsr=_lerp(bio.gsr,5.0,0.40);
    }
    return{bio,bands};
  };

  const _level2=(bio,bands)=>{
    bio.hr=_lerp(bio.hr,64,0.70);bio.hrv=_lerp(bio.hrv,54,0.65);bio.gsr=_lerp(bio.gsr,2.5,0.60);
    _reboundCd=Math.max(0,_reboundCd-1);
    if(_reboundCd===0&&_tick%20===0){bio.hr+=12+Math.random()*8;bio.gsr+=3.5+Math.random()*2;bio.hrv=Math.max(bio.hrv-14,12);_reboundCd=5;}
    if(bands){bands.theta=Math.max(bands.theta,1.8+Math.random()*0.4);bands.alpha=Math.min(bands.alpha,1.1);bands.thetaAlphaRatio=bands.theta/Math.max(bands.alpha,0.01);}
    return{bio,bands};
  };

  const _level3=(bio,bands)=>{
    bio.hr=_lerp(bio.hr,72,0.80);bio.hrv=_lerp(bio.hrv,38,0.78);bio.gsr=_lerp(bio.gsr,4.5,0.75);bio.rr=_lerp(bio.rr,15,0.70);
    const noise=_randn()*3;bio.hr+=noise*0.8;bio.hrv+=noise*0.7;bio.rr+=_randn()*2.5;bio.rr=Math.max(8,Math.min(35,bio.rr));
    if(bands){bands.beta=Math.max(bands.beta,2.2+Math.random()*0.6);bands.gamma=Math.max(bands.gamma,0.9+Math.random()*0.3);bands.thetaAlphaRatio=bands.theta/Math.max(bands.alpha,0.01);}
    return{bio,bands};
  };

  const _level4=(bio,bands)=>{
    _flatCount++;
    bio.hr=_lerp(bio.hr,70,0.93);bio.hrv=_lerp(bio.hrv,42,0.91);bio.gsr=_lerp(bio.gsr,4.2,0.89);bio.rr=_lerp(bio.rr,14,0.86);bio.eeg=_lerp(bio.eeg,1.0,0.89);
    if(bands){if(_flatCount%15===0)bands.gamma=2.1+Math.random()*0.8;else bands.gamma=_lerp(bands.gamma,0.3,0.85);}
    if(_flatCount%2===0)bio.hrv=Math.min(bio.hrv+6,65);else bio.hrv=Math.max(bio.hrv-5,22);
    bio.rr+=_randn()*0.4;bio.rr=Math.max(8,Math.min(36,bio.rr));
    if(bands)bands.thetaAlphaRatio=bands.theta/Math.max(bands.alpha,0.01);
    return{bio,bands};
  };

  const startAuto=(ticksPerLevel=60)=>{
    _active=true;_level=1;_tick=0;
    if(_autoTimer)clearInterval(_autoTimer);
    let elapsed=0;
    _autoTimer=setInterval(()=>{
      elapsed++;
      if(elapsed>=ticksPerLevel){
        elapsed=0;_level++;
        if(_level>4){_level=0;_active=false;clearInterval(_autoTimer);_autoTimer=null;return;}
      }
    },1000);
  };

  return{
    applyDeception(bio,bands){if(!_active||_level===0)return{bio,bands};_tick++;const fn=[null,_level1,_level2,_level3,_level4][_level];return fn?fn(bio,bands):{bio,bands};},
    setLevel(l){_level=Math.max(0,Math.min(4,l));_active=_level>0;_tick=0;_flatCount=0;_reboundCd=0;},
    getLevel()    {return _level;},
    isActive()    {return _active;},
    getLevelName(){return['NONE','MILD','TRAINED_LIAR','PATHOLOGICAL','SOCIOPATH'][_level];},
    startAuto,
    stopAuto(){if(_autoTimer){clearInterval(_autoTimer);_autoTimer=null;}_active=false;_level=0;},
  };
})();

// ─────────────────────────────────────────────────────────────
// B. DECEPTION SCORER — PCI v2
// ─────────────────────────────────────────────────────────────
const DeceptionScorer=(() => {
  const BUF=30;
  const _buf={hrv:[],hr:[],gsr:[],eeg:[],theta:[],alpha:[],rr:[]};
  let _history=[];

  const _push=(key,val)=>{_buf[key].push(val);if(_buf[key].length>BUF)_buf[key].shift();};
  const _pearson=(xs,ys)=>{
    const n=Math.min(xs.length,ys.length);if(n<5)return 0;
    const mx=xs.slice(-n).reduce((s,v)=>s+v,0)/n,my=ys.slice(-n).reduce((s,v)=>s+v,0)/n;
    let num=0,dx2=0,dy2=0;
    for(let i=0;i<n;i++){const dx=xs[xs.length-n+i]-mx,dy=ys[ys.length-n+i]-my;num+=dx*dy;dx2+=dx*dx;dy2+=dy*dy;}
    return(dx2*dy2>0)?num/Math.sqrt(dx2*dy2):0;
  };
  const _variance=(arr,n=15)=>{if(arr.length<n)return 1;const s=arr.slice(-n),m=s.reduce((a,b)=>a+b,0)/n;return s.reduce((a,b)=>a+(b-m)**2,0)/n;};
  const _logistic=(x,k=6,mid=0)=>1/(1+Math.exp(-k*(x-mid)));

  const _score=(bio,bands,stateName)=>{
    _push('hrv',bio.hrv);_push('hr',bio.hr);_push('gsr',bio.gsr);_push('eeg',bio.eeg);_push('rr',bio.rr);
    if(bands){_push('theta',bands.theta??1);_push('alpha',bands.alpha??1);}
    if(_buf.hrv.length<8)return{pci:0,deceptionFlag:false,violations:[],confidence:'insufficient_data'};

    const violations=[];let total=0;
    const r1=_pearson(_buf.hrv,_buf.hr),v1=_logistic(r1,5,-0.2);
    if(v1>0.6)violations.push({pair:'HRV↔HR',r:+r1.toFixed(3),score:+v1.toFixed(3)});total+=v1*0.28;
    const r2=_pearson(_buf.hr,_buf.gsr),v2=_logistic(-r2,5,-0.1);
    if(v2>0.6)violations.push({pair:'HR↔GSR',r:+r2.toFixed(3),score:+v2.toFixed(3)});total+=v2*0.20;
    const hrVar=_variance(_buf.hr),v3=Math.max(0,1-hrVar/1.5);
    if(v3>0.5)violations.push({pair:'HR_variance',val:+hrVar.toFixed(3),score:+v3.toFixed(3)});total+=v3*0.15;
    const rrVar=_variance(_buf.rr,12),v4r=Math.max(0,1-rrVar/0.8);
    if(v4r>0.5)violations.push({pair:'RR_variance',val:+rrVar.toFixed(3),score:+v4r.toFixed(3)});total+=v4r*0.12;

    let v5=0;
    if(_buf.theta.length>=5&&bands){
      const ratio=bands.thetaAlphaRatio??1;
      const STATE_R={FLOW:0.4,READY:0.3,STRESS:4.5,CONFUSION:2.7,BOREDOM:1.5,EXCITEMENT:1.0,FATIGUE:5.0,NEUTRAL:1.0,FRUSTRATION:3.6,ANXIETY:2.2,CURIOSITY:1.2,DISGUST:2.1,SURPRISE:1.3,CALM:0.2};
      const exp=STATE_R[stateName]??1.0;
      v5=Math.min(1,Math.abs(ratio-exp)/(exp+0.5));
      if(v5>0.35)violations.push({pair:'ThetaAlpha↔State',ratio:+ratio.toFixed(2),exp:+exp.toFixed(2),score:+v5.toFixed(3)});
    }
    total+=v5*0.15;

    const MEAN_REF={FLOW:{hr:66,hrv:52,gsr:2.8},READY:{hr:62,hrv:56,gsr:2.2},STRESS:{hr:108,hrv:18,gsr:15},CONFUSION:{hr:98,hrv:22,gsr:11},BOREDOM:{hr:66,hrv:36,gsr:8.5},EXCITEMENT:{hr:92,hrv:34,gsr:12},FATIGUE:{hr:70,hrv:30,gsr:3.5},NEUTRAL:{hr:72,hrv:38,gsr:4.5},FRUSTRATION:{hr:112,hrv:16,gsr:17},ANXIETY:{hr:115,hrv:14,gsr:16},CURIOSITY:{hr:78,hrv:44,gsr:5.5},DISGUST:{hr:90,hrv:20,gsr:13},SURPRISE:{hr:100,hrv:28,gsr:14},CALM:{hr:58,hrv:62,gsr:1.8}};
    const ref=MEAN_REF[stateName]??MEAN_REF.NEUTRAL;
    const nHR=_buf.hr.slice(-10),nGSR=_buf.gsr.slice(-10);
    const hrMean=nHR.reduce((s,v)=>s+v,0)/Math.min(nHR.length,10);
    const gsrMean=nGSR.reduce((s,v)=>s+v,0)/Math.min(nGSR.length,10);
    const v6=Math.min(1,(Math.abs(hrMean-ref.hr)/(ref.hr*0.30)+Math.abs(gsrMean-ref.gsr)/(ref.gsr*0.50))/2);
    if(v6>0.40)violations.push({pair:'BioMean↔State',hrObs:+hrMean.toFixed(1),hrExp:ref.hr,score:+v6.toFixed(3)});
    total+=v6*0.10;

    const pci=Math.min(1.0,total);
    _history.push(pci);if(_history.length>60)_history.shift();
    const avg=_history.reduce((s,v)=>s+v,0)/_history.length;
    const deceptionFlag=pci>0.60&&violations.length>=2;
    const confidence=avg>0.75?'high_deception':avg>0.60?'probable_deception':avg>0.35?'mild_inconsistency':'coherent';
    return{pci:+pci.toFixed(3),avgPci:+avg.toFixed(3),deceptionFlag,violations,confidence};
  };

  return{score:_score,getHistory(){return[..._history];},reset(){Object.keys(_buf).forEach(k=>_buf[k]=[]);_history=[];}};
})();

// ─────────────────────────────────────────────────────────────
// C. A/B TESTING FRAMEWORK
// ─────────────────────────────────────────────────────────────
const ABTestManager=(() => {
  let _tests=StorageManager.getJSON(StorageManager.KEYS.ABTESTS,{})??{};
  const _save=()=>StorageManager.setJSON(StorageManager.KEYS.ABTESTS,_tests);

  const _normCDF=z=>{const t=1/(1+0.2316419*z);return 1-(1/Math.sqrt(2*Math.PI))*Math.exp(-0.5*z*z)*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));};
  const _welchT=(a,b)=>{
    if(a.length<2||b.length<2)return{t:0,p:1};
    const ma=a.reduce((s,v)=>s+v,0)/a.length,mb=b.reduce((s,v)=>s+v,0)/b.length;
    const va=a.reduce((s,v)=>s+(v-ma)**2,0)/(a.length-1),vb=b.reduce((s,v)=>s+(v-mb)**2,0)/(b.length-1);
    if(va+vb===0)return{t:0,p:1};
    const t=(ma-mb)/Math.sqrt(va/a.length+vb/b.length);
    return{t:+t.toFixed(3),p:+(2*(1-_normCDF(Math.abs(t)))).toFixed(4),ma:+ma.toFixed(3),mb:+mb.toFixed(3)};
  };
  const _sprt=(a,b,alpha=0.05,beta=0.20)=>{
    if(a.length<5||b.length<5)return{decision:'continue',llr:0};
    const{p}=_welchT(a,b);
    const llr=Math.log((1-beta)/alpha)*(p<alpha?1:-0.5);
    const decision=llr>Math.log((1-beta)/alpha)?'stop_h1':llr<Math.log(beta/(1-alpha))?'stop_h0':'continue';
    return{decision,llr:+llr.toFixed(3),p};
  };

  return{
    createTest(id,variants=['control','treatment'],metric='flow_ticks',durationTicks=0){
      _tests[id]={id,variants,metric,durationTicks,createdAt:Date.now(),closed:false,data:Object.fromEntries(variants.map(v=>[v,[]])),totalAssignments:Object.fromEntries(variants.map(v=>[v,0]))};
      _save();return _tests[id];
    },
    assign(testId){const t=_tests[testId];if(!t||t.closed)return null;const v=t.variants.reduce((a,b)=>t.totalAssignments[a]<=t.totalAssignments[b]?a:b);t.totalAssignments[v]++;_save();return v;},
    record(testId,variantName,value){
      const t=_tests[testId];if(!t||t.closed||!t.data[variantName])return;
      t.data[variantName].push(value);
      if(t.variants.length>=2){const[v0,v1]=t.variants;const sprt=_sprt(t.data[v0]??[],t.data[v1]??[]);if(sprt.decision!=='continue'){t.sprtDecision=sprt;this.close(testId);return;}}
      if(t.durationTicks>0){const total=t.variants.reduce((s,v)=>s+t.data[v].length,0);if(total>=t.durationTicks)this.close(testId);}
      _save();
    },
    getResult(testId){
      const t=_tests[testId];if(!t)return null;
      if(t.variants.length<2)return{winner:t.variants[0],stats:{},significant:false};
      const means={};t.variants.forEach(v=>{const d=t.data[v];means[v]=d.length>0?d.reduce((s,x)=>s+x,0)/d.length:0;});
      const winner=Object.entries(means).sort((a,b)=>b[1]-a[1])[0][0];
      const[v0,v1]=t.variants;const stats=_welchT(t.data[v0]??[],t.data[v1]??[]);
      return{winner,means,stats,significant:stats.p<0.05,sampleSizes:Object.fromEntries(t.variants.map(v=>[v,t.data[v].length])),sprt:t.sprtDecision};
    },
    close(id){if(_tests[id]){_tests[id].closed=true;_save();}},
    listTests(){return Object.keys(_tests);},
    getTest(id){return _tests[id]??null;},
    deleteTest(id){delete _tests[id];_save();},
    exportAll(){return JSON.stringify(_tests,null,2);},
    importAll(json){try{_tests=JSON.parse(json);_save();return true;}catch{return false;}},
  };
})();

// ─────────────────────────────────────────────────────────────
// D. MODEL PORTABILITY
// ─────────────────────────────────────────────────────────────
const ModelPortability=(() => {
  const LS=StorageManager.KEYS.MODEL;
  return{
    async exportModel(tfModel){
      if(!tfModel)throw new Error('exportModel: model is null');
      const weights=tfModel.getWeights();
      const data=await Promise.all(weights.map(async w=>({name:w.name,shape:w.shape,values:Array.from(await w.data())})));
      weights.forEach(w=>w.dispose());
      return JSON.stringify({version:'nuengdeaw_v0.0',exportedAt:Date.now(),weights:data});
    },
    async importModel(tfModel,jsonStr){
      if(!tfModel||!jsonStr)throw new Error('importModel: invalid args');
      const tf=window.tf;if(!tf)throw new Error('TF.js not loaded');
      const data=JSON.parse(jsonStr);
      const tensors=data.weights.map(w=>tf.tensor(w.values,w.shape));
      tfModel.setWeights(tensors);tensors.forEach(t=>t.dispose());
    },
    quantize(jsonStr,decimals=4){const data=JSON.parse(jsonStr);data.weights.forEach(w=>{w.values=w.values.map(v=>+v.toFixed(decimals));});data.quantized=decimals;return JSON.stringify(data);},
    fedAvg(jsonStrings){
      if(!jsonStrings?.length)throw new Error('fedAvg: empty input');
      const models=jsonStrings.map(j=>JSON.parse(j)),n=models.length;
      const merged=JSON.parse(JSON.stringify(models[0]));merged.exportedAt=Date.now();merged.fedAvgSources=n;
      for(let wi=0;wi<merged.weights.length;wi++){const vals=merged.weights[wi].values;for(let i=0;i<vals.length;i++){let sum=0;for(let mi=0;mi<n;mi++)sum+=models[mi].weights[wi].values[i];vals[i]=sum/n;}}
      return JSON.stringify(merged,null,2);
    },
    saveToStorage(key,jsonStr){try{StorageManager.set(LS+key,jsonStr);return true;}catch{return false;}},
    loadFromStorage(key){return StorageManager.get(LS+key);},
    listStoredModels(){const keys=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith('nuengdeaw_'+LS))keys.push(k.replace('nuengdeaw_'+LS,''));}}catch{}return keys;},
  };
})();

// ─────────────────────────────────────────────────────────────
// E. ARTIFACT DETECTOR v2
// ─────────────────────────────────────────────────────────────
const ArtifactDetector=(() => {
  const BUF=20;
  const _h={hr:[],gsr:[],eeg:[],hrv:[],alpha:[],rr:[]};
  let _last=[];
  const _push=(k,v)=>{_h[k].push(v);if(_h[k].length>BUF)_h[k].shift();};
  const _mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
  const _std=a=>{const m=_mean(a);return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length);};

  const _check=(bio,bands)=>{
    _push('hr',bio.hr);_push('gsr',bio.gsr);_push('eeg',bio.eeg);_push('hrv',bio.hrv);_push('rr',bio.rr??15);
    if(bands)_push('alpha',bands.alpha??1);
    const n=_h.hr.length;
    if(n<4)return{isClean:true,artifacts:[],severity:'ok',ready:false};

    const arts=[];
    if(n>=2&&Math.abs(_h.gsr[n-1]-_h.gsr[n-2])>5.0)arts.push({type:'motion_gsr',msg:'GSR spike — Motion Artifact'});
    if(n>=2&&Math.abs(_h.hr[n-1]-_h.hr[n-2])>25)arts.push({type:'motion_hr',msg:'HR spike — Motion Artifact: กรุณาอยู่นิ่ง'});
    if(n>=8){const m=_mean(_h.eeg),s=_std(_h.eeg);if(s>0&&Math.abs(bio.eeg-m)>4*s)arts.push({type:'electrode_pop',msg:'EEG Electrode Pop — ตรวจสอบตำแหน่ง Electrode'});}
    if(bands&&n>=3){const prev=_h.alpha[n-2]??1;if((bands.alpha??1)>prev*2.5&&(bands.alpha??1)>3.0)arts.push({type:'eye_blink_eeg',msg:'Eye Blink Artifact ใน EEG'});}
    if(n>=15){const early=_mean(_h.gsr.slice(0,5)),late=_mean(_h.gsr.slice(-5));if(late-early>6.0)arts.push({type:'baseline_drift',msg:'GSR Baseline Drift — เหงื่อสะสม'});}
    if(n>=10){const hrV=_std(_h.hr.slice(-10));if(hrV<0.05)arts.push({type:'flat_signal',msg:'HR Flat Signal — ตรวจสอบ Sensor Connection'});}
    if(n>=2&&Math.abs(bio.eeg)>4.8)arts.push({type:'saturation_clip',msg:'EEG Signal Saturation — ลดความไวของ Amplifier'});

    _last=arts;
    return{isClean:arts.length===0,artifacts:arts,severity:arts.length===0?'ok':arts.length===1?'warn':'error',ready:true};
  };

  return{
    check:_check,
    getLastArtifacts:()=>_last,
    getWarningMessage(){return _last.length?'⚠️ '+_last.map(a=>a.msg).join(' | '):'';},
    reset(){Object.keys(_h).forEach(k=>_h[k]=[]);_last=[];},
  };
})();

window.StorageManager   = StorageManager;
window.DeceptionEngine  = DeceptionEngine;
window.DeceptionScorer  = DeceptionScorer;
window.ABTestManager    = ABTestManager;
window.ModelPortability = ModelPortability;
window.ArtifactDetector = ArtifactDetector;

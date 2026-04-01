'use strict';

const EMOTION_STATES = [
  'FLOW','READY','STRESS','CONFUSION','BOREDOM','EXCITEMENT','FATIGUE','NEUTRAL',
  'FRUSTRATION','ANXIETY','CURIOSITY','DISGUST','SURPRISE','CALM',
];

const _PHYSIO_REF = {
  FLOW:        { hrv:[52,6,28,80],  hr:[66,5,54,80],   gsr:[2.8,0.8,1.0,6.5],  rr:[13,2,9,18],  eeg:[0.55,0.10,0.25,0.90] },
  READY:       { hrv:[56,5,36,78],  hr:[62,5,50,76],   gsr:[2.2,0.6,1.0,5.0],  rr:[11,2,8,16],  eeg:[0.40,0.08,0.20,0.70] },
  STRESS:      { hrv:[18,4,10,30],  hr:[108,8,85,132], gsr:[15,3,8.0,25],       rr:[25,4,18,35], eeg:[3.10,0.30,2.0,4.2]   },
  CONFUSION:   { hrv:[22,5,12,36],  hr:[98,7,78,120],  gsr:[11,2,6.0,18],       rr:[22,3,16,30], eeg:[2.60,0.25,1.8,3.6]   },
  BOREDOM:     { hrv:[36,5,22,52],  hr:[66,4,56,78],   gsr:[8.5,1.5,5.0,14],   rr:[14,2,10,18], eeg:[1.30,0.15,0.8,1.9]   },
  EXCITEMENT:  { hrv:[34,5,20,50],  hr:[92,8,74,118],  gsr:[12,2,7.0,20],       rr:[20,3,14,28], eeg:[1.70,0.20,1.0,2.6]   },
  FATIGUE:     { hrv:[30,5,16,46],  hr:[70,5,58,86],   gsr:[3.5,0.8,1.5,7.5],  rr:[16,2,11,22], eeg:[1.10,0.12,0.6,1.7]   },
  NEUTRAL:     { hrv:[38,6,22,58],  hr:[72,6,57,92],   gsr:[4.5,1.0,2.0,9.0],  rr:[15,2,10,20], eeg:[1.00,0.10,0.5,1.5]   },
  FRUSTRATION: { hrv:[16,4,8,28],   hr:[112,9,90,138], gsr:[17,3,10.0,28],      rr:[26,4,18,36], eeg:[3.30,0.30,2.2,4.5]   },
  ANXIETY:     { hrv:[14,3,7,24],   hr:[115,9,92,140], gsr:[16,3,9.0,26],       rr:[28,5,20,38], eeg:[3.50,0.35,2.4,4.8]   },
  CURIOSITY:   { hrv:[44,5,28,64],  hr:[78,6,64,96],   gsr:[5.5,1.0,2.5,10],   rr:[16,2,11,22], eeg:[1.20,0.14,0.6,2.0]   },
  DISGUST:     { hrv:[20,4,10,32],  hr:[90,7,72,112],  gsr:[13,2,7.0,22],       rr:[20,3,14,28], eeg:[2.20,0.22,1.4,3.2]   },
  SURPRISE:    { hrv:[28,6,14,44],  hr:[100,10,78,130],gsr:[14,3,7.0,24],       rr:[22,4,14,32], eeg:[2.00,0.25,1.2,3.0]   },
  CALM:        { hrv:[62,6,40,90],  hr:[58,4,46,70],   gsr:[1.8,0.5,0.6,4.0],  rr:[10,2,6,14],  eeg:[0.38,0.08,0.18,0.65] },
};

const _EEG_BAND_REF = {
  FLOW:        { theta:0.90, alpha:2.20, beta:1.00, gamma:0.50 },
  READY:       { theta:0.70, alpha:2.50, beta:0.80, gamma:0.30 },
  STRESS:      { theta:1.40, alpha:0.60, beta:2.80, gamma:1.20 },
  CONFUSION:   { theta:2.20, alpha:0.80, beta:2.00, gamma:0.80 },
  BOREDOM:     { theta:1.80, alpha:1.20, beta:0.70, gamma:0.20 },
  EXCITEMENT:  { theta:1.00, alpha:1.00, beta:2.50, gamma:1.50 },
  FATIGUE:     { theta:2.50, alpha:1.50, beta:0.50, gamma:0.20 },
  NEUTRAL:     { theta:1.00, alpha:1.00, beta:1.00, gamma:0.50 },
  FRUSTRATION: { theta:1.80, alpha:0.50, beta:2.60, gamma:0.90 },
  ANXIETY:     { theta:1.20, alpha:0.55, beta:3.20, gamma:1.10 },
  CURIOSITY:   { theta:1.60, alpha:1.30, beta:1.40, gamma:1.80 },
  DISGUST:     { theta:1.50, alpha:0.70, beta:1.80, gamma:0.60 },
  SURPRISE:    { theta:0.80, alpha:0.60, beta:2.20, gamma:2.00 },
  CALM:        { theta:0.60, alpha:3.00, beta:0.50, gamma:0.15 },
};

const _STATE_ORDER = [
  'FLOW','READY','STRESS','CONFUSION','BOREDOM','EXCITEMENT','FATIGUE','NEUTRAL',
  'FRUSTRATION','ANXIETY','CURIOSITY','DISGUST','SURPRISE','CALM',
];

const _MARKOV_TBL = {
  FLOW:       [0.55,0.12,0.02,0.03,0.04,0.07,0.03,0.02,0.01,0.01,0.05,0.01,0.01,0.03],
  READY:      [0.18,0.42,0.03,0.06,0.03,0.05,0.03,0.03,0.02,0.02,0.07,0.01,0.02,0.03],
  STRESS:     [0.02,0.04,0.40,0.12,0.02,0.01,0.14,0.05,0.10,0.07,0.01,0.01,0.01,0.00],
  CONFUSION:  [0.04,0.08,0.14,0.36,0.05,0.02,0.09,0.04,0.08,0.05,0.03,0.01,0.01,0.00],
  BOREDOM:    [0.06,0.08,0.03,0.04,0.38,0.12,0.06,0.04,0.04,0.02,0.07,0.02,0.02,0.02],
  EXCITEMENT: [0.14,0.07,0.06,0.03,0.04,0.36,0.05,0.09,0.03,0.03,0.04,0.01,0.04,0.01],
  FATIGUE:    [0.03,0.05,0.09,0.06,0.12,0.02,0.42,0.04,0.06,0.05,0.02,0.01,0.01,0.02],
  NEUTRAL:    [0.08,0.13,0.06,0.06,0.10,0.08,0.08,0.22,0.04,0.04,0.05,0.02,0.03,0.01],
  FRUSTRATION:[0.02,0.04,0.22,0.10,0.02,0.02,0.08,0.06,0.32,0.08,0.01,0.01,0.00,0.00],
  ANXIETY:    [0.01,0.03,0.20,0.08,0.02,0.02,0.10,0.06,0.08,0.32,0.02,0.01,0.01,0.04],
  CURIOSITY:  [0.12,0.10,0.02,0.04,0.03,0.10,0.03,0.05,0.02,0.02,0.36,0.02,0.05,0.04],
  DISGUST:    [0.02,0.04,0.10,0.08,0.05,0.02,0.07,0.10,0.06,0.06,0.02,0.32,0.02,0.04],
  SURPRISE:   [0.05,0.08,0.06,0.06,0.04,0.12,0.03,0.10,0.04,0.06,0.10,0.02,0.20,0.04],
  CALM:       [0.08,0.10,0.01,0.02,0.06,0.04,0.04,0.10,0.01,0.02,0.06,0.02,0.02,0.42],
};

const _DEFAULT_PERSONALITY = {
  openness:0.5, conscientiousness:0.5, extraversion:0.5, agreeableness:0.5, neuroticism:0.5,
};

const _DEFAULT_CONTEXT = {
  timeOfDay:'morning', dayOfWeek:1, socialContext:'alone', taskType:'learning',
  environment:'quiet', caffeineIntake:0, sleepQuality:7, ambientTemp:23, systolicBP:120,
};

const MICROSTATES = { A:'self_referential', B:'visual', C:'salience', D:'attention' };

const _CIRCADIAN_TABLE = {
   0:[-8,4,-1.2],  1:[-12,6,-1.6], 2:[-15,7,-1.9], 3:[-18,8,-2.0],
   4:[-18,8,-2.0], 5:[-15,7,-1.8], 6:[-10,5,-1.4], 7:[-5,3,-1.0],
   8:[-2,2,-0.5],  9:[0,0,0.0],   10:[2,-1,0.3],  11:[3,-2,0.5],
  12:[2,-1,0.3],  13:[1,0,0.2],   14:[-3,2,-0.4], 15:[-2,1,-0.3],
  16:[1,-1,0.2],  17:[3,-2,0.4],  18:[4,-2,0.5],  19:[5,-3,0.6],
  20:[5,-3,0.6],  21:[4,-2,0.5],  22:[2,-1,0.3],  23:[-3,2,-0.6],
};

const HumanSim = (() => {
  let _state='NEUTRAL', _prevState='NEUTRAL', _tick=0, _stateAge=0, _refractory=0;
  let _scenarioQ=[], _history=[];
  let _personality={..._DEFAULT_PERSONALITY};
  let _memory={ sessionHistory:[], stressEpisodes:[], burnoutRisk:0, flowMoments:[], fatigueAccumulation:0 };
  let _context={..._DEFAULT_CONTEXT};
  const _iaf = 9.5 + (Math.random()-0.5)*1.5;
  let _p300=null, _empathyBoost=null;

  const _ou = {
    hrv:{x:38,th:0.07,sig:1.4}, hr:{x:72,th:0.07,sig:1.8}, gsr:{x:4.5,th:0.09,sig:0.38},
    rr:{x:15,th:0.06,sig:0.75}, eeg:{x:1.0,th:0.11,sig:0.05},
    theta_b:{x:1.0,th:0.09,sig:0.07}, alpha_b:{x:1.0,th:0.09,sig:0.07},
    beta_b:{x:1.0,th:0.11,sig:0.09},  gamma_b:{x:0.5,th:0.14,sig:0.06},
  };

  let _hour=new Date().getHours(), _sleepP=0, _ultra=0;
  const _ultraRate=(2*Math.PI)/10800;

  const _clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const _randn=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
  const _ouStep=(key,mu)=>{const o=_ou[key];o.x=_clamp(o.x+o.th*(mu-o.x)+o.sig*_randn(),-99999,99999);return o.x;};
  const _sample=(key,state)=>{const[mean,,lo,hi]=_PHYSIO_REF[state][key];return _clamp(_ouStep(key,mean),lo,hi);};

  const _applyContextBaseline=(bio)=>{
    const c=_context;
    if(c.socialContext==='with_friends'){bio.gsr+=1.5;bio.hr+=3;}
    if(c.socialContext==='in_class')   {bio.gsr+=2.0;bio.hr+=4;}
    if(c.socialContext==='presentation'){bio.gsr+=4.0;bio.hr+=8;}
    bio.hr=_clamp(bio.hr+c.caffeineIntake*0.02,40,145);
    const sp=(10-c.sleepQuality)*0.04;
    bio.hrv=_clamp(bio.hrv-sp*8,6,95);
    bio.hr =_clamp(bio.hr +sp*4,40,145);
    const recentStress=_memory.stressEpisodes.filter(e=>e.ts>Date.now()-86400000).length;
    if(recentStress>=3){bio.hr+=5;bio.gsr+=1.2;}
    return bio;
  };

  const _applyPersonalityBaseline=(bio)=>{
    const p=_personality;
    bio.hr =_clamp(bio.hr +(p.extraversion -0.5)*6, 40,145);
    bio.gsr=_clamp(bio.gsr+(p.extraversion -0.5)*1.5,0.3,28);
    bio.hrv=_clamp(bio.hrv-(p.neuroticism  -0.5)*8, 6,  95);
    return bio;
  };

  const _thermoRegulation=(bio)=>{
    const t=_context.ambientTemp;
    if(t>28)bio.gsr=_clamp(bio.gsr*1.2,0.3,28);
    else if(t<18)bio.gsr=_clamp(bio.gsr*0.7,0.3,28);
    return bio;
  };

  const _baroreflex=(bio)=>{
    bio.hr=_clamp(bio.hr-(_context.systolicBP-120)*0.05,40,145);
    return bio;
  };

  const _addRSA=(bio)=>{
    const rsaAmp=8/Math.max(bio.rr,4);
    bio.hrv=_clamp(bio.hrv+rsaAmp*Math.sin(Date.now()/(60000/Math.max(bio.rr,4))),6,95);
    return bio;
  };

  const _nextState=()=>{
    const row=[..._MARKOV_TBL[_state]];
    const p=_personality;
    const idx=s=>_STATE_ORDER.indexOf(s);
    const boost=(s,val)=>{const i=idx(s);if(i>=0)row[i]=_clamp(row[i]+val,0,1);};
    if(p.neuroticism>0.5){boost('STRESS',(p.neuroticism-0.5)*0.30);boost('ANXIETY',(p.neuroticism-0.5)*0.30);boost('CALM',-(p.neuroticism-0.5)*0.20);}
    if(p.extraversion>0.5){boost('EXCITEMENT',(p.extraversion-0.5)*0.16);boost('BOREDOM',-(p.extraversion-0.5)*0.10);}
    if(p.conscientiousness>0.5){if(_state==='FLOW')row[idx('FLOW')]=_clamp(row[idx('FLOW')]+(p.conscientiousness-0.5)*0.24,0,1);boost('BOREDOM',-(p.conscientiousness-0.5)*0.16);}
    boost('CURIOSITY',(p.openness-0.5)*0.12);
    if(_state==='STRESS'||_state==='FRUSTRATION'){boost('NEUTRAL',(p.agreeableness-0.5)*0.10);boost('CALM',(p.agreeableness-0.5)*0.06);}
    const total=row.reduce((a,b)=>a+b,0);
    const norm=row.map(v=>v/total);
    let r=Math.random(),cum=0;
    for(let i=0;i<_STATE_ORDER.length;i++){cum+=norm[i];if(r<cum)return _STATE_ORDER[i];}
    return _state;
  };

  const _updateMemory=(next)=>{
    const now=Date.now();
    if(['STRESS','ANXIETY','FRUSTRATION'].includes(_state)&&next!==_state){
      _memory.stressEpisodes.push({ts:now,duration:_stateAge});
      if(_memory.stressEpisodes.length>100)_memory.stressEpisodes.shift();
      _memory.burnoutRisk=_clamp(_memory.burnoutRisk+0.02,0,1);
    }
    if(next==='FLOW'){
      _memory.flowMoments.push(now);
      if(_memory.flowMoments.length>200)_memory.flowMoments.shift();
      _memory.burnoutRisk=_clamp(_memory.burnoutRisk-0.01,0,1);
    }
  };

  const _flipTo=(next)=>{
    if(next===_state)return;
    _updateMemory(next);
    _prevState=_state; _state=next; _stateAge=0; _refractory=3;
    _history.push({state:next,ts:Date.now()});
    if(_history.length>500)_history.shift();
    if(next==='SURPRISE')_p300={latency:300+Math.random()*50,amplitude:5+Math.random()*3,ts:Date.now()};
  };

  const _computePAC=(thetaPhase,gammaAmp)=>gammaAmp*Math.cos(thetaPhase);

  const _getMicrostate=()=>({
    FLOW:'D',READY:'D',STRESS:'C',CONFUSION:'C',BOREDOM:'A',EXCITEMENT:'B',
    FATIGUE:'A',NEUTRAL:'A',FRUSTRATION:'C',ANXIETY:'C',CURIOSITY:'B',
    DISGUST:'C',SURPRISE:'B',CALM:'A',
  }[_state]??'A');

  const _crossCorr=(bio)=>{
    const ref=_PHYSIO_REF[_state];
    const dHRV=bio.hrv-ref.hrv[0];
    bio.hr=_clamp(bio.hr-0.42*dHRV,ref.hr[2],ref.hr[3]);
    bio.gsr=_clamp(bio.gsr+0.018*(bio.hr-ref.hr[0]),ref.gsr[2],ref.gsr[3]);
    return bio;
  };

  const _circadianCorr=(bio)=>{
    const[dHRV,dHR,dGSR]=_CIRCADIAN_TABLE[_hour]??[0,0,0];
    const ultra=Math.sin(_ultra);
    const sp=_sleepP;
    bio.hrv=_clamp(bio.hrv+dHRV+ultra*3.0 -sp*11.0,8,  95);
    bio.hr =_clamp(bio.hr +dHR -ultra*1.8 +sp*5.5, 40,145);
    bio.gsr=_clamp(bio.gsr+dGSR+ultra*0.5 +sp*2.0, 0.3,28);
    bio.rr =_clamp(bio.rr -dHRV*0.1+ultra*0.6+sp*1.5,6,36);
    bio.eeg=_clamp(bio.eeg-dHRV*0.018+sp*0.30,       0.05,5.0);
    return bio;
  };

  const _tickCircadian=()=>{
    _ultra=(_ultra+_ultraRate)%(2*Math.PI);
    _sleepP=Math.min(1.0,_sleepP+1/115200);
    if(_tick%7200===0)_hour=new Date().getHours();
  };

  const _SCENARIOS={
    wearable_monitoring_normal:['NEUTRAL','READY','READY','FLOW','FLOW','FLOW','FATIGUE','NEUTRAL'],
    acute_stress_episode:['READY','READY','STRESS','STRESS','STRESS','FATIGUE','FATIGUE','NEUTRAL'],
    hypoarousal_recovery:['NEUTRAL','BOREDOM','BOREDOM','EXCITEMENT','FLOW','FLOW'],
    anxiety_escalation:['READY','EXCITEMENT','STRESS','CONFUSION','CONFUSION','FATIGUE'],
    sympathetic_hyperactivation:['READY','ANXIETY','ANXIETY','STRESS','FRUSTRATION','FATIGUE','NEUTRAL'],
    positive_arousal_flow:['NEUTRAL','CURIOSITY','CURIOSITY','FLOW','FLOW','CALM'],
    recovery:['STRESS','FATIGUE','NEUTRAL','CALM','CALM','READY'],
  };

  return {
    tick(){
      _tick++;_stateAge++;_tickCircadian();
      if(_refractory>0){_refractory--;return;}
      const HIGH=['STRESS','CONFUSION','FRUSTRATION','ANXIETY'];
      const MED=['FLOW','FATIGUE','CALM'];
      const minDwell=HIGH.includes(_state)?6:MED.includes(_state)?4:2;
      const neuroExt=(['STRESS','ANXIETY'].includes(_state))?Math.round((_personality.neuroticism-0.5)*8):0;
      const conExt=_state==='FLOW'?Math.round((_personality.conscientiousness-0.5)*6):0;
      if(_stateAge<minDwell+neuroExt+conExt)return;
      if(_scenarioQ.length>0){
        const target=_scenarioQ[0];
        if(_state===target&&_stateAge>=minDwell+2)_scenarioQ.shift();
        else if(_state!==target)_flipTo(target);
      }else{
        const esc=Math.min(1.0,_stateAge/40)*0.15;
        if(Math.random()<esc)_flipTo(_nextState());
      }
    },

    generateBio(){
      let bio={hrv:_sample('hrv',_state),hr:_sample('hr',_state),gsr:_sample('gsr',_state),rr:_sample('rr',_state),eeg:_sample('eeg',_state)};
      bio=_crossCorr(bio);bio=_circadianCorr(bio);
      bio=_addRSA(bio);bio=_baroreflex(bio);bio=_thermoRegulation(bio);
      bio=_applyPersonalityBaseline(bio);bio=_applyContextBaseline(bio);
      if(_empathyBoost&&['STRESS','ANXIETY','FRUSTRATION'].includes(_state)){
        bio.hrv=_clamp(bio.hrv+_empathyBoost.hrvBoost,6,95);
        _empathyBoost=null;
      }
      return bio;
    },

    generateEEGBands(){
      const t=_EEG_BAND_REF[_state];
      let theta=_clamp(_ouStep('theta_b',t.theta),0.10,5.0);
      let alpha=_clamp(_ouStep('alpha_b',t.alpha),0.10,5.0);
      let beta =_clamp(_ouStep('beta_b', t.beta), 0.10,6.0);
      let gamma=_clamp(_ouStep('gamma_b',t.gamma),0.05,3.0);

      if(['CONFUSION','STRESS','FRUSTRATION'].includes(_state))alpha=_clamp(alpha,0.1,Math.min(alpha,theta*0.55));
      if(['FLOW','READY'].includes(_state)){theta=_clamp(theta,0.1,Math.min(theta,alpha*0.50));beta=_clamp(beta,0.1,1.4);}
      if(_state==='FATIGUE'){beta=_clamp(beta*0.62,0.1,1.0);gamma=_clamp(gamma*0.58,0.05,0.5);}
      if(['EXCITEMENT','CURIOSITY'].includes(_state))gamma=_clamp(gamma,Math.max(gamma,beta*0.58),3.0);
      if(_state==='CALM'){theta=_clamp(theta,0.1,Math.min(theta,alpha*0.25));beta=_clamp(beta*0.4,0.1,0.6);gamma=_clamp(gamma*0.3,0.05,0.25);}
      if(_state==='ANXIETY'){beta=_clamp(beta,Math.max(beta,2.5),6.0);alpha=_clamp(alpha*0.5,0.1,1.0);}
      if(_state==='SURPRISE')gamma=_clamp(gamma*1.8,0.05,3.0);

      alpha=_clamp(alpha*(_iaf/10.0),0.1,5.0);
      const thetaPhase=(Date.now()/1000)*2*Math.PI*(t.theta*0.5);
      gamma=_clamp(gamma+_computePAC(thetaPhase,gamma)*0.06,0.05,3.0);
      const microstate=_getMicrostate();

      return {theta,alpha,beta,gamma,thetaAlphaRatio:alpha>0.01?theta/alpha:1.0,iaf:_iaf,microstate,microstateLabel:MICROSTATES[microstate],p300:_p300};
    },

    getState()      {return _state;},
    getPrevState()  {return _prevState;},
    getTick()       {return _tick;},
    getHistory()    {return[..._history];},
    getPersonality(){return{..._personality};},
    getMemory()     {return{..._memory,stressEpisodes:[..._memory.stressEpisodes]};},
    getContext()    {return{..._context};},

    _physioRef(stateName){
      const r=_PHYSIO_REF[stateName?.toUpperCase()];
      if(!r)return null;
      return{hrv:r.hrv[0],hr:r.hr[0],gsr:r.gsr[0],rr:r.rr[0],eeg:r.eeg[0]};
    },

    setPersonality(traits={}){_personality={..._DEFAULT_PERSONALITY,..._personality,...traits};},
    setContext(ctx={}){_context={..._DEFAULT_CONTEXT,..._context,...ctx};},

    applyEmpathy(type='stress_comfort'){
      if(type==='stress_comfort'&&['STRESS','ANXIETY','FRUSTRATION'].includes(_state)){_empathyBoost={hrvBoost:5};_refractory=0;}
      else if(type==='encouragement'){_empathyBoost={hrvBoost:3};}
      else if(type==='calm_presence'){_empathyBoost={hrvBoost:8};if(_state!=='CALM')_flipTo('CALM');}
    },

    setScenario(name){_scenarioQ=_SCENARIOS[name]?[..._SCENARIOS[name]]:[];},

    force(stateName){const upper=stateName?.toUpperCase();if(_PHYSIO_REF[upper])_flipTo(upper);},

    reset(){
      _state='NEUTRAL';_prevState='NEUTRAL';_tick=0;_stateAge=0;_refractory=0;
      _scenarioQ=[];_history=[];_ultra=Math.random()*2*Math.PI;_sleepP=0;
      _hour=new Date().getHours();_p300=null;_empathyBoost=null;
      const d={hrv:38,hr:72,gsr:4.5,rr:15,eeg:1.0,theta_b:1.0,alpha_b:1.0,beta_b:1.0,gamma_b:0.5};
      for(const k of Object.keys(_ou))_ou[k].x=d[k]??1.0;
    },

    snapshot(){
      return{
        state:_state,prevState:_prevState,tick:_tick,stateAge:_stateAge,refractory:_refractory,
        circadian:{hour:_hour,ultra:(_ultra*180/Math.PI).toFixed(1)+'°',sleepPressure:_sleepP.toFixed(4)},
        personality:{..._personality},
        memory:{burnoutRisk:_memory.burnoutRisk.toFixed(3),recentStressCount:_memory.stressEpisodes.filter(e=>e.ts>Date.now()-86400000).length,flowMomentCount:_memory.flowMoments.length},
        context:{..._context},iaf:_iaf.toFixed(2),microstate:_getMicrostate(),p300Active:!!_p300,
      };
    },
  };
})();

window.HumanSim      = HumanSim;
window.EMOTION_STATES = EMOTION_STATES;
window.MICROSTATES    = MICROSTATES;

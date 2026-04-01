param(
  [string]$BrowserPath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$sourceHtml = Join-Path $root "Nuengdeaw_Wellness.html"
$captureDir = Join-Path $root "manual_assets"
$tempDir = Join-Path $captureDir "_capture_pages"
$profileDir = Join-Path $captureDir "_edge_profile"

New-Item -ItemType Directory -Force -Path $captureDir | Out-Null
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
New-Item -ItemType Directory -Force -Path $profileDir | Out-Null

if (-not (Test-Path $BrowserPath)) {
  throw "Browser not found: $BrowserPath"
}

$html = Get-Content -Raw -Path $sourceHtml

$sampleHelper = @"
function __ndSample(profileMode, subjectId, stateName) {
  const bio = { hr: 92, hrv: 18, gsr: 12.4, rr: 24, eeg: 1.05 };
  const bands = { theta: 2.4, alpha: 0.9, beta: 1.5, gamma: 0.6, thetaAlphaRatio: 2.67, iaf: 10.1, microstate: 'B' };
  const history = ['READY','STRESS','STRESS','ANXIETY'];
  const profileContext = NuengdeawProfileResolver.resolve({ profileMode, subjectId });
  const result = NuengdeawWellnessCore.assess({ bio, bands, state: stateName || 'STRESS', history, sessionSec: 420, adaptiveAT: profileContext.adaptiveAT });
  result._profileContext = profileContext;
  window._lastScanResult = result;
  window._lastScanBio = bio;
  window._lastScanBands = bands;
  return { bio, bands, result, profileContext };
}
function __ndShowAssessment(profileMode, subjectId, stateName) {
  const payload = __ndSample(profileMode, subjectId, stateName);
  if (typeof setProfileMode === 'function') setProfileMode(profileMode, { persist:false });
  if (typeof setInputMode === 'function') setInputMode('sim', { persist:false });
  if (typeof setSubjectId === 'function') setSubjectId(subjectId, { persist:false });
  if (typeof switchTab === 'function') switchTab('diag');
  if (typeof animateGauges === 'function') animateGauges(payload.bio, payload.bands);
  const sw = document.getElementById('scan-wrap'); if (sw) sw.style.display = 'none';
  const idle = document.getElementById('idle-wrap'); if (idle) idle.style.display = 'none';
  const out = document.getElementById('diag-out');
  if (out) {
    out.style.display = 'block';
    out.innerHTML = '';
    NuengdeawAura.render(payload.result, out);
  }
  if (typeof setDiagActionsVisible === 'function') setDiagActionsVisible(true);
  if (typeof updateScanCount === 'function') updateScanCount();
  if (typeof closeResultPopup === 'function') closeResultPopup();
  return payload;
}
function __ndShowDashboard() {
  if (typeof setProfileMode === 'function') setProfileMode('personal', { persist:false });
  if (typeof setInputMode === 'function') setInputMode('sim', { persist:false });
  if (typeof setSubjectId === 'function') setSubjectId('SELF', { persist:false });
  if (NuengdeawStore && typeof NuengdeawStore.clear === 'function') NuengdeawStore.clear();
  const states = [
    { hr: 78, hrv: 42, gsr: 4.8, rr: 15, theta: 1.1, alpha: 1.5, beta: 1.2, gamma: 0.4, ratio: 0.73, state: 'READY' },
    { hr: 88, hrv: 24, gsr: 9.2, rr: 20, theta: 1.8, alpha: 1.0, beta: 1.4, gamma: 0.5, ratio: 1.8, state: 'STRESS' },
    { hr: 95, hrv: 18, gsr: 12.4, rr: 24, theta: 2.4, alpha: 0.9, beta: 1.5, gamma: 0.6, ratio: 2.67, state: 'ANXIETY' }
  ];
  states.forEach((s, idx) => {
    const bio = { hr: s.hr, hrv: s.hrv, gsr: s.gsr, rr: s.rr, eeg: 1.0 + idx * 0.05 };
    const bands = { theta: s.theta, alpha: s.alpha, beta: s.beta, gamma: s.gamma, thetaAlphaRatio: s.ratio, iaf: 10.1, microstate: idx % 2 ? 'B' : 'A' };
    const profileContext = NuengdeawProfileResolver.resolve({ profileMode:'personal', subjectId:'SELF' });
    const result = NuengdeawWellnessCore.assess({ bio, bands, state: s.state, history:['READY','STRESS'], sessionSec: 300 + idx * 60, adaptiveAT: profileContext.adaptiveAT });
    result._profileContext = profileContext;
    NuengdeawStore.push(result, bio, bands, { profileContext, inputMode:'sim' });
    window._lastScanResult = result;
    window._lastScanBio = bio;
    window._lastScanBands = bands;
  });
  const idle = document.getElementById('idle-wrap'); if (idle) idle.style.display = 'none';
  const diag = document.getElementById('diag-out'); if (diag) diag.style.display = 'none';
  const scan = document.getElementById('scan-wrap'); if (scan) scan.style.display = 'none';
  if (typeof switchTab === 'function') switchTab('dash');
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof updateScanCount === 'function') updateScanCount();
  if (typeof closeResultPopup === 'function') closeResultPopup();
}
"@

$scenarios = @(
  @{ Name = "screen_01_main_idle"; Budget = 2500; Width = 1440; Height = 1800; Script = @"
setTimeout(() => {
  try {
    if (typeof setProfileMode === 'function') setProfileMode('personal', { persist:false });
    if (typeof setInputMode === 'function') setInputMode('sim', { persist:false });
    if (typeof setSubjectId === 'function') setSubjectId('SELF', { persist:false });
    if (typeof switchTab === 'function') switchTab('diag');
    if (typeof closeResultPopup === 'function') closeResultPopup();
  } catch (e) { console.error(e); }
}, 1200);
"@ },
  @{ Name = "screen_02_scanning"; Budget = 3200; Width = 1440; Height = 1800; Script = @"
setTimeout(() => {
  try {
    if (typeof setProfileMode === 'function') setProfileMode('personal', { persist:false });
    if (typeof setInputMode === 'function') setInputMode('sim', { persist:false });
    if (typeof setSubjectId === 'function') setSubjectId('SELF', { persist:false });
    const idle = document.getElementById('idle-wrap'); if (idle) idle.style.display = 'none';
    const diag = document.getElementById('diag-out'); if (diag) diag.style.display = 'none';
    const scan = document.getElementById('scan-wrap'); if (scan) scan.style.display = 'flex';
    const lbl = document.getElementById('scan-lbl'); if (lbl) lbl.textContent = 'READING BIOSIGNAL...';
    const sub = document.getElementById('scan-sub'); if (sub) sub.textContent = 'กำลังอ่าน HRV และ Heart Rate';
  } catch (e) { console.error(e); }
}, 1200);
"@ },
  @{ Name = "screen_03_assessment_result"; Budget = 4200; Width = 1440; Height = 2200; Script = @"
$sampleHelper
setTimeout(() => {
  try { __ndShowAssessment('personal', 'SELF', 'STRESS'); } catch (e) { console.error(e); }
}, 1400);
"@ },
  @{ Name = "screen_04_dashboard"; Budget = 4200; Width = 1440; Height = 2200; Script = @"
$sampleHelper
setTimeout(() => {
  try { __ndShowDashboard(); } catch (e) { console.error(e); }
}, 1400);
"@ },
  @{ Name = "screen_05_clinic_actions"; Budget = 4200; Width = 1440; Height = 2200; Script = @"
$sampleHelper
setTimeout(() => {
  try { __ndShowAssessment('clinic', 'CASE001', 'STRESS'); } catch (e) { console.error(e); }
}, 1400);
"@ }
)

foreach ($scenario in $scenarios) {
  $inject = "<script>`r`n$($scenario.Script)`r`n</script>`r`n</body>"
  $patched = $html.Replace("</body>", $inject)
  $tempHtml = Join-Path $tempDir ($scenario.Name + ".html")
  $outputPng = Join-Path $captureDir ($scenario.Name + ".png")
  Set-Content -Path $tempHtml -Value $patched -Encoding UTF8

  $fileUrl = "file:///" + ($tempHtml -replace '\\', '/')
  & $BrowserPath `
    --headless `
    --disable-gpu `
    --hide-scrollbars `
    --allow-file-access-from-files `
    --no-first-run `
    --no-default-browser-check `
    --user-data-dir="$profileDir" `
    --window-size="$($scenario.Width),$($scenario.Height)" `
    --virtual-time-budget="$($scenario.Budget)" `
    --screenshot="$outputPng" `
    "$fileUrl" | Out-Null
}

Write-Output "Screenshots saved to: $captureDir"

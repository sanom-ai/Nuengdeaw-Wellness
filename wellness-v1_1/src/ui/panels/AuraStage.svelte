<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';

  export let snapshotState: any;

  let viewport: HTMLDivElement;
  let frame = 0;
  let raf = 0;

  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let rootGroup: THREE.Group | null = null;
  let particleCloud: THREE.Points | null = null;
  let particlePositions: Float32Array | null = null;
  let particleColors: Float32Array | null = null;
  let coreShell: THREE.Mesh | null = null;
  let innerGlow: THREE.Mesh | null = null;
  let haloRingA: THREE.Mesh | null = null;
  let haloRingB: THREE.Mesh | null = null;
  let breathBand: THREE.Line | null = null;

  $: aura = snapshotState?.aura ?? {
    primary: '#52f7d4',
    secondary: '#4da7ff',
    tertiary: '#f7f3e8',
    pulse: 0.4,
    density: 24,
    turbulence: 0.3,
    breath: 0.5,
    halo: 0.5,
    meshDrift: 0.45,
    harmonicBias: 'grounded',
  };
  $: snapshot = snapshotState?.snapshot;
  $: mesh = snapshotState?.signalMesh ?? [];
  $: decision = snapshotState?.decision;

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  function hexToColor(hex: string) {
    return new THREE.Color(hex);
  }

  function createBreathCurve(radius: number) {
    const points: THREE.Vector3[] = [];
    for (let step = 0; step <= 180; step += 1) {
      const angle = (step / 180) * Math.PI * 2;
      const warp = 1 + Math.sin(angle * 3) * 0.05;
      points.push(new THREE.Vector3(Math.cos(angle) * radius * warp, Math.sin(angle) * radius * 0.38 * warp, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  function setupScene() {
    if (!viewport) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.2, 11);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    viewport.innerHTML = '';
    viewport.appendChild(renderer.domElement);

    rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const primary = hexToColor(aura.primary);
    const secondary = hexToColor(aura.secondary);
    const tertiary = hexToColor(aura.tertiary);

    coreShell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.35, 4),
      new THREE.MeshBasicMaterial({ color: primary, wireframe: true, transparent: true, opacity: 0.42 })
    );
    rootGroup.add(coreShell);

    innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.6, 48, 48),
      new THREE.MeshBasicMaterial({ color: tertiary, transparent: true, opacity: 0.2 })
    );
    rootGroup.add(innerGlow);

    haloRingA = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.045, 20, 180),
      new THREE.MeshBasicMaterial({ color: secondary, transparent: true, opacity: 0.46 })
    );
    haloRingA.rotation.x = Math.PI / 2.6;
    rootGroup.add(haloRingA);

    haloRingB = new THREE.Mesh(
      new THREE.TorusGeometry(4.1, 0.035, 20, 180),
      new THREE.MeshBasicMaterial({ color: primary, transparent: true, opacity: 0.28 })
    );
    haloRingB.rotation.x = Math.PI / 2.1;
    haloRingB.rotation.y = Math.PI / 4.5;
    rootGroup.add(haloRingB);

    breathBand = new THREE.Line(
      createBreathCurve(4.9),
      new THREE.LineBasicMaterial({ color: tertiary, transparent: true, opacity: 0.36 })
    );
    breathBand.rotation.z = Math.PI / 8;
    breathBand.position.z = -0.2;
    rootGroup.add(breathBand);

    const particleCount = Math.max(180, Math.round((aura.density ?? 26) * 8));
    particlePositions = new Float32Array(particleCount * 3);
    particleColors = new Float32Array(particleCount * 3);
    const geometry = new THREE.BufferGeometry();

    for (let i = 0; i < particleCount; i += 1) {
      const stride = i * 3;
      const radius = 2.8 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      particlePositions[stride] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[stride + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
      particlePositions[stride + 2] = (Math.random() - 0.5) * 2.4;

      const color = i % 3 === 0 ? primary : i % 2 === 0 ? secondary : tertiary;
      particleColors[stride] = color.r;
      particleColors[stride + 1] = color.g;
      particleColors[stride + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    particleCloud = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.94, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    rootGroup.add(particleCloud);

    resizeScene();
  }

  function resizeScene() {
    if (!viewport || !renderer || !camera) return;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }

  function applyAuraPalette() {
    if (!coreShell || !innerGlow || !haloRingA || !haloRingB || !breathBand || !particleCloud || !particleColors) return;

    const primary = hexToColor(aura.primary);
    const secondary = hexToColor(aura.secondary);
    const tertiary = hexToColor(aura.tertiary);

    (coreShell.material as THREE.MeshBasicMaterial).color.copy(primary);
    (innerGlow.material as THREE.MeshBasicMaterial).color.copy(tertiary);
    (haloRingA.material as THREE.MeshBasicMaterial).color.copy(secondary);
    (haloRingB.material as THREE.MeshBasicMaterial).color.copy(primary);
    (breathBand.material as THREE.LineBasicMaterial).color.copy(tertiary);

    for (let i = 0; i < particleColors.length; i += 3) {
      const color = (i / 3) % 3 === 0 ? primary : (i / 3) % 2 === 0 ? secondary : tertiary;
      particleColors[i] = color.r;
      particleColors[i + 1] = color.g;
      particleColors[i + 2] = color.b;
    }

    const colorsAttribute = particleCloud.geometry.getAttribute('color') as THREE.BufferAttribute;
    colorsAttribute.needsUpdate = true;
  }

  function animateScene() {
    if (!renderer || !scene || !camera || !rootGroup || !particleCloud || !particlePositions || !coreShell || !innerGlow || !haloRingA || !haloRingB || !breathBand) {
      return;
    }

    frame += 1;
    const t = frame * 0.011;
    const pulse = aura.pulse ?? 0.4;
    const breath = aura.breath ?? 0.5;
    const turbulence = aura.turbulence ?? 0.35;
    const halo = aura.halo ?? 0.5;
    const drift = aura.meshDrift ?? 0.45;
    const biasBoost = aura.harmonicBias === 'intense' ? 1.35 : aura.harmonicBias === 'rising' ? 1.14 : 1;

    applyAuraPalette();

    rootGroup.rotation.y += 0.0018 + drift * 0.003;
    rootGroup.rotation.x = Math.sin(t * 0.55) * 0.08;

    const coreScale = 1 + Math.sin(t * (1.2 + breath)) * (0.06 + breath * 0.05) + pulse * 0.04;
    coreShell.scale.setScalar(coreScale * biasBoost);
    innerGlow.scale.setScalar(0.92 + halo * 0.24 + Math.cos(t * 1.8) * 0.03);
    haloRingA.scale.setScalar(1 + Math.sin(t * 1.4) * 0.08 + halo * 0.04);
    haloRingB.scale.setScalar(1 + Math.cos(t * 1.15) * 0.12 + turbulence * 0.04);
    haloRingA.rotation.z += 0.003 + drift * 0.002;
    haloRingB.rotation.y += 0.002 + pulse * 0.002;
    breathBand.rotation.z += 0.0018 + breath * 0.002;
    breathBand.scale.set(1 + breath * 0.2, 1 + pulse * 0.1, 1);

    const positions = particleCloud.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < particlePositions.length; i += 3) {
      const index = i / 3;
      const ox = particlePositions[i];
      const oy = particlePositions[i + 1];
      const oz = particlePositions[i + 2];
      const phase = t * (0.9 + drift) + index * 0.17;
      positions.array[i] = ox + Math.sin(phase) * (0.05 + turbulence * 0.22);
      positions.array[i + 1] = oy + Math.cos(phase * 1.2) * (0.04 + breath * 0.18);
      positions.array[i + 2] = oz + Math.sin(phase * 0.8) * (0.06 + halo * 0.16);
    }
    positions.needsUpdate = true;

    const particleMaterial = particleCloud.material as THREE.PointsMaterial;
    particleMaterial.size = 0.06 + halo * 0.06 + Math.sin(t * 2) * 0.004;
    particleMaterial.opacity = 0.8 + pulse * 0.18;
    (coreShell.material as THREE.MeshBasicMaterial).opacity = 0.26 + pulse * 0.26;
    (innerGlow.material as THREE.MeshBasicMaterial).opacity = 0.14 + halo * 0.24;
    (haloRingA.material as THREE.MeshBasicMaterial).opacity = 0.25 + halo * 0.28;
    (haloRingB.material as THREE.MeshBasicMaterial).opacity = 0.18 + turbulence * 0.18;
    (breathBand.material as THREE.LineBasicMaterial).opacity = 0.18 + breath * 0.24;

    camera.position.z = 10.7 - halo * 0.8;
    camera.position.x = Math.sin(t * 0.45) * 0.24;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    raf = requestAnimationFrame(animateScene);
  }

  onMount(() => {
    setupScene();
    const handleResize = () => resizeScene();
    window.addEventListener('resize', handleResize);
    raf = requestAnimationFrame(animateScene);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      renderer?.dispose();
      coreShell?.geometry.dispose();
      (coreShell?.material as THREE.Material | undefined)?.dispose();
      innerGlow?.geometry.dispose();
      (innerGlow?.material as THREE.Material | undefined)?.dispose();
      haloRingA?.geometry.dispose();
      (haloRingA?.material as THREE.Material | undefined)?.dispose();
      haloRingB?.geometry.dispose();
      (haloRingB?.material as THREE.Material | undefined)?.dispose();
      breathBand?.geometry.dispose();
      (breathBand?.material as THREE.Material | undefined)?.dispose();
      particleCloud?.geometry.dispose();
      (particleCloud?.material as THREE.Material | undefined)?.dispose();
      viewport?.replaceChildren();
    };
  });
</script>

<section class="aura-stage glass">
  <div class="stage-head">
    <div>
      <div class="eyebrow">Expression Layer</div>
      <h3>Living Bio-Aura WebGL Field</h3>
      <p>The aura now renders as a layered 3D field with pulse, halo, turbulence, and breath dynamics so the expression layer feels spatial and alive.</p>
    </div>
    <div class="meta-panel">
      <div><span>Pulse</span><strong>{Math.round((aura.pulse ?? 0) * 100)}%</strong></div>
      <div><span>Density</span><strong>{aura.density}</strong></div>
      <div><span>Halo</span><strong>{Math.round((aura.halo ?? 0) * 100)}%</strong></div>
      <div><span>Bias</span><strong>{aura.harmonicBias}</strong></div>
    </div>
  </div>

  <div class="orbital-field">
    <div bind:this={viewport} class="aura-viewport"></div>
    <div class="scene-glow"></div>

    <div class="aura-insights">
      <div>
        <span>State</span>
        <strong>{decision?.state ?? 'Calibrating'}</strong>
      </div>
      <div>
        <span>Confidence</span>
        <strong>{Math.round((decision?.confidence ?? 0) * 100)}%</strong>
      </div>
      <div>
        <span>Turbulence</span>
        <strong>{Math.round((aura.turbulence ?? 0) * 100)}%</strong>
      </div>
      <div>
        <span>Breath Flow</span>
        <strong>{Math.round((aura.breath ?? 0) * 100)}%</strong>
      </div>
    </div>

    <div class="mesh-grid">
      {#each mesh as node}
        <div class:alert={node.status === 'alert'} class="mesh-node">
          <div class="mesh-layer">{node.layer}</div>
          <strong>{node.label}</strong>
          <span>{Math.round(clamp(node.intensity, 0, 1) * 100)}% intensity</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="legend">
    <div><span class="swatch" style={`background:${aura.primary}`}></span>Primary emotional field</div>
    <div><span class="swatch" style={`background:${aura.secondary}`}></span>Coherence and recovery halo</div>
    <div><span class="swatch" style={`background:${aura.tertiary}`}></span>Inner clarity core</div>
  </div>

  <div class="signal-ribbon">
    <span>HR {snapshot?.hr ?? '-'} bpm</span>
    <span>HRV {snapshot?.hrv ?? '-'}</span>
    <span>GSR {snapshot?.gsr ?? '-'}</span>
    <span>RR {snapshot?.rr ?? '-'}</span>
    <span>Coherence {snapshot?.coherence ?? '-'}</span>
    <span>Stress {snapshot?.stressIndex ?? '-'}</span>
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
  .aura-stage {
    padding: 22px;
    min-height: 700px;
  }
  .stage-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
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
    font-size: 1.45rem;
  }
  p {
    color: var(--text-soft);
    max-width: 580px;
  }
  .meta-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .meta-panel > div,
  .aura-insights > div {
    min-width: 96px;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.03);
  }
  .meta-panel span,
  .aura-insights span {
    display: block;
    color: var(--text-soft);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .meta-panel strong,
  .aura-insights strong {
    display: block;
    margin-top: 6px;
    font-family: 'Prompt', sans-serif;
    font-size: 1.05rem;
  }
  .orbital-field {
    position: relative;
    height: 480px;
    margin-top: 16px;
    border-radius: 28px;
    overflow: hidden;
    background:
      radial-gradient(circle at 50% 42%, rgba(239, 195, 109, 0.08), rgba(255, 255, 255, 0) 25%),
      radial-gradient(circle at 50% 50%, rgba(82, 247, 212, 0.08), rgba(255, 255, 255, 0) 55%),
      linear-gradient(180deg, rgba(5, 15, 27, 0.96), rgba(3, 9, 17, 0.98));
    isolation: isolate;
  }
  .aura-viewport,
  .aura-viewport :global(canvas) {
    width: 100%;
    height: 100%;
    display: block;
  }
  .scene-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at center, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0) 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0));
    pointer-events: none;
    mix-blend-mode: screen;
  }
  .aura-insights {
    position: absolute;
    inset: 18px 18px auto auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: min(320px, calc(100% - 36px));
    z-index: 2;
  }
  .mesh-grid {
    position: absolute;
    inset: auto 16px 16px 16px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    z-index: 2;
  }
  .mesh-node {
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 10px;
    background: rgba(9, 20, 34, 0.68);
    backdrop-filter: blur(12px);
  }
  .mesh-node.alert {
    border-color: rgba(255, 107, 129, 0.6);
    box-shadow: 0 0 24px rgba(255, 107, 129, 0.12);
  }
  .mesh-layer {
    color: var(--aura-cyan);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.72rem;
    margin-bottom: 4px;
  }
  .mesh-node strong {
    display: block;
    font-size: 0.9rem;
    margin-bottom: 4px;
  }
  .mesh-node span {
    color: var(--text-soft);
    font-size: 0.8rem;
  }
  .legend {
    display: grid;
    gap: 10px;
    color: var(--text-soft);
    margin-top: 16px;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    display: inline-block;
    margin-right: 8px;
  }
  .signal-ribbon {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 16px;
  }
  .signal-ribbon span {
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid var(--line);
    color: var(--text-soft);
    background: rgba(255, 255, 255, 0.03);
  }
  @media (max-width: 1100px) {
    .mesh-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media (max-width: 720px) {
    .stage-head {
      flex-direction: column;
    }
    .meta-panel,
    .aura-insights {
      grid-template-columns: 1fr 1fr;
    }
    .orbital-field {
      height: 560px;
    }
    .mesh-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
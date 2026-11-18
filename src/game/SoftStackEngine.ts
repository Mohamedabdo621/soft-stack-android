import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from './audio';
import { getEnvironmentTheme, getPillowDesign } from './catalog';
import {
  createBonusCoinGroup,
  createPillowGroup,
  createWorldScenery,
  getPuffSphereGeometry,
  resizePillowGroup,
  WorldSceneryRefs,
} from './pillowGeometry';
import {
  EnvironmentTheme,
  FloatingTextEvent,
  GameMode,
  GameStats,
  PillowDesign,
} from './types';

const BASE_WIDTH = 3.1;
const BASE_DEPTH = 3.1;
const PILLOW_HEIGHT = 0.72;
const STACK_STEP_Y = PILLOW_HEIGHT * 0.88;
const SWING_LIMIT = 3.55;
const PERFECT_TOLERANCE = 0.24;
const RELAX_PERFECT_TOLERANCE = 0.34;
const MIN_SURVIVAL_SIZE = 0.18;

// Pre-allocated math helpers (zero GC inside animation loop)
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _currentLookAt = new THREE.Vector3(0, 1.4, 0);

interface StackedPillowItem {
  group: THREE.Group;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  colorHex: string;
  scaleY: number;
  velY: number;
  tiltX: number;
  tiltVelX: number;
  tiltZ: number;
  tiltVelZ: number;
}

interface FallingPiece {
  group: THREE.Group;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  rz: number;
  life: number;
}

interface PuffParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export interface RunConfig {
  mode: GameMode;
  pillowDesign: PillowDesign;
  theme: EnvironmentTheme;
  baseSpeed: number;
  speedIncrement: number;
  targetHeight: number | null;
  maxPillows: number | null;
  paletteOverride?: string[];
  levelRewardCoins?: number;
}

export interface EngineCallbacks {
  onStatsChange: (stats: GameStats) => void;
  onFloatingText: (event: FloatingTextEvent) => void;
  onGameOver: (stats: GameStats) => void;
  onLevelComplete: (stats: GameStats) => void;
}

/**
 * Generates a studio environment cubemap with two softbox highlight panels baked in
 * once at initialization—giving luminous studio reflections with zero per-frame RectAreaLight cost.
 */
function buildStudioEnvironmentMap(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();

  const panelGeo = new THREE.PlaneGeometry(6, 6);
  const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });

  const softboxLeft = new THREE.Mesh(panelGeo, panelMat);
  softboxLeft.position.set(-5, 5, 5);
  softboxLeft.lookAt(0, 0, 0);
  envScene.add(softboxLeft);

  const softboxRight = new THREE.Mesh(panelGeo, panelMat);
  softboxRight.position.set(5, 3.5, 6);
  softboxRight.lookAt(0, 0, 0);
  envScene.add(softboxRight);

  const tex = pmrem.fromScene(envScene, 0.04).texture;
  panelGeo.dispose();
  panelMat.dispose();
  envScene.dispose();
  pmrem.dispose();
  return tex;
}

function setGroupShadowCasting(group: THREE.Group, cast: boolean): void {
  const body = group.getObjectByName('pillow-body');
  if (body) {
    body.castShadow = cast;
  }
}

export class SoftStackEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private envTexture: THREE.Texture;
  private isSoftwareGl: boolean;
  private maxAnisotropy: number;

  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;
  private scenery: WorldSceneryRefs;
  private towerGroup: THREE.Group;
  private debrisGroup: THREE.Group;
  private particleGroup: THREE.Group;
  private guideMesh: THREE.Mesh;
  private glowRingMesh: THREE.Mesh;
  private glowRingLife = 1;
  private bonusCoin: { group: THREE.Group; dispose: () => void };
  private bonusCoinActive = false;
  private bonusCoinX = 0;
  private bonusCoinY = 0;
  private bonusCoinZ = 0;

  private stack: StackedPillowItem[] = [];
  private activePillow: {
    group: THREE.Group;
    x: number;
    y: number;
    z: number;
    width: number;
    depth: number;
    axis: 'x' | 'z';
    swingPhase: number;
    angularSpeed: number;
    colorHex: string;
    state: 'gliding' | 'dropping' | 'bouncing';
    dropVel: number;
  } | null = null;

  private fallingPieces: FallingPiece[] = [];
  private particles: PuffParticle[] = [];

  private callbacks: EngineCallbacks;
  private currentRun: RunConfig | null = null;
  private currentDesign: PillowDesign;
  private currentTheme: EnvironmentTheme;

  private phase: 'menu' | 'playing' | 'paused' | 'ended' = 'menu';
  private floatingEventId = 1;
  private hapticsEnabled = true;

  private stats: GameStats = {
    score: 0,
    height: 0,
    pillowsUsed: 0,
    maxPillows: null,
    targetHeight: null,
    perfectStreak: 0,
    bestStreakInRun: 0,
    comboMultiplier: 1,
    coinsEarnedInRun: 0,
    isNewBest: false,
  };

  private clock = new THREE.Clock();
  private elapsed = 0;
  private frameId = 0;
  private disposed = false;

  constructor(
    container: HTMLElement,
    initialDesignId: string,
    initialThemeId: string,
    callbacks: EngineCallbacks,
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.currentDesign = getPillowDesign(initialDesignId);
    this.currentTheme = getEnvironmentTheme(initialThemeId);

    this.isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    // Cap pixel ratio at 1.5 for crisp visuals and locked 60-120 FPS on high-DPI mobile screens
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.maxAnisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());

    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.currentTheme.skyBottom);
    this.scene.fog = new THREE.Fog(this.currentTheme.fogColor, 20, 68);

    // Baked studio softbox environment reflections (zero per-frame area-light shader cost)
    this.envTexture = buildStudioEnvironmentMap(this.renderer);
    this.scene.environment = this.envTexture;

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 140);
    this.camera.position.set(4.8, 4.6, 8.4);
    this.camera.lookAt(_currentLookAt);

    // Lightweight 3-point studio light rig
    this.hemiLight = new THREE.HemisphereLight(
      this.currentTheme.hemiSkyColor,
      this.currentTheme.hemiGroundColor,
      1.15,
    );
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(this.currentTheme.keyLightColor, 1.25);
    this.keyLight.position.set(6, 14, 9);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 512;
    this.keyLight.shadow.mapSize.height = 512;
    this.keyLight.shadow.camera.left = -6;
    this.keyLight.shadow.camera.right = 6;
    this.keyLight.shadow.camera.top = 10;
    this.keyLight.shadow.camera.bottom = -6;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 36;
    this.keyLight.shadow.bias = -0.0008;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    this.rimLight = new THREE.DirectionalLight('#ffffff', 0.65);
    this.rimLight.position.set(-7, 7, -8);
    this.scene.add(this.rimLight);

    this.scenery = createWorldScenery(this.currentTheme, this.maxAnisotropy);
    this.scene.add(this.scenery.root);

    this.towerGroup = new THREE.Group();
    this.scene.add(this.towerGroup);

    this.debrisGroup = new THREE.Group();
    this.scene.add(this.debrisGroup);

    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    const guideGeo = new THREE.RingGeometry(0.38, 0.48, 32);
    guideGeo.rotateX(-Math.PI / 2);
    const guideMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.guideMesh = new THREE.Mesh(guideGeo, guideMat);
    this.guideMesh.visible = false;
    this.scene.add(this.guideMesh);

    const glowGeo = new THREE.RingGeometry(0.45, 0.56, 36);
    glowGeo.rotateX(-Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.glowRingMesh = new THREE.Mesh(glowGeo, glowMat);
    this.glowRingMesh.visible = false;
    this.scene.add(this.glowRingMesh);

    this.bonusCoin = createBonusCoinGroup();
    this.bonusCoin.group.visible = false;
    this.scene.add(this.bonusCoin.group);

    const puffGeo = getPuffSphereGeometry();
    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(puffGeo, mat);
      mesh.visible = false;
      this.particleGroup.add(mesh);
      this.particles.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.7,
        active: false,
      });
    }

    this.buildShowcaseTower();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);

    this.tick();
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
  };

  private handleResize = () => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public applyCosmetics(designId: string, themeId: string): void {
    this.currentDesign = getPillowDesign(designId);
    this.currentTheme = getEnvironmentTheme(themeId);

    this.scene.background = new THREE.Color(this.currentTheme.skyBottom);
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.set(this.currentTheme.fogColor);
    }
    this.hemiLight.color.set(this.currentTheme.hemiSkyColor);
    this.hemiLight.groundColor.set(this.currentTheme.hemiGroundColor);
    this.keyLight.color.set(this.currentTheme.keyLightColor);
    this.scenery.updateTheme(this.currentTheme);

    if (this.phase === 'menu') {
      this.buildShowcaseTower();
    }
  }

  private clearTower(): void {
    for (const item of this.stack) {
      this.towerGroup.remove(item.group);
    }
    this.stack = [];

    if (this.activePillow) {
      this.towerGroup.remove(this.activePillow.group);
      this.activePillow = null;
    }

    for (const piece of this.fallingPieces) {
      this.debrisGroup.remove(piece.group);
    }
    this.fallingPieces = [];

    this.guideMesh.visible = false;
    this.glowRingMesh.visible = false;
    this.bonusCoinActive = false;
    this.bonusCoin.group.visible = false;
  }

  public buildShowcaseTower(): void {
    this.phase = 'menu';
    this.clearTower();

    const palette = this.currentDesign.palette;
    const widths = [3.2, 2.7, 2.25, 1.85, 0.92];
    const heights = [0.78, 0.72, 0.68, 0.64, 0.78];

    let accY = 0;
    for (let i = 0; i < widths.length; i++) {
      const w = widths[i];
      const h = heights[i];
      const y = accY + h * 0.44;
      accY += h * 0.85;
      const colorHex = palette[i % palette.length];
      const group = createPillowGroup({
        width: w,
        height: h,
        depth: w,
        colorHex,
        design: this.currentDesign,
        maxAnisotropy: this.maxAnisotropy,
        isBase: i === 0,
      });
      group.position.set(0, y, 0);
      this.towerGroup.add(group);
      this.stack.push({
        group,
        x: 0,
        y,
        z: 0,
        width: w,
        depth: w,
        colorHex,
        scaleY: 1,
        velY: 0,
        tiltX: 0,
        tiltVelX: 0,
        tiltZ: 0,
        tiltVelZ: 0,
      });
    }
  }

  public startRun(config: RunConfig): void {
    this.currentRun = config;
    this.applyCosmetics(config.pillowDesign.id, config.theme.id);
    this.clearTower();
    this.phase = 'playing';

    this.stats = {
      score: 0,
      height: 0,
      pillowsUsed: 0,
      maxPillows: config.maxPillows,
      targetHeight: config.targetHeight,
      perfectStreak: 0,
      bestStreakInRun: 0,
      comboMultiplier: 1,
      coinsEarnedInRun: 0,
      isNewBest: false,
    };
    this.callbacks.onStatsChange({ ...this.stats });

    const palette = config.paletteOverride ?? config.pillowDesign.palette;
    const baseColor = palette[0];
    const baseGroup = createPillowGroup({
      width: BASE_WIDTH,
      height: PILLOW_HEIGHT,
      depth: BASE_DEPTH,
      colorHex: baseColor,
      design: config.pillowDesign,
      maxAnisotropy: this.maxAnisotropy,
      isBase: true,
    });
    const baseY = PILLOW_HEIGHT * 0.45;
    baseGroup.position.set(0, baseY, 0);
    this.towerGroup.add(baseGroup);

    this.stack.push({
      group: baseGroup,
      x: 0,
      y: baseY,
      z: 0,
      width: BASE_WIDTH,
      depth: BASE_DEPTH,
      colorHex: baseColor,
      scaleY: 1,
      velY: 0,
      tiltX: 0,
      tiltVelX: 0,
      tiltZ: 0,
      tiltVelZ: 0,
    });

    this.spawnNextMovingPillow();
  }

  public setPaused(paused: boolean): void {
    if (this.phase === 'ended' || this.phase === 'menu') return;
    this.phase = paused ? 'paused' : 'playing';
  }

  public setHapticsEnabled(enabled: boolean): void {
    this.hapticsEnabled = enabled;
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.hapticsEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore restricted Vibration API environments
    }
  }

  public returnToMenu(): void {
    this.buildShowcaseTower();
  }

  private spawnNextMovingPillow(): void {
    if (!this.currentRun || this.stack.length === 0) return;

    const top = this.stack[this.stack.length - 1];
    const levelIndex = this.stack.length;
    const palette = this.currentRun.paletteOverride ?? this.currentRun.pillowDesign.palette;
    const colorHex = palette[levelIndex % palette.length];

    const axis: 'x' | 'z' = levelIndex % 2 === 1 ? 'x' : 'z';
    const swingPhase = levelIndex % 4 < 2 ? -Math.PI * 0.5 : Math.PI * 0.5;
    const startOffset = Math.sin(swingPhase) * SWING_LIMIT;
    const hoverY = top.y + PILLOW_HEIGHT * 1.65;

    const x = axis === 'x' ? startOffset : top.x;
    const z = axis === 'z' ? startOffset : top.z;

    const group = createPillowGroup({
      width: top.width,
      height: PILLOW_HEIGHT,
      depth: top.depth,
      colorHex,
      design: this.currentRun.pillowDesign,
      maxAnisotropy: this.maxAnisotropy,
    });
    group.position.set(x, hoverY, z);
    this.towerGroup.add(group);

    const linearSpeed =
      this.currentRun.baseSpeed +
      Math.min(3.1, (levelIndex - 1) * this.currentRun.speedIncrement);
    const angularSpeed = linearSpeed / (SWING_LIMIT * 0.72);

    this.activePillow = {
      group,
      x,
      y: hoverY,
      z,
      width: top.width,
      depth: top.depth,
      axis,
      swingPhase,
      angularSpeed,
      colorHex,
      state: 'gliding',
      dropVel: 0,
    };

    const isFever = this.stats.perfectStreak >= 5;
    (this.guideMesh.material as THREE.MeshBasicMaterial).color.setHex(
      isFever ? 0xffd43b : 0xffffff,
    );
    (this.guideMesh.material as THREE.MeshBasicMaterial).opacity = isFever ? 0.36 : 0.24;
    this.guideMesh.visible = true;
    this.guideMesh.scale.set(top.width * 0.92, 1, top.depth * 0.92);
    this.guideMesh.position.set(top.x, top.y + PILLOW_HEIGHT * 0.44, top.z);

    // Spawn a spinning golden bonus star-coin above every 3rd target pillow
    if (levelIndex >= 2 && levelIndex % 3 === 2) {
      this.bonusCoinActive = true;
      this.bonusCoinX = top.x;
      this.bonusCoinY = top.y + STACK_STEP_Y + 0.14;
      this.bonusCoinZ = top.z;
      this.bonusCoin.group.position.set(this.bonusCoinX, this.bonusCoinY, this.bonusCoinZ);
      this.bonusCoin.group.visible = true;
    } else {
      this.bonusCoinActive = false;
      this.bonusCoin.group.visible = false;
    }
  }

  public triggerDrop(): void {
    if (this.phase !== 'playing' || !this.activePillow) return;
    if (this.activePillow.state !== 'gliding') return;

    this.activePillow.state = 'dropping';
    this.activePillow.dropVel = 3.6;
    soundEngine.playDropSwoosh();
  }

  private emitFloating(
    text: string,
    tone: FloatingTextEvent['tone'],
    subtext?: string,
  ): void {
    this.callbacks.onFloatingText({
      id: this.floatingEventId++,
      text,
      subtext,
      tone,
    });
  }

  private triggerGlowRing(x: number, y: number, z: number, width: number, depth: number): void {
    this.glowRingMesh.position.set(x, y, z);
    this.glowRingMesh.scale.set(width, 1, depth);
    this.glowRingMesh.visible = true;
    this.glowRingLife = 0;
    (this.glowRingMesh.material as THREE.MeshBasicMaterial).opacity = 0.65;
  }

  private spawnParticles(x: number, y: number, z: number, colorHex: string, count: number): void {
    let spawned = 0;
    for (const p of this.particles) {
      if (p.active) continue;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.55 + Math.random() * 0.3;

      const angle = (spawned / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 1.1 + Math.random() * 1.6;
      p.vx = Math.cos(angle) * speed;
      p.vy = 1.3 + Math.random() * 1.7;
      p.vz = Math.sin(angle) * speed;

      p.mesh.position.set(x, y, z);
      p.mesh.scale.setScalar(0.65 + Math.random() * 0.55);
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.color.set(colorHex);
      mat.opacity = 0.85;
      p.mesh.visible = true;

      spawned++;
      if (spawned >= count) break;
    }
  }

  private spawnFallingChunk(
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    colorHex: string,
    axis: 'x' | 'z',
    sign: number,
  ): void {
    if (!this.currentRun || w <= 0.05 || d <= 0.05) return;
    const chunkGroup = createPillowGroup({
      width: w,
      height: PILLOW_HEIGHT,
      depth: d,
      colorHex,
      design: this.currentRun.pillowDesign,
      maxAnisotropy: this.maxAnisotropy,
    });
    setGroupShadowCasting(chunkGroup, false);
    chunkGroup.position.set(x, y, z);
    this.debrisGroup.add(chunkGroup);

    this.fallingPieces.push({
      group: chunkGroup,
      vx: axis === 'x' ? sign * 1.25 : (Math.random() - 0.5) * 0.35,
      vy: 0.75,
      vz: axis === 'z' ? sign * 1.25 : (Math.random() - 0.5) * 0.35,
      rx: axis === 'z' ? sign * 1.8 : (Math.random() - 0.5) * 0.8,
      rz: axis === 'x' ? -sign * 1.8 : (Math.random() - 0.5) * 0.8,
      life: 0,
    });
  }

  private resolveLanding(): void {
    if (!this.activePillow || !this.currentRun || this.stack.length === 0) return;

    const moving = this.activePillow;
    const prev = this.stack[this.stack.length - 1];
    const targetY = prev.y + STACK_STEP_Y;

    const dx = moving.x - prev.x;
    const dz = moving.z - prev.z;
    const activeDelta = moving.axis === 'x' ? Math.abs(dx) : Math.abs(dz);
    const tolerance =
      this.currentRun.mode === 'relax' ? RELAX_PERFECT_TOLERANCE : PERFECT_TOLERANCE;

    const minX = Math.max(moving.x - moving.width / 2, prev.x - prev.width / 2);
    const maxX = Math.min(moving.x + moving.width / 2, prev.x + prev.width / 2);
    const overlapW = maxX - minX;

    const minZ = Math.max(moving.z - moving.depth / 2, prev.z - prev.depth / 2);
    const maxZ = Math.min(moving.z + moving.depth / 2, prev.z + prev.depth / 2);
    const overlapD = maxZ - minZ;

    // Complete miss
    if (overlapW <= MIN_SURVIVAL_SIZE || overlapD <= MIN_SURVIVAL_SIZE) {
      if (this.currentRun.mode === 'relax') {
        moving.state = 'bouncing';
        moving.dropVel = 5.0;
        soundEngine.playDropSwoosh();
        this.emitFloating('SOFT BOUNCE!', 'normal', 'Try again gently');
        return;
      }

      this.guideMesh.visible = false;
      this.bonusCoinActive = false;
      this.bonusCoin.group.visible = false;
      const sign = moving.axis === 'x' ? Math.sign(dx || 1) : Math.sign(dz || 1);
      setGroupShadowCasting(moving.group, false);
      this.towerGroup.remove(moving.group);
      this.debrisGroup.add(moving.group);
      this.fallingPieces.push({
        group: moving.group,
        vx: moving.axis === 'x' ? sign * 1.8 : 0,
        vy: -1.0,
        vz: moving.axis === 'z' ? sign * 1.8 : 0,
        rx: moving.axis === 'z' ? sign * 2.2 : 0.3,
        rz: moving.axis === 'x' ? -sign * 2.2 : 0.3,
        life: 0,
      });
      this.activePillow = null;
      this.phase = 'ended';
      for (const item of this.stack) {
        item.group.visible = true;
      }
      soundEngine.playGameOver();
      this.callbacks.onGameOver({ ...this.stats });
      return;
    }

    this.stats.pillowsUsed += 1;
    const isPerfect = activeDelta <= tolerance;

    let landedX = (minX + maxX) * 0.5;
    let landedZ = (minZ + maxZ) * 0.5;
    let landedW = overlapW;
    let landedD = overlapD;

    const tiltImpulseX = THREE.MathUtils.clamp(dz * 0.55, -0.35, 0.35);
    const tiltImpulseZ = THREE.MathUtils.clamp(-dx * 0.55, -0.35, 0.35);

    // Zero-allocation reuse of moving.group in place!
    const landedGroup = moving.group;

    if (isPerfect) {
      landedX = prev.x;
      landedZ = prev.z;
      landedW = prev.width;
      landedD = prev.depth;

      this.stats.perfectStreak += 1;
      if (this.stats.perfectStreak > this.stats.bestStreakInRun) {
        this.stats.bestStreakInRun = this.stats.perfectStreak;
      }

      if (this.stats.perfectStreak >= 10) {
        this.stats.comboMultiplier = 3;
      } else if (this.stats.perfectStreak >= 5) {
        this.stats.comboMultiplier = 2;
      } else {
        this.stats.comboMultiplier = 1;
      }

      if (this.stats.perfectStreak >= 5) {
        landedW = Math.min(BASE_WIDTH, landedW + 0.14);
        landedD = Math.min(BASE_DEPTH, landedD + 0.14);
      }

      const gained = (1 + 3) * this.stats.comboMultiplier;
      this.stats.score += gained;
      this.stats.coinsEarnedInRun += this.stats.comboMultiplier;

      if (this.stats.perfectStreak === 20) {
        this.stats.coinsEarnedInRun += 25;
        this.emitFloating('INCREDIBLE!', 'reward', '20x STREAK · +25 COINS');
        soundEngine.playCoin();
        this.vibrate([20, 35, 25, 35, 30, 40, 36]);
      } else if (this.stats.perfectStreak === 10) {
        this.stats.coinsEarnedInRun += 8;
        this.emitFloating('SUPER SOFT!', 'combo', 'COMBO x3');
        this.vibrate([18, 35, 24, 35, 28]);
      } else if (
        this.stats.perfectStreak === 5 ||
        (this.stats.perfectStreak > 5 && this.stats.perfectStreak % 5 === 0)
      ) {
        if (this.stats.perfectStreak === 5) {
          this.stats.coinsEarnedInRun += 4;
          this.emitFloating('AMAZING!', 'combo', 'COMBO x2');
        } else {
          this.emitFloating('STREAK!', 'combo', `${this.stats.perfectStreak}x PERFECT`);
        }
        this.vibrate([16, 40, 22]);
      } else {
        const words = ['PERFECT!', 'BEAUTIFUL!', 'SOFT LANDING!'];
        const word = words[this.stats.perfectStreak % words.length];
        this.emitFloating(word, 'perfect', `+${gained}`);
        this.vibrate(18);
      }

      resizePillowGroup(landedGroup, landedW, PILLOW_HEIGHT, landedD);
      landedGroup.position.set(landedX, targetY, landedZ);
      landedGroup.scale.set(1, 1, 1);

      this.stack.push({
        group: landedGroup,
        x: landedX,
        y: targetY,
        z: landedZ,
        width: landedW,
        depth: landedD,
        colorHex: moving.colorHex,
        scaleY: 0.64,
        velY: 2.8,
        tiltX: 0,
        tiltVelX: tiltImpulseX * 0.35,
        tiltZ: 0,
        tiltVelZ: tiltImpulseZ * 0.35,
      });

      (this.glowRingMesh.material as THREE.MeshBasicMaterial).color.setHex(
        this.stats.perfectStreak >= 5 ? 0xffd43b : 0xffffff,
      );
      this.triggerGlowRing(landedX, prev.y + PILLOW_HEIGHT * 0.44, landedZ, landedW, landedD);
      this.spawnParticles(landedX, targetY, landedZ, '#FFF5FB', 10);
    } else {
      this.stats.perfectStreak = 0;
      this.stats.comboMultiplier = 1;
      this.stats.score += 1;
      if (this.stats.pillowsUsed % 3 === 0) {
        this.stats.coinsEarnedInRun += 1;
      }

      if (moving.axis === 'x') {
        const excessW = moving.width - overlapW;
        if (excessW > 0.05) {
          const sign = dx >= 0 ? 1 : -1;
          const excessX = landedX + sign * (overlapW * 0.5 + excessW * 0.5);
          this.spawnFallingChunk(
            excessX,
            targetY,
            moving.z,
            excessW,
            moving.depth,
            moving.colorHex,
            'x',
            sign,
          );
        }
      } else {
        const excessD = moving.depth - overlapD;
        if (excessD > 0.05) {
          const sign = dz >= 0 ? 1 : -1;
          const excessZ = landedZ + sign * (overlapD * 0.5 + excessD * 0.5);
          this.spawnFallingChunk(
            moving.x,
            targetY,
            excessZ,
            moving.width,
            excessD,
            moving.colorHex,
            'z',
            sign,
          );
        }
      }

      resizePillowGroup(landedGroup, landedW, PILLOW_HEIGHT, landedD);
      landedGroup.position.set(landedX, targetY, landedZ);
      landedGroup.scale.set(1, 1, 1);

      this.stack.push({
        group: landedGroup,
        x: landedX,
        y: targetY,
        z: landedZ,
        width: landedW,
        depth: landedD,
        colorHex: moving.colorHex,
        scaleY: 0.70,
        velY: 2.3,
        tiltX: 0,
        tiltVelX: tiltImpulseX,
        tiltZ: 0,
        tiltVelZ: tiltImpulseZ,
      });

      this.spawnParticles(landedX, targetY, landedZ, moving.colorHex, 7);
      this.vibrate(12);
      if (Math.min(landedW, landedD) <= 0.58) {
        this.emitFloating('CLOSE CALL!', 'normal', 'Keep balancing!');
      }
    }

    // Collect floating golden bonus coin if landed cleanly within sweet spot
    let collectedBonusCoin = false;
    if (this.bonusCoinActive) {
      const distToCoin = Math.hypot(landedX - this.bonusCoinX, landedZ - this.bonusCoinZ);
      this.bonusCoinActive = false;
      this.bonusCoin.group.visible = false;
      if (distToCoin <= 0.78) {
        collectedBonusCoin = true;
        this.stats.coinsEarnedInRun += 5;
        this.spawnParticles(landedX, targetY + 0.35, landedZ, '#FFD43B', 10);
        soundEngine.playCoin();
        this.vibrate([14, 30, 22]);
        this.emitFloating('BONUS STAR!', 'reward', '+5 COINS');
      }
    }

    this.activePillow = null;
    this.stats.height = this.stack.length - 1;

    // Sky Altitude Landmarks for extra progression motivation
    const h = this.stats.height;
    let landmark: { title: string; coins: number } | null = null;
    if (h === 5) landmark = { title: 'BRIDGE LANTERNS', coins: 5 };
    else if (h === 10) landmark = { title: 'CITY ROOFTOPS', coins: 10 };
    else if (h === 15) landmark = { title: 'FERRIS SKYLINE', coins: 15 };
    else if (h === 25) landmark = { title: 'BALLOON CLOUDS', coins: 25 };
    else if (h >= 40 && (h - 40) % 15 === 0) landmark = { title: 'SKY MASTER', coins: 30 };

    if (landmark) {
      this.stats.coinsEarnedInRun += landmark.coins;
      this.spawnParticles(landedX, targetY + 0.4, landedZ, '#FFE066', 12);
      if (!collectedBonusCoin) {
        soundEngine.playCoin();
        this.emitFloating(landmark.title, 'reward', `+${landmark.coins} COINS`);
      }
    }

    // Disable shadow casting on buried pillows and cull very low off-screen pillows
    // so GPU cost stays constant at any tower height (even 200+ pillows!)
    const buriedIdx = this.stack.length - 9;
    if (buriedIdx >= 0) {
      setGroupShadowCasting(this.stack[buriedIdx].group, false);
    }
    const cullIdx = this.stack.length - 26;
    if (cullIdx >= 0) {
      this.stack[cullIdx].group.visible = false;
    }

    // Gentle cascading cushion compression ripple down top 5 pillows
    for (let i = 1; i <= 5; i++) {
      const idx = this.stack.length - 1 - i;
      if (idx >= 0) {
        this.stack[idx].scaleY = Math.min(this.stack[idx].scaleY, 1 - 0.14 / i);
        this.stack[idx].velY = 1.4 / i;
        this.stack[idx].tiltVelX += tiltImpulseX * (0.25 / i);
        this.stack[idx].tiltVelZ += tiltImpulseZ * (0.25 / i);
      }
    }

    soundEngine.playPillowLand(this.stats.perfectStreak, isPerfect);
    this.callbacks.onStatsChange({ ...this.stats });

    if (
      this.currentRun.targetHeight !== null &&
      this.stats.height >= this.currentRun.targetHeight
    ) {
      this.guideMesh.visible = false;
      this.phase = 'ended';
      for (const item of this.stack) {
        item.group.visible = true;
      }
      this.stats.coinsEarnedInRun += this.currentRun.levelRewardCoins ?? 25;
      this.spawnParticles(landedX, targetY + 0.6, landedZ, '#FFF5FB', 16);
      soundEngine.playLevelComplete();
      this.callbacks.onStatsChange({ ...this.stats });
      this.callbacks.onLevelComplete({ ...this.stats });
      return;
    }

    if (
      this.currentRun.maxPillows !== null &&
      this.stats.pillowsUsed >= this.currentRun.maxPillows
    ) {
      this.guideMesh.visible = false;
      this.phase = 'ended';
      for (const item of this.stack) {
        item.group.visible = true;
      }
      soundEngine.playGameOver();
      this.callbacks.onGameOver({ ...this.stats });
      return;
    }

    this.spawnNextMovingPillow();
  }

  private tick = () => {
    if (this.disposed) return;

    const dt = Math.min(0.05, this.clock.getDelta());
    this.elapsed += dt;

    let activeOffsetX = 0;

    if (this.phase === 'playing' && this.activePillow && this.stack.length > 0) {
      const m = this.activePillow;
      const top = this.stack[this.stack.length - 1];
      const targetY = top.y + STACK_STEP_Y;

      if (m.state === 'gliding') {
        m.swingPhase += dt * m.angularSpeed;
        const pos = Math.sin(m.swingPhase) * SWING_LIMIT;
        if (m.axis === 'x') {
          m.x = pos;
          activeOffsetX = pos;
        } else {
          m.z = pos;
          activeOffsetX = pos * 0.5;
        }
        const bob = Math.sin(this.elapsed * 2.8) * 0.04;
        m.group.position.set(m.x, m.y + bob, m.z);
        m.group.scale.set(1, 1, 1);
      } else if (m.state === 'dropping') {
        m.dropVel += 38 * dt;
        m.y -= m.dropVel * dt;
        const stretchY = 1 + Math.min(0.14, m.dropVel * 0.008);
        const narrowXZ = 1 / Math.sqrt(stretchY);
        m.group.scale.set(narrowXZ, stretchY, narrowXZ);
        m.group.position.set(m.x, m.y, m.z);

        if (m.y <= targetY) {
          m.y = targetY;
          this.resolveLanding();
        }
      } else if (m.state === 'bouncing') {
        const hoverY = top.y + PILLOW_HEIGHT * 1.65;
        m.y += m.dropVel * dt;
        if (m.y >= hoverY) {
          m.y = hoverY;
          m.state = 'gliding';
        }
        m.group.scale.set(1, 1, 1);
        m.group.position.set(m.x, m.y, m.z);
      }
    }

    // Only simulate springs for visible top ~24 pillows
    const squashStiffness = 140;
    const squashDamping = 10.5;
    const tiltStiffness = 95;
    const tiltDamping = 7.5;

    const startIdx = Math.max(0, this.stack.length - 26);
    for (let i = startIdx; i < this.stack.length; i++) {
      const item = this.stack[i];

      if (Math.abs(item.scaleY - 1) > 0.0008 || Math.abs(item.velY) > 0.0008) {
        const force = -squashStiffness * (item.scaleY - 1);
        const dampForce = -squashDamping * item.velY;
        item.velY += (force + dampForce) * dt;
        item.scaleY += item.velY * dt;
        const clampedY = Math.max(0.55, Math.min(1.24, item.scaleY));
        const bulgeXZ = 1 / Math.sqrt(clampedY);
        item.group.scale.set(bulgeXZ, clampedY, bulgeXZ);
      } else if (this.phase === 'menu') {
        const breathe = 1 + Math.sin(this.elapsed * 1.5 + i * 0.45) * 0.018;
        item.group.scale.set(1 / Math.sqrt(breathe), breathe, 1 / Math.sqrt(breathe));
      }

      if (
        Math.abs(item.tiltX) > 0.0005 ||
        Math.abs(item.tiltVelX) > 0.0005 ||
        Math.abs(item.tiltZ) > 0.0005 ||
        Math.abs(item.tiltVelZ) > 0.0005
      ) {
        item.tiltVelX += (-tiltStiffness * item.tiltX - tiltDamping * item.tiltVelX) * dt;
        item.tiltX += item.tiltVelX * dt;
        item.tiltVelZ += (-tiltStiffness * item.tiltZ - tiltDamping * item.tiltVelZ) * dt;
        item.tiltZ += item.tiltVelZ * dt;
        item.group.rotation.x = item.tiltX;
        item.group.rotation.z = item.tiltZ;
      }
    }

    if (this.bonusCoinActive && this.bonusCoin.group.visible) {
      this.bonusCoin.group.rotation.y = this.elapsed * 2.4;
      this.bonusCoin.group.position.y =
        this.bonusCoinY + Math.sin(this.elapsed * 3.2) * 0.08;
    }

    if (this.glowRingMesh.visible) {
      this.glowRingLife += dt * 1.9;
      if (this.glowRingLife >= 1) {
        this.glowRingMesh.visible = false;
      } else {
        const easeOut = 1 - Math.pow(1 - this.glowRingLife, 3);
        const baseItem = this.stack[this.stack.length - 1];
        const w = baseItem ? baseItem.width : BASE_WIDTH;
        const d = baseItem ? baseItem.depth : BASE_DEPTH;
        this.glowRingMesh.scale.set(w * (0.95 + easeOut * 0.65), 1, d * (0.95 + easeOut * 0.65));
        (this.glowRingMesh.material as THREE.MeshBasicMaterial).opacity = (1 - easeOut) * 0.6;
      }
    }

    for (let i = this.fallingPieces.length - 1; i >= 0; i--) {
      const p = this.fallingPieces[i];
      p.life += dt;
      p.vy -= 14 * dt;
      p.group.position.x += p.vx * dt;
      p.group.position.y += p.vy * dt;
      p.group.position.z += p.vz * dt;
      p.group.rotation.x += p.rx * dt;
      p.group.rotation.z += p.rz * dt;

      if (p.life > 2.4 || p.group.position.y < -15) {
        this.debrisGroup.remove(p.group);
        this.fallingPieces.splice(i, 1);
      }
    }

    for (const p of this.particles) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      p.vy -= 3.2 * dt;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      const t = 1 - p.life / p.maxLife;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = t * 0.8;
      p.mesh.scale.setScalar(0.45 + t * 0.65);
    }

    const topY = this.stack.length > 0 ? this.stack[this.stack.length - 1].y : 1.0;
    const parallaxShift = activeOffsetX * 0.08;

    if (this.phase === 'menu') {
      const orbitAngle = Math.sin(this.elapsed * 0.22) * 0.24 + 0.14;
      const dist = 8.8;
      _targetCamPos.set(Math.sin(orbitAngle) * dist, 3.05, Math.cos(orbitAngle) * dist);
      _targetLookAt.set(0, 1.55, 0);
    } else if (this.phase === 'ended') {
      const zoomOut = Math.min(7.5, this.stack.length * 0.24);
      _targetCamPos.set(4.8 + zoomOut * 0.35, Math.max(4.0, topY + 2.4), 8.6 + zoomOut * 0.55);
      _targetLookAt.set(0, Math.max(1.2, topY * 0.62), 0);
    } else {
      _targetCamPos.set(4.7 + parallaxShift, topY + 3.9, 8.2);
      _targetLookAt.set(parallaxShift * 0.35, topY + 0.2, 0);
    }

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _targetCamPos.x, 3.2, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _targetCamPos.y, 3.2, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _targetCamPos.z, 3.2, dt);

    _currentLookAt.x = THREE.MathUtils.damp(_currentLookAt.x, _targetLookAt.x, 3.8, dt);
    _currentLookAt.y = THREE.MathUtils.damp(_currentLookAt.y, _targetLookAt.y, 3.8, dt);
    _currentLookAt.z = THREE.MathUtils.damp(_currentLookAt.z, _targetLookAt.z, 3.8, dt);
    this.camera.lookAt(_currentLookAt);

    this.keyLight.position.set(6, topY + 13, 9);
    this.keyLight.target.position.set(0, topY, 0);
    this.keyLight.target.updateMatrixWorld();

    this.scenery.updateAnimation(this.elapsed, this.camera.position.y, this.camera.position.x);

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);

    this.clearTower();
    this.scenery.dispose();
    this.envTexture.dispose();
    this.guideMesh.geometry.dispose();
    (this.guideMesh.material as THREE.Material).dispose();
    this.glowRingMesh.geometry.dispose();
    (this.glowRingMesh.material as THREE.Material).dispose();
    this.bonusCoin.dispose();
    for (const p of this.particles) {
      (p.mesh.material as THREE.Material).dispose();
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

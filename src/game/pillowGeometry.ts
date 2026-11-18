import * as THREE from 'three';
import { EnvironmentTheme, PillowDesign } from './types';

// Cache procedural textures, shared geometries, and shared materials for 60-120 FPS mobile smoothness
let fabricBumpTexture: THREE.CanvasTexture | null = null;
let stoneTileTexture: THREE.CanvasTexture | null = null;
let softShadowTexture: THREE.CanvasTexture | null = null;
let unitPillowGeo: THREE.BufferGeometry | null = null;
let starEmblemGeo: THREE.BufferGeometry | null = null;
let heartEmblemGeo: THREE.BufferGeometry | null = null;
let puffSphereGeo: THREE.BufferGeometry | null = null;

const pillowMaterialCache = new Map<string, THREE.MeshPhysicalMaterial>();
const accentMaterialCache = new Map<string, THREE.MeshStandardMaterial>();

export function getSoftShadowTexture(): THREE.CanvasTexture {
  if (softShadowTexture) return softShadowTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.08,
    size * 0.5,
    size * 0.5,
    size * 0.48,
  );
  grad.addColorStop(0, 'rgba(130, 82, 130, 0.34)');
  grad.addColorStop(0.55, 'rgba(160, 110, 160, 0.14)');
  grad.addColorStop(1, 'rgba(180, 140, 180, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  softShadowTexture = tex;
  return tex;
}

export function getFabricBumpTexture(maxAnisotropy: number): THREE.CanvasTexture {
  if (fabricBumpTexture) return fabricBumpTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 4) {
    for (let x = 0; x < size; x += 4) {
      const alt = ((x + y) / 4) % 2 === 0;
      ctx.fillStyle = alt ? '#888888' : '#787878';
      ctx.fillRect(x, y, 3, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = maxAnisotropy;
  fabricBumpTexture = tex;
  return tex;
}

export function getStoneTileTexture(maxAnisotropy: number): THREE.CanvasTexture {
  if (stoneTileTexture) return stoneTileTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F2E7D3';
  ctx.fillRect(0, 0, size, size);

  const rows = 4;
  const cols = 4;
  const tileW = size / cols;
  const tileH = size / rows;

  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : tileW * 0.5;
    for (let c = -1; c <= cols; c++) {
      const tx = c * tileW + offset;
      const ty = r * tileH;
      const shade = 235 + ((r * 7 + c * 13) % 16);
      ctx.fillStyle = `rgb(${shade}, ${shade - 11}, ${shade - 30})`;
      ctx.fillRect(tx + 2, ty + 2, tileW - 4, tileH - 4);
      ctx.strokeStyle = 'rgba(165, 138, 102, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx + 1, ty + 1, tileW - 2, tileH - 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 10);
  tex.anisotropy = maxAnisotropy;
  stoneTileTexture = tex;
  return tex;
}

/**
 * Generates an ultra-smooth, plump, rounded marshmallow-pebble cushion geometry
 * optimized at 28x16 segments (~896 triangles) for locked 60-120 FPS on mobile.
 */
export function getUnitPillowGeometry(): THREE.BufferGeometry {
  if (unitPillowGeo) return unitPillowGeo;

  const geo = new THREE.SphereGeometry(0.5, 28, 16);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    const nx = v.x * 2;
    const ny = v.y * 2;
    const nz = v.z * 2;

    // Gentle squircle blend in XZ so cushions look plumply rounded yet align cleanly
    const sqBoost = 1 + 0.14 * (nx * nx) * (nz * nz);
    const fx = v.x * sqBoost;
    const fz = v.z * sqBoost;

    // Smooth vertical cushion profile: plump rounded sides + softly flattened stack contact faces
    const ySign = ny >= 0 ? 1 : -1;
    const absY = Math.abs(ny);
    const smoothFlatY = ySign * 0.5 * (1 - Math.pow(1 - absY, 1.72));

    pos.setXYZ(i, fx, smoothFlatY, fz);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  unitPillowGeo = geo;
  return geo;
}

function getStarEmblemGeometry(): THREE.BufferGeometry {
  if (starEmblemGeo) return starEmblemGeo;
  const shape = new THREE.Shape();
  const outer = 0.2;
  const inner = 0.09;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  starEmblemGeo = geo;
  return geo;
}

function getHeartEmblemGeometry(): THREE.BufferGeometry {
  if (heartEmblemGeo) return heartEmblemGeo;
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.13);
  shape.bezierCurveTo(0.05, -0.17, 0.19, -0.05, 0.17, 0.06);
  shape.bezierCurveTo(0.15, 0.16, 0.03, 0.18, 0, 0.08);
  shape.bezierCurveTo(-0.03, 0.18, -0.15, 0.16, -0.17, 0.06);
  shape.bezierCurveTo(-0.19, -0.05, -0.05, -0.17, 0, -0.13);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  heartEmblemGeo = geo;
  return geo;
}

export function getPuffSphereGeometry(): THREE.BufferGeometry {
  if (puffSphereGeo) return puffSphereGeo;
  puffSphereGeo = new THREE.SphereGeometry(0.11, 8, 6);
  return puffSphereGeo;
}

function getCachedPillowMaterial(
  colorHex: string,
  isQuilted: boolean,
  maxAnisotropy: number,
): THREE.MeshPhysicalMaterial {
  const key = `${colorHex}_${isQuilted ? 'q' : 's'}`;
  const cached = pillowMaterialCache.get(key);
  if (cached) return cached;

  // Lightweight physical material: clearcoat + baked softbox envMap gives creamy glossy
  // highlights without expensive per-fragment iridescence, sheen, or RectAreaLight passes!
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    bumpMap: isQuilted ? getFabricBumpTexture(maxAnisotropy) : null,
    bumpScale: isQuilted ? 0.008 : 0,
    roughness: isQuilted ? 0.28 : 0.16,
    metalness: 0.02,
    clearcoat: isQuilted ? 0.5 : 0.85,
    clearcoatRoughness: isQuilted ? 0.24 : 0.14,
    envMapIntensity: 1.35,
  });
  pillowMaterialCache.set(key, mat);
  return mat;
}

function getCachedAccentMaterial(colorHex: string): THREE.MeshStandardMaterial {
  const cached = accentMaterialCache.get(colorHex);
  if (cached) return cached;
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.25,
    metalness: 0.1,
  });
  accentMaterialCache.set(colorHex, mat);
  return mat;
}

export interface CreatePillowMeshOptions {
  width: number;
  height: number;
  depth: number;
  colorHex: string;
  design: PillowDesign;
  maxAnisotropy: number;
  isBase?: boolean;
}

/**
 * Builds an ultra-smooth pearlescent/satin 3D pillow reusing cached geometries and
 * cached materials for zero shader compilation hitches during gameplay.
 */
export function createPillowGroup(opts: CreatePillowMeshOptions): THREE.Group {
  const { width, height, depth, colorHex, design, maxAnisotropy } = opts;
  const group = new THREE.Group();

  const isQuilted = design.shapeStyle === 'quilted';
  const bodyMat = getCachedPillowMaterial(colorHex, isQuilted, maxAnisotropy);

  const body = new THREE.Mesh(getUnitPillowGeometry(), bodyMat);
  body.name = 'pillow-body';
  body.scale.set(width, height, depth);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Delicate star/heart crest on specialty unlocked designs
  const minDim = Math.min(width, depth);
  if (minDim > 0.85 && (design.shapeStyle === 'star' || design.shapeStyle === 'heart')) {
    const accentMat = getCachedAccentMaterial(design.accentColor);
    const crestGeo =
      design.shapeStyle === 'star' ? getStarEmblemGeometry() : getHeartEmblemGeometry();
    const crest = new THREE.Mesh(crestGeo, accentMat);
    crest.name = 'pillow-crest';
    crest.position.y = height * 0.48;
    crest.scale.setScalar(Math.min(1.05, minDim * 0.36));
    crest.castShadow = false;
    group.add(crest);
  }

  return group;
}

/**
 * Resizes an existing pillow group in-place without allocating new meshes or materials.
 */
export function resizePillowGroup(
  group: THREE.Group,
  width: number,
  height: number,
  depth: number,
): void {
  const body = group.getObjectByName('pillow-body');
  if (body) {
    body.scale.set(width, height, depth);
  }
  const crest = group.getObjectByName('pillow-crest');
  if (crest) {
    const minDim = Math.min(width, depth);
    if (minDim <= 0.75) {
      crest.visible = false;
    } else {
      crest.visible = true;
      crest.scale.setScalar(Math.min(1.05, minDim * 0.36));
    }
  }
}

/**
 * Reusable floating golden bonus star-coin pickup placed above target cushions
 * to reward accurate landings with extra coins and sparkle bursts.
 */
export function createBonusCoinGroup(): { group: THREE.Group; dispose: () => void } {
  const group = new THREE.Group();

  const coinGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.1, 20);
  coinGeo.rotateX(Math.PI / 2);
  const coinMat = new THREE.MeshStandardMaterial({
    color: 0xffd43b,
    emissive: 0xffa900,
    emissiveIntensity: 0.32,
    roughness: 0.22,
    metalness: 0.65,
  });
  const coinMesh = new THREE.Mesh(coinGeo, coinMat);
  group.add(coinMesh);

  const rimGeo = new THREE.TorusGeometry(0.24, 0.035, 8, 20);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xfff3bf,
    emissive: 0xffd43b,
    emissiveIntensity: 0.28,
    roughness: 0.2,
    metalness: 0.4,
  });
  const rimFront = new THREE.Mesh(rimGeo, rimMat);
  rimFront.position.z = 0.04;
  group.add(rimFront);

  const rimBack = new THREE.Mesh(rimGeo, rimMat);
  rimBack.position.z = -0.04;
  group.add(rimBack);

  const haloGeo = new THREE.RingGeometry(0.38, 0.48, 24);
  haloGeo.rotateX(-Math.PI / 2);
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xffd43b,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.y = -0.42;
  group.add(halo);

  return {
    group,
    dispose: () => {
      coinGeo.dispose();
      coinMat.dispose();
      rimGeo.dispose();
      rimMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
    },
  };
}

export interface WorldSceneryRefs {
  root: THREE.Group;
  updateTheme: (theme: EnvironmentTheme) => void;
  updateAnimation: (elapsed: number, cameraY: number, parallaxX: number) => void;
  dispose: () => void;
}

export function createWorldScenery(
  initialTheme: EnvironmentTheme,
  maxAnisotropy: number,
): WorldSceneryRefs {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];

  // 1. Smooth Vertical Sky Gradient Backdrop Sphere
  const skyGeo = new THREE.SphereGeometry(95, 16, 12);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTopColor: { value: new THREE.Color(initialTheme.skyTop) },
      uBottomColor: { value: new THREE.Color(initialTheme.skyBottom) },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      varying vec3 vWorldPos;
      void main() {
        float h = clamp((vWorldPos.y + 12.0) / 55.0, 0.0, 1.0);
        vec3 col = mix(uBottomColor, uTopColor, smoothstep(0.0, 1.0, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  root.add(skyDome);
  disposables.push(skyGeo, skyMat);

  // 2. Studio Cyclorama Floor & Soft Contact Shadow Group
  const studioGroup = new THREE.Group();
  const studioFloorGeo = new THREE.CircleGeometry(70, 32);
  studioFloorGeo.rotateX(-Math.PI / 2);
  const studioFloorMat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(initialTheme.skyBottom),
  });
  const studioFloor = new THREE.Mesh(studioFloorGeo, studioFloorMat);
  studioFloor.position.y = -0.02;
  studioFloor.receiveShadow = true;
  studioGroup.add(studioFloor);

  const contactGeo = new THREE.PlaneGeometry(5.6, 5.6);
  contactGeo.rotateX(-Math.PI / 2);
  const contactMat = new THREE.MeshBasicMaterial({
    map: getSoftShadowTexture(),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const contactShadow = new THREE.Mesh(contactGeo, contactMat);
  contactShadow.position.y = 0.005;
  studioGroup.add(contactShadow);
  root.add(studioGroup);
  disposables.push(studioFloorGeo, studioFloorMat, contactGeo, contactMat);

  // 3. Courtyard Bridge & Water Group
  const courtyardGroup = new THREE.Group();
  const waterGeo = new THREE.PlaneGeometry(180, 180, 1, 1);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialTheme.waterColor),
    roughness: 0.22,
    metalness: 0.14,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = -2.2;
  waterMesh.receiveShadow = true;
  courtyardGroup.add(waterMesh);

  const stoneTex = getStoneTileTexture(maxAnisotropy);
  const bridgeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialTheme.bridgeColor),
    map: stoneTex,
    roughness: 0.78,
    metalness: 0.04,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialTheme.bridgeTrimColor),
    roughness: 0.72,
    metalness: 0.05,
  });

  const deckGeo = new THREE.BoxGeometry(7.2, 2.2, 42);
  const deck = new THREE.Mesh(deckGeo, bridgeMat);
  deck.position.set(0, -1.35, -14);
  deck.receiveShadow = true;
  courtyardGroup.add(deck);

  const plinthGeo = new THREE.BoxGeometry(3.8, 0.34, 3.8);
  const plinth = new THREE.Mesh(plinthGeo, trimMat);
  plinth.position.set(0, -0.19, 0);
  plinth.receiveShadow = true;
  courtyardGroup.add(plinth);

  const wallGeo = new THREE.BoxGeometry(0.6, 0.75, 42);
  const leftWall = new THREE.Mesh(wallGeo, trimMat);
  leftWall.position.set(-3.7, -0.05, -14);
  courtyardGroup.add(leftWall);

  const rightWall = new THREE.Mesh(wallGeo, trimMat);
  rightWall.position.set(3.7, -0.05, -14);
  courtyardGroup.add(rightWall);

  const merlonGeo = new THREE.BoxGeometry(0.7, 0.4, 1.1);
  const merlons = new THREE.InstancedMesh(merlonGeo, bridgeMat, 24);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 12; i++) {
    const zPos = 4 - i * 2.8;
    dummy.position.set(-3.7, 0.52, zPos);
    dummy.updateMatrix();
    merlons.setMatrixAt(i * 2, dummy.matrix);
    dummy.position.set(3.7, 0.52, zPos);
    dummy.updateMatrix();
    merlons.setMatrixAt(i * 2 + 1, dummy.matrix);
  }
  merlons.instanceMatrix.needsUpdate = true;
  merlons.computeBoundingSphere();
  courtyardGroup.add(merlons);

  const pillarGeo = new THREE.BoxGeometry(1.6, 12, 1.6);
  const leftPillar = new THREE.Mesh(pillarGeo, bridgeMat);
  leftPillar.position.set(-4.3, 4.5, -13);
  courtyardGroup.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, bridgeMat);
  rightPillar.position.set(4.3, 4.5, -13);
  courtyardGroup.add(rightPillar);

  root.add(courtyardGroup);
  disposables.push(
    waterGeo,
    waterMat,
    deckGeo,
    plinthGeo,
    wallGeo,
    merlonGeo,
    pillarGeo,
    bridgeMat,
    trimMat,
  );

  // 4. Pastel Bridge City Group (Waterfront Promenade, Grand Arch Bridge, Skyline, Ferris Wheel, Boats & Balloons)
  const cityGroup = new THREE.Group();

  // Canal water & sunlit shimmer strips
  const cityWater = new THREE.Mesh(waterGeo, waterMat);
  cityWater.position.y = -2.2;
  cityWater.receiveShadow = true;
  cityGroup.add(cityWater);

  // Quay waterfront embankments (left, right, and far promenade framing the canal)
  const quayDeckMat = new THREE.MeshLambertMaterial({ color: 0xfff6ec });
  const quayTrimMat = new THREE.MeshLambertMaterial({ color: 0xf6c9e0 });
  const quayBankLeftGeo = new THREE.BoxGeometry(30, 1.6, 56);
  const quayLeft = new THREE.Mesh(quayBankLeftGeo, quayDeckMat);
  quayLeft.position.set(-26, -1.65, -14);
  cityGroup.add(quayLeft);

  const quayRight = new THREE.Mesh(quayBankLeftGeo, quayDeckMat);
  quayRight.position.set(26, -1.65, -14);
  cityGroup.add(quayRight);

  const quayFarGeo = new THREE.BoxGeometry(84, 1.8, 34);
  const quayFar = new THREE.Mesh(quayFarGeo, quayDeckMat);
  quayFar.position.set(0, -1.55, -31);
  cityGroup.add(quayFar);

  const quayEdgeGeo = new THREE.BoxGeometry(24, 0.25, 0.7);
  const quayEdgeFar = new THREE.Mesh(quayEdgeGeo, quayTrimMat);
  quayEdgeFar.position.set(0, -0.58, -14.2);
  cityGroup.add(quayEdgeFar);

  // Grand Pastel Arch Bridge spanning X across the canal (centered under tower)
  const cityBridgeMat = new THREE.MeshStandardMaterial({
    color: 0xfff8f0,
    roughness: 0.65,
    metalness: 0.03,
  });
  const cityBridgeAccentMat = new THREE.MeshStandardMaterial({
    color: 0xf7b9d7,
    roughness: 0.55,
    metalness: 0.05,
  });

  const mainBridgeDeckGeo = new THREE.BoxGeometry(25, 0.55, 5.2);
  const mainBridgeDeck = new THREE.Mesh(mainBridgeDeckGeo, cityBridgeMat);
  mainBridgeDeck.position.set(0, -0.35, 0);
  mainBridgeDeck.receiveShadow = true;
  cityGroup.add(mainBridgeDeck);

  // Central Bridge Pavilion / Plaza directly under the pillow tower
  const plazaGeo = new THREE.CylinderGeometry(2.75, 2.95, 0.22, 28);
  const plaza = new THREE.Mesh(plazaGeo, cityBridgeMat);
  plaza.position.set(0, -0.09, 0);
  plaza.receiveShadow = true;
  cityGroup.add(plaza);

  const plazaRingGeo = new THREE.TorusGeometry(2.82, 0.08, 8, 32);
  plazaRingGeo.rotateX(Math.PI / 2);
  const plazaRing = new THREE.Mesh(plazaRingGeo, cityBridgeAccentMat);
  plazaRing.position.set(0, 0.02, 0);
  cityGroup.add(plazaRing);

  const cityContactShadow = new THREE.Mesh(contactGeo, contactMat);
  cityContactShadow.position.y = 0.025;
  cityGroup.add(cityContactShadow);

  // Bridge stone piers & twin curved arch ribs over canal water
  const pierGeo = new THREE.BoxGeometry(1.45, 2.6, 5.4);
  const pierXs = [-11.2, -3.55, 3.55, 11.2];
  for (const px of pierXs) {
    const pier = new THREE.Mesh(pierGeo, cityBridgeMat);
    pier.position.set(px, -1.75, 0);
    cityGroup.add(pier);
  }

  const archRibGeo = new THREE.TorusGeometry(3.15, 0.34, 8, 22, Math.PI);
  for (const archX of [-7.35, 7.35]) {
    const archFront = new THREE.Mesh(archRibGeo, cityBridgeAccentMat);
    archFront.position.set(archX, -2.05, 2.38);
    cityGroup.add(archFront);

    const archBack = new THREE.Mesh(archRibGeo, cityBridgeAccentMat);
    archBack.position.set(archX, -2.05, -2.38);
    cityGroup.add(archBack);
  }

  // Bridge low railings & glowing golden street lanterns (InstancedMesh)
  const railGeo = new THREE.BoxGeometry(24.5, 0.28, 0.22);
  const backRail = new THREE.Mesh(railGeo, cityBridgeAccentMat);
  backRail.position.set(0, 0.05, -2.42);
  cityGroup.add(backRail);

  const frontRailLeftGeo = new THREE.BoxGeometry(8.5, 0.28, 0.22);
  const frontRailL = new THREE.Mesh(frontRailLeftGeo, cityBridgeAccentMat);
  frontRailL.position.set(-8.1, 0.05, 2.42);
  cityGroup.add(frontRailL);

  const frontRailR = new THREE.Mesh(frontRailLeftGeo, cityBridgeAccentMat);
  frontRailR.position.set(8.1, 0.05, 2.42);
  cityGroup.add(frontRailR);

  const lampXs = [-10.8, -7.4, -4.0, 4.0, 7.4, 10.8];
  const lampPostGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.35, 8);
  const lampPostMat = new THREE.MeshLambertMaterial({ color: 0x6b7280 });
  const lampPosts = new THREE.InstancedMesh(lampPostGeo, lampPostMat, lampXs.length * 2);

  const lampBulbGeo = new THREE.SphereGeometry(0.17, 10, 8);
  const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xffe484 });
  const lampBulbs = new THREE.InstancedMesh(lampBulbGeo, lampBulbMat, lampXs.length * 2);

  let lampIdx = 0;
  for (const lx of lampXs) {
    for (const lz of [-2.42, 2.42]) {
      dummy.position.set(lx, 0.65, lz);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      lampPosts.setMatrixAt(lampIdx, dummy.matrix);

      dummy.position.set(lx, 1.4, lz);
      dummy.updateMatrix();
      lampBulbs.setMatrixAt(lampIdx, dummy.matrix);
      lampIdx++;
    }
  }
  lampPosts.instanceMatrix.needsUpdate = true;
  lampPosts.computeBoundingSphere();
  lampBulbs.instanceMatrix.needsUpdate = true;
  lampBulbs.computeBoundingSphere();
  cityGroup.add(lampPosts, lampBulbs);

  // Pastel City Skyline (Instanced buildings + curved domes + warm windows)
  const buildingSpecs: Array<{
    x: number;
    z: number;
    w: number;
    h: number;
    d: number;
    color: number;
    roofColor: number;
  }> = [
    // Far waterfront skyline (behind canal)
    { x: -20.5, z: -21, w: 3.6, h: 6.4, d: 3.4, color: 0xffd1e8, roofColor: 0xf472b6 },
    { x: -16.2, z: -23, w: 3.2, h: 8.6, d: 3.2, color: 0xcbe8ff, roofColor: 0x60a5fa },
    { x: -11.5, z: -25, w: 3.4, h: 7.2, d: 3.4, color: 0xe5d9ff, roofColor: 0xa78bfa },
    { x: -7.2, z: -20, w: 3.1, h: 5.5, d: 3.0, color: 0xfff1c9, roofColor: 0xfbbf24 },
    { x: -3.1, z: -22.5, w: 3.4, h: 9.2, d: 3.4, color: 0xc9f7e4, roofColor: 0x34d399 },
    { x: 1.4, z: -20.5, w: 3.2, h: 6.6, d: 3.2, color: 0xffd1e8, roofColor: 0xfb7185 },
    { x: 5.6, z: -24, w: 3.8, h: 10.2, d: 3.6, color: 0xcbe8ff, roofColor: 0x38bdf8 },
    { x: 10.2, z: -21, w: 3.3, h: 6.8, d: 3.2, color: 0xffdcc8, roofColor: 0xfb923c },
    { x: 14.5, z: -23.5, w: 3.6, h: 8.4, d: 3.4, color: 0xe5d9ff, roofColor: 0xc084fc },
    { x: 19.0, z: -20.5, w: 3.5, h: 5.9, d: 3.4, color: 0xc9f7e4, roofColor: 0x2dd4bf },
    // Second depth layer skyline
    { x: -18, z: -30, w: 4.2, h: 11.4, d: 4.0, color: 0xe5d9ff, roofColor: 0xa78bfa },
    { x: -9.5, z: -31, w: 4.5, h: 12.6, d: 4.2, color: 0xffd1e8, roofColor: 0xf472b6 },
    { x: -1.0, z: -30, w: 4.4, h: 13.8, d: 4.0, color: 0xcbe8ff, roofColor: 0x60a5fa },
    { x: 8.0, z: -31, w: 4.4, h: 12.2, d: 4.2, color: 0xfff1c9, roofColor: 0xf59e0b },
    { x: 16.5, z: -29, w: 4.0, h: 10.8, d: 4.0, color: 0xffdcc8, roofColor: 0xf97316 },
    // Flanking left & right quay buildings
    { x: -14.8, z: -11, w: 3.4, h: 5.8, d: 3.4, color: 0xfff1c9, roofColor: 0xfbbf24 },
    { x: -16.8, z: -6.2, w: 3.6, h: 7.1, d: 3.4, color: 0xffd1e8, roofColor: 0xf472b6 },
    { x: -15.4, z: 4.8, w: 3.4, h: 5.2, d: 3.2, color: 0xcbe8ff, roofColor: 0x60a5fa },
    { x: 14.5, z: -11.5, w: 3.5, h: 6.2, d: 3.4, color: 0xc9f7e4, roofColor: 0x34d399 },
    { x: 16.5, z: -6.5, w: 3.6, h: 7.4, d: 3.5, color: 0xe5d9ff, roofColor: 0xa78bfa },
    { x: 14.8, z: 5.2, w: 3.4, h: 5.1, d: 3.2, color: 0xffdcc8, roofColor: 0xfb923c },
  ];

  const bldgGeo = new THREE.BoxGeometry(1, 1, 1);
  const bldgMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const bldgInst = new THREE.InstancedMesh(bldgGeo, bldgMat, buildingSpecs.length);

  const roofGeo = new THREE.SphereGeometry(0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const roofInst = new THREE.InstancedMesh(roofGeo, roofMat, buildingSpecs.length);

  // 3 glowing window bands per building
  const winGeo = new THREE.BoxGeometry(1, 0.24, 1);
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffeba1 });
  const winInst = new THREE.InstancedMesh(winGeo, winMat, buildingSpecs.length * 3);

  const tmpColor = new THREE.Color();
  let winIdx = 0;

  buildingSpecs.forEach((b, i) => {
    const baseGroundY = -0.8;
    dummy.position.set(b.x, baseGroundY + b.h * 0.5, b.z);
    dummy.scale.set(b.w, b.h, b.d);
    dummy.updateMatrix();
    bldgInst.setMatrixAt(i, dummy.matrix);
    bldgInst.setColorAt(i, tmpColor.setHex(b.color));

    dummy.position.set(b.x, baseGroundY + b.h - 0.05, b.z);
    dummy.scale.set(b.w * 0.88, Math.min(2.1, b.w * 0.65), b.d * 0.88);
    dummy.updateMatrix();
    roofInst.setMatrixAt(i, dummy.matrix);
    roofInst.setColorAt(i, tmpColor.setHex(b.roofColor));

    for (let wRow = 0; wRow < 3; wRow++) {
      const wy = baseGroundY + b.h * (0.34 + wRow * 0.24);
      dummy.position.set(b.x, wy, b.z + 0.05);
      dummy.scale.set(b.w * 0.72, 1, b.d * 1.03);
      dummy.updateMatrix();
      winInst.setMatrixAt(winIdx++, dummy.matrix);
    }
  });
  bldgInst.instanceMatrix.needsUpdate = true;
  if (bldgInst.instanceColor) bldgInst.instanceColor.needsUpdate = true;
  bldgInst.computeBoundingSphere();

  roofInst.instanceMatrix.needsUpdate = true;
  if (roofInst.instanceColor) roofInst.instanceColor.needsUpdate = true;
  roofInst.computeBoundingSphere();

  winInst.instanceMatrix.needsUpdate = true;
  winInst.computeBoundingSphere();
  cityGroup.add(bldgInst, roofInst, winInst);

  // Cute puffy pastel trees along the promenade (InstancedMesh)
  const treeCoords: Array<[number, number, number]> = [
    [-12.2, -16.2, 0x8ce99a],
    [-8.8, -15.8, 0xffb3d9],
    [-5.2, -16.0, 0x8ce99a],
    [-1.4, -15.8, 0xa5f3fc],
    [2.8, -16.0, 0xffb3d9],
    [6.6, -15.7, 0x8ce99a],
    [10.8, -16.1, 0xffb3d9],
    [13.4, -15.6, 0x8ce99a],
    [-12.6, -4.4, 0xffb3d9],
    [-12.4, 4.4, 0x8ce99a],
    [12.5, -4.4, 0x8ce99a],
    [12.4, 4.4, 0xffb3d9],
  ];
  const trunkGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.9, 6);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0xb08968 });
  const trunksInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCoords.length);

  const foliageGeo = new THREE.SphereGeometry(0.68, 10, 8);
  const foliageMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCoords.length);

  treeCoords.forEach(([tx, tz, col], idx) => {
    dummy.position.set(tx, -0.35, tz);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    trunksInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(tx, 0.42, tz);
    dummy.scale.set(1.05, 1.15, 1.05);
    dummy.updateMatrix();
    foliageInst.setMatrixAt(idx, dummy.matrix);
    foliageInst.setColorAt(idx, tmpColor.setHex(col));
  });
  trunksInst.instanceMatrix.needsUpdate = true;
  trunksInst.computeBoundingSphere();
  foliageInst.instanceMatrix.needsUpdate = true;
  if (foliageInst.instanceColor) foliageInst.instanceColor.needsUpdate = true;
  foliageInst.computeBoundingSphere();
  cityGroup.add(trunksInst, foliageInst);

  // Rotating Pastel Waterfront Ferris Wheel on left bank
  const ferrisBaseGroup = new THREE.Group();
  ferrisBaseGroup.position.set(-12.2, 4.5, -18.2);
  const ferrisRimGeo = new THREE.TorusGeometry(3.4, 0.14, 8, 36);
  const ferrisRimMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const ferrisWheelSpinGroup = new THREE.Group();
  ferrisWheelSpinGroup.add(new THREE.Mesh(ferrisRimGeo, ferrisRimMat));

  const spokeGeo = new THREE.CylinderGeometry(0.05, 0.05, 6.8, 6);
  for (let s = 0; s < 4; s++) {
    const spoke = new THREE.Mesh(spokeGeo, ferrisRimMat);
    spoke.rotation.z = (s * Math.PI) / 4;
    ferrisWheelSpinGroup.add(spoke);
  }

  const gondolaGeo = new THREE.SphereGeometry(0.32, 10, 8);
  const gondolaPalette = [0xf472b6, 0x60a5fa, 0xfbbf24, 0x34d399, 0xa78bfa];
  const gondolaMats = gondolaPalette.map(
    (c) => new THREE.MeshLambertMaterial({ color: c }),
  );
  for (let g = 0; g < 10; g++) {
    const angle = (g / 10) * Math.PI * 2;
    const pod = new THREE.Mesh(gondolaGeo, gondolaMats[g % gondolaMats.length]);
    pod.position.set(Math.cos(angle) * 3.4, Math.sin(angle) * 3.4, 0);
    ferrisWheelSpinGroup.add(pod);
  }
  ferrisBaseGroup.add(ferrisWheelSpinGroup);

  const standLegGeo = new THREE.CylinderGeometry(0.11, 0.16, 5.9, 6);
  const standL = new THREE.Mesh(standLegGeo, ferrisRimMat);
  standL.position.set(-1.3, -2.7, 0);
  standL.rotation.z = -0.23;
  ferrisBaseGroup.add(standL);

  const standR = new THREE.Mesh(standLegGeo, ferrisRimMat);
  standR.position.set(1.3, -2.7, 0);
  standR.rotation.z = 0.23;
  ferrisBaseGroup.add(standR);
  cityGroup.add(ferrisBaseGroup);

  // Cute Pastel Canal Boats gliding under the bridge arches
  const boatHullGeo = new THREE.BoxGeometry(0.95, 0.38, 2.2);
  const boatCabinGeo = new THREE.BoxGeometry(0.7, 0.4, 1.0);
  const boatMat1 = new THREE.MeshLambertMaterial({ color: 0xffb3d9 });
  const boatMat2 = new THREE.MeshLambertMaterial({ color: 0x93c5fd });
  const boatCabinMat = new THREE.MeshLambertMaterial({ color: 0xfff8f0 });

  const canalBoats: Array<{ group: THREE.Group; dir: number; speed: number; baseZ: number }> = [];
  [
    { x: -7.2, z: -12, dir: 1, speed: 1.35, mat: boatMat1 },
    { x: 7.2, z: 6, dir: -1, speed: 1.15, mat: boatMat2 },
  ].forEach((spec) => {
    const bGroup = new THREE.Group();
    const hull = new THREE.Mesh(boatHullGeo, spec.mat);
    const cabin = new THREE.Mesh(boatCabinGeo, boatCabinMat);
    cabin.position.y = 0.34;
    bGroup.add(hull, cabin);
    bGroup.position.set(spec.x, -2.02, spec.z);
    cityGroup.add(bGroup);
    canalBoats.push({ group: bGroup, dir: spec.dir, speed: spec.speed, baseZ: spec.z });
  });

  // Floating Pastel Hot Air Balloons visible in sky as tower ascends
  const balloonEnvelopeGeo = new THREE.SphereGeometry(0.95, 14, 10);
  const balloonBasketGeo = new THREE.BoxGeometry(0.42, 0.34, 0.42);
  const basketMat = new THREE.MeshLambertMaterial({ color: 0xd4a373 });
  const balloonColors = [0xff8fab, 0x74c0fc, 0xb197fc, 0xffd43b];
  const balloonMats = balloonColors.map(
    (c) => new THREE.MeshLambertMaterial({ color: c }),
  );
  const hotAirBalloons: THREE.Group[] = [];
  const balloonSpecs = [
    { x: -7.5, y: 7.5, z: -15.5, phase: 0.4 },
    { x: 8.6, y: 12.0, z: -18.0, phase: 1.7 },
    { x: -5.8, y: 18.5, z: -21.0, phase: 2.9 },
    { x: 6.4, y: 24.0, z: -16.5, phase: 4.1 },
  ];
  balloonSpecs.forEach((bs, idx) => {
    const bGrp = new THREE.Group();
    const env = new THREE.Mesh(balloonEnvelopeGeo, balloonMats[idx % balloonMats.length]);
    env.scale.set(1, 1.18, 1);
    const basket = new THREE.Mesh(balloonBasketGeo, basketMat);
    basket.position.y = -1.35;
    bGrp.add(env, basket);
    bGrp.position.set(bs.x, bs.y, bs.z);
    bGrp.userData = { baseX: bs.x, baseY: bs.y, phase: bs.phase };
    cityGroup.add(bGrp);
    hotAirBalloons.push(bGrp);
  });

  root.add(cityGroup);
  disposables.push(
    quayDeckMat,
    quayTrimMat,
    quayBankLeftGeo,
    quayFarGeo,
    quayEdgeGeo,
    cityBridgeMat,
    cityBridgeAccentMat,
    mainBridgeDeckGeo,
    plazaGeo,
    plazaRingGeo,
    pierGeo,
    archRibGeo,
    railGeo,
    frontRailLeftGeo,
    lampPostGeo,
    lampPostMat,
    lampBulbGeo,
    lampBulbMat,
    bldgGeo,
    bldgMat,
    roofGeo,
    roofMat,
    winGeo,
    winMat,
    trunkGeo,
    trunkMat,
    foliageGeo,
    foliageMat,
    ferrisRimGeo,
    ferrisRimMat,
    spokeGeo,
    gondolaGeo,
    standLegGeo,
    ...gondolaMats,
    boatHullGeo,
    boatCabinGeo,
    boatMat1,
    boatMat2,
    boatCabinMat,
    balloonEnvelopeGeo,
    balloonBasketGeo,
    basketMat,
    ...balloonMats,
  );

  // 5. Layered Soft Background Clouds (Opaque Lambert = zero transparency overdraw!)
  const parallaxCloudsGroup = new THREE.Group();
  const cloudMat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(initialTheme.cloudColor),
  });
  const orbGeo = new THREE.SphereGeometry(1, 14, 10);

  for (let i = 0; i < 8; i++) {
    const orb = new THREE.Mesh(orbGeo, cloudMat);
    const side = i % 2 === 0 ? -1 : 1;
    const radius = 1.2 + (i % 4) * 0.7;
    const depthZ = -14 - (i % 4) * 6;
    orb.scale.set(radius * 1.35, radius * 0.85, radius);
    orb.position.set(side * (6.8 + (i % 3) * 4.2), 2.5 + i * 3.8, depthZ);
    orb.userData = {
      baseX: orb.position.x,
      baseY: orb.position.y,
      speed: 0.16 + (i % 3) * 0.06,
      phase: i * 1.4,
      parallax: 0.25 + (i % 4) * 0.1,
    };
    parallaxCloudsGroup.add(orb);
  }
  root.add(parallaxCloudsGroup);
  disposables.push(orbGeo, cloudMat);

  // 6. Twinkling Stars for Starry Night
  const starCount = 90;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 60;
    starPositions[i * 3 + 1] = Math.random() * 45 + 2;
    starPositions[i * 3 + 2] = -15 - Math.random() * 25;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xfff3b0,
    size: 0.24,
    transparent: true,
    opacity: 0.85,
  });
  const starsPoints = new THREE.Points(starGeo, starMat);
  root.add(starsPoints);
  disposables.push(starGeo, starMat);

  // 7. Soft Floating Ambient Motes
  const sparklesGroup = new THREE.Group();
  const sparkleGeo = new THREE.SphereGeometry(0.11, 8, 6);
  const sparkleMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Mesh(sparkleGeo, sparkleMat);
    s.position.set(
      (Math.random() - 0.5) * 14,
      1.5 + i * 2.4,
      (Math.random() - 0.5) * 8 - 5,
    );
    s.userData = { baseX: s.position.x, baseY: s.position.y, phase: i * 0.9 };
    sparklesGroup.add(s);
  }
  root.add(sparklesGroup);
  disposables.push(sparkleGeo, sparkleMat);

  const updateTheme = (theme: EnvironmentTheme) => {
    const style = theme.sceneryStyle ?? 'courtyard';
    studioGroup.visible = style === 'studio';
    courtyardGroup.visible = style === 'courtyard';
    cityGroup.visible = style === 'city';

    skyMat.uniforms.uTopColor.value.set(theme.skyTop);
    skyMat.uniforms.uBottomColor.value.set(theme.skyBottom);
    studioFloorMat.color.set(theme.skyBottom);

    waterMat.color.set(theme.waterColor);
    bridgeMat.color.set(theme.bridgeColor);
    trimMat.color.set(theme.bridgeTrimColor);
    cityBridgeMat.color.set(theme.bridgeColor);
    cityBridgeAccentMat.color.set(theme.bridgeTrimColor);
    cloudMat.color.set(theme.cloudColor);
    starsPoints.visible = theme.hasStars;
    sparklesGroup.visible = theme.hasFloatingSparkles;
  };

  updateTheme(initialTheme);

  const updateAnimation = (elapsed: number, cameraY: number, parallaxX: number) => {
    skyDome.position.y = cameraY;

    for (const child of parallaxCloudsGroup.children) {
      const { baseX, baseY, speed, phase, parallax } = child.userData as {
        baseX: number;
        baseY: number;
        speed: number;
        phase: number;
        parallax: number;
      };
      child.position.x = baseX + Math.sin(elapsed * speed + phase) * 1.1 - parallaxX * parallax;
      const bandOffset = Math.floor(Math.max(0, cameraY - 6) / 26) * 26;
      child.position.y = baseY + bandOffset + Math.cos(elapsed * 0.35 + phase) * 0.25;
    }

    if (cityGroup.visible) {
      ferrisWheelSpinGroup.rotation.z = elapsed * 0.16;

      for (const boat of canalBoats) {
        const range = 34;
        const z = ((boat.baseZ + elapsed * boat.speed * boat.dir + 22) % range + range) % range - 22;
        boat.group.position.z = z;
        boat.group.position.y = -2.02 + Math.sin(elapsed * 1.8 + z) * 0.03;
      }

      const balloonBand = Math.floor(Math.max(0, cameraY - 8) / 26) * 26;
      for (const bGrp of hotAirBalloons) {
        const { baseX, baseY, phase } = bGrp.userData as {
          baseX: number;
          baseY: number;
          phase: number;
        };
        bGrp.position.x = baseX + Math.sin(elapsed * 0.25 + phase) * 1.35 - parallaxX * 0.14;
        bGrp.position.y = baseY + balloonBand + Math.sin(elapsed * 0.6 + phase) * 0.45;
      }
    }

    if (starsPoints.visible) {
      starsPoints.position.y = Math.max(0, cameraY - 8);
    }

    if (sparklesGroup.visible) {
      const bandOffset = Math.max(0, cameraY - 6);
      for (const child of sparklesGroup.children) {
        const { baseX, baseY, phase } = child.userData as {
          baseX: number;
          baseY: number;
          phase: number;
        };
        child.position.x = baseX + Math.sin(elapsed * 0.6 + phase) * 0.35 - parallaxX * 0.18;
        child.position.y = baseY + bandOffset + Math.sin(elapsed * 1.1 + phase) * 0.3;
      }
    }
  };

  const dispose = () => {
    for (const item of disposables) {
      item.dispose();
    }
  };

  return {
    root,
    updateTheme,
    updateAnimation,
    dispose,
  };
}

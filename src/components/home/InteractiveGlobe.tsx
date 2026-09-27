import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useApp } from '../../context/AppContext';

interface TradeRoute {
  id: string;
  originName: string;
  originCode: string;
  originCountry: string;
  destName: string;
  destCode: string;
  originCoords: [number, number]; // [lat, lng]
  destCoords: [number, number]; // [lat, lng]
  vesselName: string;
  vesselClass: string;
  freightRateUSD: number;
  quantityMT: number;
  speedKnots: number;
  draftM: number;
  etaDays: number;
  marketTrend: 'Rising' | 'Stable' | 'Softening';
  atdDate: string;
  etaDate: string;
  progressPct: number;
}

const TRADE_ROUTES: TradeRoute[] = [
  {
    id: 'route-aus-vizag',
    originName: 'Newcastle',
    originCode: 'BNE',
    originCountry: 'Australia',
    destName: 'Visakhapatnam',
    destCode: 'VZG',
    originCoords: [-32.92, 151.78],
    destCoords: [17.68, 83.21],
    vesselName: 'SWARNA BRAHMA',
    vesselClass: 'Capesize',
    freightRateUSD: 18.6,
    quantityMT: 75000,
    speedKnots: 14.2,
    draftM: 16.5,
    etaDays: 14,
    marketTrend: 'Rising',
    atdDate: '2026-09-10',
    etaDate: '2026-09-24',
    progressPct: 68,
  },
  {
    id: 'route-indo-paradip',
    originName: 'Samarinda',
    originCode: 'SRD',
    originCountry: 'Indonesia',
    destName: 'Paradip',
    destCode: 'PDP',
    originCoords: [-0.5, 117.15],
    destCoords: [20.26, 86.67],
    vesselName: 'MANTA ANKA',
    vesselClass: 'Panamax',
    freightRateUSD: 12.4,
    quantityMT: 60000,
    speedKnots: 13.3,
    draftM: 14.2,
    etaDays: 7,
    marketTrend: 'Stable',
    atdDate: '2026-09-17',
    etaDate: '2026-09-24',
    progressPct: 82,
  },
  {
    id: 'route-moz-dhamra',
    originName: 'Maputo',
    originCode: 'MPM',
    originCountry: 'Mozambique',
    destName: 'Dhamra',
    destCode: 'DHM',
    originCoords: [-25.96, 32.58],
    destCoords: [20.8, 86.91],
    vesselName: 'NEW LEGEND',
    vesselClass: 'Supramax',
    freightRateUSD: 22.1,
    quantityMT: 55000,
    speedKnots: 12.1,
    draftM: 12.8,
    etaDays: 12,
    marketTrend: 'Rising',
    atdDate: '2026-09-12',
    etaDate: '2026-09-24',
    progressPct: 54,
  },
  {
    id: 'route-rus-vizag',
    originName: 'Vostochny',
    originCode: 'VOS',
    originCountry: 'Russia',
    destName: 'Visakhapatnam',
    destCode: 'VZG',
    originCoords: [42.74, 133.08],
    destCoords: [17.68, 83.21],
    vesselName: 'PACIFIC HORIZON',
    vesselClass: 'Panamax',
    freightRateUSD: 24.5,
    quantityMT: 70000,
    speedKnots: 13.8,
    draftM: 15.0,
    etaDays: 11,
    marketTrend: 'Softening',
    atdDate: '2026-09-13',
    etaDate: '2026-09-24',
    progressPct: 62,
  },
  {
    id: 'route-usa-kamarajar',
    originName: 'Norfolk',
    originCode: 'ORF',
    originCountry: 'USA',
    destName: 'Kamarajar (Ennore)',
    destCode: 'ENR',
    originCoords: [36.85, -76.28],
    destCoords: [13.25, 80.33],
    vesselName: 'ATLANTIC STAR',
    vesselClass: 'Capesize',
    freightRateUSD: 38.2,
    quantityMT: 120000,
    speedKnots: 14.5,
    draftM: 16.8,
    etaDays: 32,
    marketTrend: 'Rising',
    atdDate: '2026-08-23',
    etaDate: '2026-09-24',
    progressPct: 91,
  },
];

const TREND_COLOR: Record<TradeRoute['marketTrend'], string> = {
  Rising: '#34D399',
  Stable: '#38BDF8',
  Softening: '#FBBF24',
};

const GLOBE_RADIUS = 80;

/** Convert lat/lng (degrees) to a position on the sphere surface. */
function latLngToVector3(lat: number, lng: number, r: number = GLOBE_RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/** Crisp High-Visibility Port Location Pointer Texture (Glowing Halo + Target Ring + Solid Pin) */
function makePortPointerTexture(colorHex = '#2DD4BF'): THREE.Texture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Intense radial glow backdrop
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.25, colorHex);
  grad.addColorStop(0.65, `${colorHex}80`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Bold outer white ring
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 54, 0, Math.PI * 2);
  ctx.stroke();

  // Dark accent ring for high contrast against landmasses
  ctx.strokeStyle = '#040910';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 44, 0, Math.PI * 2);
  ctx.stroke();

  // Solid vivid pin center
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 32, 0, Math.PI * 2);
  ctx.fill();

  // Pure white center dot
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 12, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** Directional Glowing Vessel Arrowhead Texture */
function makeVesselArrowTexture(colorHex = '#00F0FF'): THREE.Texture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Radial backdrop glow
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(0.4, colorHex);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Sharp directional ship arrowhead polygon
  ctx.fillStyle = colorHex;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(size / 2, 20);
  ctx.lineTo(size - 36, size - 36);
  ctx.lineTo(size / 2, size - 64);
  ctx.lineTo(36, size - 36);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/** High-contrast floating 3D port badge label sprite texture */
function makePortLabelTexture(code: string, colorHex = '#2DD4BF'): THREE.Texture {
  const width = 256;
  const height = 96;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Dark navy pill background with bright glowing border
  ctx.fillStyle = 'rgba(7, 17, 34, 0.92)';
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 5;

  const r = 20;
  ctx.beginPath();
  ctx.roundRect(6, 6, width - 12, height - 12, r);
  ctx.fill();
  ctx.stroke();

  // Inner code text
  ctx.font = '700 42px "Berkeley Mono", "Space Mono", monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const TUBE_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TUBE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uHighlight;
  varying vec2 vUv;
  void main() {
    float flow = fract(vUv.x * 5.0 - uTime * uSpeed);
    float pulse = smoothstep(0.0, 0.25, flow) * smoothstep(0.7, 0.25, flow);
    float base = 0.45 + uHighlight * 0.35;
    float alpha = base + pulse * (0.9 + uHighlight * 0.4);
    float edge = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.5, vUv.y);
    vec3 color = uColor + vec3(0.3, 0.7, 0.9) * pulse * 0.8;
    gl_FragColor = vec4(color, clamp(alpha * (0.75 + edge * 0.25), 0.0, 1.0));
  }
`;

const EARTH_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const EARTH_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 dayColor = texture2D(dayMap, vUv).rgb;
    float oceanMask = texture2D(specMap, vUv).r;
    
    // Deep rich oceanic blue for waters, vibrant realistic natural earth tones for land
    vec3 oceanBase = mix(dayColor, vec3(0.02, 0.08, 0.18), 0.65);
    vec3 base = mix(dayColor * 1.35, oceanBase, oceanMask);

    vec3 n = normalize(vNormal);
    vec3 sun = normalize(sunDirection);
    float NdotL = dot(n, sun);
    float dayFactor = smoothstep(-0.25, 0.25, NdotL);

    vec3 nightColor = texture2D(nightMap, vUv).rgb;
    vec3 nightGlow = nightColor * vec3(1.0, 0.85, 0.55) * 2.2;

    // High clarity bright ambient + directional sunlight illumination
    float ambient = 0.65;
    float diffuse = max(NdotL, 0.0) * 0.95;
    vec3 dayLit = base * (ambient + diffuse);

    // Specular sunlight highlights on oceans
    vec3 viewDir = normalize(vViewPosition);
    vec3 reflectDir = reflect(-sun, n);
    float spec = pow(max(dot(reflectDir, viewDir), 0.0), 32.0) * oceanMask * max(NdotL, 0.0);
    vec3 specColor = vec3(0.35, 0.88, 0.82) * spec * 1.5;

    vec3 color = mix(nightGlow * 0.85, dayLit + specColor, dayFactor);

    // Subtle atmospheric rim highlight along terminator curve
    float terminator = 1.0 - abs(NdotL);
    color += vec3(0.08, 0.45, 0.42) * pow(terminator, 5.0) * 0.4;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const ATMOSPHERE_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 glowColor;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
    gl_FragColor = vec4(glowColor, clamp(intensity, 0.0, 0.85));
  }
`;

export const InteractiveGlobe: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { formatRatePerMT, formatTotalCostShort } = useApp();

  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeRoute, setActiveRoute] = useState<TradeRoute | null>(TRADE_ROUTES[0]);
  const [pinned, setPinned] = useState(false);

  const activeRouteRef = useRef<TradeRoute | null>(activeRoute);
  const pinnedRef = useRef(false);
  activeRouteRef.current = activeRoute;
  pinnedRef.current = pinned;

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 2000);
    const INITIAL_DISTANCE = 480;
    const DEFAULT_DISTANCE = 232;
    camera.position.set(0, 12, INITIAL_DISTANCE);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroup.rotation.y = -Math.PI / 1.85;
    globeGroup.rotation.x = 0.3;
    scene.add(globeGroup);

    // ---- Starfield ----
    const starCount = 1400;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 620 + Math.random() * 380;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xdce8f5,
      size: 1.15,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ---- Textures ----
    const manager = new THREE.LoadingManager();
    manager.onProgress = (_url, loaded, total) => setProgress(loaded / Math.max(total, 1));
    manager.onLoad = () => setReady(true);
    const loader = new THREE.TextureLoader(manager);

    const dayMap = loader.load('/textures/earth_atmos_2048.jpg');
    const nightMap = loader.load('/textures/earth_lights_2048.png');
    const specMap = loader.load('/textures/earth_specular_2048.jpg');
    const cloudMap = loader.load('/textures/earth_clouds_1024.png');
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;

    // ---- Earth Mesh ----
    const sunDirection = new THREE.Vector3(0.6, 0.45, 1.0).normalize();
    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96);
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayMap },
        nightMap: { value: nightMap },
        specMap: { value: specMap },
        sunDirection: { value: sunDirection },
      },
      vertexShader: EARTH_VERTEX_SHADER,
      fragmentShader: EARTH_FRAGMENT_SHADER,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // ---- Clouds ----
    const cloudGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.012, 72, 72);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      color: 0xdfeffa,
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    globeGroup.add(cloudMesh);

    // ---- Atmosphere glow ----
    const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.16, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(0x2dd4bf) } },
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);
    atmosphereMesh.position.copy(globeGroup.position);

    // ---- Shared Pointer & Arrow Textures ----
    const originPinTexture = makePortPointerTexture('#F59E0B');
    const destPinTexture = makePortPointerTexture('#2DD4BF');
    const vesselArrowTexture = makeVesselArrowTexture('#38BDF8');

    function makeSprite(mapTexture: THREE.Texture, scale: number, opacity = 1): THREE.Sprite {
      const material = new THREE.SpriteMaterial({
        map: mapTexture,
        transparent: true,
        opacity,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(scale, scale, 1);
      return sprite;
    }

    // ---- Routes, Hit Meshes, Vessel Arrow Pointers ----
    const tubeMeshes: { mesh: THREE.Mesh; material: THREE.ShaderMaterial; route: TradeRoute }[] = [];
    const hitMeshes: THREE.Mesh[] = [];
    const pulsingRings: { sprite: THREE.Sprite; phase: number }[] = [];
    const vessels: { sprite: THREE.Sprite; points: THREE.Vector3[]; progress: number; speed: number }[] = [];

    TRADE_ROUTES.forEach((route, idx) => {
      const start = latLngToVector3(route.originCoords[0], route.originCoords[1]);
      const end = latLngToVector3(route.destCoords[0], route.destCoords[1]);

      const distance = start.distanceTo(end);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(GLOBE_RADIUS + distance * 0.32);

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(64);

      const tubeGeometry = new THREE.TubeGeometry(curve, 64, 1.15, 8, false);
      const tubeMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(0x2dd4bf) },
          uTime: { value: Math.random() * 10 },
          uSpeed: { value: 0.28 + Math.random() * 0.16 },
          uHighlight: { value: idx === 0 ? 1 : 0 },
        },
        vertexShader: TUBE_VERTEX_SHADER,
        fragmentShader: TUBE_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
      globeGroup.add(tubeMesh);
      tubeMeshes.push({ mesh: tubeMesh, material: tubeMaterial, route });

      // Generous invisible hit tube for hover/click interaction
      const hitGeometry = new THREE.TubeGeometry(curve, 32, 3.2, 6, false);
      const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, depthTest: false });
      const hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);
      hitMesh.userData.route = route;
      globeGroup.add(hitMesh);
      hitMeshes.push(hitMesh);

      // Sea Port Pointers: Origin (Gold) & Destination (Teal)
      const originPin = makeSprite(originPinTexture, 14.0, 1.0);
      originPin.position.copy(start);
      globeGroup.add(originPin);

      const destPin = makeSprite(destPinTexture, 16.0, 1.0);
      destPin.position.copy(end);
      globeGroup.add(destPin);

      const destRing = makeSprite(destPinTexture, 26.0, 0.85);
      destRing.position.copy(end);
      globeGroup.add(destRing);
      pulsingRings.push({ sprite: destRing, phase: idx * 0.6 });

      // High-Visibility 3D Port Code Badges on Globe Surface
      const originLabelTexture = makePortLabelTexture(route.originCode, '#F59E0B');
      const originLabelSprite = makeSprite(originLabelTexture, 18.0, 0.95);
      originLabelSprite.scale.set(18.0, 6.75, 1);
      originLabelSprite.position.copy(start.clone().multiplyScalar(1.07));
      globeGroup.add(originLabelSprite);

      const destLabelTexture = makePortLabelTexture(route.destCode, '#2DD4BF');
      const destLabelSprite = makeSprite(destLabelTexture, 18.0, 0.95);
      destLabelSprite.scale.set(18.0, 6.75, 1);
      destLabelSprite.position.copy(end.clone().multiplyScalar(1.07));
      globeGroup.add(destLabelSprite);

      // Moving Directional Vessel Arrowhead Pointer
      const vesselSprite = makeSprite(vesselArrowTexture, 12.5, 1.0);
      vesselSprite.position.copy(points[Math.floor(points.length * (route.progressPct / 100))]);
      globeGroup.add(vesselSprite);
      vessels.push({ sprite: vesselSprite, points, progress: route.progressPct / 100, speed: 0.00028 + Math.random() * 0.00018 });
    });

    // ---- Camera entrance animation ----
    let introT = 0;
    const introDuration = 1.7;

    let isDragging = false;
    let dragMoved = false;
    let lastPointer = { x: 0, y: 0 };
    const rotationVelocity = { x: 0, y: 0 };
    let idleFrames = 0;
    const AUTO_ROTATE_SPEED = 0.00095;
    let targetDistance = DEFAULT_DISTANCE;

    const pointerNDC = new THREE.Vector2(0, 0);
    let pointerInside = false;
    const raycaster = new THREE.Raycaster();

    const updatePointerNDC = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      if (tooltipRef.current) {
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        tooltipRef.current.style.left = `${Math.min(Math.max(x + 18, 12), rect.width - 340)}px`;
        tooltipRef.current.style.top = `${Math.min(Math.max(y - 18, 12), rect.height - 240)}px`;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragMoved = false;
      lastPointer = { x: e.clientX, y: e.clientY };
      rotationVelocity.x = 0;
      rotationVelocity.y = 0;
      window.addEventListener('pointermove', onWindowPointerMove);
      window.addEventListener('pointerup', onWindowPointerUp);
    };

    const onWindowPointerMove = (e: PointerEvent) => {
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
      rotationVelocity.y = dx * 0.0032;
      rotationVelocity.x = dy * 0.0032;
      globeGroup.rotation.y += rotationVelocity.y;
      globeGroup.rotation.x = Math.min(1.05, Math.max(-1.05, globeGroup.rotation.x + rotationVelocity.x));
      lastPointer = { x: e.clientX, y: e.clientY };
      idleFrames = 0;
    };

    const onWindowPointerUp = () => {
      isDragging = false;
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      if (!dragMoved) {
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects(hitMeshes);
        if (hits.length > 0) {
          const route = hits[0].object.userData.route as TradeRoute;
          setActiveRoute(route);
          setPinned(true);
        } else {
          setPinned(false);
        }
      }
    };

    const onContainerPointerMove = (e: PointerEvent) => {
      pointerInside = true;
      updatePointerNDC(e.clientX, e.clientY);
    };
    const onContainerPointerLeave = () => {
      pointerInside = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetDistance = Math.min(360, Math.max(140, targetDistance + e.deltaY * 0.12));
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onContainerPointerMove);
    container.addEventListener('pointerleave', onContainerPointerLeave);
    container.addEventListener('wheel', onWheel, { passive: false });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinned(false);
    };
    window.addEventListener('keydown', onKeyDown);

    // ---- Animation Loop ----
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let lastHoveredId: string | null = TRADE_ROUTES[0].id;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      if (introT < introDuration) {
        introT += dt;
        const t = Math.min(introT / introDuration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        camera.position.z = INITIAL_DISTANCE + (targetDistance - INITIAL_DISTANCE) * eased;
      } else {
        camera.position.z += (targetDistance - camera.position.z) * 0.07;
      }

      if (!isDragging) {
        rotationVelocity.x *= 0.94;
        rotationVelocity.y *= 0.94;
        globeGroup.rotation.y += rotationVelocity.y;
        globeGroup.rotation.x = Math.min(1.05, Math.max(-1.05, globeGroup.rotation.x + rotationVelocity.x));

        const speed = Math.hypot(rotationVelocity.x, rotationVelocity.y);
        if (speed < 0.00006) {
          idleFrames += 1;
          if (idleFrames > 70) {
            globeGroup.rotation.y += AUTO_ROTATE_SPEED;
          }
        } else {
          idleFrames = 0;
        }
      }

      cloudMesh.rotation.y += 0.00025;
      stars.rotation.y += 0.00006;

      tubeMeshes.forEach(({ material }) => {
        material.uniforms.uTime.value = elapsed;
      });

      vessels.forEach((v) => {
        v.progress = (v.progress + v.speed) % 1;
        const idx = v.progress * (v.points.length - 1);
        const lo = Math.floor(idx);
        const hi = Math.min(lo + 1, v.points.length - 1);
        const frac = idx - lo;
        v.sprite.position.copy(v.points[lo]).lerp(v.points[hi], frac);
      });

      pulsingRings.forEach((r) => {
        const s = 10.0 + Math.sin(elapsed * 1.5 + r.phase) * 2.2;
        r.sprite.scale.set(s, s, 1);
        const mat = r.sprite.material as THREE.SpriteMaterial;
        mat.opacity = 0.5 + Math.sin(elapsed * 1.5 + r.phase) * 0.3;
      });

      if (!isDragging && pointerInside) {
        raycaster.setFromCamera(pointerNDC, camera);
        const hits = raycaster.intersectObjects(hitMeshes);
        if (!pinnedRef.current) {
          if (hits.length > 0) {
            const route = hits[0].object.userData.route as TradeRoute;
            if (route.id !== lastHoveredId) {
              lastHoveredId = route.id;
              setActiveRoute(route);
            }
          } else if (lastHoveredId !== null) {
            lastHoveredId = null;
            setActiveRoute(null);
          }
        }
      }

      const highlightId = pinnedRef.current ? activeRouteRef.current?.id : lastHoveredId;
      tubeMeshes.forEach(({ material, route }) => {
        const target = route.id === highlightId ? 1 : 0;
        material.uniforms.uHighlight.value += (target - material.uniforms.uHighlight.value) * 0.12;
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onContainerPointerMove);
      container.removeEventListener('pointerleave', onContainerPointerLeave);
      container.removeEventListener('wheel', onWheel);

      tubeMeshes.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      hitMeshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      earthGeometry.dispose();
      earthMaterial.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      originPinTexture.dispose();
      destPinTexture.dispose();
      vesselArrowTexture.dispose();
      dayMap.dispose();
      nightMap.dispose();
      specMap.dispose();
      cloudMap.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[540px] md:h-[620px] rounded-3xl overflow-hidden border border-white/10 bg-[#040910] shadow-2xl">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Premium loading veil */}
      <div
        className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#040910] transition-opacity duration-700 ${
          ready ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="w-40 h-px bg-white/10 relative overflow-hidden rounded-full">
          <div
            className="absolute inset-y-0 left-0 bg-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">
          Calibrating Global Trade Network & WebGL Shaders
        </span>
      </div>

      {/* MarineTraffic-Style High-Contrast Operational Popover Card */}
      <div
        ref={tooltipRef}
        className={`absolute z-30 pointer-events-none transition-all duration-200 ${
          activeRoute ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{ left: '18px', top: '18px', width: '330px' }}
      >
        {activeRoute && (
          <div className="p-4 rounded-2xl border-2 border-teal-400/80 text-xs text-white space-y-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] bg-[#070F22]/98 backdrop-blur-xl">
            {/* Header: Vessel Name + Flag */}
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                <span className="font-extrabold text-white text-sm tracking-wide font-['Syne'] drop-shadow">
                  {activeRoute.vesselName}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-400/50 uppercase">
                  {activeRoute.vesselClass}
                </span>
                <span
                  className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase"
                  style={{
                    color: TREND_COLOR[activeRoute.marketTrend],
                    backgroundColor: `${TREND_COLOR[activeRoute.marketTrend]}26`,
                    border: `1.5px solid ${TREND_COLOR[activeRoute.marketTrend]}80`,
                  }}
                >
                  {activeRoute.marketTrend}
                </span>
              </div>
            </div>

            {/* Route Codes + Direction */}
            <div className="flex items-center justify-between font-mono text-xs pt-0.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-300">
                <span className="text-sm">{activeRoute.originCode}</span>
                <span className="text-slate-200 font-bold text-[11px]">({activeRoute.originName})</span>
              </div>
              <span className="text-teal-400 font-extrabold text-sm">➔</span>
              <div className="flex items-center gap-1.5 font-extrabold text-teal-300">
                <span className="text-sm">{activeRoute.destCode}</span>
                <span className="text-slate-200 font-bold text-[11px]">({activeRoute.destName})</span>
              </div>
            </div>

            {/* Progress Bar with High-Contrast Dates */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex justify-between text-[11px] font-mono font-bold">
                <span className="text-slate-300">ATD: {activeRoute.atdDate}</span>
                <span className="text-teal-300 font-extrabold">ETA: {activeRoute.etaDate}</span>
              </div>
              <div className="relative w-full h-2.5 rounded-full bg-slate-950 border border-slate-700 overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-300 shadow-[0_0_10px_rgba(45,212,191,0.8)]"
                  style={{ width: `${activeRoute.progressPct}%` }}
                />
              </div>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5 font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
                <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Speed / Status</span>
                <span className="font-extrabold text-white text-xs block">{activeRoute.speedKnots} Kts • Underway</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
                <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Max Draft</span>
                <span className="font-extrabold text-white text-xs block">{activeRoute.draftM}m Berth Limit</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
                <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Est. Freight</span>
                <span className="font-extrabold text-emerald-300 text-xs block font-mono-num">{formatRatePerMT(activeRoute.freightRateUSD)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner">
                <span className="text-slate-300 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Total Commitment</span>
                <span className="font-extrabold text-amber-300 text-xs block font-mono-num">{formatTotalCostShort(activeRoute.freightRateUSD * activeRoute.quantityMT)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Minimal caption bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none text-[10px] font-mono">
        <div className="bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-slate-300 uppercase tracking-wider font-semibold">
          Drag to explore · Scroll to zoom · Click corridor for AIS telemetry
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-teal-300 uppercase tracking-wider font-bold">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>{TRADE_ROUTES.length} Active Corridors Monitored</span>
        </div>
      </div>
    </div>
  );
};

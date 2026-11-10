import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
  AssetContext,
  buildPowerTransformer,
  buildDeadTankBreaker,
  buildCentreBreakDisconnector,
  buildPostCurrentTransformer,
  buildInductiveVoltageTransformer,
  buildSurgeArrester,
  buildStrainGantry,
  buildEarthingSwitch,
  buildMvSwitchgearLineup
} from './assets/substationAssets';
import { useScada } from '../../context/ScadaContext';
import {
  Box,
  Eye,
  Layers,
  Zap,
  Flame,
  Activity,
  Compass,
  Crosshair,
  Sliders,
  CheckCircle2,
  Sparkles,
  Radio,
  Cpu,
  Sun,
  Sunset,
  Moon,
  Siren,
  Radar,
  Camera,
  Orbit,
  ChevronUp,
  ChevronDown,
  MousePointerClick,
  Keyboard,
  CloudRain,
  Ruler
} from 'lucide-react';

export type AssetType =
  | 'TR1'
  | 'TR2'
  | 'HV_BUSHING'
  | 'SF6_BREAKER'
  | 'DISCONNECTOR'
  | 'OLTC_HOUSING'
  | 'RADIATOR_BANK'
  | 'SURGE_ARRESTER'
  | 'CT_VT_METERING';

export const Substation3dModule: React.FC = () => {
  const { tr1State, tr2State, gridFrequency, t, lang, toggleSwitch, addToast } = useScada();
  const isAr = lang === 'ar';

  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetType>('TR1');
  const [hoveredAsset, setHoveredAsset] = useState<AssetType | null>(null);
  const [viewMode, setViewMode] = useState<'WALKTHROUGH' | 'CUTAWAY' | 'XRAY_THERMAL'>('WALKTHROUGH');
  const [oilFlowSpeed, setOilFlowSpeed] = useState<number>(1.2);
  const [simulatedLoadPct, setSimulatedLoadPct] = useState<number>(85); // 85% load
  const [isAutoOrbit, setIsAutoOrbit] = useState<boolean>(true);
  const [showEnergyFlow, setShowEnergyFlow] = useState<boolean>(true);
  const [showArcFaultEffect, setShowArcFaultEffect] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<'OVERVIEW' | 'TR1_FOCUS' | 'BUSHINGS' | 'BREAKERS' | 'GANTRIES'>('OVERVIEW');

  // New Visual Enhancements States
  const [envPreset, setEnvPreset] = useState<'DAY' | 'SUNSET' | 'NIGHT' | 'RAIN' | 'EMERGENCY'>('DAY');
  const [isDroneMode, setIsDroneMode] = useState<boolean>(false);
  const [droneWaypointIndex, setDroneWaypointIndex] = useState<number>(0);
  const [showCoronaEffect, setShowCoronaEffect] = useState<boolean>(true);
  const [showARLabels, setShowARLabels] = useState<boolean>(true);
  const [isSceneDockOpen, setIsSceneDockOpen] = useState<boolean>(true);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(false);

  // Operable-switchgear actuator registry (populated by asset builders)
  const dsActuatorsRef = useRef<Array<{ pivots: THREE.Group[]; switchKey: keyof typeof tr1State.switches; trId: 'TR-1' | 'TR-2' }>>([]);
  const breakerFlagsRef = useRef<THREE.Mesh[]>([]);
  const sf6NeedlesRef = useRef<THREE.Mesh[]>([]);
  const tapDialRef = useRef<THREE.Group | null>(null);
  const annotationsGroupRef = useRef<THREE.Group | null>(null);
  const snapshotRequestRef = useRef<boolean>(false);
  const fanVelRef = useRef<number>(0);
  const tr1StateRef = useRef(tr1State);
  useEffect(() => {
    tr1StateRef.current = tr1State;
  }, [tr1State]);
  const showAnnotationsRef = useRef<boolean>(false);

  // Fast animation refs to decouple Three.js render loop from React state re-renders
  const simulatedLoadPctRef = useRef<number>(simulatedLoadPct);
  const oilFlowSpeedRef = useRef<number>(oilFlowSpeed);
  const isAutoOrbitRef = useRef<boolean>(isAutoOrbit);
  const showArcFaultEffectRef = useRef<boolean>(showArcFaultEffect);
  const envPresetRef = useRef<'DAY' | 'SUNSET' | 'NIGHT' | 'RAIN' | 'EMERGENCY'>(envPreset);
  const isDroneModeRef = useRef<boolean>(isDroneMode);
  const droneWaypointIndexRef = useRef<number>(droneWaypointIndex);
  const showCoronaEffectRef = useRef<boolean>(showCoronaEffect);

  useEffect(() => {
    simulatedLoadPctRef.current = simulatedLoadPct;
  }, [simulatedLoadPct]);

  useEffect(() => {
    oilFlowSpeedRef.current = oilFlowSpeed;
  }, [oilFlowSpeed]);

  useEffect(() => {
    isAutoOrbitRef.current = isAutoOrbit;
  }, [isAutoOrbit]);

  useEffect(() => {
    showArcFaultEffectRef.current = showArcFaultEffect;
  }, [showArcFaultEffect]);

  useEffect(() => {
    envPresetRef.current = envPreset;
  }, [envPreset]);

  useEffect(() => {
    isDroneModeRef.current = isDroneMode;
  }, [isDroneMode]);

  useEffect(() => {
    showAnnotationsRef.current = showAnnotations;
    setShowAnnotations(showAnnotations);
  }, [showAnnotations]);

  useEffect(() => {
    droneWaypointIndexRef.current = droneWaypointIndex;
  }, [droneWaypointIndex]);

  useEffect(() => {
    showCoronaEffectRef.current = showCoronaEffect;
  }, [showCoronaEffect]);

  // Automated Drone Fly-Through Interval
  useEffect(() => {
    if (!isDroneMode) return;
    const interval = setInterval(() => {
      setDroneWaypointIndex((prev) => (prev + 1) % 5);
    }, 6000);
    return () => clearInterval(interval);
  }, [isDroneMode]);

  // Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Animated objects references
  const oilParticlesRef = useRef<THREE.Points | null>(null);
  const coronaParticlesRef = useRef<THREE.Points | null>(null);
  const conductorParticlesRef = useRef<THREE.Points | null>(null);
  const hotspotMeshRef = useRef<THREE.Mesh | null>(null);
  const fanMeshesRef = useRef<THREE.Mesh[]>([]);
  const arcLightRef = useRef<THREE.PointLight | null>(null);
  const emergencyLightRef = useRef<THREE.PointLight | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const clickableMeshesRef = useRef<{ mesh: THREE.Object3D; asset: AssetType }[]>([]);

  // Orbit control interaction state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ alpha: number; beta: number; radius: number }>({
    alpha: Math.PI / 3.8,
    beta: Math.PI / 5.2,
    radius: 26
  });

  // Camera presets coordinates
  const applyCameraPreset = (preset: 'OVERVIEW' | 'TR1_FOCUS' | 'BUSHINGS' | 'BREAKERS' | 'GANTRIES') => {
    setCameraPreset(preset);
    setIsAutoOrbit(false);
    if (preset === 'OVERVIEW') {
      cameraAngleRef.current = { alpha: Math.PI / 3.8, beta: Math.PI / 5.2, radius: 28 };
    } else if (preset === 'TR1_FOCUS') {
      cameraAngleRef.current = { alpha: 0.15, beta: Math.PI / 7, radius: 13 };
    } else if (preset === 'BUSHINGS') {
      cameraAngleRef.current = { alpha: -0.25, beta: Math.PI / 10, radius: 9 };
    } else if (preset === 'BREAKERS') {
      cameraAngleRef.current = { alpha: Math.PI * 0.75, beta: Math.PI / 5.5, radius: 19 };
    } else if (preset === 'GANTRIES') {
      cameraAngleRef.current = { alpha: Math.PI * 0.4, beta: Math.PI / 4, radius: 32 };
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 560;

    // 1. Scene & Lighting Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xbfd4e8, 0.006);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    const { alpha, beta, radius } = cameraAngleRef.current;
    camera.position.x = radius * Math.cos(beta) * Math.sin(alpha);
    camera.position.y = radius * Math.sin(beta);
    camera.position.z = radius * Math.cos(beta) * Math.cos(alpha);
    camera.lookAt(0, 2.5, 0);
    cameraRef.current = camera;

    // Renderer with High PBR Quality
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing: bloom on emissives + correct output colour transform
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.5, 0.85, 0.83);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    clickableMeshesRef.current = [];
    fanMeshesRef.current = [];

    // Lighting Environment
    const hemisphereLight = new THREE.HemisphereLight(0xbdd7f2, 0x39434f, 0.9);
    scene.add(hemisphereLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    sunLight.position.set(32, 50, 24);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.bias = -0.00035;
    sunLight.shadow.normalBias = 0.03;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // High-Mast Switchyard Corner Floodlights
    const floodLightsArr: THREE.SpotLight[] = [];
    [
      { x: -20, z: -14, color: 0x06b6d4 },
      { x: 20, z: -14, color: 0x38bdf8 },
      { x: -20, z: 14, color: 0x0284c7 },
      { x: 20, z: 14, color: 0x06b6d4 }
    ].forEach((tower) => {
      const floodLight = new THREE.SpotLight(tower.color, 2.5, 45, Math.PI / 4, 0.5);
      floodLight.position.set(tower.x, 14, tower.z);
      floodLight.target.position.set(tower.x * 0.4, 1, tower.z * 0.4);
      scene.add(floodLight);
      scene.add(floodLight.target);
      floodLightsArr.push(floodLight);

      // Volumetric Light Cone Effect
      const coneGeo = new THREE.ConeGeometry(8, 14, 16, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: tower.color,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.set(tower.x * 0.7, 7, tower.z * 0.7);
      coneMesh.rotation.x = Math.PI / 8;
      scene.add(coneMesh);
    });

    // Arc Fault Point Light
    const arcLight = new THREE.PointLight(0x38bdf8, 0, 30);
    arcLight.position.set(-11, 4, 5);
    scene.add(arcLight);
    arcLightRef.current = arcLight;

    // -------------------------------------------------------------
    // SKY DOME, IMAGE-BASED LIGHTING & ATMOSPHERE
    // -------------------------------------------------------------
    const proceduralTextures: THREE.Texture[] = [];

    const skyVertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const skyFragmentShader = `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        if (h >= 0.0) {
          float t = pow(min(h * 1.35, 1.0), 0.62);
          gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
        } else {
          gl_FragColor = vec4(mix(horizonColor, bottomColor, min(-h * 2.4, 1.0)), 1.0);
        }
      }
    `;
    const skyUniforms = {
      topColor: { value: new THREE.Color(0x9dc4f0) },
      horizonColor: { value: new THREE.Color(0xe8f0fa) },
      bottomColor: { value: new THREE.Color(0x141d2e) },
    };
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(320, 32, 18), skyMaterial);
    scene.add(skyDome);

    // Image-based lighting baked once from the sky dome
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.add(skyDome.clone());
    const envRenderTarget = pmremGenerator.fromScene(envScene, 0.04);
    scene.environment = envRenderTarget.texture;

    // Night-sky star field (visible in NIGHT / EMERGENCY presets)
    const starCount = 1400;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85 + 0.05); // upper hemisphere bias
      const rStar = 290;
      starPositions[i * 3] = rStar * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = rStar * Math.cos(phi);
      starPositions[i * 3 + 2] = rStar * Math.sin(phi) * Math.sin(theta);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xcdd9ea,
      size: 1.15,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Aviation beacon lamps on the four high-mast towers
    const beaconMeshes: THREE.Mesh[] = [];
    [
      [-20, -14],
      [20, -14],
      [-20, 14],
      [20, 14],
    ].forEach(([bx, bz]) => {
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x450a0a, emissive: 0xdc2626, emissiveIntensity: 0 })
      );
      beacon.position.set(bx, 14.6, bz);
      scene.add(beacon);
      beaconMeshes.push(beacon);
    });

    // -------------------------------------------------------------
    // PROCEDURAL MATERIAL CREATION
    // Painted equipment enclosures are DIELECTRIC (low metalness) — high
    // metalness on paint makes surfaces mirror the dark sky and read black.
    // Only true metals (galvanised steel, copper, bus conductor) stay metallic.
    // -------------------------------------------------------------
    const matIndustrialGray = new THREE.MeshPhysicalMaterial({
      color: 0x8b98ab,
      metalness: 0.22,
      roughness: 0.52,
      clearcoat: 0.35,
      clearcoatRoughness: 0.5
    });
    const matDarkSlate = new THREE.MeshPhysicalMaterial({
      color: 0x46586e,
      metalness: 0.18,
      roughness: 0.6
    });
    const matPorcelainBrown = new THREE.MeshPhysicalMaterial({ color: 0x9a5622, roughness: 0.22, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.3 });
    const matPorcelainGray = new THREE.MeshPhysicalMaterial({ color: 0x9aa7b8, roughness: 0.26, metalness: 0.05, clearcoat: 0.55, clearcoatRoughness: 0.32 });
    const matGalvanizedSteel = new THREE.MeshPhysicalMaterial({ color: 0x93a3b8, metalness: 0.85, roughness: 0.42 });
    const matCopperGrad = new THREE.MeshPhysicalMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.22 });
    const matConductorLine = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.65
    });

    const matConcrete = new THREE.MeshStandardMaterial({ color: 0x767f8e, roughness: 0.92 });

    // Shared material/context bundle consumed by the procedural asset library
    const assetCtx: AssetContext = {
      mats: {
        tankSteel: matIndustrialGray,
        darkSlate: matDarkSlate,
        galvanized: matGalvanizedSteel,
        porcelainBrown: matPorcelainBrown,
        porcelainGray: matPorcelainGray,
        copper: matCopperGrad,
        conductor: matConductorLine,
        concrete: matConcrete,
        safetyPaint: new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.75 }),
        glassGlow: new THREE.MeshStandardMaterial({
          color: 0x7dd3fc,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.55,
          transparent: true,
          opacity: 0.85
        })
      },
      registerClickable: (obj, asset) => {
        clickableMeshesRef.current.push({ mesh: obj, asset: asset as AssetType });
      }
    };

    // -------------------------------------------------------------
    // 3. OVERHEAD LATTICE STRAIN GANTRIES & BUSBAR CONDUCTORS
    // -------------------------------------------------------------
    scene.add(buildStrainGantry(assetCtx, { x: -16, z: 1, height: 10.5 }));
    scene.add(buildStrainGantry(assetCtx, { x: 16, z: 1, height: 10.5 }));

    // Strain busbars: catenary sag hangs from suspension strings at 9.0 m
    const busCurves: THREE.CatmullRomCurve3[] = [];
    [-6, 0, 6].forEach((zBus) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-16, 8.95, zBus),
        new THREE.Vector3(-8, 8.52, zBus),
        new THREE.Vector3(0, 8.4, zBus),
        new THREE.Vector3(8, 8.52, zBus),
        new THREE.Vector3(16, 8.95, zBus)
      ]);
      busCurves.push(curve);
      const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.055, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, matConductorLine);
      tubeMesh.castShadow = true;
      scene.add(tubeMesh);
    });

    // Sagging jumper droppers from the strain buses down to bay equipment
    const makeDropper = (xSpan: number, busIdx: number, toY: number, toZ: number) => {
      const busCurve = busCurves[busIdx];
      const tParam = THREE.MathUtils.clamp((xSpan + 16) / 32, 0.03, 0.97);
      const p0 = busCurve.getPointAt(tParam).clone();
      p0.z = [-6, 0, 6][busIdx];
      const p2 = new THREE.Vector3(xSpan, toY, toZ);
      const midPoint = p0.clone().lerp(p2, 0.5);
      midPoint.y -= p0.distanceTo(p2) * 0.1;
      const dropperCurve = new THREE.QuadraticBezierCurve3(p0, midPoint, p2);
      const dropperMesh = new THREE.Mesh(
        new THREE.TubeGeometry(dropperCurve, 18, 0.032, 6, false),
        assetCtx.mats.galvanized
      );
      dropperMesh.castShadow = true;
      scene.add(dropperMesh);
    };

    // Transformer bay droppers: centre bus -> HV bushing arc shields
    [-8.7, -7, -5.3, 5.3, 7, 8.7].forEach((px) => {
      makeDropper(px, 1, 8.16, 0.95);
    });

    // Breaker bay droppers: outer buses -> terminal crowns of each pole
    [-11, 11].forEach((xCB) => {
      [-3.5, 3.5].forEach((zCB) => {
        const busIdx = zCB < 0 ? 0 : 2;
        [-1.35, 0, 1.35].forEach((dPole) => {
          makeDropper(xCB + dPole, busIdx, 4.15, zCB);
        });
      });
    });

    // Line-bay CT head droppers from the +6 m side bus
    [-13, 13].forEach((xCt) => {
      makeDropper(xCt, 2, 3.3, 8);
    });

    // 2. SWITCHYARD GROUND — PROCEDURAL GRAVEL YARD & SAFETY MARKINGS
    // -------------------------------------------------------------
    const makeSpeckleTexture = (base: string, specks: string[], count: number): THREE.CanvasTexture => {
      const cnv = document.createElement('canvas');
      cnv.width = 256;
      cnv.height = 256;
      const ctx = cnv.getContext('2d')!;
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < count; i++) {
        ctx.fillStyle = specks[Math.floor(Math.random() * specks.length)];
        const r = 0.6 + Math.random() * 1.7;
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(cnv);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      proceduralTextures.push(tex);
      return tex;
    };

    const gravelTex = makeSpeckleTexture('#20242e', ['#2b3140', '#39404f', '#171b24', '#454d5e', '#232837'], 4200);
    gravelTex.repeat.set(10, 8);

    const yardGeo = new THREE.PlaneGeometry(50, 36);
    const yardMat = new THREE.MeshStandardMaterial({ map: gravelTex, roughness: 0.94, metalness: 0.05 });
    const yardMesh = new THREE.Mesh(yardGeo, yardMat);
    yardMesh.rotation.x = -Math.PI / 2;
    yardMesh.receiveShadow = true;
    scene.add(yardMesh);

    // Faint technical survey grid on top of the gravel
    const gridHelper = new THREE.GridHelper(48, 48, 0x2dd4bf, 0x243044);
    gridHelper.position.set(0, 0.02, 0);
    const gridMaterial = gridHelper.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.22;
    scene.add(gridHelper);

    // Concrete Equipment Foundations Pads (procedural concrete + safety kerb)
    const concreteTex = makeSpeckleTexture('#343b49', ['#3f4757', '#282f3c', '#4a5364', '#1f2530'], 2600);
    [-7, 7].forEach((xPad) => {
      const trPadGeo = new THREE.BoxGeometry(7.5, 0.3, 5.5);
      const trPadMat = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.88 });
      const trPad = new THREE.Mesh(trPadGeo, trPadMat);
      trPad.position.set(xPad, 0.15, 0);
      trPad.receiveShadow = true;
      scene.add(trPad);

      // Safety-yellow painted kerb frame around each transformer bay
      const kerbMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.75 });
      [
        { w: 8.1, d: 0.18, x: 0, z: -2.95 },
        { w: 8.1, d: 0.18, x: 0, z: 2.95 },
        { w: 0.18, d: 5.9, x: -3.96, z: 0 },
        { w: 0.18, d: 5.9, x: 3.96, z: 0 },
      ].forEach((seg) => {
        const kerb = new THREE.Mesh(new THREE.BoxGeometry(seg.w, 0.09, seg.d), kerbMat);
        kerb.position.set(xPad + seg.x, 0.33, seg.z);
        kerb.receiveShadow = true;
        scene.add(kerb);
      });
    });

    // Concrete Cable Trench Troughs
    const trenchGeo = new THREE.BoxGeometry(38, 0.12, 1.2);
    const trenchMat = new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.85 });
    const trenchMesh = new THREE.Mesh(trenchGeo, trenchMat);
    trenchMesh.position.set(0, 0.06, 6.5);
    trenchMesh.receiveShadow = true;
    scene.add(trenchMesh);

    // Perimeter security fence (instanced posts + rails)
    const fencePostGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6);
    const fenceRailMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, metalness: 0.7, roughness: 0.45 });
    const perimeter = [
      { from: [-23.5, -17.5], to: [23.5, -17.5] },
      { from: [23.5, -17.5], to: [23.5, 17.5] },
      { from: [23.5, 17.5], to: [-23.5, 17.5] },
      { from: [-23.5, 17.5], to: [-23.5, -17.5] },
    ];
    let totalPosts = 0;
    perimeter.forEach((side) => {
      const len = Math.hypot(side.to[0] - side.from[0], side.to[1] - side.from[1]);
      totalPosts += Math.floor(len / 2.4) + 1;
    });
    const fencePosts = new THREE.InstancedMesh(fencePostGeo, fenceRailMat, totalPosts);
    const dummy = new THREE.Object3D();
    let postIdx = 0;
    perimeter.forEach((side) => {
      const dx = side.to[0] - side.from[0];
      const dz = side.to[1] - side.from[1];
      const len = Math.hypot(dx, dz);
      const n = Math.floor(len / 2.4) + 1;
      for (let i = 0; i < n; i++) {
        dummy.position.set(side.from[0] + (dx * i) / (n - 1), 1.2, side.from[1] + (dz * i) / (n - 1));
        dummy.updateMatrix();
        fencePosts.setMatrixAt(postIdx++, dummy.matrix);
      }
      const rail = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(dx) || 0.05, 0.06, Math.abs(dz) || 0.05), fenceRailMat);
      rail.position.set((side.from[0] + side.to[0]) / 2, 1.9, (side.from[1] + side.to[1]) / 2);
      scene.add(rail);
    });
    fencePosts.instanceMatrix.needsUpdate = true;
    scene.add(fencePosts);

    // -------------------------------------------------------------
    
    // -------------------------------------------------------------
    // 4. POWER TRANSFORMERS (IEC 60076 CONSERVATOR TYPE)
    // -------------------------------------------------------------
    const trFans = fanMeshesRef.current;
    const isXray = viewMode === 'XRAY_THERMAL';
    scene.add(buildPowerTransformer(assetCtx, {
      x: -7,
      assetId: 'TR1',
      fans: trFans,
      xray: isXray,
      windingTint: tr1StateRef.current.windingTemp > 95 ? 0xef4444 : tr1StateRef.current.windingTemp > 75 ? 0xf59e0b : 0x06b6d4,
      onHotspot: (mesh) => { hotspotMeshRef.current = mesh; },
      onTapDial: (mesh) => { tapDialRef.current = mesh; }
    }));
    scene.add(buildPowerTransformer(assetCtx, {
      x: 7,
      assetId: 'TR2',
      fans: trFans,
      xray: isXray
    }));

    // Operable centre-break disconnectors wired to the switching model
    [-11, 11].forEach((xDisc, dIdx) => {
      const pivots: THREE.Group[] = [];
      scene.add(buildCentreBreakDisconnector(assetCtx, { x: xDisc, z: -8, pivots }));
      dsActuatorsRef.current.push({
        pivots,
        switchKey: dIdx === 0 ? 'mvDisconnect89_2' : 'mvDisconnect89_5',
        trId: dIdx === 0 ? 'TR-1' : 'TR-2'
      });
    });

    // Earthing switches flanking the disconnector bays
    [-11, 11].forEach((xEs) => {
      scene.add(buildEarthingSwitch(assetCtx, { x: xEs, z: -9.7 }));
    });

    // MV metal-clad switchgear lineup (13.8 kV distribution side)
    scene.add(buildMvSwitchgearLineup(assetCtx, { x: 0, z: -12, panels: 6 }));

    // -------------------------------------------------------------
    // 5. DEAD-TANK SF6 BREAKERS & CENTRE-BREAK DISCONNECTORS
    // -------------------------------------------------------------
    [-11, 11].forEach((xCB) => {
      [-3.5, 3.5].forEach((zCB) => {
        scene.add(buildDeadTankBreaker(assetCtx, { x: xCB, z: zCB, flags: breakerFlagsRef.current, needles: sf6NeedlesRef.current }));
      });
    });

    [-11, 11].forEach((xDisc) => {
      scene.add(buildCentreBreakDisconnector(assetCtx, { x: xDisc, z: -8 }));
    });

    // Post-type CTs, inductive VTs and metal-oxide surge arresters per line bay
    [-13, 13].forEach((xInst) => {
      scene.add(buildPostCurrentTransformer(assetCtx, { x: xInst, z: 8 }));
      scene.add(buildInductiveVoltageTransformer(assetCtx, { x: xInst, z: 9.7 }));
      scene.add(buildSurgeArrester(assetCtx, { x: xInst, z: -12 }));
    });

    // -------------------------------------------------------------
    // 6. CONTROL HOUSE BUILDING
    // -------------------------------------------------------------
    // Transformer fire barrier wall between bays (IEEE 979 practice)
    const firewall = new THREE.Mesh(new THREE.BoxGeometry(0.35, 5.4, 6.4), matConcrete);
    firewall.position.set(0, 2.7, 0);
    firewall.castShadow = true;
    firewall.receiveShadow = true;
    scene.add(firewall);

    const emergencyLight = new THREE.PointLight(0xf43f5e, 0, 40);
    emergencyLight.position.set(0, 12, 0);
    scene.add(emergencyLight);
    emergencyLightRef.current = emergencyLight;

// 7. PARTICLES: OIL FLOW, CORONA DISCHARGE & CONDUCTOR BEAMS
    // -------------------------------------------------------------
    const particleCount = 240;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const coolColor = new THREE.Color(0x0284c7);
    const warmColor = new THREE.Color(0xef4444);

    for (let i = 0; i < particleCount; i++) {
      const x = -7.0 + (Math.random() - 0.5) * 5.2;
      const y = 0.5 + Math.random() * 3.8;
      const z = (Math.random() - 0.5) * 3.4;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const t = (y - 0.5) / 3.8;
      const c = coolColor.clone().lerp(warmColor, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.24,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    oilParticlesRef.current = particles;

    // High Voltage Corona Discharge Particles (HV Bushing Aura)
    const coronaCount = 160;
    const coronaGeo = new THREE.BufferGeometry();
    const coronaPos = new Float32Array(coronaCount * 3);
    for (let i = 0; i < coronaCount; i++) {
      const isTR2 = i % 2 === 0;
      const baseX = isTR2 ? 7 : -7;
      coronaPos[i * 3] = baseX + (Math.random() - 0.5) * 2.2;
      coronaPos[i * 3 + 1] = 5.2 + (Math.random() - 0.5) * 1.5;
      coronaPos[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
    }
    coronaGeo.setAttribute('position', new THREE.BufferAttribute(coronaPos, 3));
    const coronaMat = new THREE.PointsMaterial({
      size: 0.35,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const coronaParticles = new THREE.Points(coronaGeo, coronaMat);
    scene.add(coronaParticles);
    coronaParticlesRef.current = coronaParticles;

    // Power-flow particles riding the exact catenary curves of each busbar
    const conductorCount = 180;
    const conductorGeo = new THREE.BufferGeometry();
    const conductorPos = new Float32Array(conductorCount * 3);
    const particleLane = new Uint8Array(conductorCount);
    const particleT = new Float32Array(conductorCount);
    const perLane = Math.ceil(conductorCount / 3);
    for (let i = 0; i < conductorCount; i++) {
      particleLane[i] = i % 3;
      particleT[i] = Math.floor(i / 3) / perLane;
      const pt = busCurves[particleLane[i]].getPointAt(particleT[i]);
      conductorPos[i * 3] = pt.x;
      conductorPos[i * 3 + 1] = pt.y;
      conductorPos[i * 3 + 2] = pt.z;
    }
    conductorGeo.setAttribute('position', new THREE.BufferAttribute(conductorPos, 3));
    const conductorMat = new THREE.PointsMaterial({
      size: 0.28,
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const conductorParticles = new THREE.Points(conductorGeo, conductorMat);
    scene.add(conductorParticles);
    conductorParticlesRef.current = conductorParticles;

    // Rain streaks (visible only in the RAIN environment preset)
    const rainCount = 1200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 42;
      rainPos[i * 3 + 1] = Math.random() * 18;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 34;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0x9fb6cc, size: 0.09, transparent: true, opacity: 0.55 });
    const rainPoints = new THREE.Points(rainGeo, rainMat);
    rainPoints.visible = false;
    scene.add(rainPoints);

    // Soft cloud sprites drifting across DAY / SUNSET skies
    const makeCloudTexture = (): THREE.CanvasTexture => {
      const cnv = document.createElement('canvas');
      cnv.width = 256;
      cnv.height = 128;
      const ctx2d = cnv.getContext('2d')!;
      for (let b = 0; b < 26; b++) {
        const gx = 40 + Math.random() * 176;
        const gy = 40 + Math.random() * 48;
        const grad = ctx2d.createRadialGradient(gx, gy, 4, gx, gy, 26 + Math.random() * 22);
        grad.addColorStop(0, 'rgba(255,255,255,0.55)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx2d.fillStyle = grad;
        ctx2d.fillRect(0, 0, 256, 128);
      }
      return new THREE.CanvasTexture(cnv);
    };
    const cloudSprites: Array<{ sprite: THREE.Sprite; speed: number }> = [];
    for (let ci = 0; ci < 6; ci++) {
      const cloudMat = new THREE.SpriteMaterial({
        map: makeCloudTexture(),
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      const cloudSprite = new THREE.Sprite(cloudMat);
      cloudSprite.scale.set(11 + Math.random() * 6, 4.2, 1);
      cloudSprite.position.set(-30 + Math.random() * 60, 21 + (ci % 3) * 2.4, -22 + Math.random() * 14);
      scene.add(cloudSprite);
      cloudSprites.push({ sprite: cloudSprite, speed: 0.14 + Math.random() * 0.12 });
    }

    // Sun disc riding the directional-light vector
    const makeSunTexture = (): THREE.CanvasTexture => {
      const cnv = document.createElement('canvas');
      cnv.width = 128;
      cnv.height = 128;
      const ctx2d = cnv.getContext('2d')!;
      const grad = ctx2d.createRadialGradient(64, 64, 6, 64, 64, 62);
      grad.addColorStop(0, 'rgba(255,250,220,1)');
      grad.addColorStop(0.35, 'rgba(255,225,150,0.85)');
      grad.addColorStop(1, 'rgba(255,210,120,0)');
      ctx2d.fillStyle = grad;
      ctx2d.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(cnv);
    };
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeSunTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    sunSprite.scale.set(24, 24, 1);
    scene.add(sunSprite);

    // Clearance annotation group (engineering dimension mode)
    const annotationsGroup = new THREE.Group();
    annotationsGroup.visible = false;
    scene.add(annotationsGroup);
    annotationsGroupRef.current = annotationsGroup;
    const makeDimensionLabel = (text: string, pos: THREE.Vector3) => {
      const cnv = document.createElement('canvas');
      cnv.width = 512;
      cnv.height = 96;
      const ctx2d = cnv.getContext('2d')!;
      ctx2d.fillStyle = 'rgba(8,12,18,0.88)';
      ctx2d.fillRect(0, 0, 512, 96);
      ctx2d.strokeStyle = '#67e8f9';
      ctx2d.lineWidth = 4;
      ctx2d.strokeRect(2, 2, 508, 92);
      ctx2d.fillStyle = '#a5f3fc';
      ctx2d.font = 'bold 40px monospace';
      ctx2d.textAlign = 'center';
      ctx2d.textBaseline = 'middle';
      ctx2d.fillText(text, 256, 52);
      const tex = new THREE.CanvasTexture(cnv);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const label = new THREE.Sprite(spriteMat);
      label.scale.set(3.6, 0.68, 1);
      label.position.copy(pos);
      annotationsGroup.add(label);
    };
    const makeDimensionLine = (a: THREE.Vector3, b: THREE.Vector3, text: string) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([a, b]);
      const lineMat = new THREE.LineDashedMaterial({ color: 0x67e8f9, dashSize: 0.28, gapSize: 0.18 });
      const dimLine = new THREE.Line(lineGeo, lineMat);
      dimLine.computeLineDistances();
      annotationsGroup.add(dimLine);
      makeDimensionLabel(text, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.45, 0)));
    };
    makeDimensionLine(new THREE.Vector3(-13.4, 0.05, 10), new THREE.Vector3(-13.4, 3.55, 10), 'Ground clearance 3550 mm');
    makeDimensionLine(new THREE.Vector3(23.5, 0.05, 17.5), new THREE.Vector3(23.5, 5.8, 17.5), 'Fence height 5800 mm');
    makeDimensionLine(new THREE.Vector3(-1.75, 9.0, 6), new THREE.Vector3(1.75, 9.0, 6), 'Phase spacing 1750 mm');
    makeDimensionLine(new THREE.Vector3(-13, 0.05, -3.5), new THREE.Vector3(-9, 0.05, -3.5), 'Bay width ~8 m');

    // Drone Patrol Camera Waypoints
    const droneWaypoints = [
      { pos: new THREE.Vector3(0, 18, 24), target: new THREE.Vector3(0, 2.5, 0) },
      { pos: new THREE.Vector3(-7, 4.5, 8.5), target: new THREE.Vector3(-7, 2.5, 0) },
      { pos: new THREE.Vector3(-7, 7.5, 4), target: new THREE.Vector3(-7, 5, 0) },
      { pos: new THREE.Vector3(-11, 3.5, 6), target: new THREE.Vector3(-11, 2, 0) },
      { pos: new THREE.Vector3(0, 3.5, -7), target: new THREE.Vector3(0, 2.1, -12) },
    ];

    // -------------------------------------------------------------
    // 8. RENDER LOOP & INTERACTION CONTROLS
    // -------------------------------------------------------------
    const animClock = new THREE.Clock();

    let dprCurrent = Math.min(window.devicePixelRatio, 2);
    let fpsAccumSec = 0;
    let fpsFrames = 0;
    const snapshotCanvas = () => {
      try {
        const url = renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `substation3d_${Date.now()}.png`;
        link.click();
      } catch {
        /* canvas tainted guard */
      }
    };

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const dtSec = Math.min(animClock.getDelta(), 0.05);

      const currentLoadPct = simulatedLoadPctRef.current;
      const currentOilSpeed = oilFlowSpeedRef.current;
      const autoOrbitActive = isAutoOrbitRef.current;
      const arcFaultActive = showArcFaultEffectRef.current;
      const currentEnv = envPresetRef.current;
      const droneActive = isDroneModeRef.current;
      const droneIndex = droneWaypointIndexRef.current;
      const coronaActive = showCoronaEffectRef.current;

      // Environment & Lighting Presets Logic — sky gradient, IBL, stars, floodlights
      const envNow = Date.now() * 0.001;
      if (currentEnv === 'DAY') {
        skyUniforms.topColor.value.setHex(0x9dc4f0);
        skyUniforms.horizonColor.value.setHex(0xe8f0fa);
        skyUniforms.bottomColor.value.setHex(0x141d2e);
        scene.background = null;
        scene.fog = new THREE.FogExp2(0xbfd4e8, 0.006);
        sunLight.color.setHex(0xfff3c4);
        sunLight.intensity = 1.6;
        starMaterial.opacity = 0;
        scene.environmentIntensity = 1.05;
        floodLightsArr.forEach((fl) => { fl.intensity = 0.5; });
        beaconMeshes.forEach((bc) => { (bc.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4; });
        if (emergencyLightRef.current) emergencyLightRef.current.intensity = 0;
      } else if (currentEnv === 'SUNSET') {
        skyUniforms.topColor.value.setHex(0x2a1a3e);
        skyUniforms.horizonColor.value.setHex(0xff8c42);
        skyUniforms.bottomColor.value.setHex(0x12060a);
        scene.background = null;
        scene.fog = new THREE.FogExp2(0xd97a3f, 0.010);
        sunLight.color.setHex(0xf97316);
        sunLight.intensity = 2.2;
        starMaterial.opacity = 0.35;
        scene.environmentIntensity = 0.55;
        floodLightsArr.forEach((fl) => { fl.intensity = 1.7; });
        beaconMeshes.forEach((bc) => { (bc.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6; });
        if (emergencyLightRef.current) emergencyLightRef.current.intensity = 0;
      } else if (currentEnv === 'NIGHT') {
        skyUniforms.topColor.value.setHex(0x02040a);
        skyUniforms.horizonColor.value.setHex(0x0d1b33);
        skyUniforms.bottomColor.value.setHex(0x010208);
        scene.background = null;
        scene.fog = new THREE.FogExp2(0x05080f, 0.013);
        sunLight.color.setHex(0x93c5fd);
        sunLight.intensity = 0.35;
        starMaterial.opacity = 0.95;
        scene.environmentIntensity = 0.3;
        floodLightsArr.forEach((fl) => { fl.intensity = 2.9; });
        beaconMeshes.forEach((bc, idx) => {
          (bc.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.sin(envNow * 2.2 + idx * 0.4) > 0 ? 2.4 : 0.15;
        });
        if (emergencyLightRef.current) emergencyLightRef.current.intensity = 0;
      } else if (currentEnv === 'RAIN') {
        skyUniforms.topColor.value.setHex(0x39424f);
        skyUniforms.horizonColor.value.setHex(0x6b7684);
        skyUniforms.bottomColor.value.setHex(0x14181f);
        scene.background = null;
        scene.fog = new THREE.FogExp2(0x4a5561, 0.019);
        sunLight.color.setHex(0xcbd5e1);
        sunLight.intensity = 0.5;
        starMaterial.opacity = 0;
        scene.environmentIntensity = 0.5;
        floodLightsArr.forEach((fl) => { fl.intensity = 2.3; });
        beaconMeshes.forEach((bc) => { (bc.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4; });
        if (emergencyLightRef.current) emergencyLightRef.current.intensity = 0;
      } else if (currentEnv === 'EMERGENCY') {
        skyUniforms.topColor.value.setHex(0x1a0508);
        skyUniforms.horizonColor.value.setHex(0x8b1a1a);
        skyUniforms.bottomColor.value.setHex(0x0a0203);
        scene.background = null;
        scene.fog = new THREE.FogExp2(0x2a070a, 0.012);
        sunLight.color.setHex(0xef4444);
        sunLight.intensity = 0.55;
        starMaterial.opacity = 0.45;
        scene.environmentIntensity = 0.38;
        const sirenPulse = Math.sin(Date.now() * 0.008);
        floodLightsArr.forEach((fl, i) => { fl.intensity = sirenPulse > 0 ? 2.2 : 1.2; void i; });
        beaconMeshes.forEach((bc) => {
          (bc.material as THREE.MeshStandardMaterial).emissiveIntensity = sirenPulse > 0 ? 4.5 : 0.2;
        });
        if (emergencyLightRef.current) {
          emergencyLightRef.current.intensity = sirenPulse > 0 ? 12.0 : 1.0;
        }
      }

      // Drone Flight Camera Interpolation
      if (droneActive) {
        const wp = droneWaypoints[droneIndex];
        camera.position.lerp(wp.pos, 0.03);
        const currentLookAt = new THREE.Vector3();
        camera.getWorldDirection(currentLookAt);
        camera.lookAt(wp.target);
      } else if (autoOrbitActive && !isDraggingRef.current) {
        // Auto Orbit Camera Logic
        cameraAngleRef.current.alpha += 0.0022;
        const { alpha, beta, radius } = cameraAngleRef.current;
        camera.position.x = radius * Math.cos(beta) * Math.sin(alpha);
        camera.position.y = radius * Math.sin(beta);
        camera.position.z = radius * Math.cos(beta) * Math.cos(alpha);
        camera.lookAt(0, 2.5, 0);
      } else {
        const { alpha, beta, radius } = cameraAngleRef.current;
        camera.position.x = radius * Math.cos(beta) * Math.sin(alpha);
        camera.position.y = radius * Math.sin(beta);
        camera.position.z = radius * Math.cos(beta) * Math.cos(alpha);
        camera.lookAt(0, 2.5, 0);
      }

      // Animate HV Corona Discharge Aura Particles
      if (coronaParticlesRef.current) {
        coronaParticlesRef.current.visible = coronaActive;
        if (coronaActive) {
          const coronaPosAttr = coronaParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
          const coronaArr = coronaPosAttr.array as Float32Array;
          for (let i = 0; i < coronaCount; i++) {
            coronaArr[i * 3 + 1] += (Math.random() - 0.5) * 0.05;
            if (coronaArr[i * 3 + 1] > 6.2 || coronaArr[i * 3 + 1] < 4.5) {
              coronaArr[i * 3 + 1] = 5.2;
            }
          }
          coronaPosAttr.needsUpdate = true;
        }
      }

      // Animate Power-Flow Particles along the busbar catenaries
      if (conductorParticlesRef.current) {
        const condPosAttr = conductorParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const condArr = condPosAttr.array as Float32Array;
        const flowAdvance = dtSec * 0.045 * (currentLoadPct / 85);
        for (let i = 0; i < conductorCount; i++) {
          particleT[i] = (particleT[i] + flowAdvance) % 1;
          const pt = busCurves[particleLane[i]].getPointAt(particleT[i]);
          condArr[i * 3] = pt.x;
          condArr[i * 3 + 1] = pt.y;
          condArr[i * 3 + 2] = pt.z;
        }
        condPosAttr.needsUpdate = true;
      }

      // Rotate Cooling Fans
      fanMeshesRef.current.forEach((fan) => {
        fan.rotation.z += 0.16 * currentOilSpeed;
      });

      // Animate Oil Circulation Particles
      if (oilParticlesRef.current) {
        const posAttr = oilParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const colAttr = oilParticlesRef.current.geometry.attributes.color as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;
        const colArray = colAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          array[i * 3 + 1] += 0.018 * currentOilSpeed * (currentLoadPct / 80);

          if (array[i * 3 + 1] > 4.4) {
            array[i * 3 + 1] = 0.5;
          }

          const yVal = array[i * 3 + 1];
          const tFactor = (yVal - 0.5) / 3.8;
          const updatedColor = coolColor.clone().lerp(warmColor, Math.min(1.0, tFactor * (currentLoadPct / 85)));
          colArray[i * 3] = updatedColor.r;
          colArray[i * 3 + 1] = updatedColor.g;
          colArray[i * 3 + 2] = updatedColor.b;
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }

      // Hotspot Pulse
      if (hotspotMeshRef.current) {
        const pulse = 1.0 + Math.sin(Date.now() * 0.006) * 0.35 * (currentLoadPct / 100);
        hotspotMeshRef.current.scale.set(pulse, pulse, pulse);
      }


      // Telemetry binding: radiator fans track cooling stage & load
      if (fanMeshesRef.current.length > 0) {
        const fansNow = tr1StateRef.current.fans;
        const stageFactor = (fansNow.fan1 ? 0.6 : 0) + (fansNow.fan2 ? 0.4 : 0);
        const targetSpeed = dtSec * 14 * stageFactor * Math.min(2, Math.max(0.35, currentLoadPct / 85));
        fanVelRef.current += (targetSpeed - fanVelRef.current) * Math.min(1, dtSec * 3);
        fanMeshesRef.current.forEach((fan) => {
          fan.rotation.z += fanVelRef.current;
        });
      }

      // Telemetry binding: OLTC tap dial tracks live tap position (1..17)
      if (tapDialRef.current) {
        const tap = tr1StateRef.current.tapPosition ?? 9;
        tapDialRef.current.children.forEach((child) => {
          if ((child as THREE.Mesh).material === undefined) return;
        });
        const pointer = tapDialRef.current.children[1];
        pointer.rotation.z = -((tap - 1) / 16) * Math.PI * 1.6;
      }

      // Operable disconnectors: drive blade pivots toward switch state
      dsActuatorsRef.current.forEach((actuator) => {
        const isOpen = !tr1StateRef.current.switches[actuator.switchKey];
        actuator.pivots.forEach((pivot, pIdx) => {
          const dir = pIdx === 0 ? 1 : -1;
          const targetRot = isOpen ? dir * 0.95 : 0;
          pivot.rotation.y += (targetRot - pivot.rotation.y) * Math.min(1, dtSec * 2.4);
        });
      });

      // Breaker position flags: rose = closed/energised, green = open
      const hvClosed = tr1StateRef.current.switches.hvBreaker52_1;
      breakerFlagsRef.current.forEach((flag) => {
        const matFlag = flag.material as THREE.MeshStandardMaterial;
        if (hvClosed) {
          matFlag.color.setHex(0xdc2626);
          matFlag.emissive.setHex(0x7f1d1d);
        } else {
          matFlag.color.setHex(0x16a34a);
          matFlag.emissive.setHex(0x166534);
        }
      });

      // SF6 density gauge needle drifts with transformer oil temperature band
      const oilTempNow = tr1StateRef.current.oilTemp ?? 62;
      const needleNorm = THREE.MathUtils.clamp((oilTempNow - 40) / 80, 0, 1);
      sf6NeedlesRef.current.forEach((needle) => {
        needle.rotation.z = -0.6 + needleNorm * 1.2;
      });
      // Arc Fault Flicker
      if (arcLightRef.current) {
        if (arcFaultActive) {
          arcLightRef.current.intensity = Math.random() > 0.3 ? 9.0 : 1.0;
        } else {
          arcLightRef.current.intensity = 0;
        }
      }

      // Rain streaks fall only in the RAIN preset
      rainPoints.visible = currentEnv === 'RAIN';
      if (rainPoints.visible) {
        const rainAttr = rainPoints.geometry.attributes.position as THREE.BufferAttribute;
        const rainArr = rainAttr.array as Float32Array;
        for (let i = 0; i < rainCount; i++) {
          rainArr[i * 3 + 1] -= dtSec * (13 + (i % 7) * 1.4);
          if (rainArr[i * 3 + 1] < 0) rainArr[i * 3 + 1] = 18;
        }
        rainAttr.needsUpdate = true;
      }

      // Clouds drift and fade per environment; sun disc rides the light vector
      const cloudOpacity = currentEnv === 'DAY' ? 0.5 : currentEnv === 'SUNSET' ? 0.75 : currentEnv === 'RAIN' ? 0.9 : 0.06;
      cloudSprites.forEach((cl) => {
        cl.sprite.material.opacity = cloudOpacity;
        cl.sprite.position.x += dtSec * cl.speed * (currentEnv === 'RAIN' ? 2.6 : 1);
        if (cl.sprite.position.x > 34) cl.sprite.position.x = -34;
      });
      const sunDir = new THREE.Vector3().copy(sunLight.position).normalize().multiplyScalar(250);
      sunSprite.position.copy(sunDir);
      sunSprite.visible = currentEnv === 'DAY' || currentEnv === 'SUNSET';
      (sunSprite.material as THREE.SpriteMaterial).color.setHex(currentEnv === 'SUNSET' ? 0xffb347 : 0xfff6d5);

      // Engineering clearance dimensions toggle
      if (annotationsGroupRef.current) {
        annotationsGroupRef.current.visible = showAnnotationsRef.current;
      }

      // Snapshot request: capture right after the frame is drawn
      if (snapshotRequestRef.current) {
        snapshotRequestRef.current = false;
        snapshotCanvas();
      }

      // Adaptive pixel ratio: protect frame rate on weaker GPUs
      fpsAccumSec += dtSec;
      fpsFrames += 1;
      if (fpsAccumSec >= 2.2) {
        const fps = fpsFrames / fpsAccumSec;
        if (fps < 42 && dprCurrent > 0.85) {
          dprCurrent = Math.max(0.85, dprCurrent - 0.25);
          renderer.setPixelRatio(dprCurrent);
          composer.setPixelRatio(dprCurrent);
        } else if (fps > 57 && dprCurrent < Math.min(window.devicePixelRatio, 2)) {
          dprCurrent = Math.min(Math.min(window.devicePixelRatio, 2), dprCurrent + 0.25);
          renderer.setPixelRatio(dprCurrent);
          composer.setPixelRatio(dprCurrent);
        }
        fpsAccumSec = 0;
        fpsFrames = 0;
      }

      composer.render();
    };

    animate();

    // Event listeners for Orbiting and Raycasting
    const domElem = mountRef.current;

    const handlePointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAngleRef.current.alpha -= deltaX * 0.0055;
      cameraAngleRef.current.beta = Math.max(0.05, Math.min(Math.PI / 2.1, cameraAngleRef.current.beta + deltaY * 0.0055));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(8, Math.min(50, cameraAngleRef.current.radius + e.deltaY * 0.015));
    };

    const handleCanvasClick = (e: MouseEvent) => {
      if (!mountRef.current || !cameraRef.current) return;
      const rect = domElem.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

      const targets = clickableMeshesRef.current.map((item) => item.mesh);
      const intersects = raycaster.intersectObjects(targets, true);

      if (intersects.length > 0) {
        let currentObj: THREE.Object3D | null = intersects[0].object;
        let match = null;
        while (currentObj && !match) {
          const targetObj = currentObj;
          const found = clickableMeshesRef.current.find((item) => item.mesh === targetObj);
          if (found) {
            match = found;
            break;
          }
          currentObj = currentObj.parent;
        }
        if (match) {
          setSelectedAsset(match.asset);
        }
      }
    };

    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });
    domElem.addEventListener('click', handleCanvasClick);

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 560;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // ResizeObserver on the canvas container for container layout shifts
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    return () => {
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      domElem.removeEventListener('wheel', handleWheel);
      domElem.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();

      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
        animFrameId.current = null;
      }

      // Memory Management: Traverse scene and dispose geometries/materials
      scene.traverse((object) => {
        if ((object as THREE.Mesh).isMesh || (object as THREE.Points).isPoints || (object as THREE.Line).isLine) {
          const item = object as THREE.Mesh;
          if (item.geometry) {
            item.geometry.dispose();
          }
          if (item.material) {
            const mats = Array.isArray(item.material) ? item.material : [item.material];
            mats.forEach((mat) => {
              Object.values(mat).forEach((value) => {
                if (value && (value as THREE.Texture).isTexture) {
                  (value as THREE.Texture).dispose();
                }
              });
              mat.dispose();
            });
          }
        }
      });
      proceduralTextures.forEach((tex) => tex.dispose());
      envRenderTarget.dispose();
      pmremGenerator.dispose();

      composer.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [viewMode]);

  // Telemetry properties according to selected asset
  const getAssetTelemetry = () => {
    switch (selectedAsset) {
      case 'TR1':
        return {
          title: isAr ? 'محول القدرة الرئيسي TR-1' : 'TR-1 Main Power Transformer',
          rating: isAr ? '40 م.ف.أ • 132/13.8 ك.ف' : '40 MVA • 132/13.8 kV',
          status: isAr ? 'قيد التشغيل (متصل بالشبكة)' : 'OPERATIONAL (ONLINE)',
          temp: `${((tr1State?.windingTemp ?? 71.8) * (simulatedLoadPct / 85)).toFixed(1)} °C`,
          oilTemp: `${((tr1State?.oilTemp ?? 62.4) * (simulatedLoadPct / 85)).toFixed(1)} °C`,
          pressure: isAr ? '1.08 بار SF6 / نيتروجين' : '1.08 bar SF6 / Nitrogen',
          healthScore: isAr ? '98.4% (مثالي)' : '98.4% (Optimal)',
          lastMaintenance: isAr ? '2026-05-14 (تحليل DGA سليم)' : '2026-05-14 (DGA Normal)'
        };
      case 'TR2':
        return {
          title: isAr ? 'محول القدرة الاحتياطي TR-2' : 'TR-2 Secondary Power Transformer',
          rating: isAr ? '40 م.ف.أ • 132/13.8 ك.ف' : '40 MVA • 132/13.8 kV',
          status: isAr ? 'جاهزية احتياطية / توازي' : 'STANDBY / PARALLEL',
          temp: '58.2 °C',
          oilTemp: '48.6 °C',
          pressure: isAr ? '1.05 بار' : '1.05 bar',
          healthScore: isAr ? '99.1% (ممتاز)' : '99.1% (Excellent)',
          lastMaintenance: isAr ? '2026-06-02 (إعادة تنقية الزيت)' : '2026-06-02 (Oil Re-filtered)'
        };
      case 'HV_BUSHING':
        return {
          title: isAr ? 'عازل اختراق جهد عالي 132kV بورسلين (أطوار A/B/C)' : '132kV Porcelain HV Bushing (Phase A/B/C)',
          rating: isAr ? '132 ك.ف • 1250A أقصى تيار' : '132 kV • 1250A Peak',
          status: isAr ? 'مراقبة التفريغ الجزئي UHF: طبيعي' : 'UHF PD MONITORING: NORMAL',
          temp: `${(38.5 + simulatedLoadPct * 0.15).toFixed(1)} °C`,
          oilTemp: isAr ? 'غير متاح (تدرج سعوي)' : 'N/A (Capacitive Graded)',
          pressure: isAr ? '< 15 بيكوكولوم تفريغ' : '< 15 pC Discharge',
          healthScore: '97.2%',
          lastMaintenance: isAr ? '2026-02-10 (اختبار تان دلتا C1/C2)' : '2026-02-10 (C1/C2 Tan Delta Test)'
        };
      case 'SF6_BREAKER':
        return {
          title: isAr ? 'قاطع دورة غازي 52-1 SF6' : '52-1 SF6 Gas Circuit Breaker',
          rating: isAr ? '145 ك.ف • سعة عطل 31.5 ك.أ' : '145 kV • 31.5 kA Fault Rating',
          status: isAr ? 'مغلق (مسلح)' : 'CLOSED (ARMED)',
          temp: '32.0 °C',
          oilTemp: isAr ? 'غير متاح' : 'N/A',
          pressure: isAr ? '6.2 بار ضغط غاز SF6' : '6.2 bar SF6 Gas Pressure',
          healthScore: '96.8%',
          lastMaintenance: isAr ? '2026-04-18 (عمليات الآلية: 142)' : '2026-04-18 (Mechanism Operations: 142)'
        };
      case 'DISCONNECTOR':
        return {
          title: isAr ? 'سكينة فصل خط بمحرك 89-1' : '89-1 Motorized Line Disconnector',
          rating: isAr ? '132 ك.ف • تيار مقنن 1600A' : '132 kV • 1600A Rating',
          status: isAr ? 'مغلق (معشق ميكانيكياً)' : 'CLOSED (INTERLOCKED)',
          temp: '31.2 °C',
          oilTemp: isAr ? 'غير متاح' : 'N/A',
          pressure: isAr ? 'غير متاح' : 'N/A',
          healthScore: '100.0%',
          lastMaintenance: '2026-01-22'
        };
      case 'OLTC_HOUSING':
        return {
          title: isAr ? 'مغير التفريع تحت الحمل (OLTC) مفرغ هوائياً' : 'On-Load Tap Changer (OLTC) Vacuum Diverter',
          rating: isAr ? '17 تفريعة (نطاق ±10%)' : '17 Taps (±10% Range)',
          status: isAr ? `موضع التفريعة: ${tr1State?.tapPosition ?? 9} / 17` : `TAP POSITION: ${tr1State?.tapPosition ?? 9} / 17`,
          temp: `${(52.0 + simulatedLoadPct * 0.12).toFixed(1)} °C`,
          oilTemp: '51.2 °C',
          pressure: isAr ? 'حجرة زيت معزولة' : 'Oil Compartment Isolated',
          healthScore: '95.4%',
          lastMaintenance: isAr ? '2026-03-30 (فحص مفتاح التحويل)' : '2026-03-30 (Diverter Switch Inspection)'
        };
      case 'RADIATOR_BANK':
        return {
          title: isAr ? 'مجموعة مشعات تبريد زيتي وهوائي قسري (OFAF)' : 'Forced Oil Forced Air (OFAF) Radiator Bank',
          rating: isAr ? '24 زعنفة تبريد • 4 مراوح متغيرة' : '24 Cooling Fins • 4 Variable Fans',
          status: isAr ? 'المراوح تعمل (تلقائي)' : 'FANS ACTIVE (AUTOMATIC)',
          temp: isAr ? '44.2 °C المخرج' : '44.2 °C Outlet',
          oilTemp: isAr ? '56.8 °C المدخل' : '56.8 °C Inlet',
          pressure: isAr ? '1.8 م³/ث سرعة الهواء' : '1.8 m3/s Air Velocity',
          healthScore: '98.0%',
          lastMaintenance: '2026-06-12'
        };
      case 'SURGE_ARRESTER':
        return {
          title: isAr ? 'مانعة صواعق بدون ثغرات من أكسيد الزنك (ZnO)' : 'Zinc Oxide (ZnO) Gapless Surge Arrester',
          rating: isAr ? '120 ك.ف MCOV • 10 ك.أ فئة 3' : '120 kV MCOV • 10 kA Class 3',
          status: isAr ? 'تيار التسرب: 0.42 ميلي أمبير' : 'LEAKAGE CURRENT: 0.42 mA',
          temp: '28.5 °C',
          oilTemp: isAr ? 'غير متاح' : 'N/A',
          pressure: isAr ? 'عداد الصدمات: 04' : 'Surge Counter: 04',
          healthScore: '99.5%',
          lastMaintenance: '2026-01-15'
        };
      case 'CT_VT_METERING':
        return {
          title: isAr ? 'محولات القياس والحماية (CT / VT)' : 'Instrument Metering Transformer (CT / VT)',
          rating: isAr ? '132 ك.ف / 110 ف • 600/5A فئة 0.2S' : '132kV / 110V • 600/5A Class 0.2S',
          status: isAr ? 'الحمل: 1.4 ف.أ • دقيق' : 'BURDEN: 1.4 VA • ACCURATE',
          temp: '30.5 °C',
          oilTemp: isAr ? 'مغلق بإحكام' : 'Hermetically Sealed',
          pressure: isAr ? '0.98 بار' : '0.98 bar',
          healthScore: '99.2%',
          lastMaintenance: '2026-03-11'
        };
      default:
        return {
          title: isAr ? 'نظرة عامة على ساحة المفاتيح بالمحطة' : 'Substation Switchyard Overview',
          rating: isAr ? 'عقدة شبكة 132/13.8 ك.ف' : '132/13.8 kV Grid Node',
          status: isAr ? 'تردد الشبكة الاسمي 50.0 هرتز' : 'NOMINAL GRID FREQUENCY 50.0 Hz',
          temp: isAr ? 'المحيط: 32.0 °C' : 'Ambient: 32.0 °C',
          oilTemp: isAr ? 'غير متاح' : 'N/A',
          pressure: isAr ? 'غير متاح' : 'N/A',
          healthScore: '98.5%',
          lastMaintenance: isAr ? 'جميع الأنظمة سليمة' : 'All Systems Green'
        };
    }
  };

  const assetInfo = getAssetTelemetry();

  return (
    <div className="space-y-5 font-sans text-zinc-100">
      {/* Command Row — identity, view modes, live status */}
      <div className="bg-[#09090b] border border-zinc-800 rounded-2xl px-4 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-700/80 rounded-xl text-cyan-400 shrink-0">
            <Box className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white font-mono tracking-wide truncate">{t('threed_title')}</h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] font-mono font-extrabold">
                WEBGL PBR
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{t('threed_subtitle')}</p>
          </div>
        </div>

        {/* View Mode Segmented Control */}
        <div
          role="tablist"
          aria-label={isAr ? 'وضع العرض' : 'View mode'}
          className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl"
        >
          {([
            { id: 'WALKTHROUGH' as const, icon: Eye, label: t('threed_view_switchyard'), active: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' },
            { id: 'CUTAWAY' as const, icon: Layers, label: t('threed_view_cutaway'), active: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' },
            { id: 'XRAY_THERMAL' as const, icon: Flame, label: t('threed_view_xray'), active: 'bg-purple-600 text-white shadow-md shadow-purple-600/30' },
          ]).map((vm) => (
            <button
              key={vm.id}
              role="tab"
              aria-selected={viewMode === vm.id}
              title={vm.label}
              onClick={() => setViewMode(vm.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
                viewMode === vm.id ? vm.active : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <vm.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{vm.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Immersive 3D Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* 3D Canvas Area (3 Columns) */}
        <div className="lg:col-span-3 bg-[#09090b] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div ref={mountRef} className="w-full h-[600px] cursor-grab active:cursor-grabbing" />

          {/* Floating Scene Toolbar — environment & layers */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 rtl:translate-x-1/2 flex flex-wrap items-center justify-center gap-1 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-xl px-2 py-1.5 shadow-xl max-w-[95%]">
            {([
              { id: 'DAY' as const, icon: Sun, label: isAr ? 'نهار' : 'Day', on: 'bg-cyan-950 border-cyan-600 text-cyan-300', dot: 'bg-cyan-400' },
              { id: 'SUNSET' as const, icon: Sunset, label: isAr ? 'غروب' : 'Sunset', on: 'bg-amber-950 border-amber-600 text-amber-300', dot: 'bg-amber-400' },
              { id: 'NIGHT' as const, icon: Moon, label: isAr ? 'ليل' : 'Night', on: 'bg-indigo-950 border-indigo-600 text-indigo-300', dot: 'bg-indigo-400' },
              { id: 'RAIN' as const, icon: CloudRain, label: isAr ? 'مطر' : 'Rain', on: 'bg-slate-800 border-slate-500 text-slate-200', dot: 'bg-slate-300' },
              { id: 'EMERGENCY' as const, icon: Siren, label: isAr ? 'طوارئ' : 'Emergency', on: 'bg-rose-950 border-rose-600 text-rose-300 animate-pulse', dot: 'bg-rose-400' },
            ]).map((p) => (
              <button
                key={p.id}
                onClick={() => setEnvPreset(p.id)}
                title={p.label}
                aria-label={p.label}
                aria-pressed={envPreset === p.id}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
                  envPreset === p.id ? `${p.on} shadow-md` : 'border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <p.icon className="w-4 h-4" />
              </button>
            ))}

            <span className="w-px h-6 bg-zinc-800 mx-0.5" aria-hidden="true" />

            {([
              { icon: Sparkles, label: isAr ? 'هالة القر Corona' : 'HV Corona Aura', state: showCoronaEffect, toggle: () => setShowCoronaEffect(!showCoronaEffect), on: 'text-cyan-300 bg-cyan-950/80' },
              { icon: Radio, label: isAr ? 'بطاقات AR' : 'AR Labels', state: showARLabels, toggle: () => setShowARLabels(!showARLabels), on: 'text-emerald-300 bg-emerald-950/80' },
              { icon: Activity, label: isAr ? 'تدفق الطاقة' : 'Energy Flow', state: showEnergyFlow, toggle: () => setShowEnergyFlow(!showEnergyFlow), on: 'text-amber-300 bg-amber-950/80' },
            ]).map((tItem) => (
              <button
                key={tItem.label}
                onClick={tItem.toggle}
                title={`${tItem.label}: ${tItem.state ? 'ON' : 'OFF'}`}
                aria-label={tItem.label}
                aria-pressed={tItem.state}
                className={`h-9 px-2.5 rounded-lg border border-transparent flex items-center gap-1.5 text-[11px] font-mono font-bold transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
                  tItem.state ? tItem.on : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <tItem.icon className="w-4 h-4" />
                <span className="hidden xl:inline">{tItem.label}</span>
              </button>
            ))}
          </div>

          {/* Drone Patrol Flight HUD Overlay */}
          {isDroneMode && (
            <div className="absolute inset-0 pointer-events-none border-2 border-purple-500/50 p-6 flex flex-col justify-between select-none">
              <div className="flex justify-between items-start font-mono">
                <div className="bg-purple-950/90 border border-purple-600 px-3 py-1.5 rounded-xl text-purple-200 text-xs shadow-2xl flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-400 animate-spin" />
                  <div>
                    <span className="font-extrabold uppercase block text-[10px] text-purple-400">AUTONOMOUS DRONE PATROL</span>
                    <span className="font-bold">
                      {droneWaypointIndex === 0 && 'Station 01: Full Switchyard Overview'}
                      {droneWaypointIndex === 1 && 'Station 02: TR-1 Transformer & OLTC'}
                      {droneWaypointIndex === 2 && 'Station 03: 132kV Porcelain Bushings'}
                      {droneWaypointIndex === 3 && 'Station 04: SF6 Breaker 52-1 Bay'}
                      {droneWaypointIndex === 4 && 'Station 05: Surge Arresters & Earthing Bay'}
                    </span>
                  </div>
                </div>
                <div className="bg-purple-950/90 border border-purple-600 px-3 py-1.5 rounded-xl text-purple-200 text-xs font-bold font-mono">
                  ALT: 18.4m • VEL: 3.8m/s • BAT: 94%
                </div>
              </div>

              {/* Drone Center Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border border-purple-400/60 rounded-full flex items-center justify-center">
                  <Crosshair className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
              </div>

              <div className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-3 py-1 rounded-lg border border-purple-800 flex items-center gap-1.5">
                <Camera className="w-3 h-3" aria-hidden="true" />
                4K FLIR THERMAL & OPTICAL STREAM ACTIVE (60 FPS)
              </div>
            </div>
          )}

          {/* AR Floating Spatial Labels Overlay */}
          {showARLabels && !isDroneMode && (
            <div className="absolute inset-0 pointer-events-none p-4 select-none">
              {/* TR-1 AR Spatial Card */}
              <div className="absolute top-[28%] left-[22%] bg-zinc-950/90 border border-cyan-500/80 p-2 rounded-xl text-[10px] font-mono shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-1.5 text-cyan-300 font-extrabold">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>TR-1 (40 MVA)</span>
                </div>
                <div className="text-zinc-300 font-bold mt-0.5">132/13.8kV • 58.4°C • {simulatedLoadPct}% Load</div>
              </div>

              {/* TR-2 AR Spatial Card */}
              <div className="absolute top-[28%] right-[24%] bg-zinc-950/90 border border-cyan-500/80 p-2 rounded-xl text-[10px] font-mono shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-1.5 text-cyan-300 font-extrabold">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>TR-2 (40 MVA)</span>
                </div>
                <div className="text-zinc-300 font-bold mt-0.5">132/13.8kV • 52.1°C • 78% Load</div>
              </div>

              {/* SF6 Breaker AR Card */}
              <div className="absolute top-[48%] left-[10%] bg-zinc-950/90 border border-emerald-500/80 p-2 rounded-xl text-[10px] font-mono shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-1.5 text-emerald-300 font-extrabold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>BREAKER 52-1</span>
                </div>
                <div className="text-zinc-300 font-bold mt-0.5">CLOSED • 6.2 bar SF6</div>
              </div>
            </div>
          )}

          {/* Selected Asset Chip (top-left, slim) */}
          <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-xl px-3 py-2 font-mono text-xs shadow-xl flex items-center gap-2.5 max-w-[280px]">
            <Crosshair className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-cyan-300 font-bold text-[10px] uppercase tracking-wider">{t('threed_active_raycast')}</span>
                <span className="text-[9px] bg-cyan-950 border border-cyan-700 text-cyan-300 px-1.5 py-0 rounded font-extrabold">{selectedAsset}</span>
              </div>
              <div className="text-white font-bold truncate">{assetInfo.title}</div>
            </div>
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full shrink-0 ${showArcFaultEffect ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`}
            />
          </div>

          {/* Scene Dock — camera presets, orbit & drone (top-right, collapsible) */}
          <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
            <button
              onClick={() => setIsSceneDockOpen(!isSceneDockOpen)}
              aria-expanded={isSceneDockOpen}
              aria-label={isAr ? 'لوحة المشهد' : 'Scene dock'}
              className="w-full px-3 py-2 flex items-center justify-between gap-3 text-[10px] font-mono font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
            >
              <span className="uppercase tracking-wider">{isAr ? 'الكاميرا والمشهد' : 'Camera & Scene'}</span>
              {isSceneDockOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isSceneDockOpen && (
              <div className="px-2 pb-2 space-y-1 min-w-[190px]">
                {([
                  { id: 'OVERVIEW' as const, label: t('threed_preset_full') },
                  { id: 'TR1_FOCUS' as const, label: t('threed_preset_tr1') },
                  { id: 'BUSHINGS' as const, label: isAr ? 'البوشينغ 132kV' : 'HV Bushings' },
                  { id: 'BREAKERS' as const, label: isAr ? 'قواطع SF6' : 'SF6 Breakers' },
                  { id: 'GANTRIES' as const, label: isAr ? 'أبراج التعليق' : 'Gantry Towers' },
                ]).map((cp) => (
                  <button
                    key={cp.id}
                    onClick={() => applyCameraPreset(cp.id)}
                    aria-pressed={cameraPreset === cp.id}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left rtl:text-right text-[11px] font-mono font-bold transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
                      cameraPreset === cp.id ? 'bg-cyan-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    {cp.label}
                  </button>
                ))}

                <span className="block w-full h-px bg-zinc-800 my-1" aria-hidden="true" />

                <button
                  onClick={() => setIsAutoOrbit(!isAutoOrbit)}
                  aria-pressed={isAutoOrbit}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
                    isAutoOrbit ? 'bg-emerald-950 text-emerald-300' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Orbit className="w-3.5 h-3.5" />
                  {isAutoOrbit ? (isAr ? 'الدوران: نشط' : 'Orbit: ON') : isAr ? 'الدوران: متوقف' : 'Orbit: OFF'}
                </button>
                <button
                  onClick={() => {
                    setIsDroneMode(!isDroneMode);
                    if (!isDroneMode) setIsAutoOrbit(false);
                  }}
                  aria-pressed={isDroneMode}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
                    isDroneMode ? 'bg-purple-950 text-purple-300 animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Radar className="w-3.5 h-3.5" />
                  {isDroneMode ? (isAr ? 'الجولة الجوية: نشطة' : 'Drone Patrol: ACTIVE') : isAr ? 'الجولة الجوية: متوقفة' : 'Drone Patrol: OFF'}
                </button>
                  <span className="block w-full h-px bg-zinc-800 my-1" aria-hidden="true" />
                  <button
                    onClick={() => setShowAnnotations(!showAnnotations)}
                    aria-pressed={showAnnotations}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-2 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
                      showAnnotations ? 'bg-cyan-950 text-cyan-300' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    Clearance Dims
                  </button>
                  <button
                    onClick={() => { snapshotRequestRef.current = true; }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Snapshot PNG
                  </button>
              </div>
            )}
          </div>

          {/* Simulation Control Strip */}
          <div className="absolute bottom-3 left-3 right-3 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono text-xs">
            {/* Load Adjustment Slider */}
            <div className="flex items-center gap-3 min-w-[240px] flex-1 sm:flex-none">
              <Sliders className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              <label htmlFor="twin-load-slider" className="text-zinc-300 font-bold whitespace-nowrap">
                {t('threed_sim_load')}
              </label>
              <input
                id="twin-load-slider"
                type="range"
                min="30"
                max="150"
                step="5"
                value={simulatedLoadPct}
                onChange={(e) => setSimulatedLoadPct(parseInt(e.target.value))}
                className="w-full sm:w-32 accent-amber-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
              />
              <span
                className={`font-bold tabular-nums whitespace-nowrap ${
                  simulatedLoadPct > 110 ? 'text-rose-400 animate-pulse' : simulatedLoadPct > 100 ? 'text-amber-300' : 'text-emerald-400'
                }`}
              >
                {simulatedLoadPct}%
                {simulatedLoadPct > 100 && (
                  <span className="ml-1 text-rose-400">{t('threed_overload')}</span>
                )}
              </span>
            </div>

            {/* Arc Fault Test Trigger */}
            <button
              onClick={() => setShowArcFaultEffect(!showArcFaultEffect)}
              aria-pressed={showArcFaultEffect}
              className={`px-3.5 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
                showArcFaultEffect
                  ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-lg shadow-rose-600/30'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>{showArcFaultEffect ? t('threed_stop_arc') : t('threed_test_arc')}</span>
            </button>
          </div>
        </div>

        {/* Selected Asset Detailed Diagnostics Sidebar (1 Column) */}
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white uppercase">{t('threed_asset_inspector')}</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                {selectedAsset}
              </span>
            </div>

            {/* Asset Selector — 2-column chip grid */}
            <div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase mb-2 flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                {t('threed_click_select')}
              </div>
              <div role="listbox" aria-label={isAr ? 'اختيار المعدة' : 'Select asset'} className="grid grid-cols-2 gap-1.5">
                {(['TR1', 'TR2', 'HV_BUSHING', 'SF6_BREAKER', 'DISCONNECTOR', 'OLTC_HOUSING', 'RADIATOR_BANK', 'SURGE_ARRESTER', 'CT_VT_METERING'] as AssetType[]).map((ast) => (
                  <button
                    key={ast}
                    role="option"
                    aria-selected={selectedAsset === ast}
                    onClick={() => setSelectedAsset(ast)}
                    className={`px-2 py-1.5 rounded-lg text-left rtl:text-right text-[10px] font-mono font-bold transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none ${
                      selectedAsset === ast
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                        : hoveredAsset === ast
                        ? 'bg-zinc-800 text-cyan-300'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {ast.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-600 mt-2 flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" aria-hidden="true" />
                {isAr ? 'أو انقر المعدة مباشرة داخل المشهد' : 'or click the asset directly in the scene'}
              </p>

              {selectedAsset === 'DISCONNECTOR' && (
                <div className="mt-3 p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
                  <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">
                    {isAr ? 'تشغيل الفواصل (مع التعشيق)' : 'Operate Disconnectors (interlocked)'}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([['TR-1', 'mvDisconnect89_2'], ['TR-2', 'mvDisconnect89_5']] as const).map(([trId, key]) => (
                      <button
                        key={key}
                        onClick={() => {
                          const result = toggleSwitch(trId, key);
                          addToast(
                            result.success ? (isAr ? 'مناورة مقبولة' : 'Operation accepted') : (isAr ? 'تعشيق يمنع العملية' : 'Interlock rejected'),
                            result.message,
                            result.success ? 'success' : 'error'
                          );
                        }}
                        className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-700 text-zinc-200 hover:text-white text-[10px] font-mono font-bold transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 outline-none"
                      >
                        {trId} 89-{trId === 'TR-1' ? '2' : '5'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">{t('threed_asset_name')}</div>
                <div className="text-sm font-bold text-white">{assetInfo.title}</div>
                <div className="text-[10px] text-zinc-400">{assetInfo.rating}</div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">{t('threed_op_state')}</div>
                <div className="text-xs font-bold text-emerald-400">{assetInfo.status}</div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">{t('threed_meas_temp')}</div>
                <div className="text-lg font-bold text-amber-400">{assetInfo.temp}</div>
                <div className="text-[10px] text-zinc-400">{t('threed_oil_temp')}: {assetInfo.oilTemp}</div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">{t('threed_pressure_diag')}</div>
                <div className="text-xs font-bold text-purple-300">{assetInfo.pressure}</div>
                <div className="text-[10px] text-zinc-400">{t('threed_health_index')}: {assetInfo.healthScore}</div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase">{t('threed_last_maint')}</div>
                <div className="text-[11px] text-zinc-300">{assetInfo.lastMaintenance}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl text-xs">
            <div className="text-white font-bold flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-cyan-400" aria-hidden="true" /> {t('threed_nav_guide_title')}
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              {t('threed_nav_guide_text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
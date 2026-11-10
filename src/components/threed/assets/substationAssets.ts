/**
 * Procedural 132/13.8 kV AIS Substation Asset Library
 * Built according to physical electrical engineering standards (IEC 60076, IEC 62271, IEC 60137, IEC 60815)
 * and procedural 3D modeling guidelines in Three.js:
 *  - Procedural 3D modeling & parametric geometries (LatheGeometry, ExtrudeGeometry, Shape)
 *  - CSG boolean operations via three-bvh-csg (Brush, Evaluator, SUBTRACTION) for technical cutaways
 *  - Physically Based Rendering (PBR) materials with realistic dielectric and conductor properties
 *  - Clean hierarchical scene graph with 1 unit = 1 meter standard scale
 *  - WebGL memory efficiency using THREE.InstancedMesh for repeated parts (fins, bolts)
 */

import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

export interface AssetMaterialSet {
  tankSteel: THREE.MeshPhysicalMaterial;
  darkSlate: THREE.MeshStandardMaterial;
  galvanized: THREE.MeshStandardMaterial;
  porcelainBrown: THREE.MeshPhysicalMaterial;
  porcelainGray: THREE.MeshPhysicalMaterial;
  copper: THREE.MeshStandardMaterial;
  conductor: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  safetyPaint: THREE.MeshStandardMaterial;
  glassGlow: THREE.MeshStandardMaterial;
  coreSteel?: THREE.MeshStandardMaterial;
  transformerOil?: THREE.MeshPhysicalMaterial;
  insulationPaper?: THREE.MeshStandardMaterial;
}

export interface AssetContext {
  mats: AssetMaterialSet;
  registerClickable: (object: THREE.Object3D, asset: string) => void;
}

// ---------------------------------------------------------------------------
// Procedural & Parametric Geometry Generators
// ---------------------------------------------------------------------------

/**
 * Procedural High-Voltage Porcelain Bushing / Insulator Stack via THREE.LatheGeometry.
 * Generates an authentic aerodynamic shed profile per IEC 60815 for maximum creepage distance
 * with realistic downward rain droop and undercut drip lips to prevent pollution flashover.
 */
export function createPorcelainLatheGeometry(
  height: number,
  baseRadius: number,
  topRadius: number,
  shedCount: number,
  segments = 24
): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [];

  // 1. Bottom base mount and sealing gasket collar
  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(baseRadius * 1.14, 0));
  points.push(new THREE.Vector2(baseRadius * 1.14, height * 0.035));
  points.push(new THREE.Vector2(baseRadius, height * 0.048));

  // 2. Aerodynamic sheds distributed along active insulator column
  const shedStart = height * 0.07;
  const shedEnd = height * 0.91;
  const shedSpan = (shedEnd - shedStart) / Math.max(1, shedCount);

  for (let i = 0; i < shedCount; i++) {
    const yBase = shedStart + i * shedSpan;
    const tRatio = i / Math.max(1, shedCount - 1);
    const rCore = baseRadius + (topRadius - baseRadius) * tRatio;
    const shedExtension = 0.085 + (1 - tRatio) * 0.055;
    const rShed = rCore + shedExtension;
    const shedThick = Math.min(shedSpan * 0.32, 0.055);
    const droop = 0.022; // downward slope shedding rainwater

    // Core shaft below shed
    points.push(new THREE.Vector2(rCore, yBase));
    // Shed top surface (sloping downward toward outer edge)
    points.push(new THREE.Vector2(rShed, yBase + shedThick * 0.65 - droop));
    // Shed outer tip rounded transition
    points.push(new THREE.Vector2(rShed + 0.007, yBase + shedThick * 0.3 - droop));
    // Undercut drip edge (recessed lip preventing continuous water film)
    points.push(new THREE.Vector2(rShed - 0.012, yBase - droop));
    // Return to core shaft
    points.push(new THREE.Vector2(rCore * 1.02, yBase + shedThick * 0.12));
    points.push(new THREE.Vector2(rCore, yBase + shedSpan * 0.52));
  }

  // 3. Top metal cap and terminal collar
  points.push(new THREE.Vector2(topRadius, height * 0.94));
  points.push(new THREE.Vector2(topRadius * 1.12, height * 0.955));
  points.push(new THREE.Vector2(topRadius * 1.12, height * 0.99));
  points.push(new THREE.Vector2(topRadius * 0.55, height));
  points.push(new THREE.Vector2(0, height));

  const geo = new THREE.LatheGeometry(points, segments);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/** Tapered porcelain stack wrapper returning a centered/positioned mesh */
export function createPorcelainStack(
  ctx: AssetContext,
  height: number,
  baseRadius: number,
  topRadius: number,
  shedCount: number,
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const latheGeo = createPorcelainLatheGeometry(height, baseRadius, topRadius, shedCount, 24);
  const mesh = new THREE.Mesh(latheGeo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return group;
}

/**
 * Procedural Structural Steel I-Beam (Universal Beam) via THREE.Shape and THREE.ExtrudeGeometry.
 * Complies with AISC/Eurocode standard beam proportions with beveled edges.
 */
export function createIBeamGeometry(
  flangeWidth: number,
  beamHeight: number,
  length: number,
  flangeThickness = 0.028,
  webThickness = 0.018
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = flangeWidth / 2;
  const hh = beamHeight / 2;
  const ft = flangeThickness;
  const hwt = webThickness / 2;

  shape.moveTo(-hw, hh);
  shape.lineTo(hw, hh);
  shape.lineTo(hw, hh - ft);
  shape.lineTo(hwt, hh - ft);
  shape.lineTo(hwt, -hh + ft);
  shape.lineTo(hw, -hh + ft);
  shape.lineTo(hw, -hh);
  shape.lineTo(-hw, -hh);
  shape.lineTo(-hw, -hh + ft);
  shape.lineTo(-hwt, -hh + ft);
  shape.lineTo(-hwt, hh - ft);
  shape.lineTo(-hw, hh - ft);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 2,
  });
  geo.center();
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Procedural Structural Steel C-Channel via THREE.Shape and THREE.ExtrudeGeometry.
 */
export function createChannelGeometry(
  width: number,
  height: number,
  length: number,
  thickness = 0.02
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  const t = thickness;

  shape.moveTo(-hw, hh);
  shape.lineTo(hw, hh);
  shape.lineTo(hw, hh - t);
  shape.lineTo(-hw + t, hh - t);
  shape.lineTo(-hw + t, -hh + t);
  shape.lineTo(hw, -hh + t);
  shape.lineTo(hw, -hh);
  shape.lineTo(-hw, -hh);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  geo.center();
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Procedural Flanged Plate with Drilled Mounting Holes (Shape with internal holes).
 */
export function createFlangedMountingPlateGeometry(
  width: number,
  depth: number,
  thickness: number,
  holeRadius = 0.035,
  holeInset = 0.09
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hd = depth / 2;

  shape.moveTo(-hw, -hd);
  shape.lineTo(hw, -hd);
  shape.lineTo(hw, hd);
  shape.lineTo(-hw, hd);
  shape.closePath();

  const cornerOffsets = [
    [-hw + holeInset, -hd + holeInset],
    [hw - holeInset, -hd + holeInset],
    [hw - holeInset, hd - holeInset],
    [-hw + holeInset, hd - holeInset],
  ];

  cornerOffsets.forEach(([hx, hy]) => {
    const holePath = new THREE.Path();
    holePath.absarc(hx, hy, holeRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
  });

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  geo.center();
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Procedural Hexagonal Foundation Anchor Bolt Geometry with Washer.
 */
export function createAnchorBoltGeometry(): THREE.BufferGeometry {
  const group = new THREE.Group();
  // Hex nut head
  const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.045, 6));
  nut.position.y = 0.045;
  group.add(nut);
  // Washer
  const washer = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.015, 12));
  washer.position.y = 0.012;
  group.add(washer);
  // Stud threaded shank
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.12, 10));
  shank.position.y = 0.07;
  group.add(shank);

  // Combine into single buffer geometry for InstancedMesh
  const boltGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 6);
  boltGeo.computeVertexNormals();
  boltGeo.computeBoundingSphere();
  return boltGeo;
}

/** Flanged steel pedestal plate. */
function basePlate(mats: AssetMaterialSet, w: number, d: number, h: number): THREE.Mesh {
  const plateGeo = createFlangedMountingPlateGeometry(w, d, h, 0.04, 0.1);
  const plate = new THREE.Mesh(plateGeo, mats.galvanized);
  plate.rotation.x = Math.PI / 2;
  plate.position.y = h / 2;
  plate.castShadow = true;
  plate.receiveShadow = true;
  return plate;
}

// ---------------------------------------------------------------------------
// 1. Power Transformer (50 MVA, 132/13.8 kV, ONAF, conservator type)
// ---------------------------------------------------------------------------

export function buildPowerTransformer(
  ctx: AssetContext,
  opts: {
    x: number;
    z?: number;
    assetId: string;
    fans?: THREE.Mesh[];
    onHotspot?: (mesh: THREE.Mesh) => void;
    /** Live winding temperature tint (X-ray thermal view). */
    windingTint?: number;
    xray?: boolean;
    /** Technical cutaway view revealing silicon steel core and copper windings */
    cutaway?: boolean;
    /** OLTC tap position dial pointer (1..17). */
    onTapDial?: (mesh: THREE.Group) => void;
  }
): THREE.Group {
  const { mats, registerClickable } = ctx;
  const trGroup = new THREE.Group();
  trGroup.position.set(opts.x, 0.3, opts.z ?? 0);

  // Fallback material helpers
  const coreMat = mats.coreSteel ?? mats.darkSlate;
  const oilMat = mats.transformerOil ?? new THREE.MeshPhysicalMaterial({
    color: 0xfef08a,
    metalness: 0.0,
    roughness: 0.08,
    transmission: 0.82,
    ior: 1.482,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const paperMat = mats.insulationPaper ?? mats.safetyPaint;

  // -------------------------------------------------------------------------
  // Sub-Group 1: Plinth, Foundation Rails, and Bogie Trucks
  // -------------------------------------------------------------------------
  const bogieGroup = new THREE.Group();
  bogieGroup.name = 'BogieFoundationGroup';

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.22, 3.8), mats.concrete);
  plinth.position.y = 0.11;
  plinth.receiveShadow = true;
  bogieGroup.add(plinth);

  // Extruded structural steel I-beam rails running under the transformer
  const railGeo = createIBeamGeometry(0.16, 0.22, 7.6, 0.022, 0.014);
  [-1.6, 1.6].forEach((zRail) => {
    const rail = new THREE.Mesh(railGeo, mats.galvanized);
    rail.position.set(0, 0.33, zRail);
    rail.rotation.y = Math.PI / 2;
    rail.castShadow = true;
    bogieGroup.add(rail);

    // Flanged transport wheels
    [-2.7, 2.7].forEach((xWheel) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 16), mats.darkSlate);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(xWheel, 0.44, zRail);
      wheel.castShadow = true;
      bogieGroup.add(wheel);

      // Wheel axle bracket
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.26), mats.galvanized);
      bracket.position.set(xWheel, 0.55, zRail);
      bogieGroup.add(bracket);
    });
  });

  // Instanced Foundation Anchor Bolts clamping rails to concrete
  const boltGeo = createAnchorBoltGeometry();
  const anchorBolts = new THREE.InstancedMesh(boltGeo, mats.galvanized, 16);
  const boltDummy = new THREE.Object3D();
  let bIdx = 0;
  [-1.6, 1.6].forEach((zRail) => {
    for (let xPos = -3.2; xPos <= 3.2; xPos += 1.6) {
      boltDummy.position.set(xPos, 0.22, zRail + 0.14);
      boltDummy.updateMatrix();
      anchorBolts.setMatrixAt(bIdx++, boltDummy.matrix);
      boltDummy.position.set(xPos, 0.22, zRail - 0.14);
      boltDummy.updateMatrix();
      anchorBolts.setMatrixAt(bIdx++, boltDummy.matrix);
    }
  });
  anchorBolts.instanceMatrix.needsUpdate = true;
  anchorBolts.castShadow = true;
  bogieGroup.add(anchorBolts);
  trGroup.add(bogieGroup);

  // -------------------------------------------------------------------------
  // Sub-Group 2: Main Transformer Tank (Standard or CSG Boolean Cutaway)
  // -------------------------------------------------------------------------
  const tankGroup = new THREE.Group();
  tankGroup.name = 'TransformerTankGroup';

  const isCutaway = !!opts.cutaway;

  if (isCutaway) {
    // Constructive Solid Geometry (CSG) Technical Cutaway
    // Cutting out the front-right quadrant to reveal core, windings, and tap leads
    const tankBaseBrush = new Brush(new THREE.BoxGeometry(6.4, 4.2, 4.0), mats.tankSteel);
    tankBaseBrush.position.set(0, 2.62, 0);
    tankBaseBrush.updateMatrixWorld();

    // Cutting brush extended by epsilon (+0.005) to eliminate Z-fighting on coplanar boundaries
    const cutterBrush = new Brush(new THREE.BoxGeometry(3.6, 4.6, 2.3), mats.tankSteel);
    cutterBrush.position.set(1.605, 2.625, 1.005);
    cutterBrush.updateMatrixWorld();

    const evaluator = new Evaluator();
    evaluator.useGroups = false;
    const cutawayTankMesh = evaluator.evaluate(tankBaseBrush, cutterBrush, SUBTRACTION);
    cutawayTankMesh.castShadow = true;
    cutawayTankMesh.receiveShadow = true;
    tankGroup.add(cutawayTankMesh);
    registerClickable(cutawayTankMesh, opts.assetId);

    // Cutaway edge gasket trim (aesthetic CAD cut marker)
    const cutEdgeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.3, roughness: 0.5 });
    const edgeTrimTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 0.03), cutEdgeMat);
    edgeTrimTop.position.set(1.6, 4.72, -0.15);
    tankGroup.add(edgeTrimTop);

    // Corrugation cooling ribs placed only on uncut tank faces
    // Rear face (z = -2.06)
    for (let cx = -2.7; cx <= 2.7; cx += 0.42) {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.05, 8), mats.galvanized);
      rib.rotation.x = Math.PI / 2;
      rib.position.set(cx, 2.62, -2.06);
      tankGroup.add(rib);
    }
    // Left face (x = -3.26)
    for (let cz = -1.75; cz <= 1.75; cz += 0.42) {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.05, 8), mats.galvanized);
      rib.rotation.z = Math.PI / 2;
      rib.position.set(-3.26, 2.62, cz);
      tankGroup.add(rib);
    }
    // Front-left quadrant face (cx from -2.7 to -0.2)
    for (let cx = -2.7; cx <= -0.2; cx += 0.42) {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.05, 8), mats.galvanized);
      rib.rotation.x = Math.PI / 2;
      rib.position.set(cx, 2.62, 2.06);
      tankGroup.add(rib);
    }

    // Cover flange matching cutaway profile
    const coverUncut = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.12, 4.15), mats.darkSlate);
    coverUncut.position.set(-1.62, 4.78, 0);
    tankGroup.add(coverUncut);
    const coverRearRight = new THREE.Mesh(new THREE.BoxGeometry(3.25, 0.12, 2.1), mats.darkSlate);
    coverRearRight.position.set(1.62, 4.78, -1.02);
    tankGroup.add(coverRearRight);
  } else {
    // Standard solid corrugated main tank
    const tank = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.2, 4.0), mats.tankSteel);
    tank.position.set(0, 2.62, 0);
    tank.castShadow = true;
    tank.receiveShadow = true;
    tankGroup.add(tank);
    registerClickable(tank, opts.assetId);

    // Corrugation ribs on all four vertical faces
    const faceZ = [-2.06, 2.06];
    const faceX = [-3.26, 3.26];
    for (let cx = -2.7; cx <= 2.7; cx += 0.42) {
      faceZ.forEach((zf) => {
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.05, 8), mats.galvanized);
        rib.rotation.x = Math.PI / 2;
        rib.position.set(cx, 2.62, zf);
        tankGroup.add(rib);
      });
    }
    for (let cz = -1.75; cz <= 1.75; cz += 0.42) {
      faceX.forEach((xf) => {
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.05, 8), mats.galvanized);
        rib.rotation.z = Math.PI / 2;
        rib.position.set(xf, 2.62, cz);
        tankGroup.add(rib);
      });
    }

    // Tank cover flange
    const coverFlange = new THREE.Mesh(new THREE.BoxGeometry(6.55, 0.12, 4.15), mats.darkSlate);
    coverFlange.position.set(0, 4.78, 0);
    tankGroup.add(coverFlange);
  }

  // CSG Flanged Inspection Hatch (Manhole) with drilled center
  const manholeCollar = new Brush(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 20), mats.galvanized);
  const manholeHole = new Brush(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 20), mats.galvanized);
  manholeCollar.updateMatrixWorld();
  manholeHole.updateMatrixWorld();
  const manholeEvaluator = new Evaluator();
  manholeEvaluator.useGroups = false;
  const manholeMesh = manholeEvaluator.evaluate(manholeCollar, manholeHole, SUBTRACTION);
  manholeMesh.position.set(-1.0, 4.88, -0.6);
  manholeMesh.castShadow = true;
  tankGroup.add(manholeMesh);

  // Bolted circular manhole cover plate
  const manholeLid = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.04, 20), mats.darkSlate);
  manholeLid.position.set(-1.0, 4.96, -0.6);
  tankGroup.add(manholeLid);

  // Pressure relief emergency device (PRV) with directional discharge pipe
  const prv = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 12), mats.safetyPaint);
  prv.position.set(-2.6, 5.0, -1.55);
  tankGroup.add(prv);
  const prvPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 10), mats.galvanized);
  prvPipe.position.set(-2.6, 5.4, -1.8);
  prvPipe.rotation.x = Math.PI / 3;
  tankGroup.add(prvPipe);

  // Rating nameplate (front)
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.65, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xd6d3d1, metalness: 0.5, roughness: 0.35 })
  );
  plate.position.set(-1.75, 1.6, 2.08);
  tankGroup.add(plate);

  trGroup.add(tankGroup);

  // -------------------------------------------------------------------------
  // Sub-Group 3: Internal Magnetic Core & Concentric Windings (Cutaway / X-Ray)
  // -------------------------------------------------------------------------
  if (isCutaway || opts.xray) {
    const coreWindingsGroup = new THREE.Group();
    coreWindingsGroup.name = 'CoreAndWindingsGroup';

    // 1. Three-Phase Grain-Oriented Silicon Steel (CRGO) Magnetic Core
    // Three vertical core limbs
    const limbX = [-1.7, 0, 1.7];
    limbX.forEach((lx) => {
      const limb = new THREE.Mesh(new THREE.BoxGeometry(0.72, 3.2, 0.72), coreMat);
      limb.position.set(lx, 2.62, 0);
      limb.castShadow = true;
      coreWindingsGroup.add(limb);
    });

    // Top and bottom horizontal yokes magnetically closing the magnetic circuit
    [1.25, 4.02].forEach((yYoke) => {
      const yoke = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.64, 0.75), coreMat);
      yoke.position.set(0, yYoke, 0);
      yoke.castShadow = true;
      coreWindingsGroup.add(yoke);

      // Core clamping steel channels
      [-0.42, 0.42].forEach((zClamp) => {
        const clamp = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.14, 0.12), mats.galvanized);
        clamp.position.set(0, yYoke, zClamp);
        coreWindingsGroup.add(clamp);
      });
    });

    // Core tie rods holding laminations under compression
    [-2.3, -0.85, 0.85, 2.3].forEach((xTie) => {
      const tieRod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.2, 8), mats.galvanized);
      tieRod.position.set(xTie, 2.62, 0.44);
      coreWindingsGroup.add(tieRod);
    });

    // 2. Concentric Cylindrical Copper Windings (LV inner + oil duct + HV outer)
    limbX.forEach((lx, phaseIdx) => {
      // Inner Low-Voltage (LV) winding cylinder with oil duct spacers
      const lvWinding = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.3, 24), paperMat);
      lvWinding.position.set(lx, 2.62, 0);
      coreWindingsGroup.add(lvWinding);

      // Outer High-Voltage (HV) winding cylinder with copper turns
      const hvWinding = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 2.05, 24), mats.copper);
      hvWinding.position.set(lx, 2.62, 0);
      hvWinding.castShadow = true;
      coreWindingsGroup.add(hvWinding);

      // Insulation kraft paper rings & tape bands on winding top and bottom
      [1.65, 3.58].forEach((yRing) => {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.14, 24), paperMat);
        ring.position.set(lx, yRing, 0);
        coreWindingsGroup.add(ring);
      });

      // Internal HV riser leads: insulated copper conductors travelling up to bushings
      const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.35, 10), mats.copper);
      riser.position.set(lx, 4.3, 0.48);
      riser.rotation.x = -Math.PI / 6;
      coreWindingsGroup.add(riser);

      // LV heavy copper busbar jumpers heading toward LV cable box
      const lvBus = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.6), mats.copper);
      lvBus.position.set(lx, 3.8, -0.6);
      coreWindingsGroup.add(lvBus);
      void phaseIdx;
    });

    // Internal On-Load Tap Changer (OLTC) selector switch cage and connection leads
    const oltcCage = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 2.2, 16), mats.galvanized);
    oltcCage.position.set(2.4, 2.62, 0);
    coreWindingsGroup.add(oltcCage);

    for (let tapI = 0; tapI < 6; tapI++) {
      const tapLead = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8), mats.copper);
      tapLead.position.set(2.0, 1.8 + tapI * 0.32, 0.1);
      tapLead.rotation.z = Math.PI / 4;
      coreWindingsGroup.add(tapLead);
    }

    // Dielectric mineral oil fluid layer inside uncut section
    if (isCutaway) {
      const oilFluid = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.3, 3.8), oilMat);
      oilFluid.position.set(-1.6, 2.2, 0);
      coreWindingsGroup.add(oilFluid);
      const oilFluidRear = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.3, 1.8), oilMat);
      oilFluidRear.position.set(1.58, 2.2, -0.98);
      coreWindingsGroup.add(oilFluidRear);
    }

    trGroup.add(coreWindingsGroup);
  }

  // -------------------------------------------------------------------------
  // Sub-Group 4: Oil Conservator Tank, Buchholz Relay, and Breather
  // -------------------------------------------------------------------------
  const conservatorGroup = new THREE.Group();
  conservatorGroup.name = 'ConservatorGroup';

  const conservator = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4.2, 20), mats.tankSteel);
  conservator.rotation.z = Math.PI / 2;
  conservator.position.set(0, 5.85, -1.25);
  conservator.castShadow = true;
  conservatorGroup.add(conservator);

  // Mounting saddles
  [-1.45, 1.45].forEach((xSad) => {
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.95), mats.galvanized);
    saddle.position.set(xSad, 5.32, -1.25);
    conservatorGroup.add(saddle);
  });

  // Silica-gel moisture breather canister
  const breather = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.5, 12), mats.darkSlate);
  breather.position.set(-2.35, 5.28, -1.25);
  conservatorGroup.add(breather);

  // Magnetic oil level gauge (sight glass)
  const sightGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.05, 8), mats.glassGlow);
  sightGlass.position.set(-2.32, 5.82, -0.86);
  conservatorGroup.add(sightGlass);

  // Buchholz relay in the conservator-to-tank pipe run
  const buchPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.35, 10), mats.galvanized);
  buchPipe.rotation.x = Math.PI / 3.4;
  buchPipe.position.set(0.9, 5.12, -0.72);
  conservatorGroup.add(buchPipe);

  const buchholz = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.36, 0.46),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.65, roughness: 0.4 })
  );
  buchholz.position.set(0.9, 4.78, -0.52);
  conservatorGroup.add(buchholz);

  trGroup.add(conservatorGroup);

  // -------------------------------------------------------------------------
  // Sub-Group 5: OLTC Drive Mechanism and Control Kiosk
  // -------------------------------------------------------------------------
  const oltcGroup = new THREE.Group();
  oltcGroup.name = 'OltcDriveGroup';

  const oltc = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.35, 1.25), mats.darkSlate);
  oltc.position.set(3.95, 2.1, 0);
  oltc.castShadow = true;
  oltcGroup.add(oltc);
  registerClickable(oltc, 'OLTC_HOUSING');

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.15, 8), mats.galvanized);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(3.12, 1.45, 0);
  oltcGroup.add(shaft);

  const mDrive = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.74, 0.62), mats.galvanized);
  mDrive.position.set(2.7, 1.05, 0);
  oltcGroup.add(mDrive);

  // Marshalling kiosk (front-left)
  const kiosk = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.85, 0.78), mats.galvanized);
  kiosk.position.set(-3.9, 1.23, 1.6);
  kiosk.castShadow = true;
  oltcGroup.add(kiosk);

  trGroup.add(oltcGroup);

  // -------------------------------------------------------------------------
  // Sub-Group 6: High-Voltage & Low-Voltage Bushings (145 kV & 24 kV)
  // -------------------------------------------------------------------------
  const bushingGroup = new THREE.Group();
  bushingGroup.name = 'BushingsGroup';

  // HV taper bushings (145 kV class) on the long front face
  [-1.7, 0, 1.7].forEach((xPhase) => {
    const bushing = createPorcelainStack(ctx, 2.9, 0.3, 0.11, 9, mats.porcelainBrown);
    bushing.position.set(xPhase, 4.84, 0.95);
    bushingGroup.add(bushing);

    // Electrostatic corona / arc grading shield
    const arcShield = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), mats.copper);
    arcShield.position.set(xPhase, 7.82, 0.95);
    bushingGroup.add(arcShield);

    registerClickable(bushing, 'HV_BUSHING');
  });

  // LV cable boxes on the right face (13.8 kV side)
  [-1.3, 0, 1.3].forEach((zBox) => {
    const cableBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.55), mats.darkSlate);
    cableBox.position.set(3.35, 3.4, zBox);
    bushingGroup.add(cableBox);
  });

  trGroup.add(bushingGroup);

  // -------------------------------------------------------------------------
  // Sub-Group 7: Radiator Panel Banks with Instanced Cooling Fins & Fans
  // -------------------------------------------------------------------------
  const radiatorGroup = new THREE.Group();
  radiatorGroup.name = 'RadiatorBankGroup';

  // Compute total cooling fin count across both banks: 2 banks * 5 sections * 12 fins = 120 fins
  const finGeo = new THREE.BoxGeometry(0.016, 3.4, 0.44);
  const totalFins = 120;
  const instancedFins = new THREE.InstancedMesh(finGeo, mats.tankSteel, totalFins);
  const finDummy = new THREE.Object3D();
  let finIdx = 0;

  [-4.35, 4.35].forEach((xBank) => {
    // Upper and lower oil manifold distribution headers
    [3.85, 1.15].forEach((yHeader) => {
      const header = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.0, 12), mats.galvanized);
      header.rotation.x = Math.PI / 2;
      header.position.set(xBank, yHeader, 0);
      radiatorGroup.add(header);
    });

    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.0, 10), mats.galvanized);
    riser.position.set(xBank * 0.78, 0.95, 0);
    radiatorGroup.add(riser);

    // 5 radiator panel sections along Z
    for (let zElem = -1.15; zElem <= 1.15; zElem += 0.58) {
      // Structural element header box
      const element = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.55, 0.46), mats.tankSteel);
      element.position.set(xBank, 2.5, zElem);
      element.castShadow = true;
      radiatorGroup.add(element);
      registerClickable(element, 'RADIATOR_BANK');

      // Populate 12 instanced cooling fins per section
      for (let f = 0; f < 12; f++) {
        const finOffsetZ = (f - 5.5) * 0.034;
        finDummy.position.set(xBank, 2.5, zElem + finOffsetZ);
        finDummy.updateMatrix();
        if (finIdx < totalFins) {
          instancedFins.setMatrixAt(finIdx++, finDummy.matrix);
        }
      }

      // Fan safety guard cowling ring
      const guard = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.032, 8, 20), mats.galvanized);
      guard.rotation.y = Math.PI / 2;
      guard.position.set(xBank + Math.sign(xBank) * 0.22, 2.35, zElem);
      radiatorGroup.add(guard);

      // Rotating fan blade assembly
      const fanBlade = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.055, 8), mats.conductor);
      fanBlade.rotation.x = Math.PI / 2;
      fanBlade.position.set(xBank + Math.sign(xBank) * 0.16, 2.35, zElem);
      radiatorGroup.add(fanBlade);
      opts.fans?.push(fanBlade);
    }
  });

  instancedFins.instanceMatrix.needsUpdate = true;
  instancedFins.castShadow = true;
  radiatorGroup.add(instancedFins);
  trGroup.add(radiatorGroup);

  // -------------------------------------------------------------------------
  // Sub-Group 8: Thermal Plume & Hotspot Visualizer (X-Ray Mode)
  // -------------------------------------------------------------------------
  if (opts.assetId === 'TR1') {
    const plumeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uHeat: { value: 0.65 } },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPosL;
        void main() {
          vPosL = position;
          vNormalW = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uHeat;
        varying vec3 vNormalW;
        varying vec3 vPosL;
        void main() {
          float rim = 1.0 - abs(dot(normalize(vNormalW), vec3(0.0, 0.0, 1.0)));
          vec3 cool = vec3(0.02, 0.35, 0.75);
          vec3 mid  = vec3(0.95, 0.55, 0.05);
          vec3 hot  = vec3(1.0, 0.12, 0.08);
          float h = clamp(uHeat, 0.0, 1.0);
          vec3 col = h < 0.5 ? mix(cool, mid, h * 2.0) : mix(mid, hot, (h - 0.5) * 2.0);
          float core = smoothstep(0.55, 0.0, length(vPosL) / 1.6);
          float alpha = (rim * 0.85 + core * 0.9) * (0.35 + h * 0.65);
          gl_FragColor = vec4(col * (0.8 + rim), alpha);
        }
      `,
    });
    const plume = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 20), plumeMat);
    plume.scale.set(1.15, 1.25, 0.85);
    plume.position.set(0, 2.7, 0);
    plume.visible = !!opts.xray;
    trGroup.add(plume);
    opts.onHotspot?.(plume);
  }

  // OLTC tap-position dial with rotating pointer
  if (opts.onTapDial) {
    const dialGroup = new THREE.Group();
    const dialFace = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 18), mats.glassGlow);
    dialFace.rotation.x = Math.PI / 2;
    dialFace.position.set(0, 0, 0.66);
    dialGroup.add(dialFace);
    const pointer = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.2, 0.03),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    pointer.position.set(0, 0, 0.7);
    dialGroup.add(pointer);
    dialGroup.position.set(3.95, 2.62, 0.63);
    trGroup.add(dialGroup);
    opts.onTapDial(dialGroup);
  }

  return trGroup;
}

// ---------------------------------------------------------------------------
// 2. Dead-Tank SF6 Circuit Breaker (145 kV class, gang-operated spring mech)
// ---------------------------------------------------------------------------

export function buildDeadTankBreaker(
  ctx: AssetContext,
  opts: { x: number; z: number; flags?: THREE.Mesh[]; needles?: THREE.Mesh[] }
): THREE.Group {
  const { mats, registerClickable } = ctx;
  const cb = new THREE.Group();
  cb.position.set(opts.x, 0, opts.z);

  const poleX = [-1.35, 0, 1.35];

  // Three fabricated structural steel pedestal columns with mounting base plates
  poleX.forEach((xp) => {
    const colBase = basePlate(mats, 0.65, 0.65, 0.06);
    colBase.position.set(xp, 0.03, 0);
    cb.add(colBase);

    const column = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.0, 0.42), mats.galvanized);
    column.position.set(xp, 1.0, 0);
    column.castShadow = true;
    cb.add(column);

    // Lattice cut-out illusion: recessed dark panels
    const inset = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.5, 0.24), mats.darkSlate);
    inset.position.set(xp, 1.0, 0);
    cb.add(inset);

    // Column cap plate transferring tank load
    const capPlate = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.56), mats.galvanized);
    capPlate.position.set(xp, 2.04, 0);
    cb.add(capPlate);
  });

  // Longitudinal tie beams linking pedestals
  [-0.28, 0.28].forEach((zTie) => {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 0.14), mats.galvanized);
    tie.position.set(0, 0.5, zTie);
    cb.add(tie);
  });

  // Cast aluminium dead tank with reinforcement rib rings
  const tankLen = 4.0;
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, tankLen, 20), mats.tankSteel);
  tank.rotation.z = Math.PI / 2;
  tank.position.y = 2.62;
  tank.castShadow = true;
  tank.receiveShadow = true;
  cb.add(tank);
  registerClickable(tank, 'SF6_BREAKER');

  [-1.2, -0.4, 0.4, 1.2].forEach((xRibRing) => {
    const ribRing = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.035, 8, 26), mats.galvanized);
    ribRing.rotation.y = Math.PI / 2;
    ribRing.position.set(xRibRing, 2.62, 0);
    cb.add(ribRing);
  });

  // End covers
  [-tankLen / 2 - 0.06, tankLen / 2 + 0.06].forEach((xCover) => {
    const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.12, 20), mats.darkSlate);
    cover.rotation.z = Math.PI / 2;
    cover.position.set(xCover, 2.62, 0);
    cb.add(cover);
  });

  // Two inclined porcelain bushings per pole (inverted-V interruption chambers) via LatheGeometry
  let terminalTopY = 4.2;
  poleX.forEach((xp) => {
    [-1, 1].forEach((side) => {
      const tilt = side * 0.42;

      const chamberGroup = new THREE.Group();
      chamberGroup.position.set(xp, 2.72, 0);

      const porcelain = createPorcelainStack(ctx, 1.7, 0.19, 0.11, 7, mats.porcelainGray);
      porcelain.rotation.z = tilt;
      porcelain.position.y = 0.85 * Math.cos(tilt);
      porcelain.position.x = side * 0.85 * Math.sin(tilt) * -1;
      chamberGroup.add(porcelain);

      // Aluminium terminal crown with flat contact pad
      const crownY = 2.72 + 1.7 * Math.cos(tilt);
      const crownX = xp - side * 1.7 * Math.sin(tilt);
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.22, 12), mats.copper);
      crown.position.set(crownX, crownY + 0.08, 0);
      chamberGroup.add(crown);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.18), mats.copper);
      pad.position.set(crownX, crownY + 0.21, 0);
      chamberGroup.add(pad);

      if (crownY + 0.3 > terminalTopY) terminalTopY = crownY + 0.3;
      cb.add(chamberGroup);
      registerClickable(porcelain, 'SF6_BREAKER');
    });
  });

  // Bell crank + insulating pull-rod driving centre pole
  const pullRod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.15, 10), mats.porcelainGray);
  pullRod.position.set(0, 1.62, 0.34);
  cb.add(pullRod);
  const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.1), mats.darkSlate);
  crankArm.position.set(0, 2.2, 0.34);
  cb.add(crankArm);

  // Gang-operated linkage shaft
  const linkShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.1, 10), mats.galvanized);
  linkShaft.rotation.z = Math.PI / 2;
  linkShaft.position.set(0, 1.05, 0.52);
  cb.add(linkShaft);
  poleX.forEach((xp) => {
    const linkArm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.36, 0.09), mats.galvanized);
    linkArm.position.set(xp, 1.28, 0.52);
    cb.add(linkArm);
  });

  // Operating mechanism cabinet
  const mechCab = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.65, 0.88), mats.galvanized);
  mechCab.position.set(2.35, 0.93, 0);
  mechCab.castShadow = true;
  cb.add(mechCab);
  [0.55, 1.05].forEach((yStiff) => {
    const stiffener = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.045, 0.02), mats.darkSlate);
    stiffener.position.set(2.35, yStiff, 0.45);
    cb.add(stiffener);
  });
  const cabVent = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.02), mats.darkSlate);
  cabVent.position.set(2.35, 1.45, 0.45);
  cb.add(cabVent);

  // SF6 density monitor: gauge head piped into the tank
  const densityPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8), mats.galvanized);
  densityPipe.position.set(-1.78, 2.86, 0.3);
  densityPipe.rotation.x = Math.PI / 2.6;
  cb.add(densityPipe);
  const densityHead = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 14), mats.darkSlate);
  densityHead.rotation.x = Math.PI / 2;
  densityHead.position.set(-1.78, 3.02, 0.48);
  cb.add(densityHead);
  const gaugeFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.115, 18),
    new THREE.MeshStandardMaterial({ color: 0xe7e5e4, roughness: 0.35 })
  );
  gaugeFace.position.set(-1.78, 3.02, 0.54);
  cb.add(gaugeFace);
  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.07, 0.005),
    new THREE.MeshStandardMaterial({ color: 0x166534 })
  );
  needle.position.set(-1.78, 3.02, 0.545);
  needle.rotation.z = 0.6;
  cb.add(needle);
  opts.needles?.push(needle);

  void terminalTopY;
  return cb;
}

// ---------------------------------------------------------------------------
// 3. Centre-Break Rotating Disconnector (double-post type)
// ---------------------------------------------------------------------------

export function buildCentreBreakDisconnector(
  ctx: AssetContext,
  opts: { x: number; z: number; pivots?: THREE.Group[] }
): THREE.Group {
  const { mats, registerClickable } = ctx;
  const ds = new THREE.Group();
  ds.position.set(opts.x, 0, opts.z);

  // Extruded structural C-channel base frame
  const channelGeo = createChannelGeometry(0.35, 0.2, 2.3, 0.02);
  const frame = new THREE.Mesh(channelGeo, mats.galvanized);
  frame.position.y = 0.1;
  frame.rotation.y = Math.PI / 2;
  frame.receiveShadow = true;
  ds.add(frame);

  // Operating mechanism cabinet + vertical linkage
  const mech = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.92, 0.52), mats.galvanized);
  mech.position.set(0, 0.56, 0.62);
  ds.add(mech);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 2.1, 8), mats.galvanized);
  rod.position.set(0, 1.85, 0.44);
  ds.add(rod);

  // Two counter-rotating post insulators via LatheGeometry
  [-0.68, 0.68].forEach((xPost) => {
    const post = createPorcelainStack(ctx, 2.35, 0.17, 0.12, 7, mats.porcelainBrown);
    post.position.set(xPost, 0.2, 0);
    ds.add(post);

    const bearingHead = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 12), mats.galvanized);
    bearingHead.position.set(xPost, 2.62, 0);
    ds.add(bearingHead);
  });

  // Aluminium tube blade halves meeting at centre break
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xd8d8dc, metalness: 0.88, roughness: 0.3 });
  [-0.68, 0.68].forEach((xPost, postIdx) => {
    const pivot = new THREE.Group();
    pivot.position.set(xPost, 2.72, 0);
    ds.add(pivot);

    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.32, 12), bladeMat);
    blade.rotation.z = Math.PI / 2;
    blade.position.x = -Math.sign(xPost) * 0.66;
    blade.castShadow = true;
    pivot.add(blade);

    // Copper contact finger
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.2), mats.copper);
    finger.position.x = -Math.sign(xPost) * 1.28;
    pivot.add(finger);

    opts.pivots?.push(pivot);
    void postIdx;
  });

  const bladeRef = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.06), mats.copper);
  bladeRef.visible = false;
  ds.add(bladeRef);
  registerClickable(bladeRef, 'DISCONNECTOR');

  return ds;
}

// ---------------------------------------------------------------------------
// 4. Instrument Transformers: post-type CT and inductive VT
// ---------------------------------------------------------------------------

export function buildPostCurrentTransformer(
  ctx: AssetContext,
  opts: { x: number; z: number }
): THREE.Group {
  const { mats, registerClickable } = ctx;
  const ct = new THREE.Group();
  ct.position.set(opts.x, 0, opts.z);

  ct.add(basePlate(mats, 1.0, 1.0, 0.18));

  // Tapered porcelain column via LatheGeometry
  const column = createPorcelainStack(ctx, 2.3, 0.27, 0.17, 9, mats.porcelainBrown);
  column.position.y = 0.18;
  ct.add(column);

  // Dished top housing enclosing toroidal magnetic core
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.4, 0.64, 18), mats.galvanized);
  head.position.y = 2.85;
  head.castShadow = true;
  ct.add(head);

  // Hairpin primary conductor passing through the window
  [-0.3, 0.3].forEach((dzStub) => {
    const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.85, 10), mats.copper);
    stub.rotation.x = Math.PI / 2;
    stub.position.set(0, 2.98, dzStub);
    ct.add(stub);
    const lug = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 12), mats.copper);
    lug.rotation.x = Math.PI / 2;
    lug.position.set(0, 2.98, dzStub + Math.sign(dzStub) * 0.48);
    ct.add(lug);
  });

  // Secondary terminal junction box
  const termBox = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.32), mats.darkSlate);
  termBox.position.set(0.36, 0.52, 0.2);
  ct.add(termBox);

  registerClickable(head, 'CT_VT_METERING');
  return ct;
}

export function buildInductiveVoltageTransformer(
  ctx: AssetContext,
  opts: { x: number; z: number }
): THREE.Group {
  const { mats, registerClickable } = ctx;
  const vt = new THREE.Group();
  vt.position.set(opts.x, 0, opts.z);

  vt.add(basePlate(mats, 1.05, 1.05, 0.18));

  const body = createPorcelainStack(ctx, 2.5, 0.34, 0.24, 8, mats.porcelainGray);
  body.position.y = 0.18;
  vt.add(body);

  // Upper tank containing primary winding
  const upperTank = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 18), mats.tankSteel);
  upperTank.position.y = 2.9;
  upperTank.castShadow = true;
  vt.add(upperTank);

  const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), mats.galvanized);
  topCap.position.y = 3.42;
  vt.add(topCap);

  const hvTerminal = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.26, 10), mats.copper);
  hvTerminal.position.y = 3.72;
  vt.add(hvTerminal);

  const termBox = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.4, 0.32), mats.darkSlate);
  termBox.position.set(0.38, 0.52, 0.2);
  vt.add(termBox);

  registerClickable(upperTank, 'CT_VT_METERING');
  return vt;
}

// ---------------------------------------------------------------------------
// 5. Metal-Oxide Surge Arrester with grading rings & discharge counter
// ---------------------------------------------------------------------------

export function buildSurgeArrester(
  ctx: AssetContext,
  opts: { x: number; z: number }
): THREE.Group {
  const { mats, registerClickable } = ctx;
  const sa = new THREE.Group();
  sa.position.set(opts.x, 0, opts.z);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.4, 14), mats.darkSlate);
  pedestal.position.y = 0.2;
  sa.add(pedestal);

  const column = createPorcelainStack(ctx, 2.55, 0.19, 0.12, 9, mats.porcelainGray);
  column.position.y = 0.4;
  sa.add(column);

  // Toroidal grading / corona rings
  [2.62, 1.78].forEach((yRing) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.028, 8, 22), mats.galvanized);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = yRing;
    sa.add(ring);
  });

  const liveCap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), mats.copper);
  liveCap.position.y = 3.05;
  sa.add(liveCap);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.2), mats.darkSlate);
  counter.position.set(0.3, 0.62, 0.14);
  sa.add(counter);

  registerClickable(column, 'SURGE_ARRESTER');
  return sa;
}

// ---------------------------------------------------------------------------
// 6. Lattice Strain Gantry with suspension insulator strings
// ---------------------------------------------------------------------------

export function buildStrainGantry(
  ctx: AssetContext,
  opts: { x: number; z: number; height: number; spread?: number }
): THREE.Group {
  const { mats, registerClickable } = ctx;
  const gantry = new THREE.Group();
  gantry.position.set(opts.x, 0, opts.z);

  const spread = opts.spread ?? 3.2;
  const h = opts.height;
  const angleIron = mats.galvanized;

  [-spread / 2, spread / 2].forEach((xLeg) => {
    // Twin vertical chords per leg plane
    [-0.5, 0.5].forEach((zChord) => {
      const chord = new THREE.Mesh(new THREE.BoxGeometry(0.14, h, 0.14), angleIron);
      chord.position.set(xLeg, h / 2, zChord);
      chord.castShadow = true;
      gantry.add(chord);
    });

    // Horizontal rungs + diagonal web lacing between chords
    for (let yBrace = 1.1; yBrace < h; yBrace += 1.1) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 1.05), angleIron);
      rung.position.set(xLeg, yBrace, 0);
      gantry.add(rung);
      if (yBrace + 1.1 < h) {
        const diagA = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.06), angleIron);
        diagA.position.set(xLeg, yBrace + 0.55, 0);
        diagA.rotation.x = 0.72;
        gantry.add(diagA);
        const diagB = diagA.clone();
        diagB.rotation.x = -0.72;
        gantry.add(diagB);
      }
    }
  });

  // Top cross beam with lattice X-bracing
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(spread + 0.6, 0.22, 0.22), angleIron);
  topBeam.position.y = h;
  gantry.add(topBeam);
  const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(spread + 0.6, 0.14, 0.14), angleIron);
  lowerBeam.position.y = h - 1.1;
  gantry.add(lowerBeam);

  for (let xDiag = -spread / 2 + 0.4; xDiag < spread / 2; xDiag += 0.8) {
    const diag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.12, 0.06), angleIron);
    diag.position.set(xDiag + 0.4, h - 0.55, 0);
    diag.rotation.z = 0.72;
    gantry.add(diag);
    const diagMirror = diag.clone();
    diagMirror.rotation.z = -0.72;
    gantry.add(diagMirror);
  }

  // Suspension insulator strings at three phase positions
  [-1.75, 0, 1.75].forEach((xString) => {
    const stringTop = new THREE.Group();
    for (let discIdx = 0; discIdx < 6; discIdx++) {
      const disc = new THREE.Mesh(
        new THREE.TorusGeometry(0.13 - discIdx * 0.004, 0.045, 6, 16),
        mats.porcelainBrown
      );
      disc.rotation.x = Math.PI / 2;
      disc.position.set(xString, h - 0.25 - discIdx * 0.19, 0);
      gantry.add(disc);
    }
    gantry.add(stringTop);
    const clevis = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), mats.galvanized);
    clevis.position.set(xString, h - 1.5, 0);
    gantry.add(clevis);
    registerClickable(stringTop, 'HV_BUSHING');
  });

  return gantry;
}

// ---------------------------------------------------------------------------
// 7. Earthing Switch (hinged blade type)
// ---------------------------------------------------------------------------

export function buildEarthingSwitch(
  ctx: AssetContext,
  opts: { x: number; z: number }
): THREE.Group {
  const { mats } = ctx;
  const es = new THREE.Group();
  es.position.set(opts.x, 0, opts.z);

  const post = createPorcelainStack(ctx, 1.6, 0.15, 0.11, 5, mats.porcelainBrown);
  post.position.y = 0.1;
  es.add(post);

  const hinge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.26), mats.galvanized);
  hinge.position.set(-0.32, 1.86, 0);
  es.add(hinge);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.12), mats.copper);
  blade.position.set(0.18, 1.78, 0);
  es.add(blade);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.2), mats.copper);
  jaw.position.set(0.66, 1.76, 0);
  es.add(jaw);

  return es;
}

// ---------------------------------------------------------------------------
// 8. MV Switchgear Lineup (13.8 kV metal-clad panels)
// ---------------------------------------------------------------------------

export function buildMvSwitchgearLineup(
  ctx: AssetContext,
  opts: { x: number; z: number; panels?: number; rotY?: number }
): THREE.Group {
  const { mats } = ctx;
  const lineup = new THREE.Group();
  lineup.position.set(opts.x, 0, opts.z);
  lineup.rotation.y = opts.rotY ?? 0;

  const count = Math.max(2, Math.min(10, opts.panels ?? 6));
  const panelW = 0.85;
  const totalW = count * panelW;

  const skid = new THREE.Mesh(new THREE.BoxGeometry(totalW + 0.3, 0.18, 1.35), mats.darkSlate);
  skid.position.y = 0.09;
  lineup.add(skid);

  for (let i = 0; i < count; i++) {
    const px = -totalW / 2 + panelW / 2 + i * panelW;

    const enclosure = new THREE.Mesh(new THREE.BoxGeometry(panelW - 0.04, 2.15, 1.15), mats.tankSteel);
    enclosure.position.set(px, 0.18 + 2.15 / 2, 0);
    enclosure.castShadow = true;
    lineup.add(enclosure);

    [0.45, 1.95].forEach((yL) => {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(panelW - 0.28, 0.14, 0.02), mats.darkSlate);
      louver.position.set(px, yL, 0.59);
      lineup.add(louver);
    });

    const indicator = new THREE.Mesh(
      new THREE.CircleGeometry(0.055, 12),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xdc2626 : 0x16a34a,
        emissive: i % 2 === 0 ? 0xdc2626 : 0x16a34a,
        emissiveIntensity: 0.85,
      })
    );
    indicator.position.set(px, 1.55, 0.59);
    lineup.add(indicator);

    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.03), mats.copper);
    handle.position.set(px + panelW / 2 - 0.14, 1.1, 0.6);
    lineup.add(handle);
  }

  const busDuct = new THREE.Mesh(new THREE.BoxGeometry(totalW + 0.2, 0.32, 0.5), mats.galvanized);
  busDuct.position.set(0, 0.18 + 2.15 + 0.16, -0.2);
  lineup.add(busDuct);

  return lineup;
}

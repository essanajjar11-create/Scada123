/**
 * Procedural 132/13.8 kV AIS Substation Asset Library
 * Builders modelled on real outdoor air-insulated switchgear practice:
 *  - Power transformer per IEC 60076 accessory sets (conservator, Buchholz,
 *    detachable radiator panels, OLTC drive, HV taper bushings)
 *  - Dead-tank SF6 circuit breaker (steel support frame, cast tank, angled
 *    porcelain bushing pairs, gang-operated linkage, density monitor)
 *  - Centre-break rotating disconnector, post-type CT / inductive VT,
 *    metal-oxide surge arrester with grading rings, lattice strain gantries.
 *
 * Dimensions are scaled scene units where 1 unit ~= 1 m at 132 kV class
 * clearances (ground clearance ~3.55 m, fence height ~5.8 m).
 */

import * as THREE from 'three';

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
}

export interface AssetContext {
  mats: AssetMaterialSet;
  registerClickable: (object: THREE.Object3D, asset: string) => void;
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Tapered porcelain stack with cemented sheds (instanced for draw-call economy). */
export function createPorcelainStack(
  ctx: AssetContext,
  height: number,
  baseRadius: number,
  topRadius: number,
  shedCount: number,
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius, baseRadius, height, 14),
    material
  );
  shaft.position.y = height / 2;
  shaft.castShadow = true;
  group.add(shaft);

  const shedGeometry = new THREE.TorusGeometry(1, 0.048, 6, 18);
  const sheds = new THREE.InstancedMesh(shedGeometry, material, shedCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < shedCount; i++) {
    const tRatio = i / (shedCount - 1 || 1);
    const yShed = 0.12 * height + tRatio * 0.76 * height;
    const rAt = baseRadius + (topRadius - baseRadius) * tRatio + 0.075;
    dummy.position.set(0, yShed, 0);
    dummy.scale.set(rAt, rAt, 1);
    dummy.rotation.set(Math.PI / 2, 0, 0);
    dummy.updateMatrix();
    sheds.setMatrixAt(i, dummy.matrix);
  }
  sheds.instanceMatrix.needsUpdate = true;
  sheds.castShadow = true;
  group.add(sheds);
  return group;
}

/** Flanged steel pedestal plate. */
function basePlate(mats: AssetMaterialSet, w: number, d: number, h: number): THREE.Mesh {
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.galvanized);
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
    /** OLTC tap position dial pointer (1..17). */
    onTapDial?: (mesh: THREE.Group) => void;
  }
): THREE.Group {
  const { mats, registerClickable } = ctx;
  const trGroup = new THREE.Group();
  trGroup.position.set(opts.x, 0.3, opts.z ?? 0);

  // Rail bogie: plinth beams + rollers riding on rails
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.22, 3.6), mats.concrete);
  plinth.position.y = 0.11;
  plinth.receiveShadow = true;
  trGroup.add(plinth);
  [-1.6, 1.6].forEach((zRail) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.08, 0.14), mats.galvanized);
    rail.position.set(0, 0.26, zRail);
    trGroup.add(rail);
    [-2.7, 2.7].forEach((xWheel) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 14), mats.darkSlate);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(xWheel, 0.42, zRail);
      wheel.castShadow = true;
      trGroup.add(wheel);
    });
  });

  // Corrugated main tank
  const tank = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.2, 4.0), mats.tankSteel);
  tank.position.set(0, 2.62, 0);
  tank.castShadow = true;
  tank.receiveShadow = true;
  trGroup.add(tank);
  registerClickable(tank, opts.assetId);

  // Corrugation ribs on all four vertical faces
  const faceZ = [-2.06, 2.06];
  const faceX = [-3.26, 3.26];
  for (let cx = -2.7; cx <= 2.7; cx += 0.42) {
    faceZ.forEach((zf) => {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 4.05, 8), mats.galvanized);
      rib.rotation.x = Math.PI / 2;
      rib.position.set(cx, 2.62, zf);
      trGroup.add(rib);
    });
  }
  for (let cz = -1.75; cz <= 1.75; cz += 0.42) {
    faceX.forEach((xf) => {
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 4.05, 8), mats.galvanized);
      rib.rotation.z = Math.PI / 2;
      rib.position.set(xf, 2.62, cz);
      trGroup.add(rib);
    });
  }

  // Tank cover flange with bolt heads
  const coverFlange = new THREE.Mesh(new THREE.BoxGeometry(6.55, 0.12, 4.15), mats.darkSlate);
  coverFlange.position.set(0, 4.78, 0);
  trGroup.add(coverFlange);

  // Pressure relief emergency valve (rear corner)
  const prv = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 12), mats.safetyPaint);
  prv.position.set(-2.6, 5.0, -1.55);
  trGroup.add(prv);

  // Rating nameplate (front)
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.65, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xd6d3d1, metalness: 0.5, roughness: 0.35 })
  );
  plate.position.set(-1.75, 1.6, 2.08);
  trGroup.add(plate);

  // Conservator tank above cover, offset to the rear
  const conservator = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4.2, 18), mats.tankSteel);
  conservator.rotation.z = Math.PI / 2;
  conservator.position.set(0, 5.85, -1.25);
  conservator.castShadow = true;
  trGroup.add(conservator);
  [-1.45, 1.45].forEach((xSad) => {
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.95), mats.galvanized);
    saddle.position.set(xSad, 5.32, -1.25);
    trGroup.add(saddle);
  });
  // Silica-gel breather hanging off the conservator end
  const breather = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.5, 10), mats.darkSlate);
  breather.position.set(-2.35, 5.28, -1.25);
  trGroup.add(breather);
  // Magnetic oil level gauge (sight glass)
  const sightGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 1.05, 8),
    mats.glassGlow
  );
  sightGlass.position.set(-2.32, 5.82, -0.86);
  trGroup.add(sightGlass);

  // Buchholz relay in the conservator-to-tank pipe run
  const buchPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.35, 10), mats.galvanized);
  buchPipe.rotation.x = Math.PI / 3.4;
  buchPipe.position.set(0.9, 5.12, -0.72);
  trGroup.add(buchPipe);
  const buchholz = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.46), new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.65, roughness: 0.4 }));
  buchholz.position.set(0.9, 4.78, -0.52);
  trGroup.add(buchholz);

  // OLTC diverter compartment + motor drive + universal shaft
  const oltc = new THREE.Mesh(new THREE.BoxGeometry(1.45, 2.35, 1.25), mats.darkSlate);
  oltc.position.set(3.95, 2.1, 0);
  oltc.castShadow = true;
  trGroup.add(oltc);
  registerClickable(oltc, 'OLTC_HOUSING');
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.15, 8), mats.galvanized);
  shaft.rotation.z = Math.PI / 2;
  shaft.position.set(3.12, 1.45, 0);
  trGroup.add(shaft);
  const mDrive = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.74, 0.62), mats.galvanized);
  mDrive.position.set(2.7, 1.05, 0);
  trGroup.add(mDrive);

  // Marshalling kiosk (front-left)
  const kiosk = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.85, 0.78), mats.galvanized);
  kiosk.position.set(-3.9, 1.23, 1.6);
  kiosk.castShadow = true;
  trGroup.add(kiosk);

  // HV taper bushings (145 kV class) on the long front face
  [-1.7, 0, 1.7].forEach((xPhase) => {
    const bushing = createPorcelainStack(ctx, 2.9, 0.3, 0.11, 9, mats.porcelainBrown);
    bushing.position.set(xPhase, 4.84, 0.95);
    trGroup.add(bushing);
    const arcShield = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 14, 10),
      mats.copper
    );
    arcShield.position.set(xPhase, 7.82, 0.95);
    trGroup.add(arcShield);
    registerClickable(bushing, 'HV_BUSHING');
  });

  // LV cable boxes on the right face (13.8 kV side)
  [-1.3, 0, 1.3].forEach((zBox) => {
    const cableBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.55), mats.darkSlate);
    cableBox.position.set(3.35, 3.4, zBox);
    trGroup.add(cableBox);
  });

  // Detachable radiator panel banks on both ends + fan cowlings
  [-4.35, 4.35].forEach((xBank) => {
    [3.85, 1.15].forEach((yHeader) => {
      const header = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.0, 10), mats.galvanized);
      header.rotation.x = Math.PI / 2;
      header.position.set(xBank, yHeader, 0);
      trGroup.add(header);
    });
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.0, 10), mats.galvanized);
    riser.position.set(xBank * 0.78, 0.95, 0);
    trGroup.add(riser);

    for (let zElem = -1.15; zElem <= 1.15; zElem += 0.58) {
      const element = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.55, 0.46), mats.tankSteel);
      element.position.set(xBank, 2.5, zElem);
      element.castShadow = true;
      trGroup.add(element);
      registerClickable(element, 'RADIATOR_BANK');

      const guard = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.032, 8, 20), mats.galvanized);
      guard.rotation.y = Math.PI / 2;
      guard.position.set(xBank + Math.sign(xBank) * 0.22, 2.35, zElem);
      trGroup.add(guard);

      const fanBlade = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.055, 8), mats.conductor);
      fanBlade.rotation.x = Math.PI / 2;
      fanBlade.position.set(xBank + Math.sign(xBank) * 0.16, 2.35, zElem);
      trGroup.add(fanBlade);
      opts.fans?.push(fanBlade);
    }
  });

  // Thermal plume over the windings — additive heat gradient, X-ray focal point
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
    const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.2, 0.03), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
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
// Geometry follows field practice: cast interruptor tank carried on steel
// pedestals, two inclined porcelain bushings per pole forming an inverted V,
// terminal crowns with horizontal pads, bell-crank + insulating pull-rod
// drive train, SF6 density monitor, mechanism cabinet with door stiffeners.
// ---------------------------------------------------------------------------

export function buildDeadTankBreaker(
  ctx: AssetContext,
  opts: { x: number; z: number; flags?: THREE.Mesh[]; needles?: THREE.Mesh[] }
): THREE.Group {
  const { mats, registerClickable } = ctx;
  const cb = new THREE.Group();
  cb.position.set(opts.x, 0, opts.z);

  const poleX = [-1.35, 0, 1.35];

  // Three fabricated steel pedestal columns, one under each pole
  poleX.forEach((xp) => {
    const column = new THREE.Mesh(new THREE.BoxGeometry(0.42, 2.0, 0.42), mats.galvanized);
    column.position.set(xp, 1.0, 0);
    column.castShadow = true;
    cb.add(column);

    // Lattice cut-out illusion: recessed dark panels on column faces
    const inset = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.5, 0.24), mats.darkSlate);
    inset.position.set(xp, 1.0, 0);
    cb.add(inset);

    // Column cap plate transferring the tank load
    const capPlate = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.56), mats.galvanized);
    capPlate.position.set(xp, 2.04, 0);
    cb.add(capPlate);
  });

  // Longitudinal tie beams linking the pedestals
  [-0.28, 0.28].forEach((zTie) => {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 0.14), mats.galvanized);
    tie.position.set(0, 0.5, zTie);
    cb.add(tie);
  });

  // Cast aluminium dead tank with cooling/strength rib rings
  const tankLen = 4.0;
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, tankLen, 20), mats.tankSteel);
  tank.rotation.z = Math.PI / 2;
  tank.position.y = 2.62;
  tank.castShadow = true;
  tank.receiveShadow = true;
  cb.add(tank);
  registerClickable(tank, 'SF6_BREAKER');

  [-1.2, -0.4, 0.4, 1.2].forEach((xRibRing) => {
    const ribRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.57, 0.035, 8, 26),
      mats.galvanized
    );
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

  // Two inclined porcelain bushings per pole (inverted-V interruption chambers)
  let terminalTopY = 4.2;
  poleX.forEach((xp) => {
    [-1, 1].forEach((side) => {
      const tilt = side * 0.42; // ~24 degrees

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

  // Bell crank + insulating pull-rod driving the centre pole
  const pullRod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.15, 10), mats.porcelainGray);
  pullRod.position.set(0, 1.62, 0.34);
  cb.add(pullRod);
  const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.1), mats.darkSlate);
  crankArm.position.set(0, 2.2, 0.34);
  cb.add(crankArm);

  // Gang-operated linkage shaft along the frame into the mechanism cabinet
  const linkShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.1, 10), mats.galvanized);
  linkShaft.rotation.z = Math.PI / 2;
  linkShaft.position.set(0, 1.05, 0.52);
  cb.add(linkShaft);
  poleX.forEach((xp) => {
    const linkArm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.36, 0.09), mats.galvanized);
    linkArm.position.set(xp, 1.28, 0.52);
    cb.add(linkArm);
  });

  // Spring operating mechanism cabinet (right-hand end) with door stiffeners
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
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.005), new THREE.MeshStandardMaterial({ color: 0x166534 }));
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

  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 0.75), mats.galvanized);
  frame.position.y = 0.1;
  frame.receiveShadow = true;
  ds.add(frame);

  // Operating mechanism cabinet + vertical linkage
  const mech = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.92, 0.52), mats.galvanized);
  mech.position.set(0, 0.56, 0.62);
  ds.add(mech);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 2.1, 8), mats.galvanized);
  rod.position.set(0, 1.85, 0.44);
  ds.add(rod);

  // Two counter-rotating post insulators carrying the blade halves
  [-0.68, 0.68].forEach((xPost) => {
    const post = createPorcelainStack(ctx, 2.35, 0.17, 0.12, 7, mats.porcelainBrown);
    post.position.set(xPost, 0.2, 0);
    ds.add(post);

    // Rotating bearing head atop each post
    const bearingHead = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 12), mats.galvanized);
    bearingHead.position.set(xPost, 2.62, 0);
    ds.add(bearingHead);
  });

  // Aluminium tube blade halves meeting at the centre break,
  // each parented to a rotating pivot group for open/close animation
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

    // Contact finger at the outer end of each blade half
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

  const column = createPorcelainStack(ctx, 2.3, 0.27, 0.17, 9, mats.porcelainBrown);
  column.position.y = 0.18;
  ct.add(column);

  // Dished top housing enclosing the toroidal core
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.4, 0.64, 16), mats.galvanized);
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

  // Secondary terminal box
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

  // Wider upper tank containing the primary winding
  const upperTank = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 16), mats.tankSteel);
  upperTank.position.y = 2.9;
  upperTank.castShadow = true;
  vt.add(upperTank);

  const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), mats.galvanized);
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

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.4, 12), mats.darkSlate);
  pedestal.position.y = 0.2;
  sa.add(pedestal);

  const column = createPorcelainStack(ctx, 2.55, 0.19, 0.12, 9, mats.porcelainGray);
  column.position.y = 0.4;
  sa.add(column);

  [2.62, 1.78].forEach((yRing) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.028, 8, 20), mats.galvanized);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = yRing;
    sa.add(ring);
  });

  const liveCap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), mats.copper);
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
  const angleIron = new THREE.MeshStandardMaterial({ color: 0x5b6675, metalness: 0.75, roughness: 0.42 });

  [-spread / 2, spread / 2].forEach((xLeg) => {
    // Twin vertical chords per leg plane
    [-0.5, 0.5].forEach((zChord) => {
      const chord = new THREE.Mesh(new THREE.BoxGeometry(0.14, h, 0.14), angleIron);
      chord.position.set(xLeg, h / 2, zChord);
      chord.castShadow = true;
      gantry.add(chord);
    });
    // Horizontal rungs + diagonal web between the chords
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
        new THREE.TorusGeometry(0.13 - discIdx * 0.004, 0.045, 6, 14),
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
// 8. Earthing Switch (hinged blade type)
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
// 9. MV Switchgear Lineup (13.8 kV metal-clad panels)
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

// ---------------------------------------------------------------------------

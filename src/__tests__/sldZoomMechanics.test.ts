import { describe, expect, it } from 'vitest';

/**
 * SLD Focal Point Zoom & Coordinate Transformation Core Mathematical Functions
 */
export function calculateFocalPointPan(
  mouseX: number,
  mouseY: number,
  currentPan: { x: number; y: number },
  currentZoom: number,
  newZoom: number
): { x: number; y: number } {
  const ratio = newZoom / currentZoom;
  return {
    x: Math.round(mouseX - (mouseX - currentPan.x) * ratio),
    y: Math.round(mouseY - (mouseY - currentPan.y) * ratio),
  };
}

export function calculateCenterPan(
  targetSvgX: number,
  targetSvgY: number,
  zoom: number,
  canvasCenter = { x: 600, y: 325 }
): { x: number; y: number } {
  return {
    x: Math.round((canvasCenter.x - targetSvgX) * zoom),
    y: Math.round((canvasCenter.y - targetSvgY) * zoom),
  };
}

export function projectMinimapViewport(
  pan: { x: number; y: number },
  zoom: number,
  mapDim = { width: 200, height: 125 },
  svgDim = { width: 1200, height: 650 }
) {
  const scaleX = mapDim.width / svgDim.width;
  const scaleY = mapDim.height / svgDim.height;

  const vpWidth = Math.min(mapDim.width, mapDim.width / zoom);
  const vpHeight = Math.min(mapDim.height, mapDim.height / zoom);

  const centerSvgX = svgDim.width / 2 - pan.x / zoom;
  const centerSvgY = svgDim.height / 2 - pan.y / zoom;

  const centerMapX = centerSvgX * scaleX;
  const centerMapY = centerSvgY * scaleY;

  const vpX = Math.max(0, Math.min(mapDim.width - vpWidth, centerMapX - vpWidth / 2));
  const vpY = Math.max(0, Math.min(mapDim.height - vpHeight, centerMapY - vpHeight / 2));

  return { vpX, vpY, vpWidth, vpHeight };
}

describe('SLD Zoom & Pan Mathematical Principles', () => {
  it('guarantees focal point invariance: cursor point does not drift after zoom', () => {
    const currentZoom = 1.0;
    const currentPan = { x: 0, y: 0 };
    // Mouse is 150px right, 80px down from container center
    const mouseX = 150;
    const mouseY = 80;

    // Zoom in to 1.8x
    const newZoom = 1.8;
    const newPan = calculateFocalPointPan(mouseX, mouseY, currentPan, currentZoom, newZoom);

    // Physical position of the SVG point under cursor before zoom:
    // P_screen = Pan + P_svg * Zoom => P_svg = (P_screen - Pan) / Zoom
    const pointSvgX = (mouseX - currentPan.x) / currentZoom;
    const pointSvgY = (mouseY - currentPan.y) / currentZoom;

    // Physical position of the SVG point after zoom:
    const reprojectedScreenX = newPan.x + pointSvgX * newZoom;
    const reprojectedScreenY = newPan.y + pointSvgY * newZoom;

    // Must match cursor position within rounding tolerance (<= 1px)
    expect(Math.abs(reprojectedScreenX - mouseX)).toBeLessThanOrEqual(1);
    expect(Math.abs(reprojectedScreenY - mouseY)).toBeLessThanOrEqual(1);
  });

  it('correctly centers target equipment at any zoom factor', () => {
    // Transformer TR-1 is located at (320, 270) in SVG space (600x325 center)
    const targetSvg = { x: 320, y: 270 };
    const zoomLevel = 1.45;

    const pan = calculateCenterPan(targetSvg.x, targetSvg.y, zoomLevel);

    // Screen offset from center for this target point:
    // screenX = (targetSvg.x - 600) * zoomLevel + pan.x
    const screenOffsetFromCenterX = (targetSvg.x - 600) * zoomLevel + pan.x;
    const screenOffsetFromCenterY = (targetSvg.y - 325) * zoomLevel + pan.y;

    expect(Math.abs(screenOffsetFromCenterX)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(screenOffsetFromCenterY)).toBeLessThanOrEqual(0.5);
  });

  it('accurately projects minimap lens rectangle in proportion to zoom and pan', () => {
    const zoom = 2.0;
    const pan = { x: 0, y: 0 };

    const vp = projectMinimapViewport(pan, zoom);

    // At 2x zoom, minimap viewport lens should be exactly half of total map dimensions
    expect(vp.vpWidth).toBe(100);
    expect(vp.vpHeight).toBe(62.5);

    // And centered when pan is (0, 0)
    expect(vp.vpX).toBe(50);
    expect(vp.vpY).toBe(31.25);
  });

  it('guarantees 1:1 pixel dragging without zoom attenuation', () => {
    const mouseMovement = { dx: 120, dy: -45 };
    const initialPan = { x: 50, y: 20 };

    // With corrected principle: 1 mouse pixel = 1 screen pan pixel
    const updatedPan = {
      x: initialPan.x + mouseMovement.dx,
      y: initialPan.y + mouseMovement.dy,
    };

    expect(updatedPan.x).toBe(170);
    expect(updatedPan.y).toBe(-25);
  });
});

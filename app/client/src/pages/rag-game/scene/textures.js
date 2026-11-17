import { CanvasTexture, SRGBColorSpace } from 'three';
import { typeLabel } from '../../../../../content/ragStages.js';

export function labelTexture(stage) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = stage.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText(stage.name, canvas.width / 2, 84, canvas.width - 30);
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillText(`in: ${typeLabel(stage.takes)}`, canvas.width / 2, 135, canvas.width - 30);
  ctx.fillText(`out: ${typeLabel(stage.gives)}`, canvas.width / 2, 178, canvas.width - 30);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function numberTexture(number) {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e2e8f0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText(String(number), 48, 52);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

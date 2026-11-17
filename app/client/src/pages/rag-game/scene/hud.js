import { MESSAGE_COLORS } from './constants.js';

function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const attempt = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(attempt).width > maxWidth) { lines.push(line); line = word; } else { line = attempt; }
  }
  if (line) lines.push(line);
  return lines;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, width, height, radius); else ctx.rect(x, y, width, height);
}

/**
 * Draws the on-canvas interface (progress, buttons and messages) and returns where each button is,
 * so clicks on the canvas can be matched to them. Everything the learner sees and presses lives in the canvas.
 */
export function drawHud(ctx, size, dpr, hud, hoverId) {
  const { w, h } = size;
  const small = w < 520;
  const fontPx = small ? 13 : 15;
  const lineH = Math.round(fontPx * 1.45);
  const btnH = small ? 30 : 34;
  const pad = 10;
  const font = `${fontPx}px system-ui, sans-serif`;
  const bold = `bold ${fontPx}px system-ui, sans-serif`;
  const rects = [];

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const buttonWidth = (label) => { ctx.font = bold; return Math.ceil(ctx.measureText(label).width) + 26; };
  const drawButton = (button, x, y) => {
    const bw = buttonWidth(button.label);
    const hovered = hoverId === button.id && button.enabled;
    ctx.globalAlpha = button.enabled ? 1 : 0.4;
    roundedRect(ctx, x, y, bw, btnH, 8);
    ctx.fillStyle = hovered ? '#334155' : button.active ? '#7c2d12' : '#1e293b';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = button.primary ? '#22d3ee' : button.active ? '#f97316' : '#64748b';
    ctx.stroke();
    ctx.fillStyle = '#f1f5f9';
    ctx.font = bold;
    ctx.fillText(button.label, x + 13, y + btnH / 2 + 1);
    ctx.globalAlpha = 1;
    rects.push({ id: button.id, x, y, w: bw, h: btnH, enabled: button.enabled });
    return bw;
  };

  // Top bar: progress on the left, buttons on the right (or on a second row on narrow screens).
  const topButtons = hud.buttons.filter((button) => button.area === 'top');
  ctx.font = bold;
  const progressW = ctx.measureText(hud.progress).width;
  const topButtonsW = topButtons.reduce((sum, button) => sum + buttonWidth(button.label) + 8, -8);
  const oneRow = pad * 2 + progressW + 16 + topButtonsW <= w;
  const topH = oneRow ? btnH + 16 : 8 + lineH + 6 + btnH + 8;
  ctx.fillStyle = 'rgba(15,23,42,0.92)';
  ctx.fillRect(0, 0, w, topH);
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, topH - 1, w, 1);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = bold;
  ctx.fillText(hud.progress, pad, oneRow ? topH / 2 : 8 + lineH / 2);
  let bx = oneRow ? w - pad - topButtonsW : pad;
  const by = oneRow ? 8 : 8 + lineH + 6;
  for (const button of topButtons) bx += drawButton(button, bx, by) + 8;

  // Bottom panel: the current message, then the action buttons.
  const bottomButtons = hud.buttons.filter((button) => button.area === 'bottom');
  const inner = w - pad * 2 - 24;
  ctx.font = font;
  let lines = wrapLines(ctx, hud.message.text, inner);
  const rowsOfButtons = (() => {
    let rows = bottomButtons.length ? 1 : 0;
    let used = 0;
    for (const button of bottomButtons) {
      const bw = buttonWidth(button.label);
      if (used && used + bw > w - pad * 2) { rows += 1; used = 0; }
      used += bw + 8;
    }
    return rows;
  })();
  const buttonsH = rowsOfButtons ? rowsOfButtons * (btnH + 8) : 0;
  const maxMessageH = Math.max(lineH + 20, h * 0.55 - buttonsH - pad * 2);
  const maxLines = Math.max(1, Math.floor((maxMessageH - 20) / lineH));
  if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s*\S*$/, '')}…`; }
  const messageH = lines.length * lineH + 20;
  const bottomH = pad + messageH + buttonsH + pad;
  const top = h - bottomH;
  ctx.fillStyle = 'rgba(15,23,42,0.92)';
  ctx.fillRect(0, top, w, bottomH);
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, top, w, 1);

  const [fill, stroke] = MESSAGE_COLORS[hud.message.severity] ?? MESSAGE_COLORS.info;
  roundedRect(ctx, pad, top + pad, w - pad * 2, messageH, 8);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = font;
  lines.forEach((line, index) => ctx.fillText(line, pad + 12, top + pad + 10 + lineH * index + lineH / 2));

  let x = pad;
  let y = top + pad + messageH + 8;
  for (const button of bottomButtons) {
    const bw = buttonWidth(button.label);
    if (x > pad && x + bw > w - pad) { x = pad; y += btnH + 8; }
    x += drawButton(button, x, y) + 8;
  }
  return { topH, bottomH, rects };
}

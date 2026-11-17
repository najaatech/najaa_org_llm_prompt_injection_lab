import { Color } from 'three';
import { stages } from '../../../../../content/ragStages.js';

export const GAP = 2.2;
export const SOCKET_Y = 1.4;
export const TRAY_Y = -1.6;
export const PIECE_SIZE = [1.9, 1.3, 0.5];
export const BACKGROUND = '#0f172a';
export const slotX = (index) => (index - (stages.length - 1) / 2) * GAP;

export const COLORS = {
  idle: new Color('#64748b'), next: new Color('#fbbf24'), filled: new Color('#22c55e'),
  packet: new Color('#22d3ee'), tainted: new Color('#f59e0b'), poisoned: new Color('#ef4444')
};

export const MESSAGE_COLORS = {
  success: ['#14532d', '#22c55e'], warning: ['#78350f', '#f59e0b'], error: ['#7f1d1d', '#ef4444'], info: ['#0c4a6e', '#38bdf8']
};

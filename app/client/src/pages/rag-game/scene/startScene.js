import {
  AmbientLight, BoxGeometry, CanvasTexture, DirectionalLight, EdgesGeometry, LineBasicMaterial, LineSegments,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Raycaster, Scene,
  SphereGeometry, Sprite, SpriteMaterial, SRGBColorSpace, Vector2, WebGLRenderer
} from 'three';
import { POISON_REACHES_PROMPT, stages } from '../../../../../content/ragStages.js';
import { BACKGROUND, COLORS, GAP, PIECE_SIZE, SOCKET_Y, TRAY_Y, slotX } from './constants.js';
import { drawHud } from './hud.js';
import { labelTexture, numberTexture } from './textures.js';

/** Builds the scene and starts drawing. Returns a function that stops and frees everything. */
export function startScene(host, live, shakes, act) {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(BACKGROUND);
  renderer.autoClear = false;
  host.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.touchAction = 'manipulation';

  const scene = new Scene();
  scene.add(new AmbientLight('#ffffff', 1.6));
  const sun = new DirectionalLight('#ffffff', 2.2);
  sun.position.set(3, 6, 8);
  scene.add(sun);

  const camera = new PerspectiveCamera(40, 1, 0.1, 100);

  const sockets = stages.map((_, index) => {
    const outline = new LineSegments(
      new EdgesGeometry(new BoxGeometry(PIECE_SIZE[0] + 0.2, PIECE_SIZE[1] + 0.2, PIECE_SIZE[2] + 0.2)),
      new LineBasicMaterial({ color: COLORS.idle })
    );
    outline.position.set(slotX(index), SOCKET_Y, 0);
    const tag = new Sprite(new SpriteMaterial({ map: numberTexture(index + 1), transparent: true }));
    tag.position.set(slotX(index), SOCKET_Y + 1.15, 0);
    tag.scale.set(0.6, 0.6, 1);
    scene.add(outline, tag);
    return outline;
  });

  const pieces = stages.map((stage) => {
    const side = new MeshStandardMaterial({ color: stage.color });
    const front = new MeshStandardMaterial({ map: labelTexture(stage) });
    const mesh = new Mesh(new BoxGeometry(...PIECE_SIZE), [side, side, side, side, front, side]);
    mesh.userData.id = stage.id;
    mesh.position.set(slotX(live.current.order.indexOf(stage.id)), TRAY_Y, 0);
    scene.add(mesh);
    return mesh;
  });

  const packetMaterial = new MeshStandardMaterial({ color: COLORS.packet, emissive: COLORS.packet, emissiveIntensity: 0.6 });
  const packet = new Mesh(new SphereGeometry(0.36, 24, 16), packetMaterial);
  packet.visible = false;
  scene.add(packet);

  // The interface is a flat canvas texture drawn over the 3D scene with its own camera.
  const hudScene = new Scene();
  const hudCamera = new OrthographicCamera(0, 1, 1, 0, -1, 1);
  const hudMaterial = new MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false });
  const hudMesh = new Mesh(new PlaneGeometry(1, 1), hudMaterial);
  hudScene.add(hudMesh);
  const hudCanvas = document.createElement('canvas');
  let hudTexture = null;
  let hudKey = '';
  let layout = { topH: 44, bottomH: 150, rects: [] };
  let size = { w: 1, h: 1 };
  let hovered = null;
  let hoverButton = null;

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const ease = reduceMotion ? 1 : 0.16;
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  const viewHeight = () => Math.max(80, size.h - layout.topH - layout.bottomH);
  const fitCamera = () => {
    camera.aspect = size.w / viewHeight();
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    const distance = Math.max(10, 9.6 / (tanHalf * camera.aspect), 3.6 / tanHalf);
    camera.position.set(0, 0.4, distance);
    camera.lookAt(0, 0.4, 0);
    camera.updateProjectionMatrix();
  };
  const redrawHud = () => {
    const dpr = renderer.getPixelRatio();
    if (!hudTexture) {
      hudCanvas.width = Math.round(size.w * dpr);
      hudCanvas.height = Math.round(size.h * dpr);
      hudTexture = new CanvasTexture(hudCanvas);
      hudTexture.colorSpace = SRGBColorSpace;
      hudMaterial.map = hudTexture;
      hudMaterial.needsUpdate = true;
    }
    layout = drawHud(hudCanvas.getContext('2d'), size, dpr, live.current.hud, hoverButton);
    hudTexture.needsUpdate = true;
    fitCamera();
  };
  const resize = () => {
    size = { w: Math.max(host.clientWidth, 1), h: Math.max(host.clientHeight, 1) };
    renderer.setSize(size.w, size.h);
    hudCamera.right = size.w;
    hudCamera.top = size.h;
    hudCamera.updateProjectionMatrix();
    hudMesh.scale.set(size.w, size.h, 1);
    hudMesh.position.set(size.w / 2, size.h / 2, 0);
    hudTexture?.dispose();
    hudTexture = null;
    hudKey = '';
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  const local = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width };
  };
  const buttonAt = (x, y) => layout.rects.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) ?? null;
  const pieceAt = (x, y) => {
    const viewH = viewHeight();
    if (y < layout.topH || y > layout.topH + viewH) return null;
    pointer.set((x / size.w) * 2 - 1, -(((y - layout.topH) / viewH) * 2 - 1));
    raycaster.setFromCamera(pointer, camera);
    const loose = pieces.filter((piece) => !live.current.placed.includes(piece.userData.id));
    return raycaster.intersectObjects(loose, false)[0]?.object.userData.id ?? null;
  };
  const onMove = (event) => {
    const { x, y } = local(event);
    const button = buttonAt(x, y);
    hoverButton = button?.enabled ? button.id : null;
    hovered = button ? null : pieceAt(x, y);
    renderer.domElement.style.cursor = hoverButton || hovered ? 'pointer' : 'default';
  };
  const onLeave = () => { hovered = null; hoverButton = null; renderer.domElement.style.cursor = 'default'; };
  const onDown = (event) => {
    const { x, y } = local(event);
    const button = buttonAt(x, y);
    if (button) { if (button.enabled) act.current('button', button.id); return; }
    const id = pieceAt(x, y);
    if (id) act.current('piece', id);
  };
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('pointerleave', onLeave);
  renderer.domElement.addEventListener('pointerdown', onDown);

  renderer.setAnimationLoop((time) => {
    const { placed, order, runStep, poisoned } = live.current;
    const now = performance.now();
    const pulse = (Math.sin(time / 260) + 1) / 2;

    pieces.forEach((mesh) => {
      const id = mesh.userData.id;
      const slot = placed.indexOf(id);
      const x = slot >= 0 ? slotX(slot) : slotX(order.indexOf(id));
      const y = slot >= 0 ? SOCKET_Y : TRAY_Y;
      const shake = shakes.current[id] > now ? Math.sin(now * 0.06) * 0.14 : 0;
      mesh.position.x += (x + shake - mesh.position.x) * ease;
      mesh.position.y += (y - mesh.position.y) * ease;
      const active = runStep >= 0 && placed[runStep] === id;
      const targetScale = active ? 1.1 + pulse * 0.06 : hovered === id ? 1.08 : 1;
      mesh.scale.setScalar(mesh.scale.x + (targetScale - mesh.scale.x) * 0.2);
    });

    sockets.forEach((outline, index) => {
      const filled = index < placed.length;
      const isNext = index === placed.length && runStep < 0;
      outline.material.color.copy(isNext ? COLORS.next : filled ? COLORS.filled : COLORS.idle);
      outline.scale.setScalar(isNext ? 1 + pulse * 0.05 : 1);
    });

    if (runStep >= 0) {
      const target = slotX(runStep);
      if (!packet.visible) { packet.visible = true; packet.position.set(target - GAP, SOCKET_Y + 1.5, 0); }
      packet.position.x += (target - packet.position.x) * (reduceMotion ? 1 : 0.07);
      packet.position.y = SOCKET_Y + 1.5 + (reduceMotion ? 0 : Math.sin(time / 180) * 0.12);
      const color = poisoned ? (runStep >= POISON_REACHES_PROMPT ? COLORS.poisoned : COLORS.tainted) : COLORS.packet;
      packetMaterial.color.copy(color);
      packetMaterial.emissive.copy(color);
    } else {
      packet.visible = false;
    }

    const key = JSON.stringify([size.w, size.h, hoverButton, live.current.hud]);
    if (key !== hudKey) { hudKey = key; redrawHud(); }

    renderer.setViewport(0, 0, size.w, size.h);
    renderer.clear();
    renderer.setViewport(0, layout.bottomH, size.w, viewHeight());
    renderer.render(scene, camera);
    renderer.setViewport(0, 0, size.w, size.h);
    renderer.clearDepth();
    renderer.render(hudScene, hudCamera);
  });

  return () => {
    renderer.setAnimationLoop(null);
    observer.disconnect();
    renderer.domElement.removeEventListener('pointermove', onMove);
    renderer.domElement.removeEventListener('pointerleave', onLeave);
    renderer.domElement.removeEventListener('pointerdown', onDown);
    scene.traverse((object) => {
      object.geometry?.dispose();
      const materials = [].concat(object.material ?? []);
      materials.forEach((material) => { material.map?.dispose(); material.dispose(); });
    });
    hudMesh.geometry.dispose();
    hudMaterial.dispose();
    hudTexture?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}

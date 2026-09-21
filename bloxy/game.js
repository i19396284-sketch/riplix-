// ============================================================
// ==================== СОХРАНЕНИЕ ====================
// ============================================================
const SAVE_KEY = 'bloxy_full_v1';

function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return {
      robux: s.robux || 0, coins: s.coins || 0,
      totalEarned: s.totalEarned || 0,
      ownedAccessories: s.ownedAccessories || [],
      equipped: s.equipped || {},
      lastDaily: s.lastDaily || 0,
      lastPassive: s.lastPassive || Date.now(),
      lastVisit: s.lastVisit || 0,
      streak: s.streak || 0,
      gamesPlayed: s.gamesPlayed || 0
    };
  } catch {
    return {
      robux: 500, coins: 0, totalEarned: 500,
      ownedAccessories: [], equipped: {},
      lastDaily: 0, lastPassive: Date.now(),
      lastVisit: 0, streak: 0, gamesPlayed: 0
    };
  }
}
function saveGame() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }
let save = loadSave();

const now = Date.now();
const dayMs = 24 * 60 * 60 * 1000;
const daysSinceVisit = Math.floor((now - save.lastVisit) / dayMs);
if (save.lastVisit === 0) { save.robux = 500; save.lastDaily = 0; }
else if (daysSinceVisit > 1) save.streak = 0;
save.lastVisit = now;
saveGame();

// ============================================================
// ==================== ПАССИВНЫЙ ДОХОД ====================
// ============================================================
setInterval(() => {
  const elapsed = Date.now() - save.lastPassive;
  if (elapsed >= 60000) {
    const ticks = Math.floor(elapsed / 60000);
    save.robux += 100 * ticks;
    save.totalEarned += 100 * ticks;
    save.lastPassive += 60000 * ticks;
    saveGame(); updateUI();
    showToast('+100 R$ (пассивный доход)', 'info');
  }
}, 1000);
setInterval(() => {
  const left = Math.max(0, 60 - Math.floor((Date.now() - save.lastPassive) / 1000));
  const el = document.getElementById('passive-timer');
  if (el) el.textContent = `следующее: ${left}с`;
}, 500);

// ============================================================
// ==================== ЕЖЕДНЕВКА ====================
// ============================================================
function canClaimDaily() { return Date.now() - save.lastDaily >= dayMs; }
function claimDaily() {
  if (!canClaimDaily()) { showToast('Уже забрано сегодня!', 'error'); return; }
  save.streak = (save.streak || 0) + 1;
  const reward = 500 + Math.min(save.streak * 100, 500);
  save.robux += reward; save.totalEarned += reward;
  save.lastDaily = Date.now(); saveGame();
  showToast(`🎁 +${reward} R$! Серия: ${save.streak} дн.`, 'info');
  updateUI(); updateDailyUI();
}
function updateDailyUI() {
  const btn = document.getElementById('daily-btn');
  const amountEl = document.getElementById('daily-amount');
  const timerEl = document.getElementById('daily-timer');
  if (!btn) return;
  if (canClaimDaily()) {
    btn.disabled = false; btn.textContent = 'Забрать';
    amountEl.textContent = 500 + Math.min((save.streak + 1) * 100, 500);
    timerEl.textContent = '';
  } else {
    btn.disabled = true; btn.textContent = 'Уже забрано';
    const left = dayMs - (Date.now() - save.lastDaily);
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    timerEl.textContent = `Через: ${h}ч ${m}м`;
  }
}

// ============================================================
// ==================== 30 АКСЕССУАРОВ ====================
// ============================================================
const ACCESSORIES = [
  { id: 'hat_cap', name: 'Кепка', price: 300, emoji: '🧢', slot: 'hat', color: 0xff0000, build: buildCap },
  { id: 'hat_party', name: 'Колпак', price: 400, emoji: '🎉', slot: 'hat', color: 0xff00ff, build: buildPartyHat },
  { id: 'hat_top', name: 'Цилиндр', price: 500, emoji: '🎩', slot: 'hat', color: 0x000000, build: buildTopHat },
  { id: 'hat_pirate', name: 'Пиратская', price: 800, emoji: '🏴‍☠️', slot: 'hat', color: 0x1a1a1a, build: buildPirateHat },
  { id: 'hat_viking', name: 'Шлем викинга', price: 1200, emoji: '⚔️', slot: 'hat', color: 0x8B7355, build: buildVikingHelmet },
  { id: 'hat_crown', name: 'Корона', price: 2000, emoji: '👑', slot: 'hat', color: 0xffcc00, build: buildCrown },
  { id: 'hat_halo', name: 'Нимб', price: 5000, emoji: '😇', slot: 'hat', color: 0xffff66, build: buildHalo },
  { id: 'glasses_sun', name: 'Тёмные очки', price: 600, emoji: '🕶️', slot: 'glasses', color: 0x000000, build: buildSunglasses },
  { id: 'glasses_3d', name: '3D очки', price: 700, emoji: '👓', slot: 'glasses', color: 0xff0000, build: build3DGlasses },
  { id: 'glasses_neon', name: 'Неоновые', price: 1500, emoji: '💚', slot: 'glasses', color: 0x00ff00, build: buildNeonGlasses },
  { id: 'glasses_monocle', name: 'Монокль', price: 900, emoji: '🧐', slot: 'glasses', color: 0xd4af37, build: buildMonocle },
  { id: 'glasses_vr', name: 'VR шлем', price: 2500, emoji: '🥽', slot: 'glasses', color: 0x222222, build: buildVRHeadset },
  { id: 'face_smile', name: 'Улыбка', price: 200, emoji: '😀', slot: 'face', color: 0xff0000, build: buildSmileFace },
  { id: 'face_cool', name: 'Крутой', price: 400, emoji: '😎', slot: 'face', color: 0x000000, build: buildCoolFace },
  { id: 'face_angry', name: 'Злой', price: 400, emoji: '😠', slot: 'face', color: 0xdc3545, build: buildAngryFace },
  { id: 'face_wink', name: 'Подмигивание', price: 600, emoji: '😉', slot: 'face', color: 0xffaa00, build: buildWinkFace },
  { id: 'face_skull', name: 'Череп', price: 1500, emoji: '💀', slot: 'face', color: 0xffffff, build: buildSkullFace },
  { id: 'back_cape_red', name: 'Красный плащ', price: 1500, emoji: '🦸', slot: 'back', color: 0xff0000, build: buildCape },
  { id: 'back_cape_blue', name: 'Синий плащ', price: 1500, emoji: '🦸‍♂️', slot: 'back', color: 0x0066ff, build: buildCape },
  { id: 'back_jetpack', name: 'Джетпак', price: 3000, emoji: '🚀', slot: 'back', color: 0x888888, build: buildJetpack },
  { id: 'back_wings', name: 'Крылья', price: 4000, emoji: '🦋', slot: 'back', color: 0xffffff, build: buildWings },
  { id: 'back_sword', name: 'Меч', price: 2500, emoji: '⚔️', slot: 'back', color: 0xc0c0c0, build: buildSword },
  { id: 'shoulder_parrot', name: 'Попугай', price: 1800, emoji: '🦜', slot: 'shoulder', color: 0xff0000, build: buildParrot },
  { id: 'shoulder_cat', name: 'Кот', price: 1200, emoji: '🐱', slot: 'shoulder', color: 0xff8800, build: buildCat },
  { id: 'shoulder_dragon', name: 'Дракончик', price: 5000, emoji: '🐲', slot: 'shoulder', color: 0x00aa44, build: buildDragon },
  { id: 'shoulder_ghost', name: 'Призрак', price: 3500, emoji: '👻', slot: 'shoulder', color: 0xffffff, build: buildGhost },
  { id: 'aura_fire', name: 'Огненная аура', price: 2000, emoji: '🔥', slot: 'aura', color: 0xff4400, build: buildFireAura },
  { id: 'aura_ice', name: 'Ледяная аура', price: 2000, emoji: '❄️', slot: 'aura', color: 0x66ccff, build: buildIceAura },
  { id: 'aura_rainbow', name: 'Радужная аура', price: 6000, emoji: '🌈', slot: 'aura', color: 0xff00ff, build: buildRainbowAura },
  { id: 'aura_gold', name: 'Золотая аура', price: 8000, emoji: '⭐', slot: 'aura', color: 0xffcc00, build: buildGoldAura }
];

// ============================================================
// ==================== БИЛДЕРЫ АКСЕССУАРОВ ====================
// ============================================================
function buildCap(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, roughness: 0.6 });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  cap.position.y = 3.65; g.add(cap);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.5), mat);
  brim.position.set(0, 3.65, 0.65); g.add(brim);
  return g;
}
function buildPartyHat(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, roughness: 0.5 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 16), mat);
  cone.position.y = 4.2; g.add(cone);
  const pompom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffff00 }));
  pompom.position.y = 4.8; g.add(pompom);
  return g;
}
function buildTopHat(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, roughness: 0.5 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 20), mat);
  base.position.y = 3.75; g.add(base);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.85, 20), mat);
  top.position.y = 4.2; g.add(top);
  const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.15, 20), new THREE.MeshStandardMaterial({ color: 0xaa0000 }));
  ribbon.position.y = 3.85; g.add(ribbon);
  return g;
}
function buildPirateHat(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, roughness: 0.8 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.2, 20), mat);
  base.position.y = 3.75; g.add(base);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.5, 20), mat);
  top.position.y = 4.05; g.add(top);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  skull.position.set(0, 3.75, 0.75); g.add(skull);
  const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  cross1.position.set(0, 3.58, 0.75); g.add(cross1);
  const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.03), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  cross2.position.set(0, 3.58, 0.75); g.add(cross2);
  return g;
}
function buildVikingHelmet(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, metalness: 0.7, roughness: 0.4 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  dome.position.y = 3.7; g.add(dome);
  for (let side = -1; side <= 1; side += 2) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0xfff8dc, roughness: 0.7 }));
    horn.position.set(side * 0.55, 4.05, 0);
    horn.rotation.z = side * 0.6; g.add(horn);
  }
  return g;
}
function buildCrown(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, metalness: 0.9, roughness: 0.2, emissive: 0x554400, emissiveIntensity: 0.3 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 16), mat);
  base.position.y = 3.85; g.add(base);
  for (let i = 0; i < 6; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 8), mat);
    const angle = (i / 6) * Math.PI * 2;
    spike.position.set(Math.cos(angle) * 0.45, 4.15, Math.sin(angle) * 0.45);
    g.add(spike);
  }
  return g;
}
function buildHalo(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: acc.color, transparent: true, opacity: 0.85 });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.07, 12, 40), mat);
  halo.position.y = 4.2; halo.rotation.x = Math.PI / 2; g.add(halo);
  return g;
}
function buildSunglasses(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, roughness: 0.3 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 0.12), mat);
  frame.position.set(0, 3.2, 0.55); g.add(frame);
  return g;
}
function build3DGlasses(acc) {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 0.12), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  frame.position.set(0, 3.2, 0.55); g.add(frame);
  const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.05), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  lensL.position.set(-0.24, 3.2, 0.63); g.add(lensL);
  const lensR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.05), new THREE.MeshBasicMaterial({ color: 0x00ccff }));
  lensR.position.set(0.24, 3.2, 0.63); g.add(lensR);
  return g;
}
function buildNeonGlasses(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: acc.color });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 0.12), mat);
  frame.position.set(0, 3.2, 0.55); g.add(frame);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.3, 0.08), new THREE.MeshBasicMaterial({ color: acc.color, transparent: true, opacity: 0.3 }));
  glow.position.set(0, 3.2, 0.5); g.add(glow);
  return g;
}
function buildMonocle(acc) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 20), new THREE.MeshStandardMaterial({ color: acc.color, metalness: 0.9, roughness: 0.2 }));
  ring.position.set(0.22, 3.2, 0.55); g.add(ring);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }));
  lens.position.set(0.22, 3.2, 0.56); g.add(lens);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4), new THREE.MeshStandardMaterial({ color: acc.color }));
  chain.position.set(0.22, 2.9, 0.55); g.add(chain);
  return g;
}
function buildVRHeadset(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, roughness: 0.6 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.4), mat);
  box.position.set(0, 3.2, 0.55); g.add(box);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.05), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
  visor.position.set(0, 3.2, 0.76); g.add(visor);
  return g;
}
function buildSmileFace(acc) {
  const g = new THREE.Group();
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 20, Math.PI), new THREE.MeshBasicMaterial({ color: acc.color }));
  mouth.position.set(0, 2.95, 0.55); mouth.rotation.z = Math.PI; g.add(mouth);
  return g;
}
function buildCoolFace(acc) {
  const g = new THREE.Group();
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 20, Math.PI), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  mouth.position.set(0, 2.95, 0.55); mouth.rotation.z = 0.3; g.add(mouth);
  return g;
}
function buildAngryFace(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  for (let side = -1; side <= 1; side += 2) {
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.05), mat);
    brow.position.set(side * 0.2, 3.4, 0.55); brow.rotation.z = side * 0.4; g.add(brow);
  }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), mat);
  mouth.position.set(0, 2.9, 0.55); g.add(mouth);
  return g;
}
function buildWinkFace(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.05), mat);
  line.position.set(-0.2, 3.22, 0.55); g.add(line);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 20, Math.PI), mat);
  mouth.position.set(0, 2.95, 0.55); mouth.rotation.z = Math.PI; g.add(mouth);
  return g;
}
function buildSkullFace(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12), mat);
    eye.position.set(side * 0.2, 3.2, 0.56); g.add(eye);
  }
  for (let i = -2; i <= 2; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.05), mat);
    tooth.position.set(i * 0.07, 2.9, 0.56); g.add(tooth);
  }
  return g;
}
function buildCape(acc) {
  const g = new THREE.Group();
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), new THREE.MeshStandardMaterial({ color: acc.color, side: THREE.DoubleSide, roughness: 0.7 }));
  cape.position.set(0, 1.7, -0.55); cape.rotation.x = 0.15; g.add(cape);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.2), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  collar.position.set(0, 2.6, -0.45); g.add(collar);
  return g;
}
function buildJetpack(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, metalness: 0.7, roughness: 0.4 });
  for (let side = -1; side <= 1; side += 2) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.0, 12), mat);
    tank.position.set(side * 0.4, 1.9, -0.55); g.add(tank);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 }));
    flame.position.set(side * 0.4, 1.2, -0.55); flame.rotation.x = Math.PI; g.add(flame);
  }
  return g;
}
function buildWings(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, side: THREE.DoubleSide, transparent: true, opacity: 0.85, roughness: 0.4, emissive: 0xffffff, emissiveIntensity: 0.2 });
  for (let side = -1; side <= 1; side += 2) {
    const wing = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), mat);
    wing.position.set(side * 0.9, 2.1, -0.55);
    wing.rotation.y = side * 0.3; wing.rotation.z = side * 0.4; g.add(wing);
  }
  return g;
}
function buildSword(acc) {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.03), new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 }));
  blade.position.set(0, 1.9, -0.55); blade.rotation.z = 0.4; g.add(blade);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x4a2a10 }));
  handle.position.set(-0.4, 0.9, -0.55); handle.rotation.z = 0.4; g.add(handle);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.9 }));
  guard.position.set(-0.3, 1.05, -0.55); guard.rotation.z = 0.4; g.add(guard);
  return g;
}
function buildParrot(acc) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshStandardMaterial({ color: acc.color, roughness: 0.7 }));
  body.position.set(0.9, 2.6, 0); g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshStandardMaterial({ color: 0x00ccff }));
  head.position.set(0.9, 2.85, 0); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
  beak.position.set(0.9, 2.82, 0.2); beak.rotation.x = Math.PI / 2; g.add(beak);
  return g;
}
function buildCat(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mat);
  body.position.set(0.9, 2.6, 0); g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), mat);
  head.position.set(0.9, 2.95, 0.05); g.add(head);
  for (let side = -1; side <= 1; side += 2) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.15, 8), mat);
    ear.position.set(0.9 + side * 0.1, 3.1, 0.05); g.add(ear);
  }
  return g;
}
function buildDragon(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, roughness: 0.6, emissive: 0x002200, emissiveIntensity: 0.3 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), mat);
  body.position.set(0.9, 2.6, 0); g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), mat);
  head.position.set(0.9, 2.95, 0.1); g.add(head);
  for (let side = -1; side <= 1; side += 2) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 6), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
    horn.position.set(0.9 + side * 0.1, 3.15, 0.05); horn.rotation.z = side * 0.3; g.add(horn);
  }
  for (let side = -1; side <= 1; side += 2) {
    const wing = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0xff4444, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
    wing.position.set(0.9 + side * 0.25, 2.7, -0.1); wing.rotation.y = side * 0.5; g.add(wing);
  }
  return g;
}
function buildGhost(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: acc.color, transparent: true, opacity: 0.7, emissive: 0xffffff, emissiveIntensity: 0.3 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mat);
  body.position.set(0.9, 2.7, 0); body.scale.y = 1.4; g.add(body);
  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    eye.position.set(0.9 + side * 0.1, 2.8, 0.25); g.add(eye);
  }
  return g;
}
function buildFireAura(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: acc.color, transparent: true, opacity: 0.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 8, 40), mat);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.15; g.add(ring);
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 8), new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.7 }));
    flame.position.set(Math.cos(angle) * 1.0, 0.4, Math.sin(angle) * 1.0); g.add(flame);
  }
  return g;
}
function buildIceAura(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: acc.color, transparent: true, opacity: 0.4 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 8, 40), mat);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.15; g.add(ring);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), new THREE.MeshBasicMaterial({ color: 0x99ddff, transparent: true, opacity: 0.8 }));
    crystal.position.set(Math.cos(angle) * 1.0, 0.4, Math.sin(angle) * 1.0); g.add(crystal);
  }
  return g;
}
function buildRainbowAura(acc) {
  const g = new THREE.Group();
  const colors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x00aaff, 0x8800ff, 0xff00ff];
  colors.forEach((c, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0 + i * 0.08, 0.04, 8, 40), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.15 + i * 0.1; g.add(ring);
  });
  return g;
}
function buildGoldAura(acc) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: acc.color, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0 + i * 0.15, 0.05, 8, 40), mat);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.15 + i * 0.4; g.add(ring);
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0xffff66 }));
    star.position.set(Math.cos(angle) * 1.2, 0.8, Math.sin(angle) * 1.2); g.add(star);
  }
  return g;
}

// ============================================================
// ==================== ИГРЫ ====================
// ============================================================
const GAMES = [
  { id: 'labyrinth', name: 'Лабиринт', emoji: '🏰', category: 'action', color: 'linear-gradient(135deg, #00a2ff, #0077cc)', desc: 'Собирай монеты, избегай врагов', rules: '🪙 Собери все монеты<br>👹 Избегай врагов<br>❤ 3 жизни', rewardBase: 150, type: 'three' },
  { id: 'speedrun', name: 'Спидран', emoji: '⚡', category: 'action', color: 'linear-gradient(135deg, #ffcc00, #ff8800)', desc: 'Успей собрать всё за 60 сек!', rules: '⏱ Лимит 60 секунд<br>🪙 Собери все монеты', rewardBase: 250, type: 'three', timeLimit: 60 },
  { id: 'zen', name: 'Дзен', emoji: '🧘', category: 'action', color: 'linear-gradient(135deg, #00b06b, #00834e)', desc: 'Без врагов, просто собирай', rules: '🪙 Собирай монеты<br>🚫 Нет врагов', rewardBase: 100, type: 'three', noEnemies: true },
  { id: 'hardcore', name: 'Хардкор', emoji: '🔥', category: 'action', color: 'linear-gradient(135deg, #ff6600, #cc0000)', desc: 'Одна жизнь, много врагов', rules: '❤ 1 жизнь<br>👹 Много врагов', rewardBase: 400, type: 'three', lives: 1 },
  { id: 'simon', name: 'Саймон', emoji: '🧠', category: 'puzzle', color: 'linear-gradient(135deg, #9933ff, #6600cc)', desc: 'Повторяй последовательность', rules: '🎨 Запоминай цвета<br>📈 Каждый раунд +1', rewardBase: 200, type: 'simon' },
  { id: 'tictactoe', name: 'Крестики-нолики', emoji: '❌', category: 'board', color: 'linear-gradient(135deg, #dc3545, #8b0000)', desc: 'Против ИИ', rules: '❌ 3 в ряд = победа<br>🤖 Умный противник', rewardBase: 150, type: 'tictactoe' },
  { id: 'memory', name: 'Память', emoji: '🎴', category: 'puzzle', color: 'linear-gradient(135deg, #00b06b, #007744)', desc: 'Найди все пары', rules: '🎴 Открывай карточки<br>🧠 Найди все пары', rewardBase: 180, type: 'memory' },
  { id: 'flappy', name: 'Flappy Cube', emoji: '🐦', category: 'arcade', color: 'linear-gradient(135deg, #ffcc00, #ff6600)', desc: 'Пролетай через трубы', rules: '🎯 15 труб = победа<br>⚡ Чем дальше — тем сложнее', rewardBase: 220, type: 'flappy' }
];

// ============================================================
// ==================== АУДИО ====================
// ============================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null, masterGain = null;
function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new AudioCtx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  } catch(e) {}
}
function playTone(freq, duration, type = 'sine', volume = 0.3, slideTo = null) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain); gain.connect(masterGain);
  osc.start(); osc.stop(audioCtx.currentTime + duration);
}
const Sounds = {
  coin: () => { playTone(880, 0.08, 'square', 0.3); setTimeout(() => playTone(1320, 0.12, 'square', 0.3), 60); },
  jump: () => playTone(300, 0.15, 'sine', 0.2, 600),
  hurt: () => playTone(200, 0.2, 'sawtooth', 0.4, 80),
  win: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'triangle', 0.35), i * 100)); },
  lose: () => { [400, 350, 300, 200].forEach((f, i) => setTimeout(() => playTone(f, 0.3, 'sawtooth', 0.3), i * 150)); },
  click: () => playTone(600, 0.05, 'sine', 0.15),
  correct: () => playTone(800, 0.15, 'sine', 0.25),
  wrong: () => playTone(150, 0.3, 'sawtooth', 0.3),
  enemyAlert: () => { playTone(440, 0.1, 'square', 0.25); setTimeout(() => playTone(660, 0.15, 'square', 0.25), 100); },
  simon: (i) => playTone([261, 329, 392, 523][i], 0.25, 'sine', 0.3)
};

// ============================================================
// ==================== 3D СЦЕНА ====================
// ============================================================
const TILE = 3, WALL_H = 3, PLAYER_RADIUS = 0.7;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 40, 100);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 300);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
renderer.domElement.style.display = 'none';

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(30, 50, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
sun.shadow.camera.far = 150;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0x88ccff, 0x445522, 0.4));

const gameRoot = new THREE.Group();
scene.add(gameRoot);

// ============================================================
// ==================== КАРТЫ ====================
// ============================================================
const LEVELS_CLASSIC = [
  [
    "####################",
    "#P.......#.........C#",
    "#.#####..#..#####...#",
    "#.#...#..#..#...#...#",
    "#.#.#.#..#..#.#.#...#",
    "#...#.#..#..#...#...#",
    "#####.#..#..#####...#",
    "#.....#..#..........#",
    "#.#####..######.#####",
    "#.#...........#.....#",
    "#.#.###########.###.#",
    "#.#.#.........#...#.#",
    "#.#.#.#######.###.#.#",
    "#...#.#.....#...#.#.#",
    "###.#.#.###.###.#.#.#",
    "#C..#.E.#.#...#.E.#C#",
    "#.#####.#.#.#####...#",
    "#.......#.#.........#",
    "#.###################",
    "####################"
  ],
  [
    "####################",
    "#P...#..........#.C.#",
    "#.##.#.########.#...#",
    "#.#..#.#......#.#.##.#",
    "#.#.##.#.####.#.#.#..#",
    "#.#....#.#E.#.#.#.#.##",
    "#.#.####.#...#.#.#...#",
    "#.#.#..#.#.###.#.##.#C",
    "#.#.#.##.#.#...#..#.#",
    "#.#.#..E.#.#.####.#.#",
    "#.#.####.#.#.#..#.#.#",
    "#.#......#.#.#E##.#.#",
    "#.########.#.#..#.#.#",
    "#.....E..#.#.#.##.#.#",
    "#######.##.#.#.#..#.#",
    "#C......##.#.#.####.#",
    "#.#####..E.#.#....#.#",
    "#.....#....#.####.#C#",
    "#.########.#......#.#",
    "####################"
  ]
];

// ============================================================
// ==================== СОСТОЯНИЕ ====================
// ============================================================
const state = {
  running: false, paused: false,
  level: 0, levelsList: LEVELS_CLASSIC,
  score: 0, lives: 3, maxLives: 3,
  levelStartTime: 0, invulnerable: 0,
  mode: null, difficulty: 'easy',
  timeLimit: null, totalCoins: 0
};

// ============================================================
// ==================== КОНТЕЙНЕРЫ ====================
// ============================================================
let levelGroup = null;
let flappyGroup = null;
let walls = [], coins = [], enemies = [];
let playerStart = { x: 0, z: 0 };
let equippedGroups = {};

// ============================================================
// ==================== ТЕКСТУРЫ ====================
// ============================================================
function makeBrickTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c2571a';
  ctx.fillRect(0, 0, 128, 128);
  const bw = 32, bh = 16;
  for (let y = 0; y < 128; y += bh) {
    const offset = (Math.floor(y / bh) % 2) * (bw / 2);
    for (let x = -bw; x < 128 + bw; x += bw) {
      ctx.fillStyle = `hsl(${20 + Math.random() * 10}, 65%, ${45 + Math.random() * 10}%)`;
      ctx.fillRect(x + offset + 1, y + 1, bw - 2, bh - 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
function makeGrassTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `hsl(${100 + Math.random() * 40 - 20}, 60%, ${35 + Math.random() * 15}%)`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  return tex;
}
const brickTex = makeBrickTexture();
const grassTex = makeGrassTexture();

// ============================================================
// ==================== КАПСУЛА ====================
// ============================================================
function createCapsule(radius, height, mat) {
  const group = new THREE.Group();
  const cylH = Math.max(0.01, height - radius * 2);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, cylH, 16), mat);
  cyl.castShadow = true; group.add(cyl);
  const sphereGeo = new THREE.SphereGeometry(radius, 16, 12);
  const top = new THREE.Mesh(sphereGeo, mat); top.position.y = cylH / 2; top.castShadow = true; group.add(top);
  const bottom = new THREE.Mesh(sphereGeo, mat); bottom.position.y = -cylH / 2; bottom.castShadow = true; group.add(bottom);
  return group;
}

// ============================================================
// ==================== ИГРОК ====================
// ============================================================
const player = new THREE.Group();
let playerParts = {};

function buildPlayer() {
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xFFCC99, roughness: 0.7 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2196F3, roughness: 0.6 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1565C0, roughness: 0.7 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.9 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 1.5, 16), shirtMat);
  torso.position.y = 1.65; torso.castShadow = true; player.add(torso);
  playerParts.torso = torso;
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 12), shirtMat);
  shoulders.position.y = 2.4; shoulders.castShadow = true; player.add(shoulders);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 20), skinMat);
  head.position.y = 3.15; head.castShadow = true; player.add(head);
  playerParts.head = head;
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.57, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.9 }));
  hair.position.y = 3.15; hair.castShadow = true; player.add(hair);
  const eyeGeo = new THREE.SphereGeometry(0.11, 12, 10);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.2, 3.2, 0.45); player.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.2, 3.2, 0.45); player.add(eyeR);
  const pupilGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const pL = new THREE.Mesh(pupilGeo, pupilMat); pL.position.set(-0.2, 3.2, 0.54); player.add(pL);
  const pR = new THREE.Mesh(pupilGeo, pupilMat); pR.position.set(0.2, 3.2, 0.54); player.add(pR);

  const armL = new THREE.Group();
  const armLMesh = createCapsule(0.22, 1.3, shirtMat); armLMesh.position.y = -0.65; armL.add(armLMesh);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), skinMat); handL.position.y = -1.3; armL.add(handL);
  armL.position.set(-0.85, 2.35, 0); player.add(armL); playerParts.armL = armL;
  const armR = new THREE.Group();
  const armRMesh = createCapsule(0.22, 1.3, shirtMat); armRMesh.position.y = -0.65; armR.add(armRMesh);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), skinMat); handR.position.y = -1.3; armR.add(handR);
  armR.position.set(0.85, 2.35, 0); player.add(armR); playerParts.armR = armR;
  const legL = new THREE.Group();
  const legLMesh = createCapsule(0.24, 1.3, pantsMat); legLMesh.position.y = -0.65; legL.add(legLMesh);
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.7), shoeMat); shoeL.position.set(0, -1.4, 0.1); legL.add(shoeL);
  legL.position.set(-0.35, 1.4, 0); player.add(legL); playerParts.legL = legL;
  const legR = new THREE.Group();
  const legRMesh = createCapsule(0.24, 1.3, pantsMat); legRMesh.position.y = -0.65; legR.add(legRMesh);
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.7), shoeMat); shoeR.position.set(0, -1.4, 0.1); legR.add(shoeR);
  legR.position.set(0.35, 1.4, 0); player.add(legR); playerParts.legR = legR;
}
buildPlayer();

function applyEquippedAccessories() {
  Object.values(equippedGroups).forEach(g => player.remove(g));
  equippedGroups = {};
  Object.entries(save.equipped).forEach(([slot, accId]) => {
    const acc = ACCESSORIES.find(a => a.id === accId);
    if (!acc || !acc.build) return;
    const g = acc.build(acc);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    player.add(g);
    equippedGroups[slot] = g;
  });
}

// ============================================================
// ==================== ВРАГ ====================
// ============================================================
function createEnemy3D(x, z) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xE53935, roughness: 0.6, emissive: 0x550000, emissiveIntensity: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.8 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.5, 16), bodyMat);
  torso.position.y = 1.5; torso.castShadow = true; group.add(torso);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), bodyMat);
  shoulders.position.y = 2.25; shoulders.castShadow = true; group.add(shoulders);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 16), bodyMat);
  head.position.y = 3.0; head.castShadow = true; group.add(head);
  const hornGeo = new THREE.ConeGeometry(0.1, 0.4, 8);
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x330000 });
  const hornL = new THREE.Mesh(hornGeo, hornMat); hornL.position.set(-0.3, 3.5, 0); hornL.rotation.z = 0.3; group.add(hornL);
  const hornR = hornL.clone(); hornR.position.x = 0.3; hornR.rotation.z = -0.3; group.add(hornR);
  const eyeGeo = new THREE.SphereGeometry(0.13, 12, 10);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.2, 3.1, 0.45); group.add(eyeL);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.2, 3.1, 0.45); group.add(eyeR);
  const armL = new THREE.Group();
  armL.add(createCapsule(0.22, 1.2, darkMat)); armL.position.set(-0.8, 2.2, 0); group.add(armL);
  const armR = new THREE.Group();
  armR.add(createCapsule(0.22, 1.2, darkMat)); armR.position.set(0.8, 2.2, 0); group.add(armR);
  const legL = new THREE.Group();
  legL.add(createCapsule(0.24, 1.2, darkMat)); legL.position.set(-0.35, 1.3, 0); group.add(legL);
  const legR = new THREE.Group();
  legR.add(createCapsule(0.24, 1.2, darkMat)); legR.position.set(0.35, 1.3, 0); group.add(legR);
  group.position.set(x, 0, z);
  const diffMult = state.difficulty === 'easy' ? 0.8 : state.difficulty === 'normal' ? 1 : 1.3;
  return {
    group, startX: x, startZ: z,
    dir: Math.random() > 0.5 ? 0 : Math.PI,
    speed: 2.2 * diffMult,
    detectionRange: 12 * diffMult,
    state: 'patrol', searchTimer: 0,
    lastSeenX: x, lastSeenZ: z, walkPhase: 0,
    parts: { armL, armR, legL, legR }
  };
}

// ============================================================
// ==================== СТЕНА, МОНЕТА ====================
// ============================================================
function createWall(x, z) {
  const group = new THREE.Group();
  const tex = brickTex.clone();
  tex.needsUpdate = true;
  tex.repeat.set(2, 2);
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0xD2691E, roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(TILE - 0.2, WALL_H - 0.2, TILE - 0.2), mat);
  body.position.y = WALL_H / 2;
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(TILE - 0.4, 0.15, TILE - 0.4), new THREE.MeshStandardMaterial({ color: 0x6BBF59, roughness: 0.95 }));
  top.position.y = WALL_H + 0.05;
  top.castShadow = true;
  group.add(top);
  group.position.set(x, 0, z);
  return group;
}
function createCoin3D(x, y, z) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.95, roughness: 0.15, emissive: 0x664400, emissiveIntensity: 0.6 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 32), mat);
  disc.rotation.x = Math.PI / 2; disc.castShadow = true; group.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.06, 12, 40), mat);
  group.add(ring);
  group.position.set(x, y, z);
  group.rotation.x = Math.PI / 2;
  return group;
}

// ============================================================
// ==================== ОЧИСТКА ====================
// ============================================================
function cleanupScene() {
  if (levelGroup) { gameRoot.remove(levelGroup); disposeObject(levelGroup); levelGroup = null; }
  if (flappyGroup) { gameRoot.remove(flappyGroup); disposeObject(flappyGroup); flappyGroup = null; }
  const toRemove = [];
  gameRoot.children.forEach(child => { if (child !== player) toRemove.push(child); });
  toRemove.forEach(child => { gameRoot.remove(child); disposeObject(child); });
  walls = []; coins = []; enemies = []; state.totalCoins = 0;
  player.visible = false;
  if (player.parent) player.parent.remove(player);
  if (flappyKeyHandler) { document.removeEventListener('keydown', flappyKeyHandler); flappyKeyHandler = null; }
  if (flappyClickHandler) { renderer.domElement.removeEventListener('click', flappyClickHandler); flappyClickHandler = null; }
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = null;
}
function disposeObject(obj) {
  obj.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose && m.dispose());
      else child.material.dispose && child.material.dispose();
    }
  });
}

// ============================================================
// ==================== ПОСТРОЙКА УРОВНЯ ====================
// ============================================================
function buildLevel(mapData) {
  if (levelGroup) { gameRoot.remove(levelGroup); disposeObject(levelGroup); }
  levelGroup = new THREE.Group();
  gameRoot.add(levelGroup);
  walls = []; coins = []; enemies = []; state.totalCoins = 0;

  const MAP = mapData;
  const gridH = MAP.length, gridW = MAP[0].length;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(gridW * TILE + 20, gridH * TILE + 20),
    new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  levelGroup.add(ground);

  const spawnEnemies = !(state.mode && state.mode.noEnemies);
  for (let z = 0; z < gridH; z++) {
    for (let x = 0; x < gridW; x++) {
      const ch = MAP[z][x];
      const px = (x - gridW/2) * TILE;
      const pz = (z - gridH/2) * TILE;
      if (ch === '#') {
        const wall = createWall(px, pz);
        levelGroup.add(wall);
        walls.push({ x: px, z: pz, size: TILE });
      } else if (ch === 'C') {
        const coin = createCoin3D(px, 1.2, pz);
        levelGroup.add(coin);
        coins.push({ mesh: coin, collected: false, x: px, z: pz });
        state.totalCoins++;
      } else if (ch === 'P') {
        playerStart.x = px; playerStart.z = pz;
      } else if (ch === 'E' && spawnEnemies) {
        const enemy = createEnemy3D(px, pz);
        levelGroup.add(enemy.group);
        enemies.push(enemy);
      }
    }
  }
  document.getElementById('score').textContent = '0';
  state.score = 0;
  player.visible = true;
  if (!player.parent) gameRoot.add(player);
  player.position.set(playerStart.x, 0, playerStart.z);
  player.rotation.y = 0;
  playerVelocity.set(0, 0, 0);
  velocityY = 0; onGround = true;
  cameraState.yaw = 0; cameraState.pitch = 0.25;
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 40, 100);
}

// ============================================================
// ==================== КОЛЛИЗИИ ====================
// ============================================================
function checkCollision(nx, nz, radius = PLAYER_RADIUS) {
  for (const w of walls) {
    const half = w.size / 2;
    if (nx + radius > w.x - half && nx - radius < w.x + half &&
        nz + radius > w.z - half && nz - radius < w.z + half) return true;
  }
  return false;
}

// ============================================================
// ==================== УПРАВЛЕНИЕ ====================
// ============================================================
const cameraState = { yaw: 0, pitch: 0.25, distance: 8, height: 2.5 };
let velocityY = 0, onGround = true, shiftHeld = false;
const keys = {};
let playerVelocity = new THREE.Vector3();

document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') shiftHeld = true;
  if (e.code === 'Escape' && state.running && !state.paused) pauseGame();
  else if (e.code === 'Escape' && state.paused) resumeGame();
});
document.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') shiftHeld = false;
});
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === renderer.domElement) {
    cameraState.yaw -= e.movementX * 0.0022;
    cameraState.pitch = Math.max(-0.8, Math.min(1.0, cameraState.pitch + e.movementY * 0.0022));
  }
});
renderer.domElement.addEventListener('click', () => {
  if (state.running && !state.paused && state.mode && state.mode.type === 'three') renderer.domElement.requestPointerLock();
});

let walkPhase = 0;
function updatePlayer(dt) {
  let inputX = 0, inputZ = 0;
  if (keys['KeyW'] || keys['ArrowUp']) inputZ -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) inputZ += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) inputX -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) inputX += 1;
  const speed = shiftHeld ? 6.5 : 13;
  const len = Math.hypot(inputX, inputZ);
  let targetVX = 0, targetVZ = 0;
  if (len > 0) {
    inputX /= len; inputZ /= len;
    const sin = Math.sin(cameraState.yaw), cos = Math.cos(cameraState.yaw);
    const dx = inputX * cos - inputZ * sin;
    const dz = inputX * sin + inputZ * cos;
    targetVX = dx * speed; targetVZ = dz * speed;
  }
  const ACCEL = len > 0 ? 20 : 15;
  playerVelocity.x += (targetVX - playerVelocity.x) * Math.min(1, dt * ACCEL);
  playerVelocity.z += (targetVZ - playerVelocity.z) * Math.min(1, dt * ACCEL);
  const nx = player.position.x + playerVelocity.x * dt;
  const nz = player.position.z + playerVelocity.z * dt;
  if (!checkCollision(nx, player.position.z)) player.position.x = nx; else playerVelocity.x = 0;
  if (!checkCollision(player.position.x, nz)) player.position.z = nz; else playerVelocity.z = 0;
  const velLen = Math.hypot(playerVelocity.x, playerVelocity.z);
  if (velLen > 0.5) {
    const targetAngle = Math.atan2(playerVelocity.x, playerVelocity.z);
    let diff = targetAngle - player.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    player.rotation.y += diff * Math.min(1, dt * 14);
    walkPhase += dt * (shiftHeld ? 8 : 16) * (velLen / speed);
    const swing = Math.sin(walkPhase) * 0.7;
    playerParts.armL.rotation.x = swing; playerParts.armR.rotation.x = -swing;
    playerParts.legL.rotation.x = -swing; playerParts.legR.rotation.x = swing;
  } else {
    playerParts.armL.rotation.x *= 0.85; playerParts.armR.rotation.x *= 0.85;
    playerParts.legL.rotation.x *= 0.85; playerParts.legR.rotation.x *= 0.85;
  }
  if (keys['Space'] && onGround) { velocityY = 12; onGround = false; Sounds.jump(); }
  velocityY -= 32 * dt;
  player.position.y += velocityY * dt;
  if (player.position.y <= 0) { player.position.y = 0; velocityY = 0; onGround = true; }
  if (state.invulnerable > 0) {
    state.invulnerable -= dt;
    player.visible = Math.floor(state.invulnerable * 10) % 2 === 0;
  } else player.visible = true;
}
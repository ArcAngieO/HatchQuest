// ===== HatchQuest =====
// Everything is saved automatically in this browser/app on this device (localStorage).
// A different device or browser starts fresh with its own player setup.

const SAVE_KEY = "hatchquest-save-v1";
const ui = { page: "home", editHabits: false, modal: null, ob: null, cardIdx: 0, cardList: [], cardNew: false, renaming: false };
let S = load();

/* ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function dateStr(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function addDays(str, n) { const [y, m, d] = str.split("-").map(Number); const dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() + n); return dateStr(dt); }
const today = () => dateStr();
function weekDates() { const d = new Date(); const dow = (d.getDay() + 6) % 7; const mon = addDays(today(), -dow); return [...Array(7)].map((_, i) => addDays(mon, i)); }
function prettyDate(str) { const [y, m, d] = str.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
function daysUntil(str) { const [y, m, d] = str.split("-").map(Number); const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((new Date(y, m - 1, d) - t) / 86400000); }
const creature = (id) => CREATURES.find((c) => c.id === id);
const DROP_EGGS = ["Tidecaller", "Forest", "Candy", "Bloom", "Ember"];
const BASE_EGG_XP = 300; // the standard egg; other eggs scale from it
const eggNeed = (theme) => Math.max(1, Math.round(EGGS[theme].need * ((S?.hatchXp || BASE_EGG_XP) / BASE_EGG_XP)));
const levelNeed = (l) => 150 + l * 50;

/* ---------- save / load ---------- */
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) { console.warn("Could not load save", e); }
  return null;
}
function migrate(s) {
  s.basket ||= {};
  for (const [oldName, newName] of Object.entries(EGG_RENAMES)) {
    if (s.basket[oldName]) { s.basket[newName] = (s.basket[newName] || 0) + s.basket[oldName]; }
    delete s.basket[oldName];
    if (s.inc?.theme === oldName) s.inc.theme = newName;
    (s.quests || []).forEach((q) => { if (q.egg === oldName) q.egg = newName; });
  }
  Object.keys(EGGS).forEach((k) => { s.basket[k] ||= 0; });
  (s.pets || []).forEach((p) => { if (OLD_CREATURES[p.cid]) p.cid = OLD_CREATURES[p.cid]; });
  s.pets = (s.pets || []).filter((p) => CREATURES.some((c) => c.id === p.cid));
  s.items ||= { shield: 0, polish: 0 }; s.boosts ||= {}; s.setsDone ||= []; s.gems ||= 0;
  s.history ||= {}; s.quests ||= []; s.pets ||= []; s.basket ||= {}; s.claimedWeeks ||= []; s.stats ||= { habits: 0, quests: 0, hatched: 0 };
  return s;
}
function save() { if (!S) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { console.warn("Save failed", e); } }
function commit() { save(); render(); }
window.addEventListener("beforeunload", save);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); else render(); });
let lastDay = today();
setInterval(() => { if (today() !== lastDay) { lastDay = today(); render(); } }, 30000);

function newPlayer({ name, avatar, color, habits, egg }) {
  const basket = Object.fromEntries(Object.keys(EGGS).map((k) => [k, 0]));
  return migrate({
    version: 1, createdAt: today(),
    player: { name, avatar, color },
    level: 1, xp: 0, coins: 50, gems: 0,
    habits: habits.map((h) => ({ id: uid(), name: h.name, icon: h.icon, xp: h.xp, streak: 0, lastDone: null })),
    history: {}, quests: [], pets: [], buddy: null, pity: 0, basket,
    inc: { theme: egg, xp: 0, from: "Starter egg", fed: 0 },
  });
}

/* ---------- toasts & floats ---------- */
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.innerHTML = msg; $("#toasts").appendChild(t); setTimeout(() => t.remove(), 2600); }
function floatAt(el, text, color) {
  if (!el) return; const r = el.getBoundingClientRect(); const f = document.createElement("div");
  f.className = "float"; f.textContent = text; if (color) f.style.color = color;
  f.style.left = r.left + r.width / 2 - 30 + "px"; f.style.top = r.top - 6 + "px"; document.body.appendChild(f); setTimeout(() => f.remove(), 1000);
}

/* ---------- game logic ---------- */
function buddyBonus() { const p = S.pets.find((x) => x.uid === S.buddy); return p ? RARITIES[creature(p.cid).rarity].buddyXp : 0; }
function gainXP(amount, feedEgg = true) {
  S.xp += amount;
  while (S.xp >= levelNeed(S.level)) {
    S.xp -= levelNeed(S.level); S.level++; const reward = 25 * S.level; S.coins += reward;
    S.basket[LEVEL_UP_EGG] = (S.basket[LEVEL_UP_EGG] || 0) + 1; S.gems += GEM_REWARDS.levelUp;
    toast(`⭐ Level up! You're now <b>level ${S.level}</b>: +${reward} 🪙, +${GEM_REWARDS.levelUp} 💎 and a <b>${LEVEL_UP_EGG} Egg</b>!`);
  }
  if (feedEgg && S.inc) { S.inc.xp = Math.min(S.inc.xp + amount, eggNeed(S.inc.theme)); }
}
function loseXP(amount) { S.xp = Math.max(0, S.xp - amount); if (S.inc) S.inc.xp = Math.max(0, S.inc.xp - amount); }

function todayLog() { return (S.history[today()] ||= {}); }
function doneCount(date) { const h = S.history[date]; return h ? Object.keys(h).filter((k) => !k.startsWith("__")).length : 0; }
function habitStreak(h) { return h.lastDone === today() || h.lastDone === addDays(today(), -1) ? h.streak : 0; }
function dayStreak() {
  let d = doneCount(today()) ? today() : addDays(today(), -1), n = 0;
  while (doneCount(d) > 0 || S.history[d]?.__shield) { n++; d = addDays(d, -1); }
  return n;
}
// Streak Shield: if yesterday was missed completely, use a shield so streaks carry over.
function applyShields() {
  if (!S || !S.items.shield) return;
  const y = addDays(today(), -1), before = addDays(today(), -2);
  if (doneCount(y) > 0 || S.history[y]?.__shield) return;
  const hit = S.habits.filter((h) => h.lastDone === before);
  if (!hit.length) return;
  S.items.shield--; S.history[y] = { ...(S.history[y] || {}), __shield: true };
  hit.forEach((h) => { h.lastDone = y; });
  save(); setTimeout(() => toast(`🛡️ A Streak Shield saved your streaks for ${prettyDate(y)}!`), 300);
}
function perfectThisWeek() { return weekDates().filter((d) => S.history[d]?.__perfect).length; }

function toggleHabit(id, el) {
  const h = S.habits.find((x) => x.id === id); if (!h) return;
  const log = todayLog();
  if (log[id]) { // undo
    const e = log[id]; loseXP(e.xp); S.coins = Math.max(0, S.coins - 2); h.streak = e.prevStreak; h.lastDone = e.prevLast; delete log[id];
    if (log.__perfect) { loseXP(log.__perfect); delete log.__perfect; }
    S.stats.habits = Math.max(0, S.stats.habits - 1); if (S.inc) S.inc.fed = Math.max(0, (S.inc.fed || 0) - 1);
    return commit();
  }
  const amt = Math.round(h.xp * (1 + buddyBonus() / 100) * (S.boosts.tonic === today() ? 2 : 1));
  log[id] = { xp: amt, prevStreak: h.streak, prevLast: h.lastDone };
  h.streak = h.lastDone === addDays(today(), -1) ? h.streak + 1 : h.lastDone === today() ? h.streak : 1;
  h.lastDone = today(); S.coins += 2; S.stats.habits++; if (S.inc) S.inc.fed = (S.inc.fed || 0) + 1;
  gainXP(amt); floatAt(el, `+${amt} XP!`);
  if (S.habits.length && doneCount(today()) >= S.habits.length && !log.__perfect) {
    const bonus = S.habits.reduce((a, x) => a + (log[x.id]?.xp || 0), 0);
    log.__perfect = bonus; gainXP(bonus);
    if (!log.__gem) { log.__gem = true; S.gems += GEM_REWARDS.perfectDay; }
    toast(`🌟 Perfect day! Daily bonus <b>+${bonus} XP</b> and +${GEM_REWARDS.perfectDay} 💎`);
  }
  commit();
}

function rollRarity(theme, lucky = false) {
  const base = EGGS[theme].odds; const odds = { ...base };
  if (lucky) { // double the rarest tiers, take the extra from common
    let extra = 0; for (const k of ["ultrarare", "legendary", "mythical"]) if (odds[k]) { extra += odds[k]; odds[k] *= 2; }
    odds.common = Math.max(0, (odds.common || 0) - extra);
  }
  const o = (k) => odds[k] || 0;
  if (S.pity >= PITY_LIMIT - 1 && o("legendary") + o("mythical") > 0) { // pity: guaranteed legendary or better
    return Math.random() * (o("legendary") + o("mythical")) < o("mythical") ? "mythical" : "legendary";
  }
  let r = Math.random() * 100;
  for (const k of RARITY_ORDER) { if (r < o(k)) return k; r -= o(k); }
  return "common";
}
function hatch() {
  if (!S.inc || S.inc.xp < eggNeed(S.inc.theme)) return;
  const theme = S.inc.theme;
  if (S.boosts.pearl) { // Pearl of Choice: let the player pick from creatures they've discovered
    const known = CREATURES.filter((x) => x.egg === theme && S.pets.some((p) => p.cid === x.id));
    if (known.length) { ui.modal = "choose"; render(); return; }
  }
  const lucky = !!S.boosts.lucky; if (lucky) delete S.boosts.lucky;
  let rarity;
  if (S.boosts.mythic && EGGS[theme].odds.mythical) { rarity = "mythical"; delete S.boosts.mythic; }
  else rarity = rollRarity(theme, lucky);
  S.pity = rarity === "legendary" || rarity === "mythical" ? 0 : S.pity + 1;
  const pool = CREATURES.filter((x) => x.egg === theme && x.rarity === rarity);
  const c = pick(pool.length ? pool : CREATURES.filter((x) => x.egg === theme));
  finishHatch(c);
}
function finishHatch(c) {
  const theme = S.inc.theme; ui.lastTheme = theme;
  const pet = { uid: uid(), cid: c.id, nick: null, hatchedAt: today(), fed: S.inc.fed || 0 };
  if (c.altArt) {
    const had = new Set(S.pets.filter((p) => p.cid === c.id).map(petForm));
    pet.form = Math.random() * 100 < (c.mainChance ?? 50) ? "main" : "alt";
    ui.viewForm = { cid: c.id, form: pet.form };
    if (had.size && !had.has(pet.form)) setTimeout(() => toast(`⇄ New form unlocked: <b>${esc(c.name)} · ${esc(pet.form === "main" ? c.mainLabel || "Main form" : c.altLabel || "Alt form")}</b>! You can now Shift Form.`), 400);
  }
  S.pets.push(pet); S.stats.hatched++; if (!S.buddy) S.buddy = pet.uid;
  S.inc = null;
  const all = CREATURES.filter((x) => x.egg === theme);
  if (!S.setsDone.includes(theme) && all.every((x) => S.pets.some((p) => p.cid === x.id))) {
    S.setsDone.push(theme); S.gems += GEM_REWARDS.setComplete;
    setTimeout(() => toast(`📘 You completed the <b>${theme} Set</b>! +${GEM_REWARDS.setComplete} 💎`), 400);
  }
  save(); openCard(c.id, true);
}
function chooseModal() {
  const theme = S.inc.theme;
  const known = CREATURES.filter((x) => x.egg === theme && S.pets.some((p) => p.cid === x.id)).sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
  return `<div class="overlay"><div class="modal" style="width:min(720px,100%)"><h2>🔮 Pearl of Choice</h2><p class="m">Choose which creature hatches from your ${theme} Egg. You can only pick creatures you've already discovered.</p>
    <div class="pgrid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">${known.map((c) => { const R = RARITIES[c.rarity];
      return `<div class="pcell" data-act="pearlpick" data-id="${c.id}">${thumb(c, { size: 0 })}<b>${esc(c.name)}</b><small style="color:${R.color}">${R.label}</small></div>`; }).join("")}</div>
    <div class="mfoot"><button class="btn g" data-act="pearlskip">ROLL RANDOMLY (KEEP PEARL)</button></div></div></div>`;
}
function incubate(theme) {
  if (!S.cheats && !S.basket[theme]) return;
  if (S.inc && S.inc.theme === theme) return toast(`You're already incubating a ${theme} Egg.`);
  if (S.inc && S.inc.xp > 0) { ui.swapTo = theme; ui.modal = "swap"; return render(); }
  doSwap(theme);
}
function doSwap(theme) {
  if (S.inc && !S.cheats) S.basket[S.inc.theme]++;
  if (S.inc) toast(`Swapped. Your ${S.inc.theme} Egg went back to the basket.`);
  if (!S.cheats) S.basket[theme]--;
  S.inc = { theme, xp: 0, from: "Egg basket", fed: 0 }; commit();
}
function swapModal() {
  const e = EGGS[S.inc.theme];
  return `<div class="overlay" data-act="closebg"><div class="modal"><h2>⚠️ Swap eggs?</h2>
    <p class="m">Your <b>${S.inc.theme} Egg</b> has <b>${S.inc.xp} / ${eggNeed(S.inc.theme)} XP</b>. If you swap it for a ${ui.swapTo} Egg, it goes back to your basket and <b>all of that progress is lost</b>.</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin:6px 0 4px">${eggSVG(S.inc.theme, 60)}<span style="font-size:26px">→</span>${eggSVG(ui.swapTo, 60)}</div>
    <div class="mfoot"><button class="btn g" data-act="close">KEEP MY EGG</button><button class="btn" style="background:var(--red);color:#3a0010;box-shadow:0 5px 0 #a23a4c" data-act="swapok">SWAP & LOSE PROGRESS</button></div></div></div>`;
}
function cheatModal() {
  return `<div class="overlay" data-act="closebg"><div class="modal"><h2>🧪 Enable cheats?</h2>
    <p class="m">You'll get <b>unlimited gems, coins and eggs</b>, and an <b>Instant Hatch</b> button in the incubator.</p>
    <p class="m" style="color:var(--red);font-weight:600">⚠️ This can't be reversed. Cheats stay on for this save forever. The only way back is Start Over, which erases everything.</p>
    <div class="mfoot"><button class="btn g" data-act="close">CANCEL</button><button class="btn" style="background:var(--red);color:#3a0010;box-shadow:0 5px 0 #a23a4c" data-act="cheaton">YES, ENABLE CHEATS</button></div></div></div>`;
}
function feed(el) {
  if (!S.inc || (!S.cheats && S.coins < 30)) return toast("You need 30 🪙 to feed your egg.");
  if (!S.cheats) S.coins -= 30; S.inc.xp = Math.min(S.inc.xp + 25, eggNeed(S.inc.theme)); floatAt(el, "+25 egg XP", "#ffd166"); commit();
}
function completeQuest(id, el) {
  const q = S.quests.find((x) => x.id === id); if (!q) return;
  const t = QUEST_TYPES[q.type]; gainXP(t.xp); S.coins += t.coins; S.stats.quests++;
  const gems = q.type === "boss" ? GEM_REWARDS.bossQuest : q.type === "side" ? GEM_REWARDS.assignment : 0; S.gems += gems;
  floatAt(el, `+${t.xp} XP`);
  let msg = `✅ Quest cleared! +${t.xp} XP, +${t.coins} 🪙${gems ? `, +${gems} 💎` : ""}`;
  if (Math.random() * 100 < t.eggChance) { S.basket[q.egg] = (S.basket[q.egg] || 0) + 1; msg += ` and a <b>${q.egg} Egg</b>!`; }
  else msg += ` (no egg this time)`;
  S.quests = S.quests.filter((x) => x.id !== id); toast(msg); commit();
}
// Spare copies = every copy of a creature beyond the first one you own. Your buddy and nicknamed pets are never traded.
function spareCopies() {
  const out = {};
  for (const c of CREATURES) {
    const mine = S.pets.filter((p) => p.cid === c.id); if (mine.length < 2) continue;
    const keep = new Set([mine.find((p) => p.uid === S.buddy) || mine.find((p) => p.nick) || mine[0]]);
    if (c.altArt) for (const f of ["main", "alt"]) { const k = mine.find((p) => petForm(p) === f); if (k && ![...keep].some((x) => petForm(x) === f)) keep.add(k); }
    const spare = mine.filter((p) => !keep.has(p) && p.uid !== S.buddy && !p.nick);
    if (spare.length) out[c.id] = spare;
  }
  return out;
}
const spareTotal = () => Object.values(spareCopies()).reduce((a, l) => a + l.length, 0);
function autoPickTrade() { // commonest spares first
  const pick = {}; let left = TRADE_COST; const sp = spareCopies();
  const ids = Object.keys(sp).sort((a, b) => RARITY_ORDER.indexOf(creature(b).rarity) - RARITY_ORDER.indexOf(creature(a).rarity));
  for (const id of ids) { const n = Math.min(left, sp[id].length); if (n) { pick[id] = n; left -= n; } if (!left) break; }
  return pick;
}
function doTrade() {
  const pick = ui.trade; const sp = spareCopies(); const n = Object.values(pick).reduce((a, b) => a + b, 0);
  if (n !== TRADE_COST) return toast(`Pick exactly ${TRADE_COST} duplicates.`);
  const gone = new Set(); for (const [id, k] of Object.entries(pick)) sp[id].slice(-k).forEach((p) => gone.add(p.uid));
  S.pets = S.pets.filter((p) => !gone.has(p.uid)); S.basket[TRADE_EGG] = (S.basket[TRADE_EGG] || 0) + 1; S.stats.traded = (S.stats.traded || 0) + 1;
  ui.modal = null; toast(`🔁 Traded ${TRADE_COST} duplicates for a <b>${TRADE_EGG} Egg</b>!`); commit();
}
function tradeModal() {
  const sp = spareCopies(); const pick = ui.trade; const n = Object.values(pick).reduce((a, b) => a + b, 0);
  const ids = Object.keys(sp).sort((a, b) => RARITY_ORDER.indexOf(creature(b).rarity) - RARITY_ORDER.indexOf(creature(a).rarity));
  const rows = ids.map((id) => { const c = creature(id); const R = RARITIES[c.rarity]; const k = pick[id] || 0;
    return `<div class="artrow">${thumb(c, { size: 48 })}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b><small style="color:${R.color}">${R.label} · ${sp[id].length} spare</small></div>
      <button class="mini-btn" data-act="tr-minus" data-id="${id}" ${k ? "" : "disabled"}>−</button><b class="px" style="width:26px;text-align:center;font-size:12px">${k}</b>
      <button class="mini-btn" data-act="tr-plus" data-id="${id}" ${k < sp[id].length && n < TRADE_COST ? "" : "disabled"}>＋</button></div>`; }).join("");
  return `<div class="overlay" data-act="closebg"><div class="modal" style="width:min(620px,100%)"><h2>Trade duplicates</h2>
    <p class="m">Swap ${TRADE_COST} duplicate pets for 1 ${TRADE_EGG} Egg. You always keep at least one of each creature, and your buddy and nicknamed pets are never traded.</p>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">${eggSVG(TRADE_EGG, 34)}<div style="flex:1"><div class="xpl"><span>SELECTED</span><span>${n} / ${TRADE_COST}</span></div><div class="bar gold"><i style="width:${(n / TRADE_COST) * 100}%"></i></div></div><button class="mini-btn" data-act="tr-auto">Auto-pick commonest</button></div>
    <div class="artgrid" style="grid-template-columns:1fr;max-height:46vh;overflow:auto">${rows}</div>
    <div class="mfoot"><button class="btn g" data-act="close">CANCEL</button><button class="btn" data-act="tr-go" ${n === TRADE_COST ? "" : "disabled"}>TRADE FOR EGG</button></div></div></div>`;
}

function gemSpares() { // spare duplicates worth gems
  const sp = spareCopies(); return Object.keys(sp).filter((id) => GEM_TRADE[creature(id).rarity]).sort((a, b) => RARITY_ORDER.indexOf(creature(a).rarity) - RARITY_ORDER.indexOf(creature(b).rarity)).map((id) => ({ id, list: sp[id] }));
}
function gemTrade(id) {
  const sp = spareCopies()[id]; const c = creature(id); const g = GEM_TRADE[c.rarity]; if (!sp?.length || !g) return;
  const p = sp[sp.length - 1]; S.pets = S.pets.filter((x) => x.uid !== p.uid); S.gems += g;
  toast(`💎 Traded a spare <b>${esc(c.name)}</b> for ${g} gems`); commit();
}

/* ---------- shop ---------- */
function buy(id, el) {
  const it = SHOP_ITEMS.find((x) => x.id === id); if (!it) return;
  if (!S.cheats && S.gems < it.price) return toast(`You need ${it.price} 💎 for ${it.name}.`);
  if (id === "elixir" && !S.inc) return toast("Put an egg in the incubator first.");
  if (id === "elixir" && S.inc.xp >= eggNeed(S.inc.theme)) return toast("Your egg is already ready to hatch!");
  if (id === "lucky" && S.boosts.lucky) return toast("A Lucky Potion is already active.");
  if (id === "pearl" && S.boosts.pearl) return toast("You already have a Pearl of Choice waiting.");
  if (id === "tonic" && S.boosts.tonic === today()) return toast("Tide Tonic is already active today.");
  if (it.id === "mythic" && S.boosts.mythic) return toast("An Abyssal Star is already waiting.");
  if (!S.cheats) S.gems -= it.price;
  if (id === "lucky") S.boosts.lucky = true;
  if (id === "pearl") S.boosts.pearl = true;
  if (id === "mythic") S.boosts.mythic = true;
  if (id === "tonic") S.boosts.tonic = today();
  if (id === "shield") S.items.shield++;
  if (id === "polish") S.items.polish++;
  if (id === "elixir") S.inc.xp = eggNeed(S.inc.theme);
  if (id === "egg") S.basket.Tidecaller = (S.basket.Tidecaller || 0) + 1;
  if (id === "coins") S.coins += 150;
  floatAt(el, `-${it.price} 💎`, "#7cc8ff"); toast(`${it.icon} Bought <b>${it.name}</b>`); commit();
}
function activeBoosts() {
  const b = [];
  if (S.boosts.lucky) b.push("🍀 Lucky Potion (next hatch)");
  if (S.boosts.pearl) b.push("🔮 Pearl of Choice (next hatch)");
  if (S.boosts.mythic) b.push("🌌 Abyssal Star (next Tidecaller hatch is Mythical)");
  if (S.boosts.tonic === today()) b.push("🧪 Tide Tonic (2× habit XP today)");
  if (S.items.shield) b.push(`🛡️ ${S.items.shield} Streak Shield${S.items.shield > 1 ? "s" : ""}`);
  if (S.items.polish) b.push(`✨ ${S.items.polish} Shiny Polish`);
  return b;
}
function shopPage() {
  const owned = (it) => it.id === "shield" ? S.items.shield : it.id === "polish" ? S.items.polish : it.id === "lucky" ? (S.boosts.lucky ? "active" : 0) : it.id === "pearl" ? (S.boosts.pearl ? "active" : 0) : it.id === "mythic" ? (S.boosts.mythic ? "active" : 0) : it.id === "tonic" ? (S.boosts.tonic === today() ? "active" : 0) : 0;
  const items = SHOP_ITEMS.map((it) => { const o = owned(it);
    return `<div class="shopitem"><div class="sico">${it.icon}</div><b>${esc(it.name)}</b><p>${esc(it.desc)}</p>
      ${o ? `<span class="owned">${o === "active" ? "ACTIVE" : "OWNED ×" + o}</span>` : ""}
      <button class="btn ${S.cheats || S.gems >= it.price ? "" : "g"}" data-act="buy" data-id="${it.id}" ${S.cheats || S.gems >= it.price ? "" : "disabled"}>${S.cheats ? "FREE" : it.price + " 💎"}</button></div>`; }).join("");
  const boosts = activeBoosts();
  const earn = [["⭐", "Level up", GEM_REWARDS.levelUp], ["🌟", "Perfect day (all habits done)", GEM_REWARDS.perfectDay], ["⚔️", "Finish a Boss quest", GEM_REWARDS.bossQuest], ["📚", "Finish an Assignment quest", GEM_REWARDS.assignment], ["🎁", "Open the weekly present", GEM_REWARDS.weeklyPresent], ["📘", "Complete an egg set", GEM_REWARDS.setComplete],
    ...Object.entries(GEM_TRADE).map(([r, g]) => ["🔁", `Trade a spare ${RARITIES[r].label.toLowerCase()} pet`, g])];
  return topBar() + `<div class="grid" style="grid-template-columns:1fr 340px">
    <div class="card"><div class="ch"><h3>GEM SHOP</h3><span>you have ${S.cheats ? "∞" : S.gems} 💎</span></div><div class="shopgrid">${items}</div></div>
    <div class="col"><div class="card"><div class="ch"><h3>ACTIVE</h3></div>${boosts.length ? boosts.map((b) => `<div class="q" style="padding:10px 12px">${b}</div>`).join("") : `<div class="empty">Nothing active yet.</div>`}</div>
    <div class="card"><div class="ch"><h3>EARN GEMS</h3></div>${earn.map(([i, t, g]) => `<div class="earn"><span>${i}</span><span style="flex:1">${t}</span><b>+${g} 💎</b></div>`).join("")}</div></div></div>`;
}

function claimPresent() {
  const wk = weekDates()[0]; if (perfectThisWeek() < 5 || S.claimedWeeks.includes(wk)) return;
  const egg = pick(DROP_EGGS);
  S.claimedWeeks.push(wk); S.basket[egg]++; S.coins += 100; S.gems += GEM_REWARDS.weeklyPresent;
  toast(`🎁 Present opened: <b>${egg} Egg</b>, +100 🪙, +${GEM_REWARDS.weeklyPresent} 💎`); commit();
}

/* ---------- art ---------- */
function eggSVG(theme, size = 56) {
  const e = EGGS[theme]; const deco = {
    waves: `<path d="M7 40q6-5 12 0t12 0 12 0 12 0" stroke="#fff" stroke-width="3.5" fill="none"/><path d="M8 50q6-5 11 0t11 0 11 0 11 0" stroke="${e.shade}" stroke-width="3.5" fill="none"/>`,
    leaves: `<ellipse cx="22" cy="44" rx="6" ry="3.5" fill="${e.shade}" transform="rotate(-30 22 44)"/><ellipse cx="38" cy="32" rx="6" ry="3.5" fill="${e.shade}" transform="rotate(30 38 32)"/><circle cx="36" cy="52" r="3" fill="#ff9f5a"/>`,
    sprinkles: `<rect x="16" y="34" width="6" height="2.4" rx="1.2" fill="#7cc8ff" transform="rotate(30 19 35)"/><rect x="34" y="28" width="6" height="2.4" rx="1.2" fill="#ffd166" transform="rotate(-20 37 29)"/><rect x="30" y="48" width="6" height="2.4" rx="1.2" fill="#7cf0b4" transform="rotate(50 33 49)"/><rect x="20" y="50" width="6" height="2.4" rx="1.2" fill="#fff" transform="rotate(-40 23 51)"/>`,
    flower: `<g fill="#ff8fb8"><circle cx="24" cy="40" r="3"/><circle cx="30" cy="40" r="3"/><circle cx="27" cy="35" r="3"/><circle cx="27" cy="45" r="3"/></g><circle cx="27" cy="40" r="2.2" fill="#fff"/><circle cx="40" cy="52" r="2.5" fill="#b69cff"/>`,
    flame: `<path d="M30 28q-10 12 0 24q10-12 0-24z" fill="#fff3a0"/><path d="M30 38q-4 6 0 12q4-6 0-12z" fill="#ff7a3d"/>`,
    stars: `<path d="M24 30l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="#ffd166"/><path d="M38 44l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="#ffd166"/><circle cx="40" cy="28" r="1.6" fill="#fff"/><circle cx="18" cy="52" r="1.4" fill="#fff"/>`,
  }[e.deco];
  return `<svg width="${size}" height="${Math.round(size * 1.15)}" viewBox="0 0 60 69"><path d="M30 3c-15 0-25 24-25 40 0 14 11 23 25 23s25-9 25-23C55 27 45 3 30 3z" fill="${e.base}"/><path d="M30 66c-14 0-25-9-25-23" stroke="${e.shade}" stroke-width="5" fill="none" opacity=".6"/>${deco}<ellipse cx="21" cy="20" rx="4" ry="8" fill="#fff" opacity=".5" transform="rotate(25 21 20)"/></svg>`;
}
window.artFail = (img) => { const s = document.createElement("span"); s.className = "em"; s.textContent = img.dataset.em; img.replaceWith(s); };
const ART_KEY = "hatchquest-art-v1";
let customArt = {}; try { customArt = JSON.parse(localStorage.getItem(ART_KEY) || "{}"); } catch { customArt = {}; }
function saveArt() { try { localStorage.setItem(ART_KEY, JSON.stringify(customArt)); return true; } catch { toast("Not enough space to store that picture. Try a smaller image."); return false; } }
const artSrc = (c) => customArt[c.id] || c.art || null;
const petForm = (p) => p.form || "main";
const ownedForms = (c) => new Set((S?.pets || []).filter((p) => p.cid === c.id).map(petForm));
const thumbSrc = (c) => customArt[c.id] || (c.altArt && S && ownedForms(c).size && !ownedForms(c).has("main") ? c.altThumb || c.altArt : null) || c.thumb || c.art || null;
const isFull = (c) => !customArt[c.id] && c.full;
function imgTag(src, c) { return `<img src="${esc(src)}" alt="${esc(c.name)}" data-em="${c.emoji}" onerror="artFail(this)" loading="lazy">`; }
function artHTML(c, src = artSrc(c)) { return src ? imgTag(src, c) : `<span class="em">${c.emoji}</span>`; }
function thumb(c, { size = 64, known = true, label = "", extra = "" } = {}) {
  return `<div class="thumb ${known ? "" : "unknown"}" style="${size ? `width:${size}px;height:${size}px;` : ""}background:${EGGS[c.egg].scene}" ${extra}>${known ? artHTML(c, thumbSrc(c)) : `<span class="em">${c.emoji}</span>`}${label}</div>`;
}

/* ---------- views ---------- */
function buddyPet() { const p = S.pets.find((x) => x.uid === S.buddy); return p ? { p, c: creature(p.cid) } : null; }
function buddyArt(b, which = "thumb") { // respects Selkie-style forms
  const alt = b.c.altArt && b.p.form === "alt";
  if (which === "thumb") return alt ? b.c.altThumb || b.c.altArt : thumbSrc(b.c);
  return alt ? b.c.altArt : artSrc(b.c);
}
const BUDDY_LINES = ["is cheering you on!", "believes in you.", "wants to see that streak grow.", "is ready for today.", "thinks you're doing great.", "is napping, but proud of you."];
function buddyCard() {
  const b = buddyPet();
  if (!b) return `<div class="card buddy"><div class="ch"><h3>BUDDY</h3></div><div class="empty">Hatch a creature and set it as your buddy to get bonus XP.</div></div>`;
  const R = RARITIES[b.c.rarity]; const name = b.p.nick || b.c.name; const src = buddyArt(b, "full");
  const line = BUDDY_LINES[(new Date().getDate() + b.c.name.length) % BUDDY_LINES.length];
  const shiny = b.c.rarity === "legendary" || b.c.rarity === "mythical" || b.p.shiny || (b.c.mainShiny && b.p.form !== "alt");
  return `<div class="card buddy" data-act="card" data-id="${b.c.id}" style="--acc:${R.color}">
    <div class="buddyart${b.c.full && b.p.form !== "alt" ? " tall" : ""}" style="background:${EGGS[b.c.egg].scene}">${src ? imgTag(src, b.c) : `<span class="em">${b.c.emoji}</span>`}${shiny ? '<div class="holo"></div>' : ""}
      <span class="bbadge">★ BUDDY</span></div>
    <div class="buddyinfo"><div style="flex:1;min-width:0"><b>${esc(name)}</b><small>${esc(line)}</small></div>
      <div class="bbonus" style="color:${R.color}">+${R.buddyXp}%<small>habit XP</small></div></div></div>`;
}
function topBar() {
  const p = S.player; const need = levelNeed(S.level); const bud = buddyPet();
  return `<div class="top">
    <div class="ava" style="background:${p.color}">${p.avatar}<div class="lv">${S.level}</div></div>
    <div class="who"><b>${esc(p.name)}</b><small>Habit Hero · Day ${Math.max(1, 1 - daysUntil(S.createdAt))} of your journey</small></div>
    <div class="xpw"><div class="xpl"><span>LV ${S.level}</span><span>${S.xp} / ${need} XP</span></div><div class="bar"><i style="width:${(S.xp / need) * 100}%"></i></div></div>
    ${bud ? `<button class="buddychip" data-act="card" data-id="${bud.c.id}" title="Your buddy"><span class="bthumb">${buddyArt(bud) ? imgTag(buddyArt(bud), bud.c) : bud.c.emoji}</span><span><b>${esc(bud.p.nick || bud.c.name)}</b><small>buddy · +${RARITIES[bud.c.rarity].buddyXp}% XP</small></span></button>` : ""}
    <div class="res"><div class="pill">🔥 ${dayStreak()} day streak</div><div class="pill">🪙 ${S.cheats ? "∞" : S.coins.toLocaleString()}</div><div class="pill">💎 ${S.cheats ? "∞" : S.gems}</div>${S.cheats ? `<div class="pill" style="border-color:var(--xp);color:var(--xp)">🧪 Cheats</div>` : ""}</div>
  </div>`;
}

function habitsCard() {
  const log = S.history[today()] || {}; const done = doneCount(today());
  const rows = S.habits.map((h) => {
    const d = !!log[h.id]; const st = habitStreak(h);
    return `<div class="hab ${d ? "d" : ""}" data-act="habit" data-id="${h.id}">
      <div class="ico">${h.icon}</div><div class="hn"><b>${esc(h.name)}</b><small>${st ? `🔥 ${st} day${st > 1 ? "s" : ""}` : "start a streak!"}</small></div>
      <span class="xpt">+${h.xp}</span>${ui.editHabits ? `<button class="del" data-act="delhabit" data-id="${h.id}">✕</button>` : `<div class="cb">${d ? "✓" : ""}</div>`}</div>`;
  }).join("") || `<div class="empty">No habits yet. Add one!</div>`;
  const wk = weekDates(); const n = Math.max(1, S.habits.length);
  const week = wk.map((d) => `<div class="wd ${d === today() ? "t" : ""}">${"MTWTFSS"[wk.indexOf(d)]}<i><b style="height:${Math.min(100, (doneCount(d) / n) * 100)}%"></b></i></div>`).join("");
  const perfect = !!log.__perfect;
  return `<div class="card">
    <div class="ch"><h3>DAILY HABITS</h3><span>${done} / ${S.habits.length} done</span></div>
    <div class="ch" style="margin-top:-6px"><button class="mini-btn" data-act="addhabit">＋ Add habit</button><button class="mini-btn" data-act="edithabits">${ui.editHabits ? "Done editing" : "Edit"}</button></div>
    ${rows}
    <div class="sub"><div class="ch" style="margin-bottom:6px"><h3 style="font-size:10px">THIS WEEK</h3><span>${perfectThisWeek()} perfect day${perfectThisWeek() === 1 ? "" : "s"}</span></div><div class="week">${week}</div>
    <div class="bonus ${perfect ? "on" : ""}"><span style="font-size:22px">⭐</span><div style="flex:1"><b>Daily bonus</b><small>${perfect ? "Earned today! All habits doubled." : `Finish all ${S.habits.length} habits for 2× XP`}</small></div><span class="xpt" style="color:var(--gold);background:#ffd1661a">×2</span></div></div>
  </div>`;
}

function incubatorCard() {
  if (!S.inc) {
    const has = Object.values(S.basket).some((n) => n > 0);
    return `<div class="card inc"><div class="ch"><h3>INCUBATOR</h3><span>empty</span></div>
      <div class="empty" style="padding:40px 10px"><div style="font-size:40px">🪺</div><p style="margin-top:8px">${has ? "Pick an egg from your basket below to start incubating." : "No eggs yet! Finish homework quests to earn eggs."}</p></div></div>`;
  }
  const e = EGGS[S.inc.theme]; const need = eggNeed(S.inc.theme); const ready = S.inc.xp >= need; const pct = Math.min(100, (S.inc.xp / need) * 100);
  const tiers = RARITY_ORDER.filter((r) => e.odds[r] > 0).reverse();
  const odds = tiers.map((r) => {
    const cs = CREATURES.filter((c) => c.egg === S.inc.theme && c.rarity === r); const R = RARITIES[r];
    if (!cs.length) return "";
    const owned = cs.filter((c) => S.pets.some((p) => p.cid === c.id)); const c = owned[0] || cs[0];
    return `<div class="od">${thumb(c, { size: 60, known: !!owned.length })}<b>${owned.length}/${cs.length} found</b><span class="rar" style="background:${R.color};color:${R.text}">${R.label}</span><span class="pc" style="color:${R.color}">${e.odds[r]}%</span></div>`;
  }).join("");
  const found = CREATURES.filter((c) => c.egg === S.inc.theme && S.pets.some((p) => p.cid === c.id)).length;
  const toGo = need - S.inc.xp; const setSize = CREATURES.filter((c) => c.egg === S.inc.theme).length;
  return `<div class="card inc">
    <div class="ch"><h3>INCUBATOR</h3><span>Habits feed your egg</span></div>
    <div class="eggtop">
      <div class="eggwrap ${ready || pct > 60 ? "wiggle" : ""}">${eggSVG(S.inc.theme, 130)}</div>
      <div class="einfo"><div class="tag">${S.inc.theme.toUpperCase()} EGG</div>
        <h2>${ready ? "It's hatching!" : pct > 60 ? "Something's wiggling…" : pct > 20 ? "It's getting warmer…" : "A brand new egg"}</h2>
        <p>Earned from: ${esc(S.inc.from)}</p>
        <div style="width:250px;margin-top:10px"><div class="xpl"><span>${Math.min(S.inc.xp, need)}/${need} XP</span><span>${ready ? "READY!" : toGo + " TO GO"}</span></div><div class="bar gold"><i style="width:${pct}%"></i></div></div>
        <div class="btns">${ready ? `<button class="btn green" data-act="hatch">HATCH!</button>` : `<button class="btn" data-act="feed">FEED 30🪙 → +25</button>`}${S.cheats && !ready ? `<button class="btn g" data-act="testhatch">⚡ INSTANT HATCH</button>` : ""}</div>
      </div>
    </div>
    <div class="ch" style="margin:16px 0 8px"><h3 style="font-size:10px">HATCH CHANCES</h3><span>${S.pity >= PITY_LIMIT - 1 ? "Legendary+ guaranteed next!" : `pity: legendary+ guaranteed in ${PITY_LIMIT - S.pity} eggs`}</span></div>
    <div class="odds" style="grid-template-columns:repeat(${Math.min(tiers.length, 6)},1fr)">${odds}</div>
    <div class="setrow"><span style="font-size:20px">📘</span><div style="flex:1"><b>${S.inc.theme} Set · ${found} of ${setSize} found</b><small>Hatch every ${S.inc.theme} creature to complete the set</small></div><div style="width:110px"><div class="bar" style="height:12px;margin:0"><i style="width:${(found / setSize) * 100}%;background:${e.base}"></i></div></div></div>
  </div>`;
}

function basketCard() {
  const items = Object.keys(EGGS).map((k) => {
    const n = S.cheats ? Infinity : S.basket[k] || 0; const cur = S.inc?.theme === k;
    return `<div class="be ${cur ? "inc" : ""} ${!n && !cur ? "none" : ""}" ${n ? `data-act="incubate" data-theme="${k}" title="Incubate a ${k} Egg"` : ""} style="${n ? "cursor:pointer" : ""}">
      ${n ? `<span class="n">${n === Infinity ? "∞" : "×" + n}</span>` : ""}${eggSVG(k, 36)}<b>${k}</b><small>${cur ? "incubating" : n ? "tap to incubate" : k === "Star" ? "beat a boss" : "earn from quests"}</small></div>`;
  }).join("");
  const wk = weekDates()[0]; const pd = perfectThisWeek(); const claimed = S.claimedWeeks.includes(wk);
  return `<div class="card"><div class="ch"><h3>EGG BASKET</h3><span>earned from homework quests</span></div><div class="basket">${items}</div></div>
  <div class="card gift"><svg width="70" height="70" viewBox="0 0 84 84"><rect x="12" y="34" width="60" height="44" rx="6" fill="#ff8fb8"/><rect x="8" y="24" width="68" height="16" rx="5" fill="#ffb3cf"/><rect x="36" y="24" width="12" height="54" fill="#ffd166"/><path d="M42 24c-6-14-22-16-22-6s14 6 22 6zM42 24c6-14 22-16 22-6s-14 6-22 6z" fill="#ffd166"/></svg>
    <div style="flex:1"><b>Weekly Present</b><small>${claimed ? "Opened this week. New one on Monday!" : "Get 5 perfect days this week to open"}</small><div class="keys">${[0, 1, 2, 3, 4].map((i) => `<i style="${i < pd ? "background:var(--pink)" : ""}"></i>`).join("")}</div></div>
    ${!claimed ? `<button class="btn" data-act="present" ${pd >= 5 ? "" : "disabled"}>OPEN</button>` : ""}</div>`;
}

function questsCard() {
  const qs = [...S.quests].sort((a, b) => (a.type === "boss" ? -1 : 0) - (b.type === "boss" ? -1 : 0) || a.due.localeCompare(b.due));
  const rows = qs.map((q) => {
    const t = QUEST_TYPES[q.type]; const dd = daysUntil(q.due);
    const when = dd < 0 ? `overdue (${prettyDate(q.due)})` : dd === 0 ? "due today" : dd === 1 ? "due tomorrow" : `due ${prettyDate(q.due)}`;
    return `<div class="q ${q.type === "boss" ? "boss" : ""} ${dd < 0 ? "late" : ""}">
      <button class="qdone" title="Mark complete" data-act="questdone" data-id="${q.id}"></button>
      <div class="qt">${q.type === "boss" ? `<span class="badge">BOSS · ${dd < 0 ? "LATE" : dd + " DAYS"}</span>` : ""}<b>${esc(q.title)}</b><small>${t.label} · ${when}</small></div>
      <div class="rew"><span class="x">+${t.xp} XP${q.type === "boss" ? ` · ${GEM_REWARDS.bossQuest}💎` : q.type === "side" && GEM_REWARDS.assignment ? ` · ${GEM_REWARDS.assignment}💎` : ""}</span><div class="qe">${eggSVG(q.egg, 16)}${t.eggChance < 100 ? t.eggChance + "% drop" : q.egg + " Egg"}</div></div>
      <button class="del" data-act="delquest" data-id="${q.id}" title="Delete">✕</button></div>`;
  }).join("") || `<div class="empty">No homework quests. Add your assignments to earn eggs!</div>`;
  return `<div class="card"><div class="ch"><h3>HOMEWORK QUESTS</h3><span>${S.quests.length} active</span></div>
    <div class="ch" style="margin-top:-6px"><button class="mini-btn" data-act="addquest">＋ Add quest</button></div>${rows}</div>`;
}

function collectionCard() {
  const seen = []; [...S.pets].reverse().forEach((p) => { if (!seen.includes(p.cid)) seen.push(p.cid); });
  const cells = seen.slice(0, 8).map((id) => { const c = creature(id); const R = RARITIES[c.rarity];
    return thumb(c, { size: 0, label: `<span class="stars">${"★".repeat(R.stars)}</span><small>${esc(c.name)}</small>`, extra: `data-act="card" data-id="${id}"` }); });
  while (cells.length < 8) cells.push(`<div class="thumb unknown" style="width:100%;aspect-ratio:1"><span class="px" style="color:var(--line)">?</span></div>`);
  const uniq = new Set(S.pets.map((p) => p.cid)).size;
  return `<div class="card" style="flex:1"><div class="ch"><h3>COLLECTION</h3><span>${uniq} / ${CREATURES.length}</span></div>
    <div class="pets">${cells.join("")}</div><button class="mini-btn" style="margin-top:12px;width:100%" data-act="page" data-page="pets">View all creatures →</button></div>`;
}

function homePage() {
  return topBar() + `<div class="grid"><div class="col">${buddyCard()}${habitsCard()}</div><div class="col">${incubatorCard()}${basketCard()}</div><div class="col">${questsCard()}${collectionCard()}</div></div>`;
}

function petsPage() {
  const rows = Object.keys(EGGS).map((theme) => {
    const cs = CREATURES.filter((c) => c.egg === theme).sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    const cells = cs.map((c) => {
      const owned = S.pets.filter((p) => p.cid === c.id).length; const R = RARITIES[c.rarity];
      return owned
        ? `<div class="pcell" data-act="card" data-id="${c.id}">${thumb(c, { size: 0 })}<b>${esc(c.name)} ${owned > 1 ? `<small>×${owned}</small>` : ""}</b><small style="color:${R.color}">${"★".repeat(R.stars)} ${R.label}</small></div>`
        : `<div class="pcell locked">${thumb(c, { size: 0, known: false })}<b>???</b><small>${RARITIES[c.rarity].label} · ${EGGS[theme].odds[c.rarity] || 0}%</small></div>`;
    }).join("");
    const found = cs.filter((c) => S.pets.some((p) => p.cid === c.id)).length;
    return `<div class="theme-row"><h4>${eggSVG(theme, 22)} ${theme.toUpperCase()} <span>${found}/${cs.length} found</span></h4><div class="pgrid">${cells}</div></div>`;
  }).join("");
  const spares = spareTotal();
  const trade = `<div class="card gift" style="margin-top:20px">${eggSVG(TRADE_EGG, 52)}<div style="flex:1"><b>Duplicate Exchange</b><small>Trade ${TRADE_COST} duplicate pets for a ${TRADE_EGG} Egg · you have ${spares} duplicate${spares === 1 ? "" : "s"}</small>
    <div class="bar gold" style="max-width:320px;height:12px"><i style="width:${Math.min(100, (spares / TRADE_COST) * 100)}%"></i></div></div>
    <button class="btn" data-act="trade" ${spares >= TRADE_COST ? "" : "disabled"}>TRADE ${TRADE_COST} → 🥚</button></div>`;
  const gs = gemSpares();
  const gemx = `<div class="card" style="margin-top:20px"><div class="ch"><h3>GEM EXCHANGE</h3><span>trade spare rare pets for gems</span></div>
    ${gs.length ? `<div class="artgrid">${gs.map(({ id, list }) => { const c = creature(id); const R = RARITIES[c.rarity];
      return `<div class="artrow">${thumb(c, { size: 48 })}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b><small style="color:${R.color}">${R.label} · ${list.length} spare</small></div><button class="btn" style="padding:9px 12px" data-act="gemtrade" data-id="${id}">+${GEM_TRADE[c.rarity]} 💎</button></div>`; }).join("")}</div>`
      : `<div class="empty">Spare Ultra Rare (+${GEM_TRADE.ultrarare}💎), Legendary (+${GEM_TRADE.legendary}💎) and Mythical (+${GEM_TRADE.mythical}💎) pets show up here.</div>`}</div>`;
  return topBar() + trade + gemx + `<div class="card" style="margin-top:20px"><div class="ch"><h3>CREATURE COLLECTION</h3><span>${new Set(S.pets.map((p) => p.cid)).size} / ${CREATURES.length} discovered · ${S.stats.hatched} hatched</span></div>${rows}</div>`;
}

function settingsPage() {
  const p = S.player;
  return topBar() + `<div class="grid" style="grid-template-columns:1fr 1fr"><div class="card"><div class="ch"><h3>PROFILE</h3></div><div class="form">
      <div class="field"><label>Name</label><input class="inp" id="set-name" value="${esc(p.name)}" maxlength="24"></div>
      <div class="field"><label>Avatar</label><div class="chips">${AVATARS.map((a) => `<button class="chip emo ${a === p.avatar ? "on" : ""}" data-act="setavatar" data-v="${a}">${a}</button>`).join("")}</div></div>
      <div><button class="btn" data-act="savename">SAVE PROFILE</button></div></div></div>
    <div class="card"><div class="ch"><h3>HATCH SPEED</h3><span>XP needed to hatch an egg</span></div><div class="form">
      <p style="color:var(--mute);font-size:14px;line-height:1.5">How much XP a standard egg needs. Ember and Star eggs scale with it (they always take a bit longer).</p>
      <div class="chips">${[["Speedy", 75], ["Quick", 150], ["Normal", 300], ["Patient", 450], ["Epic", 600]].map(([n, x]) => `<button class="chip ${(S.hatchXp || BASE_EGG_XP) === x ? "on" : ""}" data-act="hatchxp" data-v="${x}">${n}<br><span style="font-size:11px;color:var(--mute)">${x} XP</span></button>`).join("")}</div>
      <div class="field"><label>Or set your own (10–5000)</label><div style="display:flex;gap:10px"><input class="inp" id="hatch-custom" type="number" min="10" max="5000" value="${S.hatchXp || BASE_EGG_XP}" style="max-width:140px"><button class="btn g" data-act="hatchxpcustom">SET</button></div></div>
      <div class="hatchprev">${Object.keys(EGGS).map((k) => `<span>${eggSVG(k, 18)} ${k}: <b>${eggNeed(k)}</b></span>`).join("")}</div></div></div>
    <div class="card"><div class="ch"><h3>SAVE DATA</h3></div><div class="form">
      <p style="color:var(--mute);font-size:14px;line-height:1.5">Your progress saves automatically on this device every time something changes and when you close the app. Someone using a different device or browser starts their own fresh game.</p>
      <p style="color:var(--mute);font-size:14px;line-height:1.5">To move your progress to another device, export a backup file here and import it there.</p>
      <div class="btns"><button class="btn g" data-act="export">EXPORT BACKUP</button><label class="btn g" style="cursor:pointer">IMPORT BACKUP<input type="file" id="import-file" accept=".json" hidden></label></div>
      <div style="margin-top:10px;padding:12px;border:2px dashed ${S.cheats ? "var(--xp)" : "var(--line)"};border-radius:12px">
        <label class="cheatrow" ${S.cheats ? "" : 'data-act="cheatask"'}><span class="cbox ${S.cheats ? "on" : ""}">${S.cheats ? "✓" : ""}</span><b style="font-size:14px">Cheats enabled</b></label>
        <p style="color:var(--mute);font-size:12px;margin-top:6px">${S.cheats ? "Cheats are on for this save: unlimited gems, coins and eggs, plus Instant Hatch. This can't be turned off." : "Unlimited gems, coins and eggs, plus an Instant Hatch button. Once turned on, it can't be undone for this save."}</p></div>
      <div style="margin-top:10px"><button class="btn" style="background:var(--red);color:#3a0010;box-shadow:0 5px 0 #a23a4c" data-act="reset">START OVER</button></div>
      <p style="color:var(--mute);font-size:12px">Stats: ${S.stats.habits} habits checked · ${S.stats.quests} quests cleared · ${S.stats.hatched} eggs hatched</p></div></div>
    <div class="card" style="grid-column:1/-1"><div class="ch"><h3>CREATURE ART</h3><span>add or replace pictures on this device</span></div>
      <p style="color:var(--mute);font-size:14px;margin-bottom:14px">Upload a picture for any creature. Landscape or portrait both work; it's placed inside the card frame. Uploaded art is saved on this device only. To include art for everyone, put the file in the art folder and add it in data.js (see README).</p>
      <div class="artgrid">${CREATURES.map((c) => { const R = RARITIES[c.rarity]; const has = !!thumbSrc(c);
        return `<div class="artrow">${thumb(c, { size: 52 })}<div style="flex:1;min-width:0"><b>${esc(c.name)}</b><small style="color:${R.color}">${R.label} · ${c.egg}</small></div>
        <label class="mini-btn" style="cursor:pointer">${customArt[c.id] ? "Replace" : has ? "Replace" : "Upload"}<input type="file" accept="image/*" hidden data-upload="${c.id}"></label>
        ${customArt[c.id] ? `<button class="mini-btn" data-act="clearart" data-id="${c.id}">Reset</button>` : ""}</div>`; }).join("")}</div></div></div>`;
}

/* ---------- modals ---------- */
function onboardingModal() {
  const ob = ui.ob; const dots = [1, 2, 3, 4].map((i) => `<i class="${i <= ob.step ? "on" : ""}"></i>`).join("");
  let body = "";
  if (ob.step === 1) body = `<h2>Welcome to HatchQuest! 🥚</h2><p class="m">Build habits, clear homework quests, and hatch magical creatures. First, what should we call you?</p>
    <div class="field"><label>Your name</label><input class="inp" id="ob-name" value="${esc(ob.name)}" maxlength="24" placeholder="e.g. Angelina" autofocus></div>`;
  if (ob.step === 2) body = `<h2>Pick your look</h2><p class="m">Choose an avatar and a color. You can change these later.</p>
    <div class="field"><label>Avatar</label><div class="chips">${AVATARS.map((a) => `<button class="chip emo ${a === ob.avatar ? "on" : ""}" data-act="ob-avatar" data-v="${a}">${a}</button>`).join("")}</div></div>
    <div class="field" style="margin-top:14px"><label>Color</label><div class="chips">${["linear-gradient(135deg,#ff8fb8,#9b7bff)", "linear-gradient(135deg,#7cc8ff,#4f5bb3)", "linear-gradient(135deg,#7cf0b4,#2f8a6e)", "linear-gradient(135deg,#ffd166,#ff8a5c)", "linear-gradient(135deg,#b69cff,#3a2a8a)"].map((c) => `<button class="chip emo ${c === ob.color ? "on" : ""}" data-act="ob-color" data-v="${c}" style="background:${c}"></button>`).join("")}</div></div>`;
  if (ob.step === 3) { const nh = ob.newH; body = `<h2>Set up your daily habits</h2><p class="m">Make your own, pick from ideas, or both. Each habit gives XP when you check it off.</p>
    <div class="obtabs"><button class="chip ${ob.tab === "own" ? "on" : ""}" data-act="ob-tab" data-v="own">✏️ Make my own</button><button class="chip ${ob.tab === "ideas" ? "on" : ""}" data-act="ob-tab" data-v="ideas">💡 Pick from ideas</button></div>
    ${ob.tab === "own" ? `<div class="form" style="max-width:none;margin-top:12px"><div class="field"><label>Habit</label><input class="inp" id="ob-hname" maxlength="40" placeholder="e.g. Practice guitar for 15 min" value="${esc(nh.name)}"></div>
      <div class="field"><label>Icon</label><div class="chips">${HABIT_ICONS.map((i) => `<button class="chip emo ${i === nh.icon ? "on" : ""}" data-act="ob-hicon" data-v="${i}" style="width:38px;height:38px;font-size:18px">${i}</button>`).join("")}</div></div>
      <div class="field"><label>Difficulty</label><div class="chips">${[10, 15, 20, 30].map((x) => `<button class="chip ${x === nh.xp ? "on" : ""}" data-act="ob-hxp" data-v="${x}">+${x} XP</button>`).join("")}<button class="btn" style="margin-left:auto;padding:10px 14px" data-act="ob-hadd">＋ ADD</button></div></div></div>`
    : `<div class="chips" style="margin-top:12px">${HABIT_PRESETS.map((h, i) => `<button class="chip ${ob.habits.includes(i) ? "on" : ""}" data-act="ob-habit" data-i="${i}">${h.icon} ${esc(h.name)} <span class="px" style="font-size:8px;color:var(--xp)">+${h.xp}</span></button>`).join("")}</div>`}
    <div class="field" style="margin-top:16px"><label>Your habits (${ob.custom.length + ob.habits.length})</label>
      <div class="chips">${ob.custom.map((h, i) => `<span class="chip on">${h.icon} ${esc(h.name)} <span class="px" style="font-size:8px;color:var(--xp)">+${h.xp}</span> <button class="xbtn" data-act="ob-hdel" data-i="${i}">✕</button></span>`).join("")}${ob.habits.map((i) => { const h = HABIT_PRESETS[i]; return `<span class="chip on">${h.icon} ${esc(h.name)} <button class="xbtn" data-act="ob-habit" data-i="${i}">✕</button></span>`; }).join("") || (ob.custom.length ? "" : `<span style="color:var(--mute);font-size:13px">None yet. Add at least one.</span>`)}</div></div>`; }
  if (ob.step === 4) body = `<h2>Choose your starter egg</h2><p class="m">Your habits will keep it warm until it hatches. Each theme hatches different creatures!</p>
    <div class="basket">${STARTER_EGGS.map((k) => `<div class="be ${ob.egg === k ? "inc" : ""}" style="cursor:pointer;padding:14px 4px" data-act="ob-egg" data-v="${k}">${eggSVG(k, 50)}<b style="font-size:14px;margin-top:6px">${k}</b></div>`).join("")}</div>`;
  return `<div class="overlay"><div class="modal"><div class="steps">${dots}</div>${body}
    <div class="mfoot">${ob.step > 1 ? `<button class="btn g" data-act="ob-back">BACK</button>` : ""}<button class="btn" data-act="ob-next">${ob.step === 4 ? "START!" : "NEXT"}</button></div></div></div>`;
}

function addHabitModal() {
  const m = ui.modalData;
  return `<div class="overlay" data-act="closebg"><div class="modal"><h2>New habit</h2><p class="m">Something you want to do every day.</p>
    <div class="form"><div class="field"><label>Habit</label><input class="inp" id="h-name" maxlength="40" placeholder="e.g. Practice guitar" value="${esc(m.name)}"></div>
    <div class="field"><label>Icon</label><div class="chips">${HABIT_ICONS.map((i) => `<button class="chip emo ${i === m.icon ? "on" : ""}" data-act="h-icon" data-v="${i}">${i}</button>`).join("")}</div></div>
    <div class="field"><label>Difficulty (XP)</label><div class="chips">${[10, 15, 20, 30].map((x) => `<button class="chip ${x === m.xp ? "on" : ""}" data-act="h-xp" data-v="${x}">+${x} XP</button>`).join("")}</div></div></div>
    <div class="mfoot"><button class="btn g" data-act="close">CANCEL</button><button class="btn" data-act="h-save">ADD HABIT</button></div></div></div>`;
}

function addQuestModal() {
  const m = ui.modalData;
  return `<div class="overlay" data-act="closebg"><div class="modal"><h2>New homework quest</h2><p class="m">Add an assignment, exam, or project. Finishing it earns XP, coins, and eggs.</p>
    <div class="form"><div class="field"><label>What is it?</label><input class="inp" id="q-title" maxlength="60" placeholder="e.g. TCSS 490 proposal" value="${esc(m.title)}"></div>
    <div class="field"><label>Due date</label><input class="inp" id="q-due" type="date" value="${m.due}"></div>
    <div class="field"><label>Type</label><div class="chips">${Object.entries(QUEST_TYPES).map(([k, t]) => `<button class="chip ${k === m.type ? "on" : ""}" data-act="q-type" data-v="${k}">${t.label}<br><span style="font-size:11px;color:var(--mute)">+${t.xp} XP · ${t.egg ? "Star Egg" : t.eggChance + "% egg"}</span></button>`).join("")}</div></div></div>
    <div class="mfoot"><button class="btn g" data-act="close">CANCEL</button><button class="btn" data-act="q-save">ADD QUEST</button></div></div></div>`;
}

function openCard(cid, isNew = false) {
  const seen = []; S.pets.forEach((p) => { if (!seen.includes(p.cid)) seen.push(p.cid); });
  ui.cardList = CREATURES.map((c) => c.id).filter((id) => seen.includes(id));
  ui.cardIdx = Math.max(0, ui.cardList.indexOf(cid)); ui.cardNew = isNew; ui.renaming = false; ui.altForm = false; ui.modal = "card"; render();
}
const BORDERS = {
  mythical: "conic-gradient(from 0deg,#6ff7e8,#7cc8ff,#b69cff,#ff8fd0,#ffd166,#6ff7e8)",
  legendary: "conic-gradient(from 200deg,#ffd166,#fff3c4,#c9962e,#ffe7a8,#ffd166)",
  ultrarare: "linear-gradient(135deg,#ffd0ec,#ff6fc0,#b69cff,#ffd0ec)",
  rare: "linear-gradient(135deg,#cfe9ff,#3f8fe0,#cfe9ff)",
  uncommon: "linear-gradient(135deg,#c8ffe2,#4fc88c,#c8ffe2)",
  common: "linear-gradient(135deg,#f1eeff,#a99fd0,#f1eeff)",
};
function cardModal() {
  const cid = ui.cardList[ui.cardIdx]; const c = creature(cid); const R = RARITIES[c.rarity]; const E = EGGS[c.egg];
  const mine = S.pets.filter((p) => p.cid === cid); const pet = mine[mine.length - 1]; const isBuddy = mine.some((p) => p.uid === S.buddy);
  const no = String(CREATURES.indexOf(c) + 1).padStart(3, "0"); const total = String(CREATURES.length).padStart(3, "0");
  const stats = ["Focus", "Cheer", "Luck"].map((n, i) => `<div class="st"><span>${n}</span><div class="sb"><i style="width:${c.stats[i]}%;background:${R.color}"></i></div><b>${c.stats[i]}</b></div>`).join("");
  const name = pet.nick || c.name; const pct = E.odds[c.rarity] || 0;
  // Two-form creatures (Selkie): show the form you own; Shift Form only when you own both.
  const forms = ownedForms(c); const bothForms = !!c.altArt && forms.has("main") && forms.has("alt");
  if (c.altArt && ui.viewForm?.cid !== cid) ui.viewForm = { cid, form: forms.has("main") ? "main" : "alt" };
  const alt = !!c.altArt && ui.viewForm.form === "alt";
  const showFull = isFull(c) && !alt;
  const polished = mine.some((p) => p.shiny);
  const shiny = c.rarity === "legendary" || c.rarity === "mythical" || polished || (c.mainShiny && !alt) ? '<div class="holo"></div>' : "";
  let card, info = "";
  if (showFull) {
    // Art is already a finished card with its own border: show it as-is, info goes in the side panel.
    card = `<div class="tilt" data-tilt><div class="fullcard r-${c.rarity}" style="--acc:${R.color}">${imgTag(artSrc(c), c)}${shiny}<div class="glare"></div></div></div>`;
    info = `<div class="infobox" style="--acc:${R.color}">
      <div class="chd"><div><div class="cnm" style="font-size:22px">${esc(name)}</div><div class="ckind">${esc(c.title || c.kind)} · ${esc(c.kind)}</div></div><div class="crt"><span class="rar" style="background:${R.color};color:${R.text}">${R.label}</span><span style="color:${R.color};font-size:12px">${"★".repeat(R.stars)}</span></div></div>
      <div class="pow"><div class="pi">✦</div><div><b>${esc(c.power)}</b><small>${esc(c.powerText)} · Buddy +${R.buddyXp}% habit XP</small></div></div>
      <div class="cstats">${stats}</div><p class="lore">“${esc(c.lore)}”</p>
      <div class="cft"><span>${eggSVG(c.egg, 12)} ${c.egg} Egg · ${pct}% · No. ${no}/${total}</span><span>Hatched ${prettyDate(pet.hatchedAt)}</span></div></div>`;
  } else {
    const src = alt ? c.altArt : artSrc(c);
    card = `<div class="tilt" data-tilt><div class="ccard" style="--acc:${R.color};background:${BORDERS[c.rarity]}"><div class="glare"></div><div class="cin">
    <div class="chd"><div><div class="cnm">${esc(name)}</div><div class="ckind">${esc(c.title || c.kind)}${pet.nick ? ` · ${esc(c.name)}` : ""}</div></div><div class="crt"><span class="rar" style="background:${R.color};color:${R.text}">${R.label}</span><span style="color:${R.color};font-size:12px">${"★".repeat(R.stars)}</span></div></div>
    <div class="cart" style="background:${E.scene}">${artHTML(c, src)}${src ? "" : `<span class="ph">No art yet · upload in Settings → Creature Art</span>`}${shiny}
      <div class="eggtag">${eggSVG(c.egg, 16)}<span>${c.egg} Egg · ${pct}%</span></div><div class="cno">${alt ? esc(c.altLabel || "Alt form") : `No. ${no}`}</div></div>
    <div class="pow"><div class="pi">✦</div><div><b>${esc(c.power)}</b><small>${esc(c.powerText)} · Buddy +${R.buddyXp}% habit XP</small></div></div>
    <div class="cstats">${stats}</div><p class="lore">“${esc(c.lore)}”</p>
    <div class="cft"><span>${esc(c.kind)} · Hatched ${prettyDate(pet.hatchedAt)} · ${pet.fed} habits fed</span><span>${no}/${total}</span></div></div></div></div>`;
  }
  const side = `<div class="cside">${ui.cardNew ? `<div class="kk" style="color:${R.color}">NEW ${R.label} HATCHED!</div><h2>You hatched ${esc(c.name)}!</h2><p>A ${R.label.toLowerCase()} pull from your ${c.egg} Egg (${pct}% chance).</p>` : `<div class="kk">${mine.length > 1 ? `YOU OWN ${mine.length}` : "IN YOUR COLLECTION"}</div><h2>${esc(name)}</h2><p>${isBuddy ? "This is your current buddy." : "Set as your buddy to get its XP bonus on every habit."}</p>`}
    ${info}
    ${ui.renaming ? `<div class="field" style="margin-top:14px"><input class="inp" id="nick" maxlength="20" placeholder="${esc(c.name)}" value="${esc(pet.nick || "")}"></div>` : ""}
    <div class="btns">${isBuddy ? `<button class="btn green" disabled>★ YOUR BUDDY</button>` : `<button class="btn" data-act="buddy" data-uid="${pet.uid}">SET AS BUDDY</button>`}
    ${!polished && c.rarity !== "legendary" && c.rarity !== "mythical" && S.items.polish ? `<button class="btn" data-act="polish" data-uid="${pet.uid}">✨ USE SHINY POLISH (${S.items.polish})</button>` : ""}
    ${c.altArt ? (bothForms ? `<button class="btn g" data-act="shiftform">⇄ SHIFT FORM</button>` : `<button class="btn g" disabled title="Hatch another ${esc(c.name)} in its other form to unlock">🔒 SHIFT FORM (need ${esc(forms.has("main") ? c.altLabel : c.mainLabel)})</button>`) : ""}
    ${ui.renaming ? `<button class="btn g" data-act="savenick" data-uid="${pet.uid}">SAVE NAME</button>` : `<button class="btn g" data-act="rename">RENAME</button>`}
    ${ui.cardNew && !S.inc && (S.cheats || (S.basket[ui.lastTheme] || 0) > 0) ? `<button class="btn green" data-act="nextsame">🥚 NEXT ${esc(ui.lastTheme).toUpperCase()} EGG</button>` : ""}
    ${ui.cardNew && !S.inc && (S.cheats || Object.values(S.basket).some((n) => n)) ? `<button class="btn g" data-act="close">PICK NEXT EGG</button>` : ""}</div></div>`;
  const nav = ui.cardList.length > 1;
  return `<div class="overlay" data-act="closebg"><button class="closex" data-act="close">✕</button><div class="cardview">
    ${nav ? `<button class="closex" style="position:static" data-act="cardprev">‹</button>` : ""}${card}${side}${nav ? `<button class="closex" style="position:static" data-act="cardnext">›</button>` : ""}</div></div>`;
}

/* ---------- render ---------- */
function render() {
  const app = $("#app");
  if (!S) { if (!ui.ob) ui.ob = { step: 1, name: "", avatar: "🦊", color: "linear-gradient(135deg,#ff8fb8,#9b7bff)", habits: [], custom: [], tab: "own", newH: { name: "", icon: "⭐", xp: 15 }, egg: "Tidecaller" }; ui.modal = "onboarding"; app.innerHTML = ""; $("#nav").classList.add("hidden"); }
  else {
    $("#nav").classList.remove("hidden");
    applyShields();
    app.innerHTML = ui.page === "pets" ? petsPage() : ui.page === "settings" ? settingsPage() : ui.page === "shop" ? shopPage() : homePage();
    document.querySelectorAll(".nb").forEach((b) => b.classList.toggle("on", b.dataset.page === ui.page));
    const imp = $("#import-file"); if (imp) imp.onchange = importSave;
  }
  const mr = $("#modal-root");
  mr.innerHTML = ui.modal === "onboarding" ? onboardingModal() : ui.modal === "habit" ? addHabitModal() : ui.modal === "quest" ? addQuestModal() : ui.modal === "card" ? cardModal() : ui.modal === "trade" ? tradeModal() : ui.modal === "choose" ? chooseModal() : ui.modal === "swap" ? swapModal() : ui.modal === "cheat" ? cheatModal() : "";
  const f = mr.querySelector("input.inp"); if (f && !f.value) f.focus();
}

/* ---------- events ---------- */
function addObHabit() { const nh = ui.ob.newH; ui.ob.custom.push({ name: nh.name.trim(), icon: nh.icon, xp: nh.xp }); ui.ob.newH = { name: "", icon: "⭐", xp: 15 }; }
function readInputs() { // keep typed text when re-rendering modals
  const v = (id) => document.getElementById(id)?.value;
  if (ui.ob && v("ob-name") !== undefined) ui.ob.name = v("ob-name");
  if (ui.ob && v("ob-hname") !== undefined) ui.ob.newH.name = v("ob-hname");
  if (ui.modal === "habit" && v("h-name") !== undefined) ui.modalData.name = v("h-name");
  if (ui.modal === "quest") { if (v("q-title") !== undefined) ui.modalData.title = v("q-title"); if (v("q-due")) ui.modalData.due = v("q-due"); }
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const a = el.dataset.act; const id = el.dataset.id; const v = el.dataset.v;
  // backdrop click closes; clicks on the card, side panel or modal box itself don't
  if (a === "closebg" && e.target.closest(".modal,.ccard,.fullcard,.cside,[data-tilt],button,input,label")) return;
  readInputs();
  switch (a) {
    case "page": ui.page = el.dataset.page; ui.modal = null; render(); window.scrollTo(0, 0); break;
    case "habit": if (!ui.editHabits) toggleHabit(id, el); break;
    case "edithabits": ui.editHabits = !ui.editHabits; render(); break;
    case "delhabit": e.stopPropagation(); S.habits = S.habits.filter((h) => h.id !== id); commit(); break;
    case "addhabit": ui.modal = "habit"; ui.modalData = { name: "", icon: "⭐", xp: 15 }; render(); break;
    case "h-icon": ui.modalData.icon = v; render(); break;
    case "h-xp": ui.modalData.xp = +v; render(); break;
    case "h-save": { const n = ui.modalData.name.trim(); if (!n) return toast("Give your habit a name first."); S.habits.push({ id: uid(), name: n, icon: ui.modalData.icon, xp: ui.modalData.xp, streak: 0, lastDone: null }); ui.modal = null; commit(); break; }
    case "addquest": ui.modal = "quest"; ui.modalData = { title: "", due: addDays(today(), 3), type: "side" }; render(); break;
    case "q-type": ui.modalData.type = v; render(); break;
    case "q-save": { const t = ui.modalData.title.trim(); if (!t) return toast("Give your quest a name first.");
      const type = ui.modalData.type; S.quests.push({ id: uid(), title: t, due: ui.modalData.due || today(), type, egg: QUEST_TYPES[type].egg || pick(DROP_EGGS) });
      ui.modal = null; commit(); break; }
    case "questdone": completeQuest(id, el); break;
    case "delquest": S.quests = S.quests.filter((q) => q.id !== id); commit(); break;
    case "feed": feed(el); break;
    case "hatch": hatch(); break;
    case "hatchxp": S.hatchXp = +v; toast(`🥚 Eggs now need ${eggNeed("Tidecaller")} XP`); commit(); break;
    case "hatchxpcustom": { const n = Math.round(+document.getElementById("hatch-custom").value); if (!(n >= 10 && n <= 5000)) return toast("Pick a number from 10 to 5000."); S.hatchXp = n; toast(`🥚 Eggs now need ${eggNeed("Tidecaller")} XP`); commit(); break; }
    case "trade": ui.trade = autoPickTrade(); ui.modal = "trade"; render(); break;
    case "tr-auto": ui.trade = autoPickTrade(); render(); break;
    case "tr-plus": ui.trade[id] = (ui.trade[id] || 0) + 1; render(); break;
    case "tr-minus": ui.trade[id] = Math.max(0, (ui.trade[id] || 0) - 1); render(); break;
    case "tr-go": doTrade(); break;
    case "testhatch": if (S.cheats && S.inc) { S.inc.xp = eggNeed(S.inc.theme); hatch(); } break;
    case "cheatask": ui.modal = "cheat"; render(); break;
    case "cheaton": S.cheats = true; ui.modal = null; toast("🧪 Cheats enabled"); commit(); break;
    case "nextsame": ui.modal = null; doSwap(ui.lastTheme); break;
    case "swapok": ui.modal = null; doSwap(ui.swapTo); break;
    case "incubate": incubate(el.dataset.theme); break;
    case "present": claimPresent(); break;
    case "card": openCard(id); break;
    case "cardprev": ui.cardIdx = (ui.cardIdx - 1 + ui.cardList.length) % ui.cardList.length; ui.cardNew = false; ui.altForm = false; ui.renaming = false; render(); break;
    case "cardnext": ui.cardIdx = (ui.cardIdx + 1) % ui.cardList.length; ui.cardNew = false; ui.altForm = false; ui.renaming = false; render(); break;
    case "buy": buy(id, el); break;
    case "gemtrade": gemTrade(id); break;
    case "polish": { const p = S.pets.find((x) => x.uid === el.dataset.uid); if (p && S.items.polish) { S.items.polish--; p.shiny = true; toast("✨ So shiny!"); commit(); } break; }
    case "pearlpick": { const c = creature(id); delete S.boosts.pearl; ui.modal = null; finishHatch(c); break; }
    case "pearlskip": { ui.modal = null; const keep = S.boosts.pearl; delete S.boosts.pearl; hatch(); S.boosts.pearl = keep; save(); break; }
    case "buddy": S.buddy = el.dataset.uid; toast("★ New buddy set!"); commit(); break;
    case "rename": ui.renaming = true; render(); break;
    case "shiftform": if (ui.viewForm) ui.viewForm.form = ui.viewForm.form === "alt" ? "main" : "alt"; render(); break;
    case "clearart": delete customArt[id]; saveArt(); render(); break;
    case "savenick": { const p = S.pets.find((x) => x.uid === el.dataset.uid); p.nick = (document.getElementById("nick").value || "").trim() || null; ui.renaming = false; commit(); break; }
    case "close": case "closebg": ui.modal = null; render(); break;
    case "setavatar": S.player.avatar = v; commit(); break;
    case "savename": { const n = $("#set-name").value.trim(); if (n) { S.player.name = n; toast("Profile saved"); commit(); } break; }
    case "export": exportSave(); break;
    case "reset": if (confirm("Start over? This erases all progress on this device.")) { localStorage.removeItem(SAVE_KEY); S = null; ui.ob = null; ui.page = "home"; render(); } break;
    // onboarding
    case "ob-avatar": ui.ob.avatar = v; render(); break;
    case "ob-color": ui.ob.color = v; render(); break;
    case "ob-tab": ui.ob.tab = v; render(); break;
    case "ob-hicon": ui.ob.newH.icon = v; render(); break;
    case "ob-hxp": ui.ob.newH.xp = +v; render(); break;
    case "ob-hadd": if (!ui.ob.newH.name.trim()) return toast("Type a habit name first."); addObHabit(); render(); break;
    case "ob-hdel": ui.ob.custom.splice(+el.dataset.i, 1); render(); break;
    case "ob-habit": { const i = +el.dataset.i; ui.ob.habits = ui.ob.habits.includes(i) ? ui.ob.habits.filter((x) => x !== i) : [...ui.ob.habits, i]; render(); break; }
    case "ob-egg": ui.ob.egg = v; render(); break;
    case "ob-back": ui.ob.step--; render(); break;
    case "ob-next": {
      const ob = ui.ob;
      if (ob.step === 1 && !ob.name.trim()) return toast("Type your name to continue.");
      if (ob.step === 3 && ob.newH.name.trim()) { addObHabit(); }
      if (ob.step === 3 && !ob.habits.length && !ob.custom.length) return toast("Add at least one habit.");
      if (ob.step < 4) { ob.step++; render(); break; }
      S = newPlayer({ name: ob.name.trim(), avatar: ob.avatar, color: ob.color, habits: [...ob.custom, ...ob.habits.map((i) => HABIT_PRESETS[i])], egg: ob.egg });
      ui.ob = null; ui.modal = null; commit(); toast(`Welcome, <b>${esc(S.player.name)}</b>! Check off habits to warm your egg 🥚`); break;
    }
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && ui.modal && ui.modal !== "onboarding") { ui.modal = null; render(); }
  if (e.key === "Enter" && e.target.id === "ob-hname") { readInputs(); if (ui.ob.newH.name.trim()) { addObHabit(); render(); document.getElementById("ob-hname")?.focus(); } return; }
  if (e.key === "Enter" && e.target.matches("input.inp")) { const btn = document.querySelector('#modal-root [data-act="ob-next"],#modal-root [data-act="h-save"],#modal-root [data-act="q-save"],#modal-root [data-act="savenick"]'); btn?.click(); }
});

document.addEventListener("change", (e) => {
  const id = e.target.dataset?.upload; const file = e.target.files?.[0]; if (!id || !file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 1100; const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      const prev = customArt[id]; customArt[id] = cv.toDataURL("image/jpeg", 0.85);
      if (saveArt()) toast(`Art saved for <b>${esc(creature(id).name)}</b>`); else { if (prev) customArt[id] = prev; else delete customArt[id]; }
      render();
    };
    img.onerror = () => toast("Couldn't read that image.");
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

/* ---------- card tilt: drag a card to rotate it, it springs back when you let go ---------- */
let tiltEl = null, tiltStart = null, tiltMoved = false;
const MAX_TILT = 18; // degrees
document.addEventListener("pointerdown", (e) => {
  const t = e.target.closest("[data-tilt]"); if (!t || e.target.closest("button,input,label")) return;
  tiltEl = t; tiltStart = { x: e.clientX, y: e.clientY }; tiltMoved = false;
  t.classList.add("dragging"); t.setPointerCapture?.(e.pointerId); e.preventDefault();
});
document.addEventListener("pointermove", (e) => {
  if (!tiltEl) return;
  const dx = e.clientX - tiltStart.x, dy = e.clientY - tiltStart.y; if (Math.abs(dx) + Math.abs(dy) > 4) tiltMoved = true;
  const ry = Math.max(-MAX_TILT, Math.min(MAX_TILT, dx / 6)), rx = Math.max(-MAX_TILT, Math.min(MAX_TILT, -dy / 6));
  tiltEl.style.setProperty("--rx", rx + "deg"); tiltEl.style.setProperty("--ry", ry + "deg");
  tiltEl.style.setProperty("--gx", 50 + ry * 2.5 + "%"); tiltEl.style.setProperty("--gy", 50 - rx * 2.5 + "%");
});
function endTilt() {
  if (!tiltEl) return; const t = tiltEl; tiltEl = null;
  t.classList.remove("dragging"); t.style.setProperty("--rx", "0deg"); t.style.setProperty("--ry", "0deg"); t.style.setProperty("--gx", "50%"); t.style.setProperty("--gy", "50%");
}
document.addEventListener("pointerup", endTilt); document.addEventListener("pointercancel", endTilt);
document.addEventListener("click", (e) => { if (tiltMoved && e.target.closest("[data-tilt]")) { tiltMoved = false; e.stopPropagation(); } }, true);

function exportSave() {
  save(); const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `hatchquest-backup-${today()}.json`; a.click(); URL.revokeObjectURL(a.href);
}
function importSave(e) {
  const file = e.target.files[0]; if (!file) return; const r = new FileReader();
  r.onload = () => { try { const data = JSON.parse(r.result); if (!data.player || !data.habits) throw 0; S = migrate(data); commit(); toast("Backup imported!"); } catch { toast("That file isn't a HatchQuest backup."); } };
  r.readAsText(file);
}

render();

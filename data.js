// ===== HatchQuest game data =====
// To add your own art: put an image in the /art folder and set `art: "art/yourfile.jpg"` on the creature,
// or upload it inside the app (Settings > Creature Art). Creatures without art show a placeholder.

const RARITIES = {
  common:    { label: "COMMON",     stars: 1, color: "#cfc8ee", text: "#2a2350", buddyXp: 5 },
  uncommon:  { label: "UNCOMMON",   stars: 2, color: "#7cf0b4", text: "#0f3a26", buddyXp: 8 },
  rare:      { label: "RARE",       stars: 3, color: "#7cc8ff", text: "#0d2a4a", buddyXp: 12 },
  ultrarare: { label: "ULTRA RARE", stars: 4, color: "#ff8fd0", text: "#3a0f2a", buddyXp: 15 },
  legendary: { label: "LEGENDARY",  stars: 5, color: "#ffd166", text: "#3b2a00", buddyXp: 20 },
  mythical:  { label: "MYTHICAL",   stars: 6, color: "#6ff7e8", text: "#00302c", buddyXp: 30 },
};
// Rarity order from most to least rare (used for rolling and sorting)
const RARITY_ORDER = ["mythical", "legendary", "ultrarare", "rare", "uncommon", "common"];
const PITY_LIMIT = 20; // every 20th egg without a legendary or better is guaranteed legendary+

// Egg themes: hatch cost (XP), hatch odds by rarity, and colors used to draw the egg.
const EGGS = {
  Tidecaller: { need: 300, odds: { mythical: 1, legendary: 4, ultrarare: 8, rare: 17, uncommon: 30, common: 40 }, base: "#5fb8f0", shade: "#1f5f9e", deco: "waves", scene: "radial-gradient(circle at 50% 30%,#4fa3d9,#0f2f5e 75%)", blurb: "Called up from the deep. 24 sea creatures and myths of the ocean." },
  Forest: { need: 300, odds: { mythical: 1, legendary: 4, ultrarare: 8, rare: 17, uncommon: 30, common: 40 }, base: "#a8e6a1", shade: "#5fb37a", deco: "leaves", scene: "radial-gradient(circle at 50% 25%,#bfe8c8,#2f6b4c 75%)" },
  Candy:  { need: 300, odds: { common: 45, uncommon: 32, rare: 17, legendary: 6 }, base: "#ffc2da", shade: "#ff8fb8", deco: "sprinkles", scene: "radial-gradient(circle at 50% 30%,#ffe0ef,#a07ad9 80%)" },
  Bloom:  { need: 300, odds: { common: 45, uncommon: 32, rare: 17, legendary: 6 }, base: "#ffe9a8", shade: "#f2bb3c", deco: "flower", scene: "radial-gradient(circle at 50% 30%,#fff3c4,#d98a5a 80%)" },
  Ember:  { need: 400, odds: { common: 42, uncommon: 32, rare: 18, legendary: 8 }, base: "#ffb27a", shade: "#e5743f", deco: "flame",  scene: "radial-gradient(circle at 50% 30%,#ffcf9e,#8a2a2a 78%)" },
  Star:   { need: 500, odds: { rare: 80, legendary: 20 },  base: "#4a3f8f", shade: "#2c2560", deco: "stars",  scene: "radial-gradient(circle at 50% 30%,#6a55d8,#1b1550 72%)" },
};
// Old saves used "Ocean" for this egg. app.js converts them automatically.
const EGG_RENAMES = { Ocean: "Tidecaller" };
const OLD_CREATURES = { puffinpup: "seaotter", coralotl: "axolotl", glimmer: "moonjelly", tidecorn: "narwhal", fernwing: "barnowl", sylvanox: "entling", mossling: "fieldmouse", moonfawn: "rabbit" };


// Extra ways to get eggs
const LEVEL_UP_EGG = "Tidecaller"; // egg you get every time your character levels up
const TRADE_EGG = "Tidecaller";    // egg you get from the Duplicate Exchange
const TRADE_COST = 5;              // duplicate pets needed per egg

// ===== Gems =====
// Ways to earn gems
const GEM_REWARDS = {
  levelUp: 2,        // every level up
  perfectDay: 1,     // finish every habit in a day
  bossQuest: 3,      // finish a Boss quest
  assignment: 1,     // finish an Assignment quest
  weeklyPresent: 3,  // open the weekly present
  setComplete: 10,   // discover every creature from one egg (once per egg)
};
// Trade a spare (duplicate) high-rarity pet for gems in the Gem Exchange (Pets page)
const GEM_TRADE = { ultrarare: 2, legendary: 5, mythical: 15 };

// Creatures with two forms (like Selkie): `mainChance` = % chance a hatch comes out in the main (art) form,
// otherwise it's the alt form. You can only Shift Form once you own both.

// Shop items bought with gems. `type` decides what the item does (see app.js useItem / buy).
const SHOP_ITEMS = [
  { id: "lucky",  icon: "🍀", name: "Lucky Potion",    price: 3,  type: "boost", desc: "Your next hatch has double the chance of Ultra Rare, Legendary and Mythical." },
  { id: "tonic",  icon: "🧪", name: "Tide Tonic",      price: 2,  type: "boost", desc: "Double XP from every habit for the rest of today." },
  { id: "shield", icon: "🛡️", name: "Streak Shield",   price: 2,  type: "stack", desc: "If you miss a whole day, a shield is used up automatically and your streaks are saved." },
  { id: "elixir", icon: "⚡", name: "Hatching Elixir", price: 2,  type: "instant", desc: "Fill your incubator right now so the egg is ready to hatch." },
  { id: "pearl",  icon: "🔮", name: "Pearl of Choice", price: 10, type: "boost", desc: "On your next hatch, choose any creature you've already discovered from that egg." },
  { id: "polish", icon: "✨", name: "Shiny Polish",    price: 6,  type: "stack", desc: "Give any pet the holographic shine. Use it from the pet's card." },
  { id: "mythic", icon: "🌌", name: "Abyssal Star",    price: 150, type: "boost", desc: "Your next Tidecaller Egg is guaranteed to hatch a Mythical creature." },
  { id: "egg",    icon: "🥚", name: "Tidecaller Egg",  price: 5,  type: "instant", desc: "Adds one Tidecaller Egg to your basket." },
  { id: "coins",  icon: "🪙", name: "Coin Pouch",      price: 1,  type: "instant", desc: "Trade 1 gem for 150 coins." },
];

const STARTER_EGGS = ["Tidecaller", "Forest", "Candy", "Bloom"];

// 24 creatures: 4 per egg theme. `emoji` is only the placeholder until real art is added.
const CREATURES = [
  // ===== Tidecaller Egg =====
  // `art` = main picture. `full: true` means the picture is already a finished card with its own border,
  // so it's shown as-is (info goes beside it). Without `full`, the picture goes inside the HatchQuest card frame.
  // Mythical (0.5%)
  { id: "thalassa", name: "Thalassa", title: "The Living Ocean", egg: "Tidecaller", rarity: "mythical", kind: "Mother of Seas", emoji: "🌊", art: "art/thalassa.jpg", thumb: "art/thumbs/thalassa.jpg", full: true, power: "Endless Tide", powerText: "Every habit ripples into bonus XP", stats: [96, 90, 99], lore: "Not a creature in the ocean but the ocean itself, wearing a shape. Constellations drift through her like fish, and every tide is her breathing." },
  { id: "tiamat", name: "Tiamat", title: "Mother of Seas", egg: "Tidecaller", rarity: "mythical", kind: "Primordial Chaos", emoji: "🐉", art: "art/tiamat.jpg", thumb: "art/thumbs/tiamat.jpg", full: true, power: "Five-Fold Storm", powerText: "Brings its own weather. Streaks feel unstoppable", stats: [94, 70, 98], lore: "The five-headed dragon goddess of the first salt sea. Storms gather wherever she rests, and each head remembers a different age of the world." },
  // Legendary (2.5%)
  { id: "kraken", name: "Kraken", title: "The Deep Titan", egg: "Tidecaller", rarity: "legendary", kind: "Abyss Dweller", emoji: "🦑", art: "art/kraken.jpg", thumb: "art/thumbs/kraken.jpg", full: true, power: "Crushing Grip", powerText: "Never lets go of a streak", stats: [88, 55, 92], lore: "Sailors mistook its back for an island and its eyes for lighthouses. It rises only when the sea itself is angry." },
  { id: "aspidochelone", name: "Aspidochelone", title: "The Island Turtle", egg: "Tidecaller", rarity: "legendary", kind: "Island Guardian", emoji: "🐢", art: "art/aspidochelone.jpg", thumb: "art/thumbs/aspidochelone.jpg", full: true, power: "Calm & Wise", powerText: "Slow and steady habits grow strongest", stats: [80, 92, 85], lore: "A whole village lives on its shell and has never noticed. It has been swimming the same gentle circle for three hundred years." },
  { id: "leviathan", name: "Leviathan", title: "The Abyssal Serpent", egg: "Tidecaller", rarity: "legendary", kind: "Endless Maw", emoji: "🐍", art: "art/leviathan.jpg", thumb: "art/thumbs/leviathan.jpg", full: true, power: "Storm Surge", powerText: "Big bursts of XP on hard days", stats: [92, 48, 90], lore: "Lightning runs through its scales like veins of glass. When it surfaces, the whole storm bends toward it." },
  { id: "jormungandr", name: "Jörmungandr", title: "The World Serpent", egg: "Tidecaller", rarity: "legendary", kind: "World Ender", emoji: "🐲", art: "art/jormungandr.jpg", thumb: "art/thumbs/jormungandr.jpg", full: true, power: "Ouroboros", powerText: "Long streaks loop back into rewards", stats: [95, 40, 94], lore: "So long it circles the entire world and bites its own tail. The runes on its face glow brighter the longer it stays awake." },
  // Ultra rare (5%)
  { id: "selkie", name: "Selkie", title: "The Two-Forms", egg: "Tidecaller", rarity: "ultrarare", kind: "Shifter", emoji: "🦭", art: "art/selkie.jpg", thumb: "art/thumbs/selkie.jpg", full: true, altArt: "art/selkie-seal.jpg", altThumb: "art/thumbs/selkie-seal.jpg", altLabel: "Seal form", mainLabel: "Shore form", mainChance: 25, mainShiny: true, power: "Shift", powerText: "Hatches as a seal or (rarely) her shore form. Own both to shift between them", stats: [70, 88, 80], lore: "A seal in the water and a girl on the shore, wrapped in her own spotted sealskin coat. She always comes back to the beach where she was first seen." },
  { id: "kappa", name: "Kappa", title: "The River Imp", egg: "Tidecaller", rarity: "ultrarare", kind: "River Yokai", emoji: "🐸", art: "art/kappa.jpg", thumb: "art/thumbs/kappa.jpg", power: "Full Dish", powerText: "Bow to it and it bows back, keep the water in!", stats: [64, 78, 72], lore: "A mischievous river spirit with a water-filled dish on its head. Its strength spills out if it bows, so good manners always win." },
  { id: "ningyo", name: "Ningyo", title: "The Pearl Mermaid", egg: "Tidecaller", rarity: "ultrarare", kind: "Reef Spirit", emoji: "🧜", art: "art/ningyo.jpg", thumb: "art/thumbs/ningyo.jpg", power: "Pearl String", powerText: "Each finished habit adds a pearl", stats: [76, 82, 88], lore: "A tiny fish-spirit of the coral caves who strings glowing pearls from bubbles. Legends say one taste of her song brings long life." },
  // Rare (12%)
  { id: "orca", name: "Orca", title: "The Tide Hunter", egg: "Tidecaller", rarity: "rare", kind: "Ocean Guardian", emoji: "🐋", art: "art/orca.jpg", thumb: "art/thumbs/orca.jpg", power: "Pod Power", powerText: "Stronger when all habits are done", stats: [82, 74, 66], lore: "Leaps through rings of glowing seawater at sunset. Never travels without its family." },
  { id: "anglerfish", name: "Anglerfish", title: "The Lantern Keeper", egg: "Tidecaller", rarity: "rare", kind: "Deep Sea Light", emoji: "🏮", art: "art/anglerfish.jpg", thumb: "art/thumbs/anglerfish.jpg", power: "Night Light", powerText: "Late study sessions feel less lonely", stats: [78, 86, 60], lore: "Carries a little brass lantern through the dark so nobody in the deep ever gets lost." },
  { id: "giantsquid", name: "Giant Pacific Squid", title: "The Ink Painter", egg: "Tidecaller", rarity: "rare", kind: "Shoreline Drifter", emoji: "🦑", art: "art/giantsquid.jpg", thumb: "art/thumbs/giantsquid.jpg", power: "Ink Swirl", powerText: "Turns messy days into art", stats: [74, 62, 80], lore: "Paints the evening sky with swirls of starry ink, then disappears before anyone can say thank you." },
  { id: "narwhal", name: "Narwhal", title: "The Rune Horn", egg: "Tidecaller", rarity: "rare", kind: "Arctic Mystic", emoji: "🦄", art: "art/narwhal.jpg", thumb: "art/thumbs/narwhal.jpg", power: "Compass Horn", powerText: "Points you toward your next goal", stats: [80, 72, 84], lore: "Its spiral horn hums with glowing runes and always points north, or toward whatever you need most." },
  { id: "moonjelly", name: "Moon Jelly Swarm", title: "The Night Glow", egg: "Tidecaller", rarity: "rare", kind: "Drifting Lights", emoji: "🪼", art: "art/moonjelly.jpg", thumb: "art/thumbs/moonjelly.jpg", power: "Moonrise", powerText: "Glows brighter on nights you finish everything", stats: [60, 84, 76], lore: "Translucent by day, a lantern parade by night. The swarm follows the moon's reflection across the water." },
  // Uncommon (25%)
  { id: "axolotl", name: "Axolotl", title: "The Smiling Pond", egg: "Tidecaller", rarity: "uncommon", kind: "Regrowing Friend", emoji: "🦎", art: "art/axolotl.jpg", thumb: "art/thumbs/axolotl.jpg", power: "Regrowth", powerText: "Bounces back after a missed day", stats: [52, 96, 64], lore: "Always smiling, always splashing. It can regrow almost anything, including your motivation." },
  { id: "seahorse", name: "Seahorse", title: "The Golden Spiral", egg: "Tidecaller", rarity: "uncommon", kind: "Reef Dancer", emoji: "🌀", art: "art/seahorse.jpg", thumb: "art/thumbs/seahorse.jpg", power: "Steady Spiral", powerText: "Small daily habits add up", stats: [58, 80, 70], lore: "Dances in slow golden spirals at sunrise and holds onto coral with its curly tail when the waves get rough." },
  { id: "dolphin", name: "Dolphin", title: "The Sunset Leaper", egg: "Tidecaller", rarity: "uncommon", kind: "Playful Swimmer", emoji: "🐬", art: "art/dolphin.jpg", thumb: "art/thumbs/dolphin.jpg", power: "Joy Jump", powerText: "Extra cheer after every check-off", stats: [62, 94, 58], lore: "Jumps through the sunset just to show off, then swims back to see if you were watching." },
  { id: "mantaray", name: "Manta Ray", title: "The Skyglider", egg: "Tidecaller", rarity: "uncommon", kind: "Aquatic Companion", emoji: "🛸", art: "art/mantaray.jpg", thumb: "art/thumbs/mantaray.jpg", power: "Glide", powerText: "Makes busy weeks feel lighter", stats: [66, 76, 62], lore: "Glides above the waves like it has forgotten which way is up, trailing sparkles and very confused fish." },
  { id: "octopus", name: "Octopus", title: "The Tide Navigator", egg: "Tidecaller", rarity: "uncommon", kind: "Curious Collector", emoji: "🐙", art: "art/octopus.jpg", thumb: "art/thumbs/octopus.jpg", power: "Eight Arms", powerText: "Great at juggling many habits", stats: [84, 70, 60], lore: "Collects seashells and old brass compasses. It has eight arms and somehow still wants to hold yours." },
  // Common (55%)
  { id: "clownfish", art: "art/clownfish.jpg", thumb: "art/thumbs/clownfish.jpg", name: "Clownfish", title: "The Anemone Kid", egg: "Tidecaller", rarity: "common", kind: "Reef Resident", emoji: "🐠", power: "Home Base", powerText: "Comfort in routine", stats: [44, 90, 50], lore: "Lives in a stinging anemone and thinks it's the coziest house on the reef." },
  { id: "seaotter", art: "art/seaotter.jpg", thumb: "art/thumbs/seaotter.jpg", name: "Sea Otter", title: "The Hand Holder", egg: "Tidecaller", rarity: "common", kind: "Kelp Floater", emoji: "🦦", power: "Holding Hands", powerText: "Keeps you from drifting off track", stats: [48, 98, 52], lore: "Holds paws with friends while sleeping so nobody floats away. Keeps a favorite rock in its pocket." },
  { id: "hermitcrab", art: "art/hermitcrab.jpg", thumb: "art/thumbs/hermitcrab.jpg", name: "Hermit Crab", title: "The House Hopper", egg: "Tidecaller", rarity: "common", kind: "Shell Collector", emoji: "🦀", power: "New Shell", powerText: "Helps you start fresh", stats: [50, 80, 56], lore: "Upgrades to a bigger shell whenever it grows. Very picky about interior design." },
  { id: "sardines", art: "art/sardines.jpg", thumb: "art/thumbs/sardines.jpg", name: "Sardine Swarm", title: "The Silver Cloud", egg: "Tidecaller", rarity: "common", kind: "School of Fish", emoji: "🐟", power: "Together", powerText: "Strength in numbers", stats: [40, 86, 58], lore: "Thousands of tiny fish that move like one shimmering silver cloud. Nobody knows who's in charge." },
  { id: "babyturtle", art: "art/babyturtle.jpg", thumb: "art/thumbs/babyturtle.jpg", name: "Baby Sea Turtle", title: "The First Swim", egg: "Tidecaller", rarity: "common", kind: "Hatchling", emoji: "🐢", power: "First Steps", powerText: "Celebrates every new habit", stats: [42, 92, 60], lore: "Just hatched and already racing toward the waves. Every big journey starts with tiny flippers." },
  // ===== Forest Egg =====
  // Mythical (0.5%)
  { id: "leshen", name: "Leshen", title: "The Forest Itself", egg: "Forest", rarity: "mythical", kind: "Ancient Guardian", emoji: "🌲", art: "art/leshen.jpg", thumb: "art/thumbs/leshen.jpg", full: true, power: "Deep Roots", powerText: "Your streaks are almost impossible to break", stats: [92, 40, 98], lore: "A towering spirit of bark and root with ravens nesting in its antlers. Travelers who show it respect always find their way home." },
  { id: "yggdrasil", name: "Yggdrasil Sprout", title: "World Tree", egg: "Forest", rarity: "mythical", kind: "Life Bringer", emoji: "🌳", art: "art/yggdrasil.jpg", thumb: "art/thumbs/yggdrasil.jpg", full: true, power: "Nine Realms", powerText: "Every habit branches into bonus XP", stats: [90, 94, 96], lore: "A seedling of the tree that holds up the worlds. Squirrels, frogs and songbirds already live in its tiny branches." },
  { id: "unicorn", name: "Moonlit Unicorn", title: "Silver Bloom", egg: "Forest", rarity: "mythical", kind: "Night Blessing", emoji: "🦄", art: "art/unicorn.jpg", thumb: "art/thumbs/unicorn.jpg", full: true, power: "Night Blessing", powerText: "Bedtime habits shine twice as bright", stats: [84, 98, 95], lore: "Flowers bloom in every hoofprint it leaves. It only appears on clear nights, to those who kept their promises that day." },
  { id: "greenman", name: "Green Man", title: "Face of the Woods", egg: "Forest", rarity: "mythical", kind: "Verdant God", emoji: "🍃", art: "art/greenman.jpg", thumb: "art/thumbs/greenman.jpg", full: true, power: "Verdant Watch", powerText: "Growth habits blossom into extra rewards", stats: [96, 70, 92], lore: "The face you swear you saw in the leaves. He watches over every seed that's planted and every goal that's started." },
  { id: "babayaga", name: "Baba Yaga's Hut", title: "Walking Home", egg: "Forest", rarity: "mythical", kind: "Chicken Legged", emoji: "🏚️", art: "art/babayaga.jpg", thumb: "art/thumbs/babayaga.jpg", full: true, power: "Turn Around", powerText: "Spins any bad day back toward your goals", stats: [80, 60, 99], lore: "A cottage that walks on giant chicken legs and only opens its door if you ask politely. It has never once been on time." },
  // Legendary (2.5%)
  { id: "direwolf", name: "Direwolf Pup", title: "Heir of the Pack", egg: "Forest", rarity: "legendary", kind: "Spirit Pack", emoji: "🐺", art: "art/direwolf.jpg", thumb: "art/thumbs/direwolf.jpg", full: true, power: "Pack Howl", powerText: "Stronger streaks when all habits are done", stats: [82, 78, 88], lore: "Too young to howl properly, but the ghost-wolves of its ancestors join in every time it tries." },
  { id: "hornedguardian", name: "Great Horned Guardian", title: "Keeper of the Grove", egg: "Forest", rarity: "legendary", kind: "Elder Stag", emoji: "🦌", art: "art/hornedguardian.jpg", thumb: "art/thumbs/hornedguardian.jpg", full: true, power: "Blooming Crown", powerText: "Small habits blossom into big rewards", stats: [86, 72, 90], lore: "Flowers and glowing mushrooms grow from its antlers. Its golden eyes can see every path through the forest at once." },
  { id: "forestdrake", name: "Forest Drake", title: "The Leaf Wing", egg: "Forest", rarity: "legendary", kind: "Woodland Dragon", emoji: "🐉", art: "art/forestdrake.jpg", thumb: "art/thumbs/forestdrake.jpg", full: true, power: "Autumn Glide", powerText: "Makes busy days feel lighter", stats: [78, 90, 84], lore: "Its feathers are made of living leaves that change color with the seasons. It loves chasing falling acorns." },
  { id: "entling", name: "Entling", title: "Rune Bark", egg: "Forest", rarity: "legendary", kind: "Tree Shepherd", emoji: "🌳", art: "art/entling.jpg", thumb: "art/thumbs/entling.jpg", full: true, power: "Slow & Steady", powerText: "Long streaks grow even stronger", stats: [94, 50, 88], lore: "Glowing runes run through its bark like veins. It thinks for a very long time before it says anything, but it's always right." },
  { id: "kitsune", name: "Kitsune", title: "Shrine Fox", egg: "Forest", rarity: "legendary", kind: "Blossom Spirit", emoji: "🦊", art: "art/kitsune.jpg", thumb: "art/thumbs/kitsune.jpg", full: true, power: "Nine Tails", powerText: "Each tail is a habit you've mastered", stats: [88, 84, 92], lore: "Guards a forgotten shrine under the cherry trees. Cherry blossoms cling to its tails wherever it goes." },
  // Ultra rare (5%)
  { id: "shroomkin", name: "Mycelial Shroomkin", title: "The Glowcap", egg: "Forest", rarity: "ultrarare", kind: "Mushroom Folk", emoji: "🍄", art: "art/shroomkin.jpg", thumb: "art/thumbs/shroomkin.jpg", power: "Spore Share", powerText: "Shares a little XP with every habit", stats: [60, 96, 74], lore: "A cheerful mushroom spirit that hands out tiny mushrooms as gifts. It glows brighter when it's happy, which is always." },
  { id: "dryad", name: "Dryad Seedling", title: "Bark & Bloom", egg: "Forest", rarity: "ultrarare", kind: "Tree Spirit", emoji: "🌱", art: "art/dryad.jpg", thumb: "art/thumbs/dryad.jpg", power: "Bloom", powerText: "Flowers grow with every finished habit", stats: [70, 92, 78], lore: "A young dryad who braids flowers into her vines. Every tree she touches grows a little greener." },
  { id: "wispmother", name: "Wisp Mother", title: "Lantern Keeper", egg: "Forest", rarity: "ultrarare", kind: "Will-o'-Wisp", emoji: "🏮", art: "art/wispmother.jpg", thumb: "art/thumbs/wispmother.jpg", power: "Guiding Light", powerText: "Helps you find your way back after a missed day", stats: [84, 80, 82], lore: "She carries lost wisps home in her brass lantern. Follow her light and you'll never get lost in the woods." },
  { id: "treant", name: "Treant Sapling", title: "Little Roots", egg: "Forest", rarity: "ultrarare", kind: "Baby Tree", emoji: "🌿", art: "art/treant.jpg", thumb: "art/thumbs/treant.jpg", power: "Taking Root", powerText: "New habits stick faster", stats: [66, 94, 72], lore: "Takes its first wobbly steps on tangled roots. Leaves sprout from its head when it's proud of you." },
  { id: "changeling", name: "Changeling Deer", title: "Half Shadow", egg: "Forest", rarity: "ultrarare", kind: "Fae Trickster", emoji: "🦌", art: "art/changeling.jpg", thumb: "art/thumbs/changeling.jpg", power: "Shapeshift", powerText: "Swaps a missed habit for a done one, sometimes", stats: [78, 70, 90], lore: "Half moonlight, half shadow. The fae left it in the woods as a gift, or a prank. Nobody's sure which." },
  // Rare (12%)
  { id: "stagbeetle", name: "Stag Beetle", title: "Storm Shell", egg: "Forest", rarity: "rare", kind: "Armored Bug", emoji: "🪲", art: "art/stagbeetle.jpg", thumb: "art/thumbs/stagbeetle.jpg", power: "Iron Shell", powerText: "Tough days don't break your streak", stats: [80, 52, 70], lore: "Lightning glows in the cracks of its shell. It's small, but it'll pick a fight with anything." },
  { id: "pinemarten", name: "Pine Marten", title: "Berry Thief", egg: "Forest", rarity: "rare", kind: "Treetop Scout", emoji: "🐿️", art: "art/pinemarten.jpg", thumb: "art/thumbs/pinemarten.jpg", power: "Quick Paws", powerText: "Bonus coins on busy days", stats: [68, 90, 74], lore: "Swipes berries from every bush in the forest and shares them with exactly nobody." },
  { id: "mossgolem", name: "Moss Golem Sprout", title: "Pebble Heart", egg: "Forest", rarity: "rare", kind: "Stone Spirit", emoji: "🪨", art: "art/mossgolem.jpg", thumb: "art/thumbs/mossgolem.jpg", power: "Steady Stone", powerText: "Stays strong through long weeks", stats: [62, 80, 70], lore: "A little pile of mossy stones that decided to get up and walk. Leaves sprout from its head when it rains." },
  { id: "barnowl", name: "Barn Owl", title: "Rune Wing", egg: "Forest", rarity: "rare", kind: "Night Sage", emoji: "🦉", art: "art/barnowl.jpg", thumb: "art/thumbs/barnowl.jpg", power: "Night Watch", powerText: "Late study sessions give bonus XP", stats: [90, 62, 76], lore: "Glowing runes shimmer across its wings. Forest sprites follow it on its silent night flights." },
  { id: "foxfire", name: "Foxfire Sprite", title: "Blue Flame", egg: "Forest", rarity: "rare", kind: "Spirit Kit", emoji: "🔥", art: "art/foxfire.jpg", thumb: "art/thumbs/foxfire.jpg", power: "Foxfire", powerText: "Lights up the path to your goals", stats: [76, 86, 80], lore: "A kit made of blue spirit flame. It leaves little fires behind that are cool to the touch." },
  // Uncommon
  { id: "woodpecker", name: "Woodpecker", title: "The Treasure Tapper", egg: "Forest", rarity: "uncommon", kind: "Bark Drummer", emoji: "🐦", art: "art/woodpecker.jpg", thumb: "art/thumbs/woodpecker.jpg", power: "Knock Knock", powerText: "Finds hidden coins in busy days", stats: [70, 78, 66], lore: "Taps on trees until they share their secrets. Keeps a tiny stash of acorns and shiny crystals." },
  { id: "badger", name: "Badger", title: "The Digger", egg: "Forest", rarity: "uncommon", kind: "Burrow Builder", emoji: "🦡", art: "art/badger.jpg", thumb: "art/thumbs/badger.jpg", power: "Dig In", powerText: "Never gives up on a hard habit", stats: [82, 58, 60], lore: "Grumpy, stubborn and the hardest worker in the forest. Its tunnels go further than anyone knows." },
  { id: "turtledove", name: "Turtle Dove", title: "Coos Softly", egg: "Forest", rarity: "uncommon", kind: "Shoulder Friend", emoji: "🕊️", art: "art/turtledove.jpg", thumb: "art/thumbs/turtledove.jpg", power: "Gentle Coo", powerText: "Calm days give bonus cheer", stats: [56, 96, 64], lore: "Rides on your shoulder and coos softly whenever you start to worry." },
  { id: "rabbit", name: "Rabbit", title: "The Happy Hopper", egg: "Forest", rarity: "uncommon", kind: "Meadow Dancer", emoji: "🐇", art: "art/rabbit.jpg", thumb: "art/thumbs/rabbit.jpg", power: "Binky", powerText: "Extra joy after every check-off", stats: [52, 99, 70], lore: "Does a little jump-and-twist when it's happy. It is always happy." },
  { id: "foxkit", name: "Red Fox Kit", title: "The Acorn Digger", egg: "Forest", rarity: "uncommon", kind: "Curious Kit", emoji: "🦊", art: "art/foxkit.jpg", thumb: "art/thumbs/foxkit.jpg", power: "Sniff Out", powerText: "Finds forgotten habits for you", stats: [68, 88, 72], lore: "Buries acorns everywhere and forgets most of them. That's how half the forest got planted." },
  // Common
  { id: "fieldmouse", name: "Field Mouse", title: "The Stick Collector", egg: "Forest", rarity: "common", kind: "Meadow Scurrier", emoji: "🐭", art: "art/fieldmouse.jpg", thumb: "art/thumbs/fieldmouse.jpg", power: "Little Steps", powerText: "Small habits count a little more", stats: [46, 88, 54], lore: "Carries a stick everywhere it goes, just in case. Nobody knows what the stick is for." },
  { id: "fireflies", name: "Firefly Swarm", title: "The Night Lights", egg: "Forest", rarity: "common", kind: "Glow Bugs", emoji: "✨", art: "art/fireflies.jpg", thumb: "art/thumbs/fireflies.jpg", power: "Glow Up", powerText: "Lights up your evenings", stats: [44, 92, 58], lore: "Four tiny friends who light up the woods at night. They always fly in a perfect little square." },
  { id: "snail", name: "Garden Snail", title: "The Slow Wanderer", egg: "Forest", rarity: "common", kind: "Shell Carrier", emoji: "🐌", art: "art/snail.jpg", thumb: "art/thumbs/snail.jpg", power: "Slow & Steady", powerText: "Every bit of progress counts", stats: [50, 84, 52], lore: "Takes the long way everywhere and enjoys every second of it." },
  { id: "ladybug", name: "Ladybug", title: "The Lucky Spot", egg: "Forest", rarity: "common", kind: "Leaf Hopper", emoji: "🐞", art: "art/ladybug.jpg", thumb: "art/thumbs/ladybug.jpg", power: "Lucky Spots", powerText: "A sprinkle of extra luck", stats: [42, 90, 76], lore: "Each spot on its back is a wish someone made. Land on your hand and one might come true." },
  { id: "chipmunk", name: "Chipmunk", title: "The Acorn Hoarder", egg: "Forest", rarity: "common", kind: "Cheek Stuffer", emoji: "🐿️", art: "art/chipmunk.jpg", thumb: "art/thumbs/chipmunk.jpg", power: "Stash", powerText: "Saves up coins for later", stats: [48, 90, 56], lore: "Can fit eleven acorns in its cheeks. Has been trying for twelve." },
  // Candy
  { id: "puffloom", name: "Puffloom", egg: "Candy", rarity: "common", kind: "Cloud Lamb", emoji: "🐑", art: "art/puffloom.png", thumb: "art/thumbs/puffloom.jpg", power: "Soft Landing", powerText: "Makes rough days a bit softer", stats: [40, 96, 52], lore: "Made of leftover daydreams. Drifts after anyone who drinks enough water, leaving a rainbow trail." },
  { id: "mochibun", name: "Mochibun", egg: "Candy", rarity: "uncommon", kind: "Rice-Cake Bunny", emoji: "🍡", power: "Sweet Tooth", powerText: "Treats you to extra coins", stats: [50, 90, 60], lore: "Squishy, stretchy, and always smells faintly of strawberries." },
  { id: "taffydrake", name: "Taffy Drake", egg: "Candy", rarity: "rare", kind: "Sugar Dragon", emoji: "🐉", power: "Sugar Rush", powerText: "Quick bursts of motivation", stats: [75, 82, 58], lore: "Breathes spun sugar instead of fire. Very popular at birthday parties." },
  { id: "sugarcorn", name: "Sugarcorn", egg: "Candy", rarity: "legendary", kind: "Confection Unicorn", emoji: "🍭", power: "Sweet Victory", powerText: "Huge XP after perfect days", stats: [70, 99, 90], lore: "Its mane is a swirl of every flavor that has ever made someone smile." },
  // Bloom
  { id: "petalpup", name: "Petalpup", egg: "Bloom", rarity: "common", kind: "Flower Puppy", emoji: "🐶", power: "Bloom Buddy", powerText: "Keeps you company on chores", stats: [42, 94, 48], lore: "Its ears are two big petals that flop when it's happy, which is always." },
  { id: "bumblefluff", name: "Bumblefluff", egg: "Bloom", rarity: "uncommon", kind: "Puff Bee", emoji: "🐝", power: "Busy Bee", powerText: "Rewards finishing lots of habits", stats: [66, 78, 60], lore: "Too fluffy to fly far, so it hops from flower to flower humming tiny songs." },
  { id: "lilyphant", name: "Lilyphant", egg: "Bloom", rarity: "rare", kind: "Lily Elephant", emoji: "🐘", power: "Never Forget", powerText: "Helps you remember habits", stats: [84, 70, 62], lore: "Its ears are lily pads, and frogs ride on them like little boats." },
  { id: "gardenwyrm", name: "Gardenwyrm", egg: "Bloom", rarity: "legendary", kind: "Blossom Serpent", emoji: "🌸", power: "Full Bloom", powerText: "Every habit blossoms into more XP", stats: [86, 88, 92], lore: "Sleeps underground all winter and wakes the whole garden with one yawn." },
  // Ember
  { id: "cinderpip", name: "Cinderpip", egg: "Ember", rarity: "common", kind: "Spark Chick", emoji: "🐤", power: "Spark", powerText: "A little warmth for early mornings", stats: [50, 86, 50], lore: "Peeps out a tiny ember whenever it hiccups." },
  { id: "kindlecub", name: "Kindlecub", egg: "Ember", rarity: "uncommon", kind: "Hearth Bear", emoji: "🐻", power: "Cozy Fire", powerText: "Warm, steady progress", stats: [62, 84, 58], lore: "Always warm, always hungry, always asking for one more story." },
  { id: "embernib", name: "Embernib", egg: "Ember", rarity: "rare", kind: "Hearth Dragon", emoji: "🐲", art: "art/embernib.png", thumb: "art/thumbs/embernib.jpg", power: "Warm-Up", powerText: "Workout habits feel easier", stats: [55, 90, 60], lore: "Too small to breathe fire, so it breathes cozy. Sleeps curled around warm mugs of tea." },
  { id: "solflare", name: "Solflare", egg: "Ember", rarity: "legendary", kind: "Phoenix", emoji: "🔥", power: "Rise Again", powerText: "Comes back stronger after setbacks", stats: [92, 80, 95], lore: "Reborn every sunrise from the ashes of yesterday's worries." },
  // Star
  { id: "nebbit", name: "Nebbit", egg: "Star", rarity: "common", kind: "Nebula Hare", emoji: "🐰", power: "Stardust", powerText: "A sprinkle of extra XP", stats: [55, 80, 60], lore: "Hops between stars and leaves glittery footprints across the sky." },
  { id: "orbitail", name: "Orbitail", egg: "Star", rarity: "uncommon", kind: "Comet Cat", emoji: "🐱", power: "Orbit", powerText: "Keeps your routine going in circles", stats: [70, 72, 68], lore: "Chases its own glowing tail around the moon every night." },
  { id: "noctara", name: "Noctara", egg: "Star", rarity: "rare", kind: "Astral Owl", emoji: "🦉", power: "Night Watch", powerText: "Late study sessions give bonus XP", stats: [90, 55, 78], lore: "Its eyes are two tiny galaxies. It knows every constellation by name." },
  { id: "lumifox", name: "Lumifox", egg: "Star", rarity: "legendary", kind: "Kitsune Spirit", emoji: "🦊", art: "art/lumifox.png", thumb: "art/thumbs/lumifox.jpg", power: "Starlight Focus", powerText: "The strongest study XP boost", stats: [95, 70, 88], lore: "Grows a new glowing tail for every hundred promises kept. Only shows up after midnight study sessions." },
];

const HABIT_PRESETS = [
  { name: "Drink 8 glasses of water", icon: "💧", xp: 10 },
  { name: "Read for 20 minutes", icon: "📖", xp: 15 },
  { name: "Stretch / move", icon: "🧘", xp: 20 },
  { name: "Journal one line", icon: "✍️", xp: 10 },
  { name: "Code for 1 hour", icon: "💻", xp: 30 },
  { name: "In bed by midnight", icon: "🌙", xp: 20 },
  { name: "Study for 30 minutes", icon: "📚", xp: 25 },
  { name: "Go outside", icon: "🌿", xp: 15 },
  { name: "Make the bed", icon: "🛏️", xp: 10 },
  { name: "Eat a real breakfast", icon: "🥞", xp: 10 },
];

const HABIT_ICONS = ["💧", "📖", "🧘", "✍️", "💻", "🌙", "📚", "🌿", "🛏️", "🥞", "🏃", "🎨", "🎵", "🧹", "💊", "🍎", "🙏", "📵"];
const AVATARS = ["🦊", "🐰", "🐻", "🐱", "🐸", "🐧", "🦄", "🐲", "🌸", "⭐"];

// Quest difficulty: rewards for finishing homework
const QUEST_TYPES = {
  small:  { label: "Small task",  xp: 40,  coins: 10, eggChance: 50 },
  side:   { label: "Assignment",  xp: 60,  coins: 20, eggChance: 100 },
  boss:   { label: "Boss (exam / project)", xp: 150, coins: 50, eggChance: 100, egg: "Star" },
};

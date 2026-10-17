# HatchQuest 🥚

A habit tracker + homework planner that plays like a game. Check off daily habits to earn XP,
finish homework "quests" to earn themed eggs, and hatch creatures with different rarity chances.

## How to open it (no install needed)

1. Unzip the folder.
2. Double-click **index.html**. It opens in your web browser (Chrome or Edge work best).

The first time it opens, it walks you through a quick setup: name, avatar, your own habits (or picks from a list of ideas), and a starter egg.

## Saving

- Progress **saves automatically** every time you check something off, and again when you close the window.
- Saves are **local to the device and browser**. Anyone who opens the app on a different computer
  (or a different browser) gets their own fresh setup.
- To move your progress to another device: **Settings → Export backup**, then **Import backup** on the other device.
- **Settings → Start over** erases the save on this device.
- There is no login. Opening the app again on the same device and browser picks up right where you left off.

## How the game works

| Thing | What it does |
|---|---|
| Daily habits | +XP and +2 coins each. Finishing all of them in a day doubles that day's XP (daily bonus). Click again to undo. |
| Streaks | Each habit tracks how many days in a row you've done it. Habits reset at midnight. |
| Incubator | All XP you earn also warms your current egg. When the bar fills, press **Hatch!** You can also spend 30 coins to add 25 egg XP. |
| Hatch chances | **Tidecaller & Forest Eggs** (24 and 30 creatures): 40% common, 30% uncommon, 17% rare, 8% ultra rare, 4% legendary, 1% mythical. Candy/Bloom: 45/32/17/6. Ember: 42/32/18/8. Star: 80% rare, 20% legendary. If you go 20 eggs without a legendary or mythical, the next one is guaranteed ("pity"). |
| Homework quests | Small task: +40 XP, 50% chance of an egg. Assignment: +60 XP and an egg. Boss (exam/project): +150 XP and a Star Egg. |
| Weekly present | Get 5 perfect days in one week (Mon–Sun) to open it for a bonus egg, coins and a gem. |
| Buddy | The creature you set as buddy boosts all habit XP (+5% common, up to +20% legendary and +30% mythical). |
| Levels | Every level up gives bonus coins **and a Tidecaller Egg**. |
| Duplicate Exchange | On the Pets page, trade 5 duplicate pets for a Tidecaller Egg. You always keep one of each creature, and your buddy and nicknamed pets are never traded. |
| Cards | Click a creature to open its card. Drag the card to tilt it; it springs back when you let go. |

## Creature art

**Easiest way:** in the app, go to **Settings → Creature Art** and press **Upload** next to any creature.
The picture is shrunk automatically and saved on that device.

**To include art for everyone** (built into the app files):

1. Put the image in the **art** folder, for example `art/clownfish.jpg`.
2. Open **data.js**, find the creature, and add `art: "art/clownfish.jpg"`.
   Optionally add a square thumbnail: `thumb: "art/thumbs/clownfish.jpg"`.
3. Refresh the app.

Two card styles:

- **Framed art** (`full: true`): the picture already has its own border and nameplate, like the Kraken card.
  It's shown as-is, and the stats and lore appear in a panel beside it.
- **Plain art** (no `full`): the picture goes inside the HatchQuest card frame with the name, power, stats and lore.
  Any shape works; landscape images look great.

A creature can also have a second form with `altArt`. The Selkie hatches as a seal pup (75%) or her shiny shore form (25%, set by `mainChance`). Once you own both, **Shift Form** switches between them.

The egg rewards for leveling up and trading (`LEVEL_UP_EGG`, `TRADE_EGG`, `TRADE_COST`) are at the top of data.js.

You can also edit names, lore, powers, stats, hatch odds and habit presets in **data.js**.

## Optional: make it a Windows .exe

This needs [Node.js](https://nodejs.org) installed. In a terminal inside this folder:

```
npm install
npm start          # runs it as a desktop app
npm run build      # creates dist/HatchQuest <version>.exe (portable, no installer)
```

The desktop version saves progress in that computer's app data folder, separately for each Windows user account.

## Files

- `index.html` – the page
- `styles.css` – all the styling
- `app.js` – game logic, saving, screens
- `data.js` – creatures, eggs, odds, habit presets (easy to edit)
- `main.js`, `package.json` – only used for the optional .exe version
- `fonts/` – Fredoka and Press Start 2P (both free under the SIL Open Font License)
- `art/` – creature images

## Gems and the Shop

The **💎 Shop** tab sells:

| Item | Gems | What it does |
|---|---|---|
| 🍀 Lucky Potion | 3 | Next hatch: double chance of Ultra Rare, Legendary and Mythical |
| 🧪 Tide Tonic | 2 | Double XP from habits for the rest of the day |
| 🛡️ Streak Shield | 2 | Used automatically if you miss a whole day, so your streaks survive |
| ⚡ Hatching Elixir | 2 | Fills the incubator so the egg can hatch now |
| 🌌 Abyssal Star | 150 | Your next Tidecaller hatch is guaranteed Mythical |
| 🔮 Pearl of Choice | 10 | Next hatch: pick any creature you've already discovered from that egg |
| ✨ Shiny Polish | 6 | Gives any pet the holographic shine (use it from the pet's card) |
| 🥚 Tidecaller Egg | 5 | One more egg |
| 🪙 Coin Pouch | 1 | 150 coins |

Ways to earn gems: level up (+2), perfect day (+1), Boss quest (+3), Assignment quest (+1),
weekly present (+3), completing an egg set (+10), and the **Gem Exchange** on the Pets page,
where spare Ultra Rare (+2), Legendary (+5) and Mythical (+15) duplicates can be traded in.

All prices and rewards are in `data.js` (`SHOP_ITEMS`, `GEM_REWARDS`, `GEM_TRADE`).

## Cheats

**Settings → Cheats enabled** gives unlimited gems, coins and eggs, plus an **Instant Hatch** button in the incubator.
It asks you to confirm first, and it **can't be turned off** for that save (only Start Over removes it).

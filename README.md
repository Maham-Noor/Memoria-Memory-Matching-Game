# 🃏 Memoria — Memory Matching Game

> *flip. match. conquer.*

A fully client-side Memory Matching Game built with **HTML**, **CSS**, and **jQuery**. Features smooth 3D card-flip animations, synthesized sound effects, multiple difficulty levels, a live score system, and a responsive arcade-inspired UI — all with zero external dependencies beyond jQuery.

---

## 📸 Project Overview

Memoria is a classic concentration-style card game where players flip cards two at a time to find matching pairs. The game tracks moves, time, and calculates a score based on efficiency. All sound effects are synthesized in real-time via the **Web Audio API** — no audio files required.

---

## ✨ Features

- **3 Difficulty Levels** — Easy (4×4), Medium (6×6), Hard (8×8)
- **Smooth 3D Card Flip Animations** — Pure CSS `rotateY` transforms with `preserve-3d`
- **Randomized Deck** — Fisher-Yates shuffle ensures a unique game every time
- **Live Stats** — Move counter, elapsed timer, and real-time score
- **Synthesized Sound Effects** — Flip click, match chime, mismatch buzz, and win fanfare via Web Audio API
- **Mute Toggle** — Instantly silence all sounds without refreshing
- **Win Modal** — Displays final moves, time, and score on completion
- **Responsive Layout** — Adapts cleanly to mobile and desktop screens
- **No build tools** — Drop the three files in a folder and open `index.html`

---

## 🗂️ Project Structure

```
memoria/
├── index.html     # Markup — game board, controls, win modal
├── style.css      # All styles — layout, card animations, modal, responsive
└── script.js      # jQuery game logic + Web Audio sound engine
```

---

## 🚀 Getting Started

No installation or build step needed.

1. Clone or download this repository
2. Open `index.html` in any modern browser

```bash
git clone https://github.com/your-username/memoria.git
cd memoria
open index.html
```

> **Browser support:** Chrome, Firefox, Safari, Edge (any version supporting CSS `preserve-3d` and Web Audio API)

---

## 🎮 How to Play

1. Select a difficulty level — **Easy**, **Medium**, or **Hard**
2. Click any card to flip it and reveal its emoji symbol
3. Click a second card to try to find its match
   - ✅ **Match** → both cards stay face-up and glow
   - ❌ **No match** → both cards flip back after a short delay
4. Find all pairs to win — your score, moves, and time are shown in the results modal
5. Click **↺ Restart** or **Play Again** to start a new game

---

## 🧠 Game Logic

### Card Deck
- A pool of 32 emoji symbols is shuffled and sliced to the required pair count
- Each symbol is duplicated to form a pair, and the full deck is shuffled again using Fisher-Yates

### Flip & Match Evaluation
- jQuery tracks up to 2 flipped card IDs in `state.flipped`
- When 2 cards are flipped, their `symbol` values are compared
- A `locked` boolean prevents any further clicks during evaluation to avoid race conditions

### Score Formula
```
score = (pairs × 100) − (extra_moves × 3) − elapsed_seconds
```
- Rewards finishing quickly with fewer moves
- Floored at 0 — you can never go negative

### Sound Engine
All sounds are synthesized on-the-fly using `OscillatorNode` and `GainNode` with custom attack/release envelopes:

| Event | Sound Design |
|-------|-------------|
| Card flip | Short sine + triangle blip (900 / 1200 Hz) |
| Match | Ascending C5 → E5 chime (sine + triangle) |
| Wrong | Descending sawtooth dissonance (260 / 220 Hz) |
| Win | 5-note arpeggio C D E G A with sparkle overtones |

> The `AudioContext` is created lazily on first user interaction to comply with browser autoplay policies.

---

## 🛠️ Technical Highlights

| Concept | Implementation |
|---------|---------------|
| Card flip animation | CSS `rotateY(180deg)` on `.card-inner` with `transform-style: preserve-3d` |
| Randomization | Fisher-Yates shuffle (unbiased, unlike `array.sort(() => Math.random())`) |
| State management | Single `state` object as the source of truth — no scattered variables |
| UI lock | `state.locked` boolean prevents click handling during mismatch delay |
| Sound synthesis | Web Audio API — `OscillatorNode` + `GainNode`, no audio files |
| Responsive grid | CSS Grid with `repeat(N, auto)` columns set dynamically by JS |
| Stagger animation | CSS `animation-delay` on `:nth-child` for board card entrance |

---

## 🎨 Design

- **Typography:** [Syne](https://fonts.google.com/specimen/Syne) (display) + [DM Mono](https://fonts.google.com/specimen/DM+Mono) (UI/stats)
- **Theme:** Dark arcade / retro-future — near-black background, electric lime accent (`#e8ff47`), hot pink secondary (`#ff4fd8`)
- **Texture:** Subtle CSS grid overlay and diagonal stripe pattern on card backs

---

## 📦 Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| [jQuery](https://jquery.com/) | 3.7.1 | DOM manipulation & event handling |
| Google Fonts | — | Syne + DM Mono typefaces |

> No bundler, no framework, no build step. Pure vanilla stack.

---

## 🔮 Possible Enhancements

- Persistent high score via `localStorage`
- Themed card sets (animals, flags, food)
- Accessibility improvements (keyboard navigation, ARIA labels)
- Dark/light mode toggle
- Confetti particle burst on win

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Built with HTML, CSS, jQuery, and the Web Audio API.*

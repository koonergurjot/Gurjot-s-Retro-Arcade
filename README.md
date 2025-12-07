# 🕹️ Gurjot's Games - Retro Arcade Platform

**Gurjot's Games** is a modern, single-page React application designed to replicate the nostalgic experience of early 2000s browser gaming sites (like Miniclip). It features a polished "Neon/Vaporwave" aesthetic, a robust library of 20+ fully playable games, global progression systems, and a context-aware AI companion powered by Google Gemini.

---

## ✨ Key Features

### 1. 🎮 The Game Library
The platform hosts two distinct types of games:
*   **Canvas-Based Engines**: High-performance, physics-based games rendering at 60fps.
    *   **Retro Pong Deluxe**: Features particle effects, AI difficulty scaling, and "smash" mechanics.
    *   **Slippery Snake**: Classic gameplay with "Ghost Mode" and "Golden Apple" power-ups.
    *   **Brick Breaker Extreme**: Includes explosive bricks, multi-ball, and paddle wideners.
    *   **Space Defender**: A bullet-hell shooter with weapon upgrades, shields, and a multi-phase Boss Fight.
    *   **Pool Lite**: Physics simulation with friction, collision resolution, and combo scoring.
    *   **Flappy Block**: Side-scroller with coin collection and parallax backgrounds.
    *   **Dodgeball**: Survival game with shield power-ups and homing enemies.
*   **DOM/React Games**: Logic puzzles and arcade clickers built using React state.
    *   **Tic Tac Toe**: Unbeatable AI using the Minimax algorithm.
    *   **Connect 4**: Full win detection (horizontal, vertical, diagonal) and heuristic AI.
    *   **Memory Match**: 3-level progression system with combo timers.
    *   **Reaction Timer**, **Whack-a-Div**, **Typing Master**, **Simon Says**, and more.

### 2. 🧠 AI Game Guru (Powered by Gemini)
Integrated via `@google/genai`, the "Game Guru" is a persona-driven AI that watches you play.
*   **Pre-Game**: Offers strategic "Pro Tips" based on the specific game selected.
*   **In-Game**: Users can click "Ask Guru for Help" for tactical advice during gameplay.
*   **Post-Game**: Reacts to your final score, celebrating new high scores or offering condolences for losses.

### 3. 📈 Progression & Systems
*   **XP & Leveling**: Users earn XP based on score performance. Leveling up triggers visual celebrations.
*   **Daily Challenges**: One game is randomly selected as the "Daily Challenge" granting 2x XP.
*   **High Scores**: Session-based high score tracking for every game.
*   **Difficulty Settings**: Global Easy/Medium/Hard selector that adjusts game physics (ball speed, AI reaction time, enemy spawn rates).

### 4. 🎨 Visual Experience
*   **Retro Aesthetics**: CRT scanline overlays, chromatic aberration, moving grid backgrounds, and neon glow effects.
*   **Animations**: Custom CSS animations for "CRT Turn On" effects, card hovers, and UI transitions.
*   **Glassmorphism**: UI elements utilize backdrop blurs and semi-transparent borders for a modern-retro feel.
*   **Fullscreen Mode**: Immersive toggle for distraction-free gaming.

---

## 🛠️ Technical Architecture

### Tech Stack
*   **Framework**: React 19 (via `create-root`)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS + Custom CSS Keyframes
*   **AI**: Google Gemini Web SDK (`@google/genai`)

### File Structure
*   **`App.tsx`**: Main controller. Handles routing (Library vs Game), UI layout, global state (XP, Levels), and AI service coordination.
*   **`components/GameCanvas.tsx`**: A generic wrapper for all Canvas-based games. It handles the `requestAnimationFrame` loop, canvas refs, and bridges React state (Score) with the Imperative game logic.
*   **`components/SimpleGames.tsx`**: A monolithic component handling the logic for all DOM-based games. Uses `useEffect` for timers and game loops.
*   **`services/gameLogic.ts`**: Contains the raw physics engines for the canvas games. Each game exports an `init`, `update`, `draw`, and `getScore` function. This separation allows the logic to run independently of the React render cycle for performance.
*   **`services/geminiService.ts`**: Abstraction layer for the Gemini API. Handles prompt construction based on game context ('start', 'playing', 'end').
*   **`types.ts`**: Shared TypeScript interfaces for Game Metadata, Physics State, and difficulty configurations.

---

## 🚀 How to Run

1.  **Environment Setup**:
    Ensure you have an API Key from Google AI Studio.
    The app expects `process.env.API_KEY` to be injected (or manually set in `services/geminiService.ts` for local testing).

2.  **Dependencies**:
    This project uses standard React and Tailwind via CDN in the provided environment, but locally would require:
    ```bash
    npm install react react-dom @google/genai tailwindcss typescript
    ```

3.  **Start**:
    Run via your preferred bundler (Vite/Webpack).

---

## 🕹️ Controls

*   **General**: `ESC` to exit a game.
*   **Canvas Games**:
    *   Movement: `Arrow Keys`
    *   Action: `Spacebar` (Jump/Shoot)
    *   Special: `Shift` (Mega Bomb in Space Shooter)
    *   Mouse: Aim/Charge power in Pool.
*   **Simple Games**: Mouse/Touch interaction.

---

**© 2024 Gurjot's Games** - *Insert Coin to Continue*

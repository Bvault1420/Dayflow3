"use client";

import { useEffect, useRef } from "react";
import type { PlayConfig } from "@/lib/games/types";
import { kairosSfx } from "@/lib/kairos-sfx";

type Props = {
  config: PlayConfig;
  playing: boolean;
  className?: string;
};

type Target = { x: number; y: number; r: number; life: number; max: number; bad?: boolean };
type Pipe = { x: number; gapY: number; gapH: number; scored?: boolean; osc?: number };
type Obstacle = { x: number; y: number; w: number; h: number; scored?: boolean; lane?: number };
type Faller = { x: number; y: number; r: number; vy: number; vx?: number; bad: boolean };

/**
 * Real short-form canvas games (flappy / runner / dodge / catch / tap / roam).
 * Each PlayConfig is unique (colors, world, collectibles) from the user's prompt.
 */
export function PlayableGame({ config, playing, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let alive = true;
    let last = performance.now();
    let W = 1;
    let H = 1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const state = {
      score: 0,
      timeLeft: config.duration_seconds,
      over: false,
      started: false,
      lives: config.lives ?? 2,
    };
    const trails: Array<{ x: number; y: number; life: number }> = [];
    const style = config.obstacle_style || "pipes";
    const fx = config.fx || "glow";
    const sfxOn = config.sfx !== false;
    const hudMinimal = config.hud_style === "minimal";
    const useDrag = config.control === "drag";
    const feel = config.feel || {};
    const playerR = feel.tiny ? 11 : feel.huge ? 24 : 17;
    let holding = false;
    let airJumps = 0;
    let dashT = 0;
    let shieldOn = !!feel.shield;
    let gravSign = 1;

    const resize = () => {
      const parent = canvas.parentElement;
      W = parent?.clientWidth || window.innerWidth;
      H = parent?.clientHeight || window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // shared entities
    let playerY = H * 0.45;
    let playerX = W * 0.28;
    let vy = 0;
    let groundY = H * 0.78;
    let pipes: Pipe[] = [];
    let obstacles: Obstacle[] = [];
    let fallers: Faller[] = [];
    let targets: Target[] = [];
    let spawnTimer = 0;
    let shake = 0;
    let flash = 0;
    let runX = 0;
    let lane = 1; // 0..2 for 3-lane mode
    let playerImg: HTMLImageElement | null = null;
    let bgImg: HTMLImageElement | null = null;
    let obstacleImg: HTMLImageElement | null = null;
    let audio: HTMLAudioElement | null = null;

    if (config.player_image) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        playerImg = img;
      };
      img.src = config.player_image;
    }
    if (config.bg_image) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        bgImg = img;
      };
      img.src = config.bg_image;
    }
    if (config.obstacle_image) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        obstacleImg = img;
      };
      img.src = config.obstacle_image;
    }
    if (config.music_url && playing) {
      audio = new Audio(config.music_url);
      audio.loop = true;
      audio.volume = 0.45;
      void audio.play().catch(() => {
        /* autoplay may be blocked until tap */
      });
    }

    const speed = 2.4 * config.speed;
    const gravity = config.gravity * config.speed;
    const jump = -9.2 * config.jump;

    const resetRound = (keepScore = false) => {
      playerY = H * 0.45;
      playerX = config.genre === "flappy" ? W * 0.28 : config.genre === "roam" ? W * 0.5 : W * 0.22;
      vy = 0;
      pipes = [];
      obstacles = [];
      fallers = [];
      targets = [];
      spawnTimer = 0.4;
      shake = 0;
      flash = 0;
      if (!keepScore) {
        state.score = 0;
        state.timeLeft = config.duration_seconds;
        state.over = false;
        state.started = false;
        state.lives = config.lives ?? 2;
        runX = 0;
        trails.length = 0;
        airJumps = 0;
        dashT = 0;
        shieldOn = !!feel.shield;
        gravSign = 1;
        holding = false;
      }
    };

    resetRound(false);

    const bumpScore = (n = 1) => {
      state.score += n;
      if (sfxOn) kairosSfx.score();
    };

    const fail = () => {
      if (dashT > 0) return;
      if (shieldOn) {
        shieldOn = false;
        flash = 0.4;
        if (sfxOn) kairosSfx.tap();
        return;
      }
      flash = 0.35;
      shake = fx === "shake" || fx === "glow" ? 10 : 6;
      if (sfxOn) kairosSfx.fail();
      if (config.genre === "tap" || config.genre === "catch") {
        state.score = Math.max(0, state.score - 1);
        return;
      }
      state.lives = Math.max(0, state.lives - 1);
      if (state.lives <= 0) {
        state.over = true;
        return;
      }
      const score = state.score;
      const lives = state.lives;
      resetRound(true);
      state.score = score;
      state.lives = lives;
      state.started = true;
    };

    const endGame = () => {
      state.over = true;
      state.started = true;
    };

    const onPointer = (clientX: number, clientY: number) => {
      if (!playing || state.over) {
        if (state.over) resetRound(false);
        return;
      }
      if (audio && audio.paused) void audio.play().catch(() => undefined);
      state.started = true;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Invert only on flappy flap taps (center), not lane/drag moves
      if (feel.invert && config.genre === "flappy" && !feel.hold_flap) {
        gravSign *= -1;
      }

      const canJump = playerY >= groundY - 2 || (feel.double_jump && airJumps < 2);
      const doJump = (mult = 1.15) => {
        if (!canJump && config.genre !== "flappy") return;
        if (playerY < groundY - 2) airJumps += 1;
        else airJumps = 1;
        vy = jump * mult * gravSign;
        if (sfxOn) kairosSfx.flap();
      };

      if (config.genre === "flappy") {
        if (!feel.hold_flap) {
          vy = jump * gravSign;
          if (sfxOn) kairosSfx.flap();
        }
      } else if (config.genre === "runner" && (config.lanes || 1) === 3) {
        const third = W / 3;
        if (x < third) {
          lane = Math.max(0, lane - 1);
          if (sfxOn) kairosSfx.tap();
        } else if (x > third * 2) {
          lane = Math.min(2, lane + 1);
          if (sfxOn) kairosSfx.tap();
        } else {
          // center: jump, or dash when already in air
          if (feel.dash && playerY < groundY - 8) {
            dashT = 0.22;
            if (sfxOn) kairosSfx.flap();
          } else {
            doJump();
          }
        }
      } else if (config.genre === "runner") {
        if (feel.dash && x > W * 0.72) {
          dashT = 0.22;
          if (sfxOn) kairosSfx.flap();
        } else {
          doJump();
        }
      } else if (config.genre === "roam") {
        if (x > W * 0.7 && y > H * 0.52) {
          if (feel.dash && playerY < groundY - 8) {
            dashT = 0.22;
            if (sfxOn) kairosSfx.flap();
          } else {
            doJump(1.1);
          }
        } else {
          playerX = Math.max(36, Math.min(W - 36, x));
        }
      } else if (config.genre === "dodge" || config.genre === "catch") {
        playerX = Math.max(28, Math.min(W - 28, x));
      } else if (config.genre === "tap") {
        let hit = false;
        for (let i = targets.length - 1; i >= 0; i--) {
          const t = targets[i];
          const dx = t.x - x;
          const dy = t.y - y;
          if (dx * dx + dy * dy <= (t.r + 12) * (t.r + 12)) {
            if (t.bad) fail();
            else {
              bumpScore(1);
              if (sfxOn) kairosSfx.tap();
            }
            targets.splice(i, 1);
            hit = true;
            flash = 0.12;
            break;
          }
        }
        if (!hit) {
          /* miss */
        }
      }
    };

    const pointerDown = (e: PointerEvent) => {
      holding = true;
      onPointer(e.clientX, e.clientY);
    };
    const pointerUp = () => {
      holding = false;
    };
    const pointerMove = (e: PointerEvent) => {
      if ((!useDrag && config.genre !== "roam") || !state.started || state.over || !playing) return;
      if (e.buttons === 0 && e.pointerType === "mouse") return;
      const rect = canvas.getBoundingClientRect();
      playerX = Math.max(28, Math.min(W - 28, e.clientX - rect.left));
    };
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    canvas.addEventListener("pointermove", pointerMove);

    const drawBackground = () => {
      const seed = config.seed || 1;
      const world = config.world || config.theme;
      const decor = config.decor_color || config.obstacle_color;
      const ground = config.ground_color || config.bg_bottom;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, config.bg_top);
      g.addColorStop(0.42, config.bg_bottom);
      g.addColorStop(1, ground);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      if (bgImg) {
        ctx.globalAlpha = 0.5;
        const scale = Math.max(W / bgImg.width, H / bgImg.height);
        const dw = bgImg.width * scale;
        const dh = bgImg.height * scale;
        ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
        ctx.globalAlpha = 1;
      }

      // sun / moon
      const orbX = W * (0.18 + ((seed % 50) / 100));
      const orbY = H * (0.14 + ((seed % 17) / 120));
      const orbR = 18 + (seed % 14);
      const sun = ctx.createRadialGradient(orbX, orbY, 2, orbX, orbY, orbR * 2.4);
      sun.addColorStop(0, `${config.accent_color}cc`);
      sun.addColorStop(0.35, `${config.accent_color}55`);
      sun.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = config.accent_color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbR * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      const cityish = world === "city" || config.genre === "roam" || config.genre === "runner";
      if (cityish) {
        const drawRow = (count: number, speedMul: number, alpha: number, yBase: number, maxH: number) => {
          for (let i = 0; i < count; i++) {
            const x = ((i * (W / count + 18) + runX * speedMul + (seed % 30)) % (W + 80)) - 40;
            const bw = 22 + ((seed + i * 17) % 28);
            const bh = 40 + ((seed + i * 11) % maxH);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = i % 2 === 0 ? decor : config.obstacle_color;
            roundRect(ctx, x, yBase - bh, bw, bh, 3);
            ctx.fill();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = config.accent_color;
            const cols = 2 + (i % 3);
            const rows = 3 + (i % 4);
            const cellW = bw / (cols + 1);
            const cellH = bh / (rows + 1);
            for (let c = 0; c < cols; c++) {
              for (let r = 0; r < rows; r++) {
                if (((seed + i + c * 3 + r) % 5) === 0) continue;
                ctx.globalAlpha = 0.25 + ((seed + r) % 3) * 0.12;
                ctx.fillRect(x + cellW * (c + 0.45), yBase - bh + cellH * (r + 0.4), 3.5, 4.5);
              }
            }
          }
        };
        drawRow(8, 0.12, 0.22, H * 0.62, 70);
        drawRow(6, 0.28, 0.4, H * 0.7, 90);
        ctx.globalAlpha = 1;
      } else if (world === "space") {
        for (let i = 0; i < 28; i++) {
          const x = ((i * 53 + runX * 0.08 + seed) % (W + 20)) - 10;
          const y = (i * 37 + (seed % 40)) % (H * 0.7);
          ctx.globalAlpha = 0.25 + (i % 5) * 0.12;
          ctx.fillStyle = config.accent_color;
          ctx.beginPath();
          ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (world === "ocean") {
        for (let i = 0; i < 10; i++) {
          ctx.globalAlpha = 0.12;
          ctx.strokeStyle = config.accent_color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const y = 50 + i * 28 + Math.sin(runX * 0.02 + i) * 6;
          ctx.moveTo(0, y);
          for (let x = 0; x < W; x += 18) {
            ctx.lineTo(x, y + Math.sin(x * 0.04 + runX * 0.03 + i) * 7);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (world === "candy") {
        for (let i = 0; i < 8; i++) {
          const x = ((i * 80 + runX * 0.2 + seed) % (W + 60)) - 30;
          const y = 40 + ((seed + i * 19) % Math.floor(H * 0.45));
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = i % 2 ? config.player_color : config.accent_color;
          ctx.beginPath();
          ctx.arc(x, y, 10 + (i % 4) * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (world === "forest" || world === "temple") {
        for (let i = 0; i < 9; i++) {
          const x = ((i * 70 + runX * 0.25 + seed) % (W + 50)) - 25;
          const bh = 50 + ((seed + i * 9) % 80);
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = decor;
          ctx.beginPath();
          ctx.moveTo(x, H * 0.74);
          ctx.lineTo(x + 16, H * 0.74 - bh);
          ctx.lineTo(x + 32, H * 0.74);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else {
        for (let i = 0; i < 6; i++) {
          const x = ((i * 90 + runX * 0.18 + seed) % (W + 70)) - 35;
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = decor;
          roundRect(ctx, x, H * 0.22 + (i % 3) * 30, 40 + (i % 4) * 10, 16, 8);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // vignette
      const vig = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, H * 0.85);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.28)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    };

    const drawObstacleShape = (x: number, y: number, w: number, h: number) => {
      if (obstacleImg) {
        ctx.drawImage(obstacleImg, x, y, w, h);
        return;
      }
      const grd = ctx.createLinearGradient(x, y, x + w, y + h);
      grd.addColorStop(0, config.obstacle_color);
      grd.addColorStop(1, config.decor_color || config.obstacle_color);
      ctx.fillStyle = grd;
      if (style === "orbs") {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `${config.accent_color}99`;
        ctx.beginPath();
        ctx.arc(x + w * 0.38, y + h * 0.38, Math.min(w, h) * 0.16, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === "spikes") {
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        ctx.fill();
      } else {
        roundRect(ctx, x, y, w, h, style === "blocks" ? 7 : 5);
        ctx.fill();
        ctx.fillStyle = `${config.accent_color}33`;
        roundRect(ctx, x + 4, y + 4, w - 8, 6, 3);
        ctx.fill();
      }
    };

    const drawPlayer = (x: number, y: number, r = 18) => {
      if (fx === "trail" && state.started) {
        trails.push({ x, y, life: 0.35 });
      }
      for (let i = trails.length - 1; i >= 0; i--) {
        const t = trails[i];
        t.life -= 0.016;
        if (t.life <= 0) {
          trails.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = t.life;
        ctx.fillStyle = config.player_color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (fx === "glow") {
        ctx.shadowColor = config.player_color;
        ctx.shadowBlur = 22;
      }

      if (playerImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(playerImg, x - r - 2, y - r - 2, (r + 2) * 2, (r + 2) * 2);
        ctx.restore();
        ctx.strokeStyle = config.player_color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        return;
      }
      ctx.shadowBlur = 0;
      // contact shadow
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(x, y + r * 0.95, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = config.player_color;
      const shape =
        config.player_shape ||
        (config.genre === "roam" || config.genre === "runner" ? "hero" : "orb");
      const kick = Math.sin(runX * 0.12) * r * 0.18;
      if (shape === "hero") {
        ctx.fillStyle = config.obstacle_color;
        roundRect(ctx, x - r * 0.28 + kick, y + r * 0.15, r * 0.28, r * 0.7, 4);
        ctx.fill();
        roundRect(ctx, x + r * 0.02 - kick, y + r * 0.15, r * 0.28, r * 0.7, 4);
        ctx.fill();
        ctx.fillStyle = config.player_color;
        roundRect(ctx, x - r * 0.55, y - r * 1.05, r * 1.1, r * 1.35, 8);
        ctx.fill();
        ctx.fillStyle = config.accent_color;
        ctx.beginPath();
        ctx.arc(x, y - r * 1.22, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a1420";
        ctx.beginPath();
        ctx.arc(x - r * 0.12, y - r * 1.26, r * 0.08, 0, Math.PI * 2);
        ctx.arc(x + r * 0.16, y - r * 1.26, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === "car") {
        roundRect(ctx, x - r * 1.15, y - r * 0.5, r * 2.3, r * 0.95, 6);
        ctx.fill();
        ctx.fillStyle = "#141820";
        roundRect(ctx, x - r * 0.5, y - r * 0.38, r, r * 0.42, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - r * 0.7, y + r * 0.42, r * 0.28, 0, Math.PI * 2);
        ctx.arc(x + r * 0.7, y + r * 0.42, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const rad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 2, x, y, r);
        rad.addColorStop(0, config.accent_color);
        rad.addColorStop(0.35, config.player_color);
        rad.addColorStop(1, config.obstacle_color);
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `${config.accent_color}aa`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    const drawHudOverlay = () => {
      const { score, timeLeft, over, started, lives } = state;
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(10,12,18,0.45)";
      roundRect(ctx, 12, 12, 92, 36, 12);
      ctx.fill();
      roundRect(ctx, W - 104, 12, 92, 36, 12);
      ctx.fill();
      ctx.fillStyle = config.accent_color;
      ctx.font = "800 16px system-ui, sans-serif";
      ctx.fillText(`❤ ${lives}`, 24, 36);
      ctx.textAlign = "right";
      ctx.fillText(`${Math.ceil(Math.max(0, timeLeft))}s`, W - 24, 36);
      ctx.textAlign = "center";
      ctx.font = hudMinimal ? "800 28px system-ui, sans-serif" : "800 36px system-ui, sans-serif";
      ctx.fillText(String(score), W / 2, 40);

      if (!started && !over) {
        ctx.fillStyle = "rgba(8,10,16,0.55)";
        roundRect(ctx, 24, H * 0.38, W - 48, 64, 16);
        ctx.fill();
        ctx.fillStyle = config.accent_color;
        ctx.font = "800 15px system-ui, sans-serif";
        ctx.fillText(config.title, W / 2, H * 0.38 + 26);
        ctx.font = "600 12px system-ui, sans-serif";
        ctx.globalAlpha = 0.9;
        ctx.fillText(config.instruction, W / 2, H * 0.38 + 48);
        ctx.globalAlpha = 1;
      }

      if (over) {
        ctx.fillStyle = "rgba(8,10,16,0.62)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = config.accent_color;
        ctx.font = "800 28px system-ui, sans-serif";
        ctx.fillText(lives <= 0 ? "Game over" : "Time’s up", W / 2, H * 0.44);
        ctx.font = "700 14px system-ui, sans-serif";
        ctx.fillText(`${config.title} · ${score} pts · tap to replay`, W / 2, H * 0.52);
      }
    };

    const tickFlappy = (dt: number) => {
      if (state.started) {
        if (feel.hold_flap && holding) vy = jump * 0.62 * gravSign;
        vy += gravity * 60 * dt * gravSign;
        playerY += vy * 60 * dt * 0.16;
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          pipes.push({
            x: W + 20,
            gapY: H * (0.28 + Math.random() * 0.4),
            gapH: H * (0.22 / config.speed),
            osc: Math.random() * Math.PI * 2,
          });
          spawnTimer = 1.35 / config.speed;
        }
        for (const p of pipes) {
          p.x -= speed * 60 * dt * (dashT > 0 ? 1.45 : 1);
          if (feel.moving_gaps) {
            p.osc = (p.osc || 0) + dt * 2.2;
            p.gapY = clamp(p.gapY + Math.sin(p.osc) * 28 * dt, H * 0.22, H * 0.72);
          }
        }
        pipes = pipes.filter((p) => p.x > -60);
        for (const p of pipes) {
          const inX = playerX > p.x - 18 && playerX < p.x + 44;
          const inGap = playerY > p.gapY - p.gapH / 2 && playerY < p.gapY + p.gapH / 2;
          if (inX && !inGap) fail();
          if (!p.scored && p.x + 44 < playerX) {
            p.scored = true;
            bumpScore(1);
          }
        }
        if (playerY > H - 30 || playerY < 20) fail();
      }

      // draw pipes / styled obstacles
      for (const p of pipes) {
        const topH = p.gapY - p.gapH / 2;
        const botY = p.gapY + p.gapH / 2;
        if (style === "pipes" || style === "blocks") {
          drawObstacleShape(p.x, 0, 44, topH);
          drawObstacleShape(p.x, botY, 44, H - botY);
        } else {
          drawObstacleShape(p.x, topH - 36, 44, 36);
          drawObstacleShape(p.x, botY, 44, 36);
        }
      }
      drawPlayer(playerX, playerY, playerR);
    };

    const tickRunner = (dt: number) => {
      groundY = H * 0.78;
      const useLanes = (config.lanes || 1) === 3;
      const laneXs = [W * 0.22, W * 0.5, W * 0.78];

      if (useLanes) {
        const targetX = laneXs[lane] ?? W * 0.5;
        playerX += (targetX - playerX) * Math.min(1, 14 * dt);
      }

      if (state.started) {
        runX += speed * 60 * dt * (dashT > 0 ? 1.5 : 1);
        vy += gravity * 70 * dt * gravSign;
        playerY += vy * 60 * dt * 0.16;
        if (playerY > groundY) {
          playerY = groundY;
          airJumps = 0;
          vy = feel.bounce ? jump * 0.45 * gravSign : 0;
        }
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          if (useLanes) {
            const laneId = Math.floor(Math.random() * 3);
            obstacles.push({
              x: laneXs[laneId] - 18,
              y: -40,
              w: 36,
              h: 36,
              lane: laneId,
            });
          } else {
            obstacles.push({
              x: W + 30,
              y: groundY - (28 + Math.random() * 26),
              w: 28 + Math.random() * 24,
              h: 28 + Math.random() * 34,
            });
          }
          spawnTimer = (useLanes ? 0.85 : 1.1) / config.speed;
        }

        for (const o of obstacles) {
          if (useLanes) {
            o.y += speed * 220 * dt;
            const progress = Math.min(1, o.y / groundY);
            o.w = 28 + progress * 18;
            o.h = 28 + progress * 18;
            o.x = (laneXs[o.lane ?? 1] ?? W * 0.5) - o.w / 2;
          } else {
            o.x -= speed * 70 * dt;
          }
        }
        obstacles = obstacles.filter((o) => (useLanes ? o.y < H + 60 : o.x > -80));

        for (const o of obstacles) {
          const hit =
            playerX + 14 > o.x &&
            playerX - 14 < o.x + o.w &&
            playerY + 14 > o.y &&
            playerY - 14 < o.y + o.h;
          // In lane mode, jumping clears low obstacles
          const jumpedOver = useLanes && playerY < groundY - 28 && o.h < 50;
          if (hit && !jumpedOver) fail();
          if (!o.scored && (useLanes ? o.y > playerY + 20 : o.x + o.w < playerX)) {
            o.scored = true;
            bumpScore(1);
          }
        }
      }

      // ground / lanes
      ctx.fillStyle = config.ground_color || "rgba(255,255,255,0.12)";
      ctx.fillRect(0, groundY + 16, W, H);
      if (useLanes) {
        ctx.strokeStyle = config.accent_color;
        ctx.globalAlpha = 0.25;
        for (const lx of laneXs) {
          ctx.beginPath();
          ctx.moveTo(lx, 40);
          ctx.lineTo(lx, groundY + 16);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // track trapezoid vibe
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.moveTo(W * 0.35, 50);
        ctx.lineTo(W * 0.65, 50);
        ctx.lineTo(W * 0.92, groundY + 16);
        ctx.lineTo(W * 0.08, groundY + 16);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = config.accent_color;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(0, groundY + 16);
        ctx.lineTo(W, groundY + 16);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      for (const o of obstacles) {
        drawObstacleShape(o.x, o.y, o.w, o.h);
      }
      drawPlayer(playerX, playerY, playerR);
    };

    const tickRoam = (dt: number) => {
      groundY = H * 0.74;
      if (!state.started) {
        playerY = groundY;
        playerX = W * 0.5;
      }

      // perspective street
      ctx.fillStyle = config.ground_color || "rgba(40,44,52,0.85)";
      ctx.beginPath();
      ctx.moveTo(W * 0.42, H * 0.38);
      ctx.lineTo(W * 0.58, H * 0.38);
      ctx.lineTo(W * 1.05, H);
      ctx.lineTo(-W * 0.05, H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = config.accent_color;
      ctx.globalAlpha = 0.35;
      ctx.setLineDash([12, 16]);
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.4);
      ctx.lineTo(W * 0.5, H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      if (state.started) {
        runX += speed * 80 * dt * (dashT > 0 ? 1.4 : 1);
        vy += gravity * 70 * dt;
        playerY += vy * 60 * dt * 0.16;
        if (playerY > groundY) {
          playerY = groundY;
          airJumps = 0;
          vy = feel.bounce ? jump * 0.4 : 0;
        }
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          const loot = Math.random() < 0.42;
          obstacles.push({
            x: W * (0.22 + Math.random() * 0.56) - 16,
            y: -30,
            w: loot ? 22 : 34,
            h: loot ? 22 : 28,
            lane: loot ? 1 : 0,
          });
          spawnTimer = 0.7 / config.speed;
        }
        for (const o of obstacles) {
          o.y += speed * 210 * dt;
          if (feel.magnet && o.lane === 1) {
            o.x += (playerX - (o.x + o.w / 2)) * 2.2 * dt;
          }
          if (feel.homing && o.lane !== 1) {
            o.x += (playerX - (o.x + o.w / 2)) * 1.1 * dt;
          }
          const p = Math.min(1, o.y / groundY);
          o.w = (o.lane === 1 ? 16 : 24) + p * 18;
          o.h = (o.lane === 1 ? 16 : 22) + p * 16;
        }
        obstacles = obstacles.filter((o) => o.y < H + 50);
        for (const o of obstacles) {
          const hit =
            playerX + 14 > o.x &&
            playerX - 14 < o.x + o.w &&
            playerY + 16 > o.y &&
            playerY - 8 < o.y + o.h;
          const jumped = playerY < groundY - 26;
          if (!hit) continue;
          if (o.lane === 1) {
            if (!o.scored) {
              o.scored = true;
              bumpScore(1);
            }
          } else if (!jumped) fail();
        }
        obstacles = obstacles.filter((o) => !(o.lane === 1 && o.scored));
      }

      for (const o of obstacles) {
        if (o.lane === 1) {
          ctx.fillStyle = config.player_color;
          ctx.globalAlpha = 0.95;
          roundRect(ctx, o.x, o.y, o.w, o.h, 4);
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          drawObstacleShape(o.x, o.y, o.w, o.h);
        }
      }

      // jump pad hint
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.arc(W * 0.86, H * 0.82, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = config.accent_color;
      ctx.font = "800 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("JUMP", W * 0.86, H * 0.82 + 4);

      drawPlayer(playerX, playerY, playerR);
    };

    const tickDodge = (dt: number) => {
      playerY = H * 0.78;
      if (state.started) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          const fromSide = feel.sides && Math.random() < 0.45;
          fallers.push({
            x: fromSide ? (Math.random() < 0.5 ? -20 : W + 20) : 40 + Math.random() * (W - 80),
            y: fromSide ? 80 + Math.random() * (H * 0.5) : -20,
            r: 14 + Math.random() * 10,
            vy: fromSide ? (40 + Math.random() * 40) * config.speed : (180 + Math.random() * 140) * config.speed,
            vx: fromSide ? (Math.random() < 0.5 ? 160 : -160) * config.speed : 0,
            bad: true,
          });
          spawnTimer = 0.55 / config.speed;
        }
        for (const f of fallers) {
          f.y += f.vy * dt;
          f.x += (f.vx || 0) * dt;
          if (feel.homing) f.x += (playerX - f.x) * 1.4 * dt;
        }
        for (const f of fallers) {
          const dx = f.x - playerX;
          const dy = f.y - playerY;
          if (dx * dx + dy * dy < (f.r + 16) * (f.r + 16)) fail();
        }
        const before = fallers.length;
        fallers = fallers.filter((f) => f.y < H + 40);
        if (fallers.length < before) bumpScore(before - fallers.length);
      }
      for (const f of fallers) {
        ctx.fillStyle = config.obstacle_color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      drawPlayer(playerX, playerY, playerR);
    };

    const tickCatch = (dt: number) => {
      playerY = H * 0.8;
      if (state.started) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          const bad = Math.random() < 0.28;
          const fromSide = feel.sides && Math.random() < 0.35;
          fallers.push({
            x: fromSide ? (Math.random() < 0.5 ? -16 : W + 16) : 36 + Math.random() * (W - 72),
            y: fromSide ? 60 + Math.random() * (H * 0.4) : -24,
            r: 12 + Math.random() * 8,
            vy: (160 + Math.random() * 120) * config.speed,
            vx: fromSide ? (Math.random() < 0.5 ? 140 : -140) * config.speed : 0,
            bad,
          });
          spawnTimer = 0.7 / config.speed;
        }
        for (const f of fallers) {
          f.y += f.vy * dt;
          f.x += (f.vx || 0) * dt;
          if (feel.magnet && !f.bad) {
            f.x += (playerX - f.x) * 2.4 * dt;
            f.y += (playerY - f.y) * 0.6 * dt;
          }
          if (feel.homing && f.bad) f.x += (playerX - f.x) * 1.2 * dt;
        }
        const remain: Faller[] = [];
        for (const f of fallers) {
          const dx = f.x - playerX;
          const dy = f.y - playerY;
          if (dx * dx + dy * dy < (f.r + 18) * (f.r + 18)) {
            if (f.bad) fail();
            else bumpScore(1);
            continue;
          }
          if (f.y < H + 40) remain.push(f);
        }
        fallers = remain;
      }
      for (const f of fallers) {
        ctx.fillStyle = f.bad ? config.obstacle_color : config.player_color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // basket
      ctx.fillStyle = config.accent_color;
      ctx.globalAlpha = 0.9;
      roundRect(ctx, playerX - 28, playerY - 8, 56, 18, 8);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const tickTap = (dt: number) => {
      if (state.started) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          const bad = Math.random() < 0.2;
          targets.push({
            x: 50 + Math.random() * (W - 100),
            y: 80 + Math.random() * (H - 220),
            r: 22 + Math.random() * 10,
            life: 1.35 / config.speed,
            max: 1.35 / config.speed,
            bad,
          });
          spawnTimer = 0.55 / config.speed;
        }
        for (const t of targets) t.life -= dt;
        const before = targets.length;
        targets = targets.filter((t) => t.life > 0);
        // missed good targets
        if (targets.length < before) {
          /* ignore */
        }
      }
      for (const t of targets) {
        const a = Math.max(0.25, t.life / t.max);
        ctx.globalAlpha = a;
        ctx.fillStyle = t.bad ? config.obstacle_color : config.player_color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = config.accent_color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r + 4, 0, Math.PI * 2 * (t.life / t.max));
        ctx.stroke();
      }
    };

    const frame = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (dashT > 0) dashT = Math.max(0, dashT - dt);
      if (playing && state.started && !state.over) {
        state.timeLeft -= dt;
        if (state.timeLeft <= 0) {
          state.timeLeft = 0;
          endGame();
        }
      }

      if (shake > 0) shake = Math.max(0, shake - 40 * dt);
      if (flash > 0) flash = Math.max(0, flash - dt);

      ctx.save();
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }

      drawBackground();

      if (playing || state.started) {
        switch (config.genre) {
          case "flappy":
            tickFlappy(dt);
            break;
          case "runner":
            tickRunner(dt);
            break;
          case "roam":
            tickRoam(dt);
            break;
          case "dodge":
            tickDodge(dt);
            break;
          case "catch":
            tickCatch(dt);
            break;
          case "tap":
            tickTap(dt);
            break;
        }
      } else {
        // idle preview motion
        drawPlayer(W * 0.5, H * 0.48 + Math.sin(now / 350) * 10, 18);
      }

      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.45})`;
        ctx.fillRect(0, 0, W, H);
      }

      drawHudOverlay();
      ctx.restore();

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      canvas.removeEventListener("pointermove", pointerMove);
      ro.disconnect();
      if (audio) {
        audio.pause();
        audio.src = "";
        audio = null;
      }
    };
  }, [config, playing]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        style={{ touchAction: "none" }}
        aria-label={`${config.title} playable game`}
      />
    </div>
  );
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

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
type Pipe = { x: number; gapY: number; gapH: number; scored?: boolean };
type Obstacle = { x: number; y: number; w: number; h: number; scored?: boolean; lane?: number };
type Faller = { x: number; y: number; r: number; vy: number; bad: boolean };

/**
 * Real short-form canvas games (flappy / runner / dodge / catch / tap).
 * Config comes from prompt generation and is stored on the game row.
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
      playerX = config.genre === "flappy" ? W * 0.28 : W * 0.22;
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
      }
    };

    resetRound(false);

    const bumpScore = (n = 1) => {
      state.score += n;
      if (sfxOn) kairosSfx.score();
    };

    const fail = () => {
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

      if (config.genre === "flappy") {
        vy = jump;
        if (sfxOn) kairosSfx.flap();
      } else if (config.genre === "runner" && (config.lanes || 1) === 3) {
        const third = W / 3;
        if (x < third) {
          lane = Math.max(0, lane - 1);
          if (sfxOn) kairosSfx.tap();
        } else if (x > third * 2) {
          lane = Math.min(2, lane + 1);
          if (sfxOn) kairosSfx.tap();
        } else if (playerY >= groundY - 2) {
          vy = jump * 1.15;
          if (sfxOn) kairosSfx.flap();
        }
      } else if (config.genre === "runner") {
        if (playerY >= groundY - 2) {
          vy = jump * 1.15;
          if (sfxOn) kairosSfx.flap();
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
      onPointer(e.clientX, e.clientY);
    };
    const pointerMove = (e: PointerEvent) => {
      if (!useDrag || !state.started || state.over || !playing) return;
      if (e.buttons === 0 && e.pointerType === "mouse") return;
      const rect = canvas.getBoundingClientRect();
      playerX = Math.max(28, Math.min(W - 28, e.clientX - rect.left));
    };
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);

    const drawBackground = () => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, config.bg_top);
      g.addColorStop(1, config.bg_bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      if (bgImg) {
        ctx.globalAlpha = 0.55;
        // cover
        const scale = Math.max(W / bgImg.width, H / bgImg.height);
        const dw = bgImg.width * scale;
        const dh = bgImg.height * scale;
        ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(8,14,28,0.35)";
        ctx.fillRect(0, 0, W, H);
      } else {
        // floating decor
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = config.obstacle_color;
        for (let i = 0; i < 5; i++) {
          const x = ((i * 97 + runX * 0.2) % (W + 80)) - 40;
          const y = (i * 73) % (H * 0.7);
          ctx.fillRect(x, y, 18 + (i % 3) * 10, 70 + (i % 4) * 20);
        }
        ctx.globalAlpha = 1;
      }
    };

    const drawObstacleShape = (x: number, y: number, w: number, h: number) => {
      if (obstacleImg) {
        ctx.drawImage(obstacleImg, x, y, w, h);
        return;
      }
      ctx.fillStyle = config.obstacle_color;
      if (style === "orbs") {
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === "spikes") {
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.closePath();
        ctx.fill();
      } else {
        roundRect(ctx, x, y, w, h, style === "blocks" ? 6 : 4);
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
      ctx.fillStyle = config.player_color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0e1621";
      ctx.beginPath();
      ctx.arc(x + r * 0.25, y - r * 0.15, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawHudOverlay = () => {
      const { score, timeLeft, over, started, lives } = state;
      const size = hudMinimal ? Math.floor(W * 0.1) : Math.floor(W * 0.14);
      ctx.fillStyle = config.accent_color;
      ctx.font = `800 ${size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(String(score), W / 2, H * 0.16);

      ctx.font = `700 12px system-ui, sans-serif`;
      ctx.globalAlpha = 0.85;
      ctx.fillText(
        `${Math.ceil(Math.max(0, timeLeft))}s · ❤ ${lives}`,
        W / 2,
        H * 0.21
      );
      ctx.globalAlpha = 1;

      if (!started && !over) {
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        roundRect(ctx, W / 2 - 110, H * 0.42, 220, 36, 12);
        ctx.fill();
        ctx.fillStyle = config.accent_color;
        ctx.font = "700 13px system-ui, sans-serif";
        ctx.fillText(config.instruction, W / 2, H * 0.42 + 23);
      }

      if (over) {
        ctx.fillStyle = "rgba(14,22,33,0.55)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = config.accent_color;
        ctx.font = "800 28px system-ui, sans-serif";
        ctx.fillText(lives <= 0 ? "Out of lives" : "Time’s up", W / 2, H * 0.44);
        ctx.font = "700 14px system-ui, sans-serif";
        ctx.fillText(`Score ${score} · tap to replay`, W / 2, H * 0.5);
      }
    };

    const tickFlappy = (dt: number) => {
      if (state.started) {
        vy += gravity * 60 * dt;
        playerY += vy * 60 * dt * 0.16;
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          pipes.push({
            x: W + 20,
            gapY: H * (0.28 + Math.random() * 0.4),
            gapH: H * (0.22 / config.speed),
          });
          spawnTimer = 1.35 / config.speed;
        }
        for (const p of pipes) p.x -= speed * 60 * dt;
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
      drawPlayer(playerX, playerY, 17);
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
        runX += speed * 60 * dt;
        vy += gravity * 70 * dt;
        playerY += vy * 60 * dt * 0.16;
        if (playerY > groundY) {
          playerY = groundY;
          vy = 0;
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
      ctx.fillStyle = "rgba(255,255,255,0.12)";
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
      drawPlayer(playerX, playerY, 16);
    };

    const tickDodge = (dt: number) => {
      playerY = H * 0.78;
      if (state.started) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          fallers.push({
            x: 40 + Math.random() * (W - 80),
            y: -20,
            r: 14 + Math.random() * 10,
            vy: (180 + Math.random() * 140) * config.speed,
            bad: true,
          });
          spawnTimer = 0.55 / config.speed;
        }
        for (const f of fallers) f.y += f.vy * dt;
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
      drawPlayer(playerX, playerY, 18);
    };

    const tickCatch = (dt: number) => {
      playerY = H * 0.8;
      if (state.started) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          const bad = Math.random() < 0.28;
          fallers.push({
            x: 36 + Math.random() * (W - 72),
            y: -24,
            r: 12 + Math.random() * 8,
            vy: (160 + Math.random() * 120) * config.speed,
            bad,
          });
          spawnTimer = 0.7 / config.speed;
        }
        for (const f of fallers) f.y += f.vy * dt;
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

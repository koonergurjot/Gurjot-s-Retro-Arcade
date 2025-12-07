import { CanvasGameDefinition, GameState, InputState, Difficulty, Particle } from '../types';

// --- UTILS ---
const rectIntersect = (r1: any, r2: any) => !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
const getDiffVal = (d: Difficulty, e: number, m: number, h: number) => d === 'Easy' ? e : (d === 'Hard' ? h : m);
const createParticles = (x: number, y: number, color: string, count: number = 10, speed: number = 2): Particle[] => {
  return Array(count).fill(0).map(() => ({
    x, y,
    vx: (Math.random() - 0.5) * speed * 2,
    vy: (Math.random() - 0.5) * speed * 2,
    life: 1.0,
    color,
    size: Math.random() * 3 + 1
  }));
};
const updateParticles = (particles: Particle[]) => {
  // Filter out dead particles
  return particles.map(p => { 
      p.x += p.vx; 
      p.y += p.vy; 
      p.life -= 0.02; 
      return p; 
  }).filter(p => p.life > 0);
};
const drawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1.0;
};

// --- 1. PONG DELUXE ---
export const PongGame: CanvasGameDefinition = {
  init: (d) => ({
    p1y: 200, p2y: 200, bx: 240, by: 240, 
    bvx: getDiffVal(d, 4, 6, 9) * (Math.random() > 0.5 ? 1 : -1), 
    bvy: getDiffVal(d, 2, 4, 6) * (Math.random() > 0.5 ? 1 : -1), 
    score: 0, aiScore: 0, paddleH: 60, paddleW: 10,
    aiSpeed: getDiffVal(d, 0.06, 0.1, 0.25),
    aiOffset: 0, // Stability for AI
    particles: []
  }),
  update: (s, input, w, h) => {
    // Player movement
    if (input.keys['ArrowUp']) s.p1y -= 7;
    if (input.keys['ArrowDown']) s.p1y += 7;
    s.p1y = Math.max(0, Math.min(h - s.paddleH, s.p1y));

    // AI Logic - Update offset only occasionally to prevent jitter
    if (Math.random() < 0.02) s.aiOffset = (Math.random() * 40) - 20;
    
    // AI Chase
    const target = s.by - s.paddleH / 2 + s.aiOffset; 
    s.p2y += (target - s.p2y) * s.aiSpeed;
    s.p2y = Math.max(0, Math.min(h - s.paddleH, s.p2y));

    // Ball Physics
    s.bx += s.bvx;
    s.by += s.bvy;

    // Walls
    if (s.by <= 0 || s.by >= h) {
        s.bvy *= -1;
        s.particles.push(...createParticles(s.bx, s.by < h/2 ? 0 : h, '#fff', 5));
    }

    // Paddles Collision
    // Player Hit
    if (s.bx <= 20 && s.bx >= 10 && s.by >= s.p1y && s.by <= s.p1y + s.paddleH) { 
        s.bvx = Math.abs(s.bvx) + 0.5; 
        s.bx = 20; 
        const hitPoint = s.by - (s.p1y + s.paddleH/2);
        s.bvy = hitPoint * 0.3;
        s.score++; 
        s.particles.push(...createParticles(s.bx, s.by, '#facc15', 15));
    }
    // AI Hit
    if (s.bx >= w - 20 && s.bx <= w - 10 && s.by >= s.p2y && s.by <= s.p2y + s.paddleH) { 
        s.bvx = -Math.abs(s.bvx) - 0.5; 
        s.bx = w - 20;
        s.particles.push(...createParticles(s.bx, s.by, '#ef4444', 15));
    }

    // Scoring
    if (s.bx < 0) return { ...s, gameOver: true }; 
    if (s.bx > w) { 
        s.bx = w/2; s.by = h/2; 
        s.bvx = -4; s.bvy = (Math.random()-0.5)*4;
        s.aiScore++; 
        s.particles.push(...createParticles(w, s.by, '#ef4444', 30));
    }

    s.particles = updateParticles(s.particles);
    return { ...s };
  },
  draw: (ctx, s, w, h) => {
    // Net
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke(); ctx.setLineDash([]);

    drawParticles(ctx, s.particles);

    // Paddles
    ctx.fillStyle = '#facc15'; ctx.shadowBlur = 10; ctx.shadowColor = '#facc15';
    ctx.fillRect(10, s.p1y, s.paddleW, s.paddleH);
    ctx.fillStyle = '#ef4444'; ctx.shadowColor = '#ef4444';
    ctx.fillRect(w - 20, s.p2y, s.paddleW, s.paddleH);
    
    // Ball
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
    ctx.beginPath(); ctx.arc(s.bx, s.by, 6, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

    // Score
    ctx.font = '30px "Press Start 2P"'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'center'; ctx.fillText(`${s.score}`, w/2 - 60, 80); ctx.fillText(`${s.aiScore}`, w/2 + 60, 80);
  },
  getScore: (s) => s.score,
  isGameOver: (s) => !!s.gameOver
};

// --- 2. SNAKE EVOLVED ---
export const SnakeGame: CanvasGameDefinition = {
  init: (d) => ({ 
    snake: [{x: 10, y: 10}, {x:9, y:10}, {x:8, y:10}], 
    dir: {x: 1, y: 0}, 
    nextDir: {x: 1, y: 0},
    food: {x: 15, y: 10, type: 'normal'}, 
    score: 0, gridSize: 20, timer: 0,
    speedDelay: getDiffVal(d, 8, 6, 4),
    particles: []
  }),
  update: (s, input, w, h) => {
    const gridW = w / s.gridSize;
    const gridH = h / s.gridSize;

    if (input.keys['ArrowUp'] && s.dir.y === 0) s.nextDir = {x: 0, y: -1};
    if (input.keys['ArrowDown'] && s.dir.y === 0) s.nextDir = {x: 0, y: 1};
    if (input.keys['ArrowLeft'] && s.dir.x === 0) s.nextDir = {x: -1, y: 0};
    if (input.keys['ArrowRight'] && s.dir.x === 0) s.nextDir = {x: 1, y: 0};

    s.particles = updateParticles(s.particles);

    if (s.timer++ < s.speedDelay) return s; 
    s.timer = 0;
    s.dir = s.nextDir;

    const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
    
    // Walls
    if (head.x < 0 || head.x >= gridW || head.y < 0 || head.y >= gridH) return { ...s, gameOver: true };
    // Self collision
    if (s.snake.some((seg: any) => seg.x === head.x && seg.y === head.y)) return { ...s, gameOver: true };

    const newSnake = [head, ...s.snake];
    
    // Eat Food
    if (head.x === s.food.x && head.y === s.food.y) {
      const points = s.food.type === 'gold' ? 5 : 1;
      s.score += points;
      s.particles.push(...createParticles(head.x * s.gridSize + 10, head.y * s.gridSize + 10, s.food.type === 'gold' ? '#fbbf24' : '#ef4444', 10));
      
      if (s.score % 5 === 0 && s.speedDelay > 2) s.speedDelay--;

      // Respawn Food
      let type = Math.random() > 0.9 ? 'gold' : 'normal';
      s.food = { 
        x: Math.floor(Math.random() * gridW), 
        y: Math.floor(Math.random() * gridH),
        type 
      };
      // Don't spawn on snake
      while (newSnake.some((seg:any) => seg.x === s.food.x && seg.y === s.food.y)) {
          s.food.x = Math.floor(Math.random() * gridW);
          s.food.y = Math.floor(Math.random() * gridH);
      }
    } else {
      newSnake.pop();
    }
    return { ...s, snake: newSnake };
  },
  draw: (ctx, s, w, h) => {
    // Grid
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
    for(let i=0; i<w; i+=s.gridSize) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,h); ctx.stroke(); }
    for(let i=0; i<h; i+=s.gridSize) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(w,i); ctx.stroke(); }

    drawParticles(ctx, s.particles);

    // Snake
    s.snake.forEach((seg: any, i: number) => {
        ctx.fillStyle = i === 0 ? '#4ade80' : '#22c55e'; // Head brighter
        ctx.fillRect(seg.x * s.gridSize + 1, seg.y * s.gridSize + 1, s.gridSize - 2, s.gridSize - 2);
        if (i===0) {
            ctx.fillStyle='#000'; 
            ctx.fillRect(seg.x*s.gridSize + 5, seg.y*s.gridSize + 5, 4,4);
            ctx.fillRect(seg.x*s.gridSize + 12, seg.y*s.gridSize + 5, 4,4);
        }
    });

    // Food
    ctx.fillStyle = s.food.type === 'gold' ? '#fbbf24' : '#ef4444';
    ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;
    if (s.food.type === 'gold') {
        ctx.beginPath(); ctx.arc(s.food.x * s.gridSize + 10, s.food.y * s.gridSize + 10, 8, 0, Math.PI*2); ctx.fill();
    } else {
        ctx.fillRect(s.food.x * s.gridSize + 4, s.food.y * s.gridSize + 4, s.gridSize - 8, s.gridSize - 8);
    }
    ctx.shadowBlur = 0;
  },
  getScore: (s) => s.score,
  isGameOver: (s) => !!s.gameOver
};

// --- 3. BREAKOUT EXTREME ---
export const BreakoutGame: CanvasGameDefinition = {
  init: (d) => {
    const bricks = [];
    const rows = getDiffVal(d, 4, 6, 8);
    const cols = 8;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            const hp = r < 2 && d === 'Hard' ? 2 : 1;
            // Align brick width/height with draw rect (48x14) + padding
            bricks.push({x: c*60 + 35, y: r*20 + 40, w: 48, h: 14, status: 1, color: colors[r % colors.length], hp, maxHp: hp});
        }
    }
    return { 
      paddleX: 200, 
      balls: [{x: 240, y: 300, dx: getDiffVal(d, 4, 5, 7), dy: -4, active: true, r: 5}], 
      bricks, score: 0,
      paddleW: getDiffVal(d, 100, 80, 60),
      powerups: [],
      particles: [] 
    };
  },
  update: (s, input, w, h) => {
    // Paddle
    if (input.keys['ArrowLeft']) s.paddleX -= 8;
    if (input.keys['ArrowRight']) s.paddleX += 8;
    s.paddleX = Math.max(0, Math.min(w - s.paddleW, s.paddleX));

    // Powerups
    s.powerups.forEach((p:any) => p.y += 2);
    s.powerups = s.powerups.filter((p:any) => {
        if (p.y > h) return false;
        if (rectIntersect({x:p.x, y:p.y, w:16, h:16}, {x:s.paddleX, y:h-20, w:s.paddleW, h:10})) {
            if (p.type === 'wide') s.paddleW = Math.min(200, s.paddleW + 20);
            if (p.type === 'multi') s.balls.push({x:s.paddleX + s.paddleW/2, y:h-40, dx: 4, dy: -4, active:true, r:5});
            s.score += 50;
            return false;
        }
        return true;
    });

    // Balls
    s.balls.forEach((ball:any) => {
        if (!ball.active) return;
        ball.x += ball.dx; ball.y += ball.dy;

        // Walls
        if (ball.x < 0 || ball.x > w) ball.dx *= -1;
        if (ball.y < 0) ball.dy *= -1;
        if (ball.y > h) ball.active = false;

        // Paddle Collision
        if (ball.y > h - 25 && ball.x > s.paddleX && ball.x < s.paddleX + s.paddleW && ball.dy > 0) {
            ball.dy = -Math.abs(ball.dy);
            let hitPos = (ball.x - (s.paddleX + s.paddleW/2)) / (s.paddleW/2);
            ball.dx = hitPos * 7; 
            s.particles.push(...createParticles(ball.x, h-20, '#3b82f6', 5));
        }

        // Brick Collision
        // Use a standard rect check for consistency
        for (let b of s.bricks) {
            if (b.status === 1) {
                if (rectIntersect({x:ball.x-5, y:ball.y-5, w:10, h:10}, {x:b.x, y:b.y, w:b.w, h:b.h})) {
                    ball.dy *= -1; 
                    b.hp--;
                    if (b.hp <= 0) {
                        b.status = 0; 
                        s.score += 10 * b.maxHp;
                        s.particles.push(...createParticles(b.x + 25, b.y + 7, b.color, 8));
                        if (Math.random() < 0.1) s.powerups.push({x: b.x+25, y: b.y, type: Math.random()>0.5 ? 'wide':'multi'});
                    } else {
                        s.particles.push(...createParticles(b.x + 25, b.y + 7, '#fff', 3));
                    }
                    break; 
                }
            }
        }
    });
    
    s.balls = s.balls.filter((b:any) => b.active);
    if (s.balls.length === 0) return { ...s, gameOver: true };

    if (s.bricks.every((b:any) => b.status === 0)) { s.score += 1000; return { ...s, gameOver: true }; }

    s.particles = updateParticles(s.particles);
    return { ...s };
  },
  draw: (ctx, s, w, h) => {
    drawParticles(ctx, s.particles);

    // Paddle
    ctx.fillStyle = '#3b82f6'; 
    ctx.shadowBlur = 10; ctx.shadowColor = '#3b82f6';
    ctx.fillRect(s.paddleX, h-15, s.paddleW, 10); ctx.shadowBlur = 0;

    // Balls
    ctx.fillStyle = '#fff'; 
    s.balls.forEach((b:any) => { ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI*2); ctx.fill(); });

    // Bricks
    s.bricks.forEach((b: any) => {
      if(b.status){ 
          ctx.fillStyle = b.hp === 2 ? '#9ca3af' : b.color;
          if (b.hp === 2) ctx.strokeStyle = b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h); 
          if (b.hp === 2) ctx.strokeRect(b.x, b.y, b.w, b.h);
      }
    });

    // Powerups
    s.powerups.forEach((p:any) => {
        ctx.fillStyle = p.type === 'wide' ? '#4ade80' : '#f472b6';
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
        ctx.fillText(p.type === 'wide' ? 'W' : 'M', p.x, p.y+3);
    });
  },
  getScore: (s) => s.score,
  isGameOver: (s) => !!s.gameOver
};

// --- 4. SPACE SHOOTER BOSS EDITION ---
export const SpaceShooter: CanvasGameDefinition = {
  init: (d) => ({ 
    playerX: 200, bullets: [], enemies: [], 
    enemyBullets: [],
    stars: Array(60).fill(0).map(() => ({x: Math.random()*480, y: Math.random()*480, s: Math.random()*2, alpha: Math.random()})),
    score: 0, spawnTimer: 0, frame: 0,
    spawnRate: getDiffVal(d, 50, 40, 25),
    enemySpeed: getDiffVal(d, 2, 3, 5),
    particles: [],
    boss: null, 
    weaponLevel: 1
  }),
  update: (s, input, w, h) => {
    s.frame++;
    // Player
    if (input.keys['ArrowLeft']) s.playerX -= 5;
    if (input.keys['ArrowRight']) s.playerX += 5;
    s.playerX = Math.max(0, Math.min(w - 30, s.playerX));
    
    // Shooting
    if (input.keys[' '] && !s.fired) { 
        if (s.weaponLevel === 1) {
            s.bullets.push({x: s.playerX + 15, y: h-40});
        } else {
             s.bullets.push({x: s.playerX + 5, y: h-40}, {x: s.playerX + 25, y: h-40});
        }
        s.fired = true; 
    }
    if (!input.keys[' ']) s.fired = false;

    // Stars
    s.stars.forEach((st:any) => { st.y += st.s; if(st.y > h) st.y = 0; });

    // Boss Logic
    if (s.score > 0 && s.score % 500 === 0 && !s.boss) {
        s.boss = { x: w/2 - 40, y: -100, hp: 50, maxHp: 50, phase: 'enter' };
        s.enemies = []; // Clear
    }

    if (s.boss) {
        if (s.boss.phase === 'enter') {
            s.boss.y += 2;
            if (s.boss.y >= 50) s.boss.phase = 'fight';
        } else {
            s.boss.x += Math.sin(s.frame * 0.05) * 3;
            if (s.frame % 40 === 0) {
                s.enemyBullets.push({x: s.boss.x + 40, y: s.boss.y + 80, vx: -2, vy: 5});
                s.enemyBullets.push({x: s.boss.x + 40, y: s.boss.y + 80, vx: 2, vy: 5});
                s.enemyBullets.push({x: s.boss.x + 40, y: s.boss.y + 80, vx: 0, vy: 6});
            }
        }
    } else {
        if (s.spawnTimer++ > s.spawnRate) {
            s.enemies.push({x: Math.random() * (w-30), y: -20, speed: s.enemySpeed + s.score/200, type: Math.random()>0.8 ? 'shooter' : 'drone'});
            s.spawnTimer = 0;
        }
    }

    // Bullets
    s.bullets = s.bullets.filter((b: any) => b.y > 0);
    s.bullets.forEach((b: any) => b.y -= 10);

    // Enemy Bullets
    s.enemyBullets.forEach((b:any) => { b.x+=b.vx; b.y+=b.vy; });
    
    // Player Hit
    if (s.enemyBullets.some((b:any) => rectIntersect({x:b.x, y:b.y, w:6, h:6}, {x:s.playerX, y:h-40, w:30, h:30}))) {
        return { ...s, gameOver: true };
    }

    // Enemies
    s.enemies.forEach((e: any) => {
        e.y += e.speed;
        if (e.type === 'shooter' && Math.random() < 0.02) {
            s.enemyBullets.push({x: e.x + 15, y: e.y + 30, vx:0, vy: 5});
        }
    });

    // Collisions
    for (let i = s.enemies.length - 1; i >= 0; i--) {
        let e = s.enemies[i];
        if (e.y > h) return { ...s, gameOver: true };
        
        if (rectIntersect({x:e.x, y:e.y, w:30, h:30}, {x:s.playerX, y:h-40, w:30, h:30})) return { ...s, gameOver: true };

        for (let j = s.bullets.length - 1; j >= 0; j--) {
            let b = s.bullets[j];
            if (rectIntersect({x:b.x, y:b.y, w:4, h:10}, {x:e.x, y:e.y, w:30, h:30})) {
                s.enemies.splice(i, 1); s.bullets.splice(j, 1); 
                s.score += 10;
                s.particles.push(...createParticles(e.x+15, e.y+15, '#c026d3', 8));
                break;
            }
        }
    }

    // Boss Collision
    if (s.boss) {
        for (let j = s.bullets.length - 1; j >= 0; j--) {
            let b = s.bullets[j];
            if (rectIntersect({x:b.x, y:b.y, w:4, h:10}, {x:s.boss.x, y:s.boss.y, w:80, h:80})) {
                s.boss.hp--;
                s.bullets.splice(j, 1);
                s.particles.push(...createParticles(b.x, b.y, '#fca5a5', 3));
                if (s.boss.hp <= 0) {
                    s.score += 500;
                    s.particles.push(...createParticles(s.boss.x+40, s.boss.y+40, '#fca5a5', 50));
                    s.boss = null;
                    s.weaponLevel = 2; // Upgrade!
                }
            }
        }
    }

    s.particles = updateParticles(s.particles);
    return { ...s, bullets: s.bullets, enemies: s.enemies, enemyBullets: s.enemyBullets.filter((b:any) => b.y < h) };
  },
  draw: (ctx, s, w, h) => {
    s.stars.forEach((st:any) => { ctx.fillStyle = `rgba(255,255,255,${st.alpha})`; ctx.fillRect(st.x, st.y, st.s, st.s); });
    drawParticles(ctx, s.particles);

    // Ship
    ctx.fillStyle = '#0ea5e9'; 
    ctx.shadowBlur = 10; ctx.shadowColor = '#0ea5e9';
    ctx.beginPath(); ctx.moveTo(s.playerX+15, h-40); ctx.lineTo(s.playerX+30, h); ctx.lineTo(s.playerX, h); ctx.fill();
    ctx.shadowBlur = 0;

    // Bullets
    ctx.fillStyle = '#facc15'; s.bullets.forEach((b: any) => ctx.fillRect(b.x, b.y, 4, 10));
    ctx.fillStyle = '#ef4444'; s.enemyBullets.forEach((b: any) => { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI*2); ctx.fill(); });

    // Enemies
    s.enemies.forEach((e: any) => {
        ctx.fillStyle = e.type === 'shooter' ? '#ef4444' : '#c026d3';
        ctx.fillRect(e.x, e.y, 30, 30);
        ctx.fillStyle = '#000'; ctx.fillRect(e.x+5, e.y+10, 5, 5); ctx.fillRect(e.x+20, e.y+10, 5, 5);
    });

    // Boss
    if (s.boss) {
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(s.boss.x, s.boss.y, 80, 80);
        ctx.fillStyle = '#000'; ctx.fillRect(s.boss.x, s.boss.y - 10, 80, 5);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(s.boss.x, s.boss.y - 10, 80 * (s.boss.hp / s.boss.maxHp), 5);
        ctx.fillStyle = '#fbbf24'; ctx.fillRect(s.boss.x + 10, s.boss.y + 30, 20, 20); ctx.fillRect(s.boss.x + 50, s.boss.y + 30, 20, 20);
    }
  },
  getScore: s => s.score,
  isGameOver: s => !!s.gameOver
};

// --- 5. DODGEBALL UNLIMITED ---
export const Dodgeball: CanvasGameDefinition = {
  init: (d) => ({ 
    playerX: 200, obstacles: [], coins: [], score: 0,
    spawnChance: getDiffVal(d, 0.03, 0.05, 0.08),
    baseSpeed: getDiffVal(d, 3, 5, 7),
    particles: [],
    shield: 0
  }),
  update: (s, input, w, h) => {
    if (input.keys['ArrowLeft']) s.playerX -= 6;
    if (input.keys['ArrowRight']) s.playerX += 6;
    s.playerX = Math.max(0, Math.min(w - 20, s.playerX));

    if (Math.random() < s.spawnChance + (s.score * 0.0001)) s.obstacles.push({x: Math.random()*w, y: -20, r: Math.random()*10+5, type: 'ball'});
    if (Math.random() < 0.01) s.coins.push({x: Math.random()*w, y: -20, r: 8, type: Math.random() > 0.9 ? 'shield' : 'gold'});

    s.obstacles.forEach((o: any) => o.y += s.baseSpeed + s.score/500);
    s.obstacles = s.obstacles.filter((o: any) => o.y < h + 20);
    
    s.coins.forEach((c: any) => c.y += s.baseSpeed);
    s.coins = s.coins.filter((c: any) => c.y < h + 20);

    for (let i = s.coins.length - 1; i >= 0; i--) {
        let c = s.coins[i];
        if (Math.hypot(c.x - s.playerX, c.y - (h-20)) < c.r + 15) {
            if (c.type === 'shield') { s.shield = 300; s.particles.push(...createParticles(s.playerX, h-20, '#3b82f6', 20)); }
            else { s.score += 50; s.particles.push(...createParticles(s.playerX, h-20, '#facc15', 10)); }
            s.coins.splice(i, 1);
        }
    }

    for (let o of s.obstacles) {
        if (Math.hypot(o.x - s.playerX, o.y - (h-20)) < o.r + 10) {
            if (s.shield > 0) {
                s.shield = 0;
                s.obstacles = s.obstacles.filter((x:any) => x !== o);
                s.particles.push(...createParticles(s.playerX, h-20, '#3b82f6', 20));
            } else {
                return { ...s, gameOver: true };
            }
        }
    }

    if (s.shield > 0) s.shield--;
    s.score++; // Score based on time survival
    s.particles = updateParticles(s.particles);
    return { ...s };
  },
  draw: (ctx, s, w, h) => {
    drawParticles(ctx, s.particles);

    // Player
    ctx.fillStyle = s.shield > 0 ? '#60a5fa' : '#fff'; 
    ctx.shadowBlur = s.shield > 0 ? 20 : 10; ctx.shadowColor = ctx.fillStyle;
    ctx.beginPath(); ctx.arc(s.playerX, h-20, 10, 0, Math.PI*2); ctx.fill();
    if (s.shield > 0) {
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s.playerX, h-20, 15, 0, Math.PI*2); ctx.stroke();
    }
    ctx.shadowBlur = 0;
    
    // Balls
    ctx.fillStyle = '#f87171';
    s.obstacles.forEach((o: any) => { ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI*2); ctx.fill(); });

    // Coins
    s.coins.forEach((c: any) => {
        ctx.fillStyle = c.type === 'shield' ? '#3b82f6' : '#facc15';
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = '8px Arial'; ctx.textAlign = 'center';
        ctx.fillText(c.type === 'shield' ? 'S' : '$', c.x, c.y+3);
    });
  },
  getScore: s => Math.floor(s.score/10),
  isGameOver: s => !!s.gameOver
};

// --- 6. FLAPPY BLOCK ADVENTURE ---
export const FlappyBlock: CanvasGameDefinition = {
  init: (d) => ({ 
    y: 200, vy: 0, walls: [], coins: [], score: 0, frame: 0,
    gapSize: getDiffVal(d, 160, 140, 110),
    gravity: 0.5,
    particles: [],
    bgOffset: 0
  }),
  update: (s, input, w, h) => {
    s.bgOffset = (s.bgOffset + 1) % 40;
    s.vy += s.gravity; 
    if (input.keys[' ']) { 
        if (!s.jumped) { s.vy = -7; s.jumped = true; s.particles.push(...createParticles(50, s.y + 20, '#fbbf24', 5)); }
    } else { s.jumped = false; }
    s.y += s.vy;

    if (s.frame++ % 100 === 0) {
        const gapY = Math.random() * (h - s.gapSize - 100) + 50;
        s.walls.push({x: w, gapY});
        s.coins.push({x: w + 15, y: gapY + s.gapSize/2, collected: false});
    }

    s.walls.forEach((wall: any) => wall.x -= 3);
    s.walls = s.walls.filter((w: any) => w.x > -50);
    s.coins.forEach((c: any) => c.x -= 3);
    s.coins = s.coins.filter((c: any) => c.x > -50);

    const p = {x: 50, y: s.y, w: 20, h: 20};
    
    if (s.y > h || s.y < 0) return { ...s, gameOver: true };

    s.coins.forEach((c: any) => {
        if (!c.collected && Math.hypot(c.x - (50+10), c.y - s.y - 10) < 20) {
            c.collected = true;
            s.score += 5;
            s.particles.push(...createParticles(c.x, c.y, '#facc15', 10));
        }
    });

    for (let wall of s.walls) {
      if (rectIntersect(p, {x: wall.x, y: 0, w: 30, h: wall.gapY}) || 
          rectIntersect(p, {x: wall.x, y: wall.gapY + s.gapSize, w: 30, h: h - (wall.gapY + s.gapSize)})) {
        return { ...s, gameOver: true };
      }
      if (wall.x === 50) s.score++;
    }
    s.particles = updateParticles(s.particles);
    return { ...s };
  },
  draw: (ctx, s, w, h) => {
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = '#1e293b';
    for(let i=0; i<w; i+=40) { ctx.beginPath(); ctx.moveTo(i-s.bgOffset, 0); ctx.lineTo(i-s.bgOffset, h); ctx.stroke(); }
    
    drawParticles(ctx, s.particles);

    ctx.fillStyle = '#fbbf24'; ctx.fillRect(50, s.y, 20, 20);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(50, s.y, 20, 20);

    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#14532d'; ctx.lineWidth = 2;
    s.walls.forEach((wall: any) => {
      ctx.fillRect(wall.x, 0, 30, wall.gapY);
      ctx.strokeRect(wall.x, 0, 30, wall.gapY);
      ctx.fillRect(wall.x, wall.gapY + s.gapSize, 30, h);
      ctx.strokeRect(wall.x, wall.gapY + s.gapSize, 30, h);
    });

    ctx.fillStyle = '#facc15';
    s.coins.forEach((c:any) => {
        if(!c.collected) { ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI*2); ctx.fill(); }
    });
  },
  getScore: s => s.score,
  isGameOver: s => !!s.gameOver
};

// --- 7. POOL PRO ---
export const PoolLite: CanvasGameDefinition = {
  init: (d) => ({ 
    white: {x: 100, y: 200, vx: 0, vy: 0},
    reds: [
        {x: 300, y: 200, vx: 0, vy: 0}, 
        {x: 320, y: 190, vx:0, vy:0}, {x: 320, y: 210, vx:0, vy:0}, 
        {x: 340, y: 180, vx:0, vy:0}, {x: 340, y: 200, vx:0, vy:0}, {x: 340, y: 220, vx:0, vy:0}
    ],
    score: 0, charging: false, power: 0, particles: [], combo: 1
  }),
  update: (s, input, w, h) => {
    const friction = 0.985;
    let moving = false;

    // Update Physics
    [s.white, ...s.reds].forEach(b => {
      b.x += b.vx; b.y += b.vy;
      b.vx *= friction; b.vy *= friction;
      
      if (Math.abs(b.vx) > 0.05 || Math.abs(b.vy) > 0.05) moving = true;
      else { b.vx = 0; b.vy = 0; }

      if (b.x < 10 || b.x > w-10) { b.vx *= -0.9; b.x = b.x < 10 ? 10 : w-10; }
      if (b.y < 10 || b.y > h-10) { b.vy *= -0.9; b.y = b.y < 10 ? 10 : h-10; }
    });

    // Cue Control
    if (!moving) {
       s.combo = 1; // Reset combo if turn ends
       if (input.mouse.clicked) s.charging = true;
       if (s.charging) s.power = Math.min(25, s.power + 0.5);
       if (!input.mouse.clicked && s.charging) {
         const angle = Math.atan2(input.mouse.y - s.white.y, input.mouse.x - s.white.x);
         s.white.vx = Math.cos(angle) * s.power;
         s.white.vy = Math.sin(angle) * s.power;
         s.charging = false; s.power = 0;
       }
    } else {
        // Maintain combo during movement if balls sink
        // The combo reset should ideally happen when the player strikes, not when balls stop
        // But for simplicity in this engine, checking !moving is the 'start of turn'
    }

    // Ball-Ball Collision (Push apart logic)
    let balls = [s.white, ...s.reds];
    for (let i=0; i<balls.length; i++) {
        for (let j=i+1; j<balls.length; j++) {
            let b1 = balls[i]; let b2 = balls[j];
            let dx = b2.x - b1.x; let dy = b2.y - b1.y;
            let dist = Math.hypot(dx, dy);
            if (dist < 20 && dist > 0) {
                // Correct Position (Push apart)
                let overlap = 20 - dist;
                let nx = dx / dist;
                let ny = dy / dist;
                b1.x -= nx * overlap * 0.5;
                b1.y -= ny * overlap * 0.5;
                b2.x += nx * overlap * 0.5;
                b2.y += ny * overlap * 0.5;

                // Simple Elastic Bounce
                // Normal velocity component
                let v1n = b1.vx * nx + b1.vy * ny;
                let v2n = b2.vx * nx + b2.vy * ny;

                // Swap normal velocities
                let tx = -ny; let ty = nx;
                let v1t = b1.vx * tx + b1.vy * ty;
                let v2t = b2.vx * tx + b2.vy * ty;

                b1.vx = v2n * nx + v1t * tx;
                b1.vy = v2n * ny + v1t * ty;
                b2.vx = v1n * nx + v2t * tx;
                b2.vy = v1n * ny + v2t * ty;
                
                if (Math.abs(v1n - v2n) > 1) {
                    s.particles.push(...createParticles((b1.x+b2.x)/2, (b1.y+b2.y)/2, '#fff', 3, 1));
                }
            }
        }
    }

    // Pockets
    for(let i=0; i<s.reds.length; i++) {
       let r = s.reds[i];
       if ((r.x < 25 && r.y < 25) || (r.x > w-25 && r.y > h-25) || (r.x > w-25 && r.y < 25) || (r.x < 25 && r.y > h-25)) {
         s.score += 100 * s.combo;
         s.combo++;
         s.reds.splice(i, 1);
         s.particles.push(...createParticles(r.x, r.y, '#ef4444', 20));
         break;
       }
    }
    
    // Scratch (White ball in hole)
    if ((s.white.x < 25 && s.white.y < 25) || (s.white.x > w-25 && s.white.y > h-25) || (s.white.x > w-25 && s.white.y < 25) || (s.white.x < 25 && s.white.y > h-25)) {
        s.score -= 50;
        s.white.x = 100; s.white.y = 200; s.white.vx = 0; s.white.vy = 0;
    }

    if (s.reds.length === 0) return { ...s, gameOver: true };
    s.particles = updateParticles(s.particles);
    return { ...s };
  },
  draw: (ctx, s, w, h) => {
    ctx.fillStyle = '#15803d'; ctx.fillRect(0,0,w,h);
    // Pockets
    ctx.fillStyle = '#000'; 
    [[0,0],[w,0],[0,h],[w,h]].forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x,y,25,0,Math.PI*2); ctx.fill(); });
    
    drawParticles(ctx, s.particles);

    // Balls
    ctx.shadowBlur = 5; ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.white.x, s.white.y, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ef4444'; 
    s.reds.forEach((r: any) => { 
        ctx.beginPath(); ctx.arc(r.x, r.y, 10, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(r.x-3, r.y-3, 3, 0, Math.PI*2); ctx.fill(); // shine
        ctx.fillStyle='#ef4444';
    });
    ctx.shadowBlur = 0;

    // Cue
    if (s.charging) {
      ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(s.white.x, s.white.y);
      ctx.setLineDash([5,5]); ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1;
      ctx.lineTo(s.white.x + Math.cos(Math.atan2((s.mouse?.y||0)-s.white.y, (s.mouse?.x||0)-s.white.x))*100, s.white.y + Math.sin(Math.atan2((s.mouse?.y||0)-s.white.y, (s.mouse?.x||0)-s.white.x))*100);
      ctx.stroke();
      
      ctx.setLineDash([]); ctx.strokeStyle='#fff'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(s.white.x, s.white.y);
      ctx.lineTo(s.white.x + Math.cos(0)*s.power*4, s.white.y + Math.sin(0)*s.power*4); 
      ctx.stroke();
    }
  },
  getScore: s => s.score,
  isGameOver: s => !!s.gameOver
};

export const CANVAS_GAMES: {[key: string]: CanvasGameDefinition} = {
  pong: PongGame, snake: SnakeGame, breakout: BreakoutGame, space_shooter: SpaceShooter, dodgeball: Dodgeball, flappy: FlappyBlock, pool: PoolLite
};
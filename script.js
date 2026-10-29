
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const description = document.getElementById("description");
const startBtn = document.getElementById("startBtn");

let W = 0;
let H = 0;
let player;
let bullets = [];
let enemies = [];
let stars = [];
let score = 0;
let lives = 3;
let running = false;
let lastTime = 0;
let enemyTimer = 0;
let shotTimer = 0;
let animationId = 0;

const keys = {
  left: false,
  right: false,
  shoot: false
};

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  W = rect.width;
  H = rect.height;

  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (player) {
    player.x = Math.max(18, Math.min(W - 18, player.x));
    player.y = H - 45;
  }

  draw();
}

function resetGame() {
  score = 0;
  lives = 3;
  bullets = [];
  enemies = [];
  enemyTimer = 0;
  shotTimer = 0;

  player = {
    x: W / 2,
    y: H - 45,
    size: 18,
    speed: 260
  };

  stars = Array.from({ length: 65 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() * 2 + 0.5
  }));

  scoreText.textContent = score;
  livesText.textContent = lives;
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.fillStyle = "#b99aff";
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(17, 15);
  ctx.lineTo(0, 8);
  ctx.lineTo(-17, 15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#55eaff";
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.lineTo(0, 24 + Math.random() * 5);
  ctx.lineTo(5, 12);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, -5, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function draw() {
  if (!W || !H) return;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#050510";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ffffff";
  for (const star of stars) {
    ctx.globalAlpha = 0.4 + Math.random() * 0.6;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;

  if (player) drawPlayer();

  for (const b of bullets) {
    ctx.fillStyle = "#59f7ff";
    ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
  }

  for (const e of enemies) {
    ctx.fillStyle = "#ff477e";
    ctx.beginPath();
    ctx.moveTo(e.x, e.y - e.size);
    ctx.lineTo(e.x + e.size, e.y);
    ctx.lineTo(e.x, e.y + e.size);
    ctx.lineTo(e.x - e.size, e.y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffe0eb";
    ctx.fillRect(e.x - 3, e.y - 2, 6, 4);
  }
}

function shoot() {
  bullets.push({
    x: player.x,
    y: player.y - 18,
    speed: 440
  });
}

function spawnEnemy() {
  enemies.push({
    x: 20 + Math.random() * Math.max(1, W - 40),
    y: -20,
    size: 13 + Math.random() * 5,
    speed: 85 + Math.random() * 65
  });
}

function hit(a, b, distance) {
  return Math.hypot(a.x - b.x, a.y - b.y) < distance;
}

function endGame() {
  running = false;
  keys.left = false;
  keys.right = false;
  keys.shoot = false;

  cancelAnimationFrame(animationId);

  message.textContent = "GAME OVER!";
  description.textContent = "Skor akhir kamu: " + score;
  startBtn.textContent = "MAIN LAGI";
  overlay.classList.remove("hidden");
  draw();
}

function update(dt) {
  if (keys.left) player.x -= player.speed * dt;
  if (keys.right) player.x += player.speed * dt;

  player.x = Math.max(18, Math.min(W - 18, player.x));

  shotTimer -= dt;
  if (keys.shoot && shotTimer <= 0) {
    shoot();
    shotTimer = 0.22;
  }

  enemyTimer += dt;
  if (enemyTimer > Math.max(0.35, 0.9 - score / 500)) {
    spawnEnemy();
    enemyTimer = 0;
  }

  for (const b of bullets) {
    b.y -= b.speed * dt;
  }

  bullets = bullets.filter(b => b.y > -15);

  for (const e of enemies) {
    e.y += e.speed * dt;
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];

    if (hit(player, e, e.size + 14)) {
      enemies.splice(i, 1);
      lives--;
      livesText.textContent = lives;

      if (lives <= 0) {
        endGame();
        return;
      }
      continue;
    }

    if (e.y > H + 20) {
      enemies.splice(i, 1);
      continue;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (hit(bullets[j], e, e.size + 7)) {
        bullets.splice(j, 1);
        enemies.splice(i, 1);
        score += 10;
        scoreText.textContent = score;
        break;
      }
    }
  }

  for (const star of stars) {
    star.y += 35 * dt;
    if (star.y > H) {
      star.y = 0;
      star.x = Math.random() * W;
    }
  }
}

function loop(time) {
  if (!running) return;

  const dt = Math.min((time - lastTime) / 1000 || 0, 0.04);
  lastTime = time;

  update(dt);
  draw();

  if (running) {
    animationId = requestAnimationFrame(loop);
  }
}

function startGame() {
  cancelAnimationFrame(animationId);
  resetGame();

  running = true;
  lastTime = performance.now();
  overlay.classList.add("hidden");

  animationId = requestAnimationFrame(loop);
}

function bindButton(id, key) {
  const btn = document.getElementById(id);

  btn.addEventListener("pointerdown", event => {
    event.preventDefault();
    keys[key] = true;
    btn.setPointerCapture(event.pointerId);
  });

  const release = event => {
    event.preventDefault();
    keys[key] = false;
  };

  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("lostpointercapture", () => {
    keys[key] = false;
  });
}

bindButton("leftBtn", "left");
bindButton("rightBtn", "right");
bindButton("shootBtn", "shoot");

startBtn.addEventListener("click", startGame);

window.addEventListener("resize", resize);

resize();
resetGame();
draw();

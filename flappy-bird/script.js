const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const overlayButton = document.getElementById('overlay-button');
const muteButton = document.getElementById('mute-button');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GRAVITY = 0.55;
const FLAP = -7.8;
const PIPE_WIDTH = 72;
const PIPE_GAP = 170;
const PIPE_SPEED = 2.8;

let bird;
let pipes;
let score;
let gameOver;
let frame;
let bestScore;
let gameStarted;
let audioCtx;
let isMuted = false;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function toggleMute() {
  isMuted = !isMuted;
  muteButton.textContent = isMuted ? '🔈' : '🔇';
  if (!isMuted) {
    ensureAudio();
  }
}

function playTone(freq, duration, type, volume, slide = 0) {
  if (isMuted) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, now);
  if (slide !== 0) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(80, freq + slide),
      now + duration
    );
  }

  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playFlapSound() {
  playTone(340, 0.08, 'square', 0.03);
  playTone(260, 0.06, 'sine', 0.02);
}

function playScoreSound() {
  playTone(520, 0.08, 'triangle', 0.04);
  playTone(660, 0.1, 'triangle', 0.03);
}

function playHitSound() {
  playTone(180, 0.18, 'sawtooth', 0.06, -220);
}

function showOverlay(title, text, buttonText) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = buttonText;
  overlay.classList.add('visible');
}

function hideOverlay() {
  overlay.classList.remove('visible');
}

function resetGame() {
  bird = {
    x: 90,
    y: HEIGHT / 2,
    radius: 16,
    velocity: 0,
  };
  pipes = [];
  score = 0;
  gameOver = false;
  frame = 0;
  bestScore = bestScore || 0;
  spawnPipe();
}

function spawnPipe() {
  const minY = 90;
  const maxY = HEIGHT - 90 - PIPE_GAP;
  const gapY = Math.random() * (maxY - minY) + minY;
  pipes.push({
    x: WIDTH + 30,
    top: gapY - PIPE_GAP / 2,
    bottom: gapY + PIPE_GAP / 2,
    passed: false,
  });
}

function startGame() {
  gameStarted = true;
  gameOver = false;
  resetGame();
  hideOverlay();
}

function drawBackground() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  const skyGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  skyGradient.addColorStop(0, '#78d7ff');
  skyGradient.addColorStop(0.55, '#dff9ff');
  skyGradient.addColorStop(0.55, '#9be37a');
  skyGradient.addColorStop(1, '#a6e36f');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 3; i++) {
    const x = (frame * 0.2 + i * 140) % (WIDTH + 140) - 70;
    const y = 60 + i * 90;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.ellipse(x, y, 28, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 22, y - 10, 36, 22, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 48, y, 28, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBird() {
  const { x, y, radius } = bird;
  const wing = Math.sin(frame * 0.3) * 3;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.max(-0.5, Math.min(0.6, bird.velocity * 0.08)));

  ctx.fillStyle = '#f6d84a';
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e0a600';
  ctx.beginPath();
  ctx.ellipse(-4, 6 + wing, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(7, -5, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath();
  ctx.arc(9, -5, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff7a00';
  ctx.beginPath();
  ctx.moveTo(14, 1);
  ctx.lineTo(24, 0);
  ctx.lineTo(14, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPipes() {
  pipes.forEach((pipe) => {
    ctx.fillStyle = '#3cb043';
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, PIPE_WIDTH, HEIGHT - pipe.bottom);

    ctx.fillStyle = '#2a8f32';
    ctx.fillRect(pipe.x - 6, pipe.top - 18, PIPE_WIDTH + 12, 18);
    ctx.fillRect(pipe.x - 6, pipe.bottom, PIPE_WIDTH + 12, 18);
  });
}

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#1a4c7a';
  ctx.lineWidth = 3;
  ctx.font = 'bold 42px Segoe UI';
  ctx.strokeText(String(score), WIDTH / 2, 60);
  ctx.fillText(String(score), WIDTH / 2, 60);
}

function drawGameOver() {
  if (!gameOver) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px Segoe UI';
  ctx.fillText('Game Over', WIDTH / 2 - 120, HEIGHT / 2 - 20);

  ctx.font = 'bold 24px Segoe UI';
  ctx.fillText(`Score: ${score}`, WIDTH / 2 - 55, HEIGHT / 2 + 25);
  ctx.fillText(`Best: ${bestScore}`, WIDTH / 2 - 48, HEIGHT / 2 + 60);

  ctx.font = '18px Segoe UI';
  ctx.fillText('Click or press Space to restart', WIDTH / 2 - 110, HEIGHT / 2 + 110);
}

function update() {
  if (!gameStarted || gameOver) return;

  frame += 1;
  bird.velocity += GRAVITY;
  bird.y += bird.velocity;

  const groundY = HEIGHT - 40;
  if (bird.y + bird.radius >= groundY) {
    bird.y = groundY - bird.radius;
    bird.velocity = 0;
    gameOver = true;
    playHitSound();
    showOverlay('Game Over', `Final score: ${score}`, 'Play Again');
    return;
  }

  if (bird.y - bird.radius <= 0) {
    bird.y = bird.radius;
    bird.velocity = 0;
    gameOver = true;
    playHitSound();
    showOverlay('Game Over', `Final score: ${score}`, 'Play Again');
    return;
  }

  let hitPipe = false;
  pipes.forEach((pipe) => {
    pipe.x -= PIPE_SPEED;

    const pipeHit =
      bird.x + bird.radius > pipe.x &&
      bird.x - bird.radius < pipe.x + PIPE_WIDTH &&
      (bird.y - bird.radius < pipe.top || bird.y + bird.radius > pipe.bottom);

    if (pipeHit) {
      hitPipe = true;
    }

    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score += 1;
      bestScore = Math.max(bestScore, score);
      playScoreSound();
    }
  });

  if (hitPipe) {
    gameOver = true;
    playHitSound();
    showOverlay('Game Over', `Final score: ${score}`, 'Play Again');
    return;
  }

  pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -50);
  if (frame % 90 === 0) spawnPipe();
}

function draw() {
  drawBackground();
  drawPipes();
  drawBird();
  if (gameStarted) {
    drawScore();
  }
  drawGameOver();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function flap() {
  if (!gameStarted || gameOver) {
    startGame();
    bird.velocity = FLAP;
    playFlapSound();
    return;
  }
  bird.velocity = FLAP;
  playFlapSound();
}

canvas.addEventListener('click', () => {
  flap();
});

muteButton.addEventListener('click', () => {
  toggleMute();
});

overlayButton.addEventListener('click', () => {
  startGame();
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    flap();
  }
});

showOverlay('Ready to fly?', 'Tap start and dodge the pipes', 'Start Game');
resetGame();
loop();

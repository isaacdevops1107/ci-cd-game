// --- GAME LOGIC (SAVE AS game.js) ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const uiOverlay = document.getElementById("uiOverlay");
const titleText = document.getElementById("titleText");
const subText = document.getElementById("subText");

// Audio Context Setup (Web Audio API)
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Game State
let score = 0;
let lives = 3;
let gameOver = true;
let gameStarted = false;

// Paddle Setup
const paddle = {
    width: 120,
    height: 15,
    x: (canvas.width - 120) / 2,
    y: canvas.height - 30,
    color: '#00f0ff',
    targetX: (canvas.width - 120) / 2
};

// Ball Setup
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 45,
    radius: 8,
    speed: 7,
    dx: 4,
    dy: -4,
    color: '#ff007f',
    attached: true
};

// Bricks Configuration
const brickRowCount = 6;
const brickColumnCount = 9;
const brickWidth = 75;
const brickHeight = 24;
const brickPadding = 10;
const brickOffsetTop = 60;
const brickOffsetLeft = 25;

const rowColors = ['#ff0055', '#ff9900', '#ffea00', '#00ff66', '#00ffff', '#9900ff'];
let bricks = [];

function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { 
                x: 0, 
                y: 0, 
                status: 1, 
                color: rowColors[r],
                soundIndex: r 
            };
        }
    }
}

// Particle System for Animations
let particles = [];
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            radius: Math.random() * 3 + 2,
            color: color,
            dx: (Math.random() - 0.5) * 8,
            dy: (Math.random() - 0.5) * 8,
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02
        });
    }
}

// Synthesize Dynamic Animal Sounds
function playAnimalSound(type) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    switch(type) {
        case 0: // Bird Tweet
            let osc1 = audioCtx.createOscillator();
            let gain1 = audioCtx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(800, now);
            osc1.frequency.exponentialRampToValueAtTime(2500, now + 0.1);
            gain1.gain.setValueAtTime(0.15, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.15);
            break;
            
        case 1: // Frog Croak
            let osc2 = audioCtx.createOscillator();
            let mod2 = audioCtx.createOscillator();
            let modGain2 = audioCtx.createGain();
            let gain2 = audioCtx.createGain();
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(120, now);
            mod2.type = 'sawtooth';
            mod2.frequency.setValueAtTime(50, now);
            modGain2.gain.setValueAtTime(80, now);
            gain2.gain.setValueAtTime(0.2, now);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            mod2.connect(modGain2);
            modGain2.connect(osc2.frequency);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            mod2.start(now);
            osc2.start(now);
            mod2.stop(now + 0.2);
            osc2.stop(now + 0.2);
            break;
            
        case 2: // Elephant Trumpet
            let osc3 = audioCtx.createOscillator();
            let gain3 = audioCtx.createGain();
            let filter3 = audioCtx.createBiquadFilter();
            osc3.type = 'sawtooth';
            osc3.frequency.setValueAtTime(400, now);
            osc3.frequency.linearRampToValueAtTime(600, now + 0.05);
            osc3.frequency.exponentialRampToValueAtTime(200, now + 0.3);
            filter3.type = 'bandpass';
            filter3.frequency.setValueAtTime(500, now);
            gain3.gain.setValueAtTime(0.15, now);
            gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc3.connect(filter3);
            filter3.connect(gain3);
            gain3.connect(audioCtx.destination);
            osc3.start(now);
            osc3.stop(now + 0.3);
            break;
            
        case 3: // Cat Meow
            let osc4 = audioCtx.createOscillator();
            let gain4 = audioCtx.createGain();
            osc4.type = 'triangle';
            osc4.frequency.setValueAtTime(400, now);
            osc4.frequency.exponentialRampToValueAtTime(700, now + 0.15);
            osc4.frequency.exponentialRampToValueAtTime(300, now + 0.35);
            gain4.gain.setValueAtTime(0.2, now);
            gain4.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc4.connect(gain4);
            gain4.connect(audioCtx.destination);
            osc4.start(now);
            osc4.stop(now + 0.35);
            break;
            
        case 4: // Cricket Chirp
            for(let i=0; i<3; i++) {
                let osc5 = audioCtx.createOscillator();
                let gain5 = audioCtx.createGain();
                osc5.type = 'sine';
                osc5.frequency.setValueAtTime(4000, now + (i * 0.04));
                gain5.gain.setValueAtTime(0.1, now + (i * 0.04));
                gain5.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.04) + 0.03);
                osc5.connect(gain5);
                gain5.connect(audioCtx.destination);
                osc5.start(now + (i * 0.04));
                osc5.stop(now + (i * 0.04) + 0.03);
            }
            break;
            
        case 5: // Lion Growl
            let osc6 = audioCtx.createOscillator();
            let gain6 = audioCtx.createGain();
            let filter6 = audioCtx.createBiquadFilter();
            osc6.type = 'sawtooth';
            osc6.frequency.setValueAtTime(80, now);
            osc6.frequency.linearRampToValueAtTime(40, now + 0.4);
            filter6.type = 'lowpass';
            filter6.frequency.setValueAtTime(200, now);
            gain6.gain.setValueAtTime(0.3, now);
            gain6.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc6.connect(filter6);
            filter6.connect(gain6);
            gain6.connect(audioCtx.destination);
            osc6.start(now);
            osc6.stop(now + 0.4);
            break;

        case 'paddle':
            let oscP = audioCtx.createOscillator();
            let gainP = audioCtx.createGain();
            oscP.frequency.setValueAtTime(250, now);
            gainP.gain.setValueAtTime(0.1, now);
            gainP.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            oscP.connect(gainP);
            gainP.connect(audioCtx.destination);
            oscP.start(now);
            oscP.stop(now + 0.05);
            break;
    }
}

// User Controls
window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    paddle.targetX = e.clientX - rect.left - paddle.width / 2;
});

window.addEventListener('click', () => {
    if (ball.attached && !gameOver) {
        ball.attached = false;
        ball.dx = (Math.random() - 0.5) * 6;
        ball.dy = -ball.speed;
    }
});

startBtn.addEventListener('click', () => {
    initAudio();
    resetGame();
    gameOver = false;
    uiOverlay.style.opacity = 0;
    setTimeout(() => uiOverlay.style.display = 'none', 300);
});

function resetGame() {
    score = 0;
    lives = 3;
    initBricks();
    resetBall();
}

function resetBall() {
    ball.attached = true;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
}

// Game Mathematics and Engine Step
function update() {
    if (gameOver) return;

    paddle.x += (paddle.targetX - paddle.x) * 0.2;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

    if (ball.attached) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius;
    } else {
        ball.x += ball.dx;
        ball.y += ball.dy;

        if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
            ball.dx = -ball.dx;
        }
        if (ball.y + ball.dy < ball.radius) {
            ball.dy = -ball.dy;
        }

        if (ball.y + ball.dy > paddle.y - ball.radius && ball.x > paddle.x && ball.x < paddle.x + paddle.width && ball.dy > 0) {
            let collidePoint = ball.x - (paddle.x + paddle.width / 2);
            collidePoint = collidePoint / (paddle.width / 2);
            let angle = collidePoint * (Math.PI / 3);
            ball.dx = ball.speed * Math.sin(angle);
            ball.dy = -ball.speed * Math.cos(angle);
            playAnimalSound('paddle');
        }

        if (ball.y + ball.dy > canvas.height) {
            lives--;
            if (lives <= 0) endGame(false);
            else resetBall();
        }
    }

    let allDestroyed = true;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                allDestroyed = false;
                if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    createExplosion(b.x + brickWidth/2, b.y + brickHeight/2, b.color);
                    playAnimalSound(b.soundIndex);
                }
            }
        }
    }

    if (allDestroyed && !ball.attached) endGame(true);

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) particles.splice(i, 1);
    }
}

function endGame(won) {
    gameOver = true;
    uiOverlay.style.display = 'block';
    setTimeout(() => uiOverlay.style.opacity = 1, 10);
    if (won) {
        titleText.innerText = "VICTORY!";
        subText.innerText = `You cleared the zoo with a score of ${score}!`;
        startBtn.innerText = "PLAY AGAIN";
    } else {
        titleText.innerText = "GAME OVER";
        subText.innerText = `Final Score: ${score}. Try again to hear the animals!`;
        startBtn.innerText = "TRY AGAIN";
    }
}

// Graphic Rendering Functions
function drawPaddle() {
    ctx.shadowBlur = 15;
    ctx.shadowColor = paddle.color;
    ctx.fillStyle = paddle.color;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.shadowBlur = 10;
    ctx.shadowColor = ball.color;
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.fillStyle = bricks[c][r].color;
                ctx.beginPath();
                ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 4);
                ctx.fill();
                ctx.fillStyle = "rgba(255,255,255,0.15)";
                ctx.fillRect(brickX, brickY, brickWidth, 5);
            }
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

function drawUI() {
    ctx.font = "bold 16px 'Segoe UI', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("SCORE: " + score, 25, 30);
    ctx.fillText("LIVES: ", canvas.width - 120, 30);
    for(let i=0; i<3; i++) {
        ctx.fillStyle = i < lives ? "#ff007f" : "#443b5c";
        ctx.beginPath();
        ctx.arc(canvas.width - 60 + (i * 15), 24, 5, 0, Math.PI*2);
        ctx.fill();
    }
}

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    drawBricks();
    drawPaddle();
    drawBall();
    drawParticles();
    drawUI();
    requestAnimationFrame(loop);
}

initBricks();
loop();

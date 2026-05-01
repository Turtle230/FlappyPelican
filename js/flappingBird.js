// --- INIT ---
let game, context;
let gameWidth = 360;
let gameHeight = 640;

// --- SOUNDS ---
let jumpSound = new Audio("assets/sounds/jump.wav");
let scoreSound = new Audio("assets/sounds/score.wav");
let loseSound = new Audio("assets/sounds/lose.wav");
let bgMusic = new Audio("assets/sounds/flappingBirdMusic.wav"); // Added background music[cite: 1]

// Sound Settings
bgMusic.loop = true;      // Enable looping for background music
bgMusic.volume = 0.15;    // Set slightly lower than SFX
jumpSound.volume = 0.2;  
scoreSound.volume = 0.2; 
loseSound.volume = 0.2;  

// --- IMAGES ---
let bgImg = new Image();
bgImg.src = "assets/textures/background.png"; 

let pipeImg = new Image();
pipeImg.src = "assets/textures/pipe-green.png";

let baseImg = new Image();
baseImg.src = "assets/textures/base.png";

let gameOverImg = new Image();
gameOverImg.src = "assets/textures/gameOver.png";

let scorePanelImg = new Image();
scorePanelImg.src = "assets/textures/scoreScreen.png";

let okBtnImg = new Image();
okBtnImg.src = "assets/textures/ok_button.png";

let titleImg = new Image();
titleImg.src = "assets/textures/title.png";

let tapImg = new Image();
tapImg.src = "assets/textures/tap_button.png";

let pelicanSheet = new Image();
pelicanSheet.src = "assets/textures/PelicanFly.png"; 
const COLS = 5;
const ROWS = 5;
const TOTAL_FRAMES = 25;

let numberImgs = [];
for (let i = 0; i < 10; i++) {
    let img = new Image();
    img.src = `assets/textures/numbers/${i}.png`;
    numberImgs.push(img);
}

// --- GAME STATE ---
let birdScale = 1.8; 
let bird = { 
    x: 50, 
    y: 300, 
    w: 50 * birdScale, 
    h: 50 * birdScale, 
    vy: 0, 
    rotation: 0 
};

let gravity = 0.4;
let jump = -7;

let pipes = [];
let pipeWidth = 64;
let pipeGap = 150;
let pipeSpeed = -2;

let baseY = gameHeight - 100;
let baseX = 0; 

let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;

let started = false;
let gameOver = false;

let frame = 0;
let tick = 0;

let scale = 0.38;
let scale_score = 1;
let spacing = 2;

let okBtn = { x: 0, y: 0, w: 0, h: 0 };

window.onload = () => {
    game = document.getElementById("game");
    game.width = gameWidth;
    game.height = gameHeight;
    context = game.getContext("2d");
    context.imageSmoothingEnabled = false;

    document.addEventListener("keydown", onKey);
    setInterval(spawnPipes, 1800);

    game.addEventListener("mousedown", handleAction);

    requestAnimationFrame(loop);
};

function loop() {
    context.clearRect(0, 0, gameWidth, gameHeight);
    update();
    draw();
    if (gameOver) drawGameOver();
    requestAnimationFrame(loop);
}

// --- INPUT HANDLING ---
function handleAction(e) {
    if (gameOver) {
        let rect = game.getBoundingClientRect();
        let scaleX = gameWidth / rect.width;
        let scaleY = gameHeight / rect.height;
        let mx = (e.clientX - rect.left) * scaleX;
        let my = (e.clientY - rect.top) * scaleY;

        if (mx >= okBtn.x && mx <= okBtn.x + okBtn.w && my >= okBtn.y && my <= okBtn.y + okBtn.h) {
            reset();
        }
        return;
    }

    if (!started) {
        started = true;
        bgMusic.play(); // Start music on first interaction
    }
    bird.vy = jump;
    jumpSound.play(); 
}

function onKey(e) { 
    if (e.code === "Space") { 
        if (gameOver) return;
        if (!started) {
            started = true;
            bgMusic.play(); // Start music on first interaction
        }
        bird.vy = jump;
        jumpSound.play(); 
    } 
}

// --- UPDATE ---
function update() {
    if (!started) {
        bird.y = 300 + Math.sin(tick / 10) * 5;
    } else {
        bird.vy += gravity;
        bird.y += bird.vy;

        if (gameOver && bird.rotation < Math.PI / 2) {
            bird.rotation += 0.1;
        } else if (!gameOver) {
            bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.vy * 0.1));
        }
    }

    if (!gameOver) {
        for (let p of pipes) {
            if (started) p.x += pipeSpeed;
            if (collide(bird, p)) endGame();
            if (!p.passed && p.x < bird.x) {
                p.passed = true;
                score += 0.5;
                if (score % 1 === 0) scoreSound.play(); 
            }
        }

        if (started && baseImg.complete) {
            baseX += pipeSpeed;
            if (baseX <= -baseImg.width) baseX = 0;
        }

        if (bird.y + bird.h > baseY) {
            bird.y = baseY - bird.h;
            endGame();
        }
        if (bird.y < 0) {
            bird.y = 0;
            bird.vy = 0;
        }
    }

    pipes = pipes.filter(p => p.x > -pipeWidth);
    tick++;
    if (tick % 4 === 0) frame = (frame + 1) % TOTAL_FRAMES;
}

// --- DRAW ---
function draw() {
    if (bgImg.complete) {
        let bgX = 0;
        let backgroundY = baseY - bgImg.height; 
        while (bgX < gameWidth) {
            context.drawImage(bgImg, bgX, backgroundY, bgImg.width, bgImg.height);
            bgX += bgImg.width;
        }
    }

    if (!started) {
        if (titleImg.complete) {
            let desiredWidth = 330;
            let scale = desiredWidth / titleImg.width;
            let titleW = desiredWidth;
            let titleH = titleImg.height * scale;
            let titleX = (gameWidth - titleW) / 2;
            let bob = Math.sin(tick / 15) * 6;
            let titleY = 180 + bob;
            context.drawImage(titleImg, titleX, titleY, titleW, titleH);
        }

        if (tapImg.complete) {
            let desiredWidth = 40;
            let scale = desiredWidth / tapImg.width;
            let baseW = desiredWidth;
            let baseH = tapImg.height * scale;
            let tapX = (gameWidth - baseW) / 2;
            let tapY = 400;
            let pulse = 1 + Math.sin(tick / 20) * 0.1;
            let drawW = baseW * pulse;
            let drawH = baseH * pulse;
            let drawX = tapX - (drawW - baseW) / 2;
            let drawY = tapY - (drawH - baseH) / 2;
            context.drawImage(tapImg, drawX, drawY, drawW, drawH);
        }
    }

    if (pelicanSheet.complete) {
        context.save();
        context.translate(bird.x + bird.w / 2, bird.y + bird.h / 2);
        context.rotate(bird.rotation);
        let sw = pelicanSheet.width / COLS;
        let sh = pelicanSheet.height / ROWS;
        let sx = (frame % COLS) * sw;
        let sy = Math.floor(frame / COLS) * sh;
        context.drawImage(pelicanSheet, sx, sy, sw, sh, -bird.w / 2, -bird.h / 2, bird.w, bird.h);
        context.restore();
    }

    for (let p of pipes) {
        if (p.top) {
            context.save();
            context.translate(p.x, p.y + p.h);
            context.scale(1, -1);
            context.drawImage(pipeImg, 0, 0, pipeImg.width, p.h, 0, 0, pipeWidth, p.h);
            context.restore();
        } else {
            context.drawImage(pipeImg, 0, 0, pipeImg.width, p.h, p.x, p.y, pipeWidth, p.h);
        }
    }

    if (baseImg.complete) {
        let currentX = baseX;
        while (currentX < gameWidth + baseImg.width) {
            context.drawImage(baseImg, currentX, baseY, baseImg.width, 100);
            currentX += baseImg.width;
        }
    }

    if (started && !gameOver) {
        drawCenteredScore(score, 20);
    }
}

function drawGameOver() {
    if (score > bestScore) {
        bestScore = Math.floor(score);
        localStorage.setItem("bestScore", bestScore);
    }

    let panelW = 260;
    let panelH = 140;
    let panelX = (gameWidth - panelW) / 2;
    let panelY = 230;

    if (gameOverImg.complete) {
        context.drawImage(gameOverImg, (gameWidth - gameOverImg.width) / 2, panelY - gameOverImg.height - 30);
    }

    context.drawImage(scorePanelImg, panelX, panelY, panelW, panelH);
    drawRight(score, panelX + panelW - 25, panelY + 48);
    drawRight(bestScore, panelX + panelW - 25, panelY + 100);

    if (typeof uiBirdTick === 'undefined') uiBirdTick = 0;
    if (typeof uiBirdFrame === 'undefined') uiBirdFrame = 0;

    uiBirdTick++;
    if (uiBirdTick % 6 === 0) uiBirdFrame = (uiBirdFrame + 1) % TOTAL_FRAMES;

    let idleScale = 2.6; 
    let idleW = 50 * idleScale;
    let idleH = 50 * idleScale;

    if (pelicanSheet.complete) {
        let sw = pelicanSheet.width / COLS;
        let sh = pelicanSheet.height / ROWS;
        let sx = (uiBirdFrame % COLS) * sw;
        let sy = Math.floor(uiBirdFrame / COLS) * sh;
        let bob = Math.sin(uiBirdTick / 10) * 5;
        context.drawImage(pelicanSheet, sx, sy, sw, sh, panelX + 20, panelY + 5 + bob, idleW, idleH);
    }

    if (okBtnImg.complete) {
        okBtn = { x: (gameWidth - 100) / 2, y: panelY + panelH + 30, w: 100, h: 40 };
        context.drawImage(okBtnImg, okBtn.x, okBtn.y, okBtn.w, okBtn.h);
    }
}

// --- HELPERS ---
function drawCenteredScore(val, y) {
    let s = Math.floor(val).toString();
    let totalW = 0;
    for (let d of s) totalW += (numberImgs[d].width * scale_score) + spacing;
    let curX = (gameWidth - totalW) / 2;
    for (let d of s) {
        context.drawImage(numberImgs[d], curX, y, numberImgs[d].width * scale_score, numberImgs[d].height * scale_score);
        curX += (numberImgs[d].width * scale_score) + spacing;
    }
}

function drawRight(val, rightX, y) {
    let s = Math.floor(val).toString();
    let totalW = 0;
    for (let d of s) totalW += (numberImgs[d].width * scale) + spacing;
    let curX = rightX - totalW;
    for (let d of s) {
        context.drawImage(numberImgs[d], curX, y, numberImgs[d].width * scale, numberImgs[d].height * scale);
        curX += (numberImgs[d].width * scale) + spacing;
    }
}

function spawnPipes() {
    if (!started || gameOver) return;
    let topH = 50 + Math.random() * (baseY - pipeGap - 50);
    pipes.push({ x: gameWidth, y: 0, w: pipeWidth, h: topH, top: true, passed: false });
    pipes.push({ x: gameWidth, y: topH + pipeGap, w: pipeWidth, h: baseY - (topH + pipeGap), top: false, passed: false });
}

function collide(a, b) {
    let paddingX = a.w * 0.25;
    let paddingY = a.h * 0.25;
    let ax = a.x + paddingX;
    let ay = a.y + paddingY;
    let aw = a.w - paddingX * 2;
    let ah = a.h - paddingY * 2;
    return ax < b.x + b.w && ax + aw > b.x && ay < b.y + b.h && ay + ah > b.y;
}

function endGame() { 
    if (!gameOver) {
        loseSound.play();
        bgMusic.pause(); // Stop music on death
    }
    gameOver = true; 
}

function reset() { 
    bird.y = 300; 
    bird.vy = 0; 
    bird.rotation = 0; 
    pipes = []; 
    score = 0; 
    started = false; 
    gameOver = false; 
    bgMusic.currentTime = 0; // Rewind music for next game[cite: 1]
}
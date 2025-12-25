// --- CÁC BIẾN TOÀN CỤC ---

// Board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// Draco (Kích thước 70x70)
let dracoWidth = 85; 
let dracoHeight = 85; 
let dracoX = boardWidth / 8;
let dracoY = boardHeight / 2;

let draco = {
    x: dracoX,
    y: dracoY,
    width: dracoWidth,
    height: dracoHeight,
    rotation: 0
}

// Sprite Rồng
let dracoImg1 = new Image(); 
let dracoImg2 = new Image(); 
let currentDracoSprite; 
let wingFlapSpeed = 25; 

// Vật lý
let velocityX = -5; 
let velocityY = 0; 
let gravity = 0.15; 
let jumpStrength = -5; 

// Cột
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;
let pipeGap = boardHeight / 3; 

// Game logic & State
let score = 0;
let frameCount = 0; 
let pipeInterval; 

// CÁC TRẠNG THÁI: "START", "COUNTDOWN", "PLAYING", "GAMEOVER"
let gameState = "START"; 
let countdownValue = 3; 

// Cấu hình Nút
let btnConfig = {
    w: 140,
    h: 50,
    x: boardWidth / 2 - 70,
    y: boardHeight / 2 + 50
};

// --- KHỞI TẠO ---
window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); 

    dracoImg1.src = 'dd.png'; 
    dracoImg2.src = 'cc.png';
    currentDracoSprite = dracoImg1;

    requestAnimationFrame(update);
    pipeInterval = setInterval(placePipes, 1500); 
    
    document.addEventListener("keydown", handleInput);
    board.addEventListener("mousedown", handleInputMouse); 
    board.addEventListener("touchstart", handleInputTouch, {passive: false});
}

function startCountdown() {
    gameState = "COUNTDOWN";
    countdownValue = 3;
    
    let timer = setInterval(() => {
        countdownValue--;
        if (countdownValue <= 0) {
            clearInterval(timer);
            gameState = "PLAYING";
        }
    }, 1000);
}

// --- UPDATE LOOP (VÒNG LẶP CHÍNH) ---
function update() {
    requestAnimationFrame(update);
    context.clearRect(0, 0, board.width, board.height);

    // 1. XỬ LÝ LOGIC

    // Di chuyển cột (Chỉ khi đang chơi)
    if (gameState === "PLAYING") {
        for (let i = 0; i < pipeArray.length; i++) {
            let pipe = pipeArray[i];
            pipe.x += velocityX; 

            if (!pipe.passed && draco.x > pipe.x + pipe.width) {
                score += 0.5; 
                pipe.passed = true;
            }

            if (detectCollision(draco, pipe)) {
                gameState = "GAMEOVER"; // Chuyển trạng thái ngay lập tức
            }
        }
        // Xóa cột thừa
        while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth * 2) {
            pipeArray.shift();
        }
    }

    // Xử lý Draco (SỬA LẠI ĐOẠN NÀY ĐỂ KHÔNG BỊ VĂNG)
    frameCount++;
    
    if (gameState === "PLAYING") {
        // Khi đang chơi: Rơi tự do
        velocityY += gravity;
        draco.y = Math.max(draco.y + velocityY, 0);
        draco.rotation = velocityY * 0.05; 
        draco.rotation = Math.max(-0.5, Math.min(draco.rotation, 1.2));
        
        // Chạm đất
        if (draco.y + draco.height > board.height) {
            gameState = "GAMEOVER";
        }
        
    } else if (gameState === "START" || gameState === "COUNTDOWN") {
        // Khi chưa chơi: Bay lơ lửng (Reset vị trí về giữa)
        draco.y = dracoY + Math.sin(frameCount * 0.05) * 10; 
        draco.rotation = 0;
    } 
    // TRƯỜNG HỢP "GAMEOVER": KHÔNG LÀM GÌ CẢ -> GIỮ NGUYÊN VỊ TRÍ X, Y VÀ GÓC XOAY

    // Animation cánh
    // Nếu Game Over thì dừng vỗ cánh (luôn dùng ảnh 1)
    if (gameState === "GAMEOVER") {
        if (frameCount % (wingFlapSpeed * 2) < wingFlapSpeed) {
            currentDracoSprite = dracoImg1;
        } else {
            currentDracoSprite = dracoImg2;
        }
    } else {
        if (frameCount % (wingFlapSpeed * 2) < wingFlapSpeed) {
            currentDracoSprite = dracoImg1;
        } else {
            currentDracoSprite = dracoImg2;
        }
    }

    // 2. VẼ (RENDER)

    // Vẽ cột
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        let gradient = context.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
        gradient.addColorStop(0, '#2eccccff'); 
        gradient.addColorStop(1, '#277faeff'); 
        context.fillStyle = gradient;
        context.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
        context.strokeStyle = "#841e1eff";
        context.lineWidth = 3;
        context.strokeRect(pipe.x + 1.5, pipe.y + 1.5, pipe.width - 3, pipe.height -3);
    }

    // Vẽ Draco
    drawDracoSprite();

    // Vẽ Điểm
    if (gameState !== "START") {
        drawScore();
    }

    // 3. VẼ UI
    if (gameState === "START") {
        drawStartScreen();
    } else if (gameState === "COUNTDOWN") {
        drawCountdownText();
    } else if (gameState === "GAMEOVER") {
        drawGameOverUI();
    }
}

// --- CÁC HÀM VẼ UI (GIỮ NGUYÊN) ---

function drawButton(text, color, borderColor) {
    context.fillStyle = color;
    context.fillRect(btnConfig.x, btnConfig.y, btnConfig.w, btnConfig.h);
    context.strokeStyle = borderColor;
    context.lineWidth = 3;
    context.strokeRect(btnConfig.x, btnConfig.y, btnConfig.w, btnConfig.h);
    context.fillStyle = "white";
    context.font = "bold 25px 'Courier New'";
    context.textAlign = "center";
    context.fillText(text, boardWidth/2, btnConfig.y + 33);
}

function drawStartScreen() {
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.lineWidth = 3;
    context.textAlign = "center";
    context.font = "bolder 45px 'Courier New'";
    context.strokeText("FLAPPY", boardWidth/2, boardHeight/2 - 80);
    context.fillText("FLAPPY", boardWidth/2, boardHeight/2 - 80);
    context.font = "bolder 60px 'Courier New'";
    context.strokeText("DRACO", boardWidth/2, boardHeight/2 - 20);
    context.fillText("DRACO", boardWidth/2, boardHeight/2 - 20);
    drawButton("START", "#3498db", "#2980b9");
}

function drawCountdownText() {
    context.fillStyle = "rgba(0, 0, 0, 0.3)";
    context.fillRect(0, 0, boardWidth, boardHeight);
    context.fillStyle = "#f1c40f";
    context.strokeStyle = "black";
    context.lineWidth = 4;
    context.font = "bolder 120px 'Courier New'";
    context.textAlign = "center";
    let text = countdownValue > 0 ? countdownValue : "GO!";
    context.strokeText(text, boardWidth/2, boardHeight/2);
    context.fillText(text, boardWidth/2, boardHeight/2);
}

function drawGameOverUI() {
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.lineWidth = 3;
    context.textAlign = "center";
    context.font = "bolder 50px 'Courier New'";
    context.strokeText("GAME OVER", boardWidth/2, boardHeight/2 - 50);
    context.fillText("GAME OVER", boardWidth/2, boardHeight/2 - 50);
    context.font = "bolder 30px 'Courier New'";
    context.fillText("Score: " + Math.floor(score), boardWidth/2, boardHeight/2);
    drawButton("RESTART", "#e74c3c", "#c0392b");
}

function drawDracoSprite() {
    context.save();
    let centerX = draco.x + draco.width / 2;
    let centerY = draco.y + draco.height / 2;
    context.translate(centerX, centerY);
    context.rotate(draco.rotation);
    if (currentDracoSprite.complete) {
        context.drawImage(currentDracoSprite, -draco.width / 2, -draco.height / 2, draco.width, draco.height);
    }
    context.restore();
}

function drawScore() {
    if (gameState === "GAMEOVER") return; 
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.textAlign = "left"; 
    context.font = "bolder 45px 'Courier New'";
    context.strokeText(Math.floor(score), 15, 50);
    context.fillText(Math.floor(score), 15, 50);
}

// --- XỬ LÝ INPUT ---

function handleInput(e) {
    if (e.code == "Space" || e.code == "ArrowUp") {
        if (gameState === "START") {
            startCountdown();
        } else if (gameState === "PLAYING") {
            velocityY = jumpStrength;
        } else if (gameState === "GAMEOVER") {
            resetGame();
        }
    }
}

function handleInputMouse(e) {
    let rect = board.getBoundingClientRect();
    let clickX = e.clientX - rect.left;
    let clickY = e.clientY - rect.top;
    checkClick(clickX, clickY);
}

function handleInputTouch(e) {
    if (e.cancelable) e.preventDefault();
    let rect = board.getBoundingClientRect();
    let touch = e.touches[0];
    let clickX = touch.clientX - rect.left;
    let clickY = touch.clientY - rect.top;
    checkClick(clickX, clickY);
}

function checkClick(x, y) {
    if (gameState === "START") {
        if (x >= btnConfig.x && x <= btnConfig.x + btnConfig.w &&
            y >= btnConfig.y && y <= btnConfig.y + btnConfig.h) {
            startCountdown();
        }
    } else if (gameState === "PLAYING") {
        velocityY = jumpStrength;
    } else if (gameState === "GAMEOVER") {
        if (x >= btnConfig.x && x <= btnConfig.x + btnConfig.w &&
            y >= btnConfig.y && y <= btnConfig.y + btnConfig.h) {
            resetGame();
        }
    }
}

function resetGame() {
    draco.y = dracoY;
    draco.rotation = 0;
    velocityY = 0;
    pipeArray = [];
    score = 0;
    frameCount = 0;
    startCountdown();
}

function placePipes() {
    if (gameState !== "PLAYING") return;
    
    let randomPipeY = pipeY - pipeHeight/4 - Math.random()*(pipeHeight/2.5);
    let topPipe = { x: pipeX, y: randomPipeY, width: pipeWidth, height: pipeHeight, passed: false }
    pipeArray.push(topPipe);
    let bottomPipe = { x: pipeX, y: randomPipeY + pipeHeight + pipeGap, width: pipeWidth, height: pipeHeight, passed: false }
    pipeArray.push(bottomPipe);
}

function detectCollision(a, b) {
    let padding = 10; 
    return a.x + padding < b.x + b.width &&
           a.x + a.width - padding > b.x &&
           a.y + padding < b.y + b.height &&
           a.y + a.height - padding > b.y;
}

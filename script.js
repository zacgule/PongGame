// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreElem = document.querySelector('.player-score');
const computerScoreElem = document.querySelector('.computer-score');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// Game objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speed: 5,
    velocityX: 5,
    velocityY: 5,
    color: 'white'
};

const player = {
    x: 10,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    color: 'white',
    score: 0,
    speed: 8
};

const computer = {
    x: canvas.width - 20,
    y: canvas.height / 2 - 50,
    width: 10,
    height: 100,
    color: 'white',
    score: 0,
    speed: 6, // Computer paddle speed
    reactionDelay: 0.1, // Delay in computer reaction (in seconds)
    predictionFactor: 0.7 // How much the computer predicts ball movement
};

// Game state
let gameRunning = false;
let gamePaused = false;
let keys = {};

// Event listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

startBtn.addEventListener('click', () => {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        resetBall();
        gameLoop();
    } else if (gamePaused) {
        gamePaused = false;
        gameLoop();
    }
});

pauseBtn.addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        gamePaused = true;
    }
});

resetBtn.addEventListener('click', () => {
    gameRunning = false;
    gamePaused = false;
    player.score = 0;
    computer.score = 0;
    updateScore();
    resetBall();
    draw();
});

// Draw functions
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
}

function drawNet() {
    for (let i = 0; i < canvas.height; i += 15) {
        drawRect(canvas.width / 2 - 1, i, 2, 10, 'white');
    }
}

function draw() {
    // Clear canvas
    drawRect(0, 0, canvas.width, canvas.height, 'black');
    
    // Draw net
    drawNet();
    
    // Draw scores
    ctx.font = "32px Arial";
    ctx.fillText(player.score, canvas.width / 4, 50);
    ctx.fillText(computer.score, 3 * canvas.width / 4, 50);
    
    // Draw paddles and ball
    drawRect(player.x, player.y, player.width, player.height, player.color);
    drawRect(computer.x, computer.y, computer.width, computer.height, computer.color);
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}

// Update functions
function updatePlayer() {
    if (keys['w'] || keys['W']) {
        player.y -= player.speed;
    }
    if (keys['s'] || keys['S']) {
        player.y += player.speed;
    }
    
    // Prevent player from moving beyond canvas
    if (player.y < 0) {
        player.y = 0;
    } else if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

function updateComputer() {
    // Calculate where the ball will be when it reaches the computer's side
    let ballTravelTime = (computer.x - ball.x) / ball.velocityX;
    let predictedY = ball.y + (ball.velocityY * ballTravelTime);
    
    // Add some randomness to make the computer beatable
    predictedY += (Math.random() - 0.5) * 50;
    
    // Move computer paddle toward predicted position with delay
    let targetY = predictedY - computer.height / 2;
    
    // Apply reaction delay
    if (Math.abs(computer.y + computer.height / 2 - targetY) > computer.reactionDelay * computer.speed) {
        if (computer.y + computer.height / 2 < targetY) {
            computer.y += computer.speed;
        } else {
            computer.y -= computer.speed;
        }
    }
    
    // Prevent computer from moving beyond canvas
    if (computer.y < 0) {
        computer.y = 0;
    } else if (computer.y + computer.height > canvas.height) {
        computer.y = canvas.height - computer.height;
    }
}

function updateBall() {
    // Move the ball
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    // Ball collision with top and bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
    }
    
    // Ball collision with paddles
    let playerPaddle = (ball.x - ball.radius < player.x + player.width) && 
                      (ball.x > player.x) && 
                      (ball.y > player.y) && 
                      (ball.y < player.y + player.height);
    
    let computerPaddle = (ball.x + ball.radius > computer.x) && 
                        (ball.x < computer.x + computer.width) && 
                        (ball.y > computer.y) && 
                        (ball.y < computer.y + computer.height);
    
    if (playerPaddle || computerPaddle) {
        // Determine which paddle was hit
        let paddle = playerPaddle ? player : computer;
        
        // Calculate hit position (from -1 to 1, where -1 is top and 1 is bottom)
        let hitPos = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
        
        // Calculate angle based on hit position
        let angle = hitPos * (Math.PI / 4); // Max 45 degree angle
        
        // Determine direction (left or right)
        let direction = ball.x < canvas.width / 2 ? 1 : -1;
        
        // Update ball velocity
        ball.velocityX = direction * ball.speed * Math.cos(angle);
        ball.velocityY = ball.speed * Math.sin(angle);
        
        // Increase speed slightly with each hit
        ball.speed += 0.2;
    }
    
    // Score points
    if (ball.x - ball.radius < 0) {
        // Computer scores
        computer.score++;
        updateScore();
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        // Player scores
        player.score++;
        updateScore();
        resetBall();
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speed = 5;
    
    // Randomize initial direction
    ball.velocityX = Math.random() > 0.5 ? 5 : -5;
    ball.velocityY = (Math.random() * 2 - 1) * 5;
}

function updateScore() {
    playerScoreElem.textContent = `Player: ${player.score}`;
    computerScoreElem.textContent = `Computer: ${computer.score}`;
    
    // Check for winner
    if (player.score >= 5) {
        alert('You win!');
        resetGame();
    } else if (computer.score >= 5) {
        alert('Computer wins!');
        resetGame();
    }
}

function resetGame() {
    player.score = 0;
    computer.score = 0;
    updateScore();
    resetBall();
    gameRunning = false;
}

// Game loop
function gameLoop() {
    if (!gameRunning || gamePaused) return;
    
    draw();
    updatePlayer();
    updateComputer();
    updateBall();
    
    requestAnimationFrame(gameLoop);
}

// Initial draw
draw();
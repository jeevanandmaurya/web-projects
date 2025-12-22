var c = document.getElementById("myCanvas");
var gameOverModal = document.getElementById("gameOverModal");
var IterationsDisplay = document.getElementById("iteration");

var cWidth = c.width;
var cHeight = c.height;
var ctx = c.getContext("2d");

var aiControlsEnabled = false;
var gameLoopInterval = 1;
var gameLoopSkipped = 0;

//handle graph
var graphCanvas = document.getElementById("graphCanvas");
var graphCtx = graphCanvas.getContext("2d");
function drawGraph() {
    console.log("Graph");

    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    graphCtx.beginPath();
    graphCtx.moveTo(0, graphCanvas.height);
    for (var j = 0; j < scoreArr.length; j++) {
        var x = (j / (scoreArr.length - 1)) * graphCanvas.width;
        var y = graphCanvas.height - (scoreArr[j] / Math.max(...scoreArr)) * graphCanvas.height * 0.9;
        graphCtx.lineTo(x, y);
        console.log("Point: (" + x + ", " + y + ")");
    }
    graphCtx.strokeStyle = "blue";
    graphCtx.stroke();
}

//Ai Iterations
var n = 100;
var scoreArr = [];
//create json scheme for game states for total n games
var gameSates = {
    "snakeBody": [],
    "snakeDirection": {},
    "foodPosition": {},
    "score": 0
}

var aiControls = {
    "moveUp": 0,
    "moveDown": 0,
    "moveLeft": 0,
    "moveRight": 0
}



//Start Game
var gameOverFlag;
var snakBody = [];
var snakeBlockSize = cWidth / 20;
var snakeDirection;
var foodX;
var foodY;
var score;





function startGame() {

    score = 0;
    gameOverFlag = false;
    snakeDirection = { x: 1, y: 0 };
    snakBody = [{ x: 50, y: 50 }];
    foodX = Math.floor(Math.random() * (cWidth / snakeBlockSize)) * snakeBlockSize;
    foodY = Math.floor(Math.random() * (cHeight / snakeBlockSize)) * snakeBlockSize;

    ctx.clearRect(0, 0, cWidth, cHeight);
    drawGrid();
    drawSnake();
    drawFood();
}

function drawGrid() {
    var gridSize = snakeBlockSize;
    ctx.strokeStyle = "#bfbfbfff";
    for (var x = 0; x <= c.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, c.height);
    }
    for (var y = 0; y <= c.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(c.width, y);
    }
    ctx.stroke();
}
function drawSnake() {
    for (var i = 0; i < snakBody.length; i++) {
        ctx.fillStyle = "red";
        ctx.fillRect(snakBody[i].x, snakBody[i].y, snakeBlockSize, snakeBlockSize);
    }

}
function drawFood() {
    ctx.fillStyle = "green";
    ctx.fillRect(foodX, foodY, snakeBlockSize, snakeBlockSize);
}
function drawScore() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 20);
}

//Controls
document.addEventListener("keydown", keyPush);
//WASD or Arrow Keys 
function keyPush(evt) {
    switch (evt.keyCode) {
        case 37: // left arrow
            moveLeft();
            break;
        case 65: // A key
            moveLeft();
            break;
        case 38: // up arrow    
            moveUp();
            break;
        case 87: // W key
            moveUp();
            break;
        case 39: // right arrow    
            moveRight();
            break;
        case 68: // D key
            moveRight();
            break;
        case 40: // down arrow    
            moveDown();
            break;
        case 83: // S key    
            moveDown();
            break;

        case 82: // R key    
            restartGame();
            break;
        case 32: // Space key    
            if (gameOverFlag) {
                restartGame();
            }
            break;
    }
}

function moveUp() {
    snakeDirection.x = 0;
    if (snakeDirection.y === 1) return; //prevent reverse
    snakeDirection.y = -1;
    console.log("Move Up");
}
function moveDown() {
    snakeDirection.x = 0;
    if (snakeDirection.y === -1) return; //prevent reverse
    snakeDirection.y = 1;
    console.log("Move Down");
}
function moveLeft() {
    if (snakeDirection.x === 1) return; //prevent reverse
    snakeDirection.x = -1;
    snakeDirection.y = 0;
    console.log("Move Left");
}
function moveRight() {
    if (snakeDirection.x === -1) return; //prevent reverse
    snakeDirection.x = 1;
    snakeDirection.y = 0;
    console.log("Move Right");
}

function updateSnakePosition() {

    for (var i = snakBody.length - 1; i > 0; i--) {
        snakBody[i].x = snakBody[i - 1].x;
        snakBody[i].y = snakBody[i - 1].y;
    }
    snakBody[0].x += snakeDirection.x * snakeBlockSize;
    snakBody[0].y += snakeDirection.y * snakeBlockSize;



}



function gameLoop() {
    ctx.clearRect(0, 0, cWidth, cHeight);

    if (aiControlsEnabled){
        snakeDirection = aiDecideDirection(snakBody, foodX, foodY, snakeDirection);
    }
    

    updateSnakePosition();
    hnadleCollision();
    if (gameOverFlag) return;

    if (gameLoopInterval < 10) {
        gameLoopSkipped++;
        if (gameLoopSkipped < Math.floor(10 / gameLoopInterval)) {
            console.log("Frame skiped" + gameLoopSkipped);

            // return;
        }
        gameLoopSkipped = 0;
    }

    drawGrid();
    drawSnake();
    drawFood();
    drawScore();


}

function hnadleCollision() {
    if (snakBody[0].x < 0 || snakBody[0].x >= cWidth || snakBody[0].y < 0 || snakBody[0].y >= cHeight) {
        console.log("Game Over");
        gameOverFlag = true;
        gameOver();
    }
    //Food collision logic to be added here
    if (snakBody[0].x === foodX && snakBody[0].y === foodY) {
        console.log("Food Eaten");
        score += 10;
        increaseSnakeLength();
        foodX = Math.floor(Math.random() * (cWidth / snakeBlockSize)) * snakeBlockSize;
        foodY = Math.floor(Math.random() * (cHeight / snakeBlockSize)) * snakeBlockSize;
    }
    //Self collision
    if (snakBody.length < 5) return;
    for (var i = 1; i < snakBody.length; i++) {
        if (snakBody[0].x === snakBody[i].x && snakBody[0].y === snakBody[i].y) {
            console.log("Game Over");
            gameOverFlag = true;
            gameOver();
        }
    }
}

function increaseSnakeLength() {
    var newSegment = { x: snakBody[snakBody.length - 1].x, y: snakBody[snakBody.length - 1].y };
    snakBody.push(newSegment);
}

function gameOver() {
    if (!aiControlsEnabled) {
        gameOverModal.style.display = "flex";
    }
}
function restartGame() {
    gameOverModal.style.display = "none";
    startGame();
}


//AI Iterations Loop

function aiDecideDirection(snakeBody, foodX, foodY, currentDirection) {
    var head = snakeBody[0];
    var dx = foodX - head.x;
    var dy = foodY - head.y;


    return (Math.abs(dx) > Math.abs(dy) ?
        (dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 }) :
        (dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 }));
}

var i = 0;
function runAiIterations() {
    aiControlsEnabled = true;
    if (i >= n) {
        console.log("AI Iterations Completed");
        return;
    }
    drawGraph();
    IterationsDisplay.innerText = "Iteration: " + (i + 1);
    console.log("Iteration: " + (i + 1));
    restartGame();
    var intervalId = setInterval(() => {
        if (!gameOverFlag) {
            scoreArr[i] = score;
            gameLoop();
        } else {
            clearInterval(intervalId);
            i++;
            runAiIterations();
        }
    }, gameLoopInterval);
}
// runAiIterations();

if (!aiControlsEnabled) {
    startGame();
    setInterval(gameLoop, 1000 / 15); //15 FPS
}

var c = document.getElementById("myCanvas");
var gameOverModal = document.getElementById("gameOverModal");
var IterationsDisplay = document.getElementById("iteration");

var cWidth = c.width;
var cHeight = c.height;
var ctx = c.getContext("2d");


var aiControlsEnabled = false;
var gameLoopInterval = 120;
var gameLoopSkipped = 0;
var distanceBasedThreshold = 0;
var isModelLoaded = false;

//handle graph
var graphCanvas = document.getElementById("graphCanvas");
var graphCtx = graphCanvas.getContext("2d");
function drawGraph() {
    const padding = 30;
    const width = graphCanvas.width - padding * 2;
    const height = graphCanvas.height - padding * 2;

    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);

    if (scoreArr.length === 0) return;

    const maxScore = Math.max(...scoreArr, 1); // Avoid division by zero

    // Draw Axes
    graphCtx.strokeStyle = "#ccc";
    graphCtx.beginPath();
    graphCtx.moveTo(padding, padding);
    graphCtx.lineTo(padding, graphCanvas.height - padding);
    graphCtx.lineTo(graphCanvas.width - padding, graphCanvas.height - padding);
    graphCtx.stroke();

    // Draw Y-axis labels (Scores)
    graphCtx.fillStyle = "black";
    graphCtx.font = "10px Arial";
    graphCtx.textAlign = "right";
    for (let k = 0; k <= 5; k++) {
        let scoreVal = Math.round((maxScore / 5) * k);
        let y = graphCanvas.height - padding - (k / 5) * height;
        graphCtx.fillText(scoreVal, padding - 5, y + 3);
    }

    // Draw X-axis labels (Iterations)
    graphCtx.textAlign = "center";
    let numLabels = Math.min(scoreArr.length, 5);
    for (let k = 0; k <= numLabels; k++) {
        let iterVal = Math.round((scoreArr.length / numLabels) * k);
        if (iterVal >= scoreArr.length && k > 0) iterVal = scoreArr.length;
        let x = padding + (k / numLabels) * width;
        graphCtx.fillText(iterVal, x, graphCanvas.height - padding + 15);
    }

    // Draw Graph Line
    graphCtx.beginPath();
    graphCtx.strokeStyle = "blue";
    graphCtx.lineWidth = 2;
    for (var j = 0; j < scoreArr.length; j++) {
        var x = padding + (j / Math.max(1, scoreArr.length - 1)) * width;
        var y = graphCanvas.height - padding - (scoreArr[j] / maxScore) * height;
        if (j === 0) graphCtx.moveTo(x, y);
        else graphCtx.lineTo(x, y);
    }
    graphCtx.stroke();
    graphCtx.lineWidth = 1;
}

//Ai Iterations
function getSensorData(gameState) {
    const head = gameState.snakeBody[0];

    const movingLeft = (gameState.direction.x === -1) ? 1 : 0;
    const movingRight = (gameState.direction.x === 1) ? 1 : 0;
    const movingUp = (gameState.direction.y === -1) ? 1 : 0;
    const movingDown = (gameState.direction.y === 1) ? 1 : 0;

    // Check for danger in each direction (Wall or Body)
    const checkDanger = (x, y) => {
        if (x < 0 || x >= cWidth || y < 0 || y >= cHeight) return 1;
        for (let i = 1; i < gameState.snakeBody.length; i++) {
            if (x === gameState.snakeBody[i].x && y === gameState.snakeBody[i].y) return 1;
        }
        return 0;
    };

    const dangerLeft = checkDanger(head.x - snakeBlockSize, head.y);
    const dangerRight = checkDanger(head.x + snakeBlockSize, head.y);
    const dangerUp = checkDanger(head.x, head.y - snakeBlockSize);
    const dangerDown = checkDanger(head.x, head.y + snakeBlockSize);

    const foodLeft = (gameState.foodPosition.x < head.x) ? 1 : 0;
    const foodRight = (gameState.foodPosition.x > head.x) ? 1 : 0;
    const foodUp = (gameState.foodPosition.y < head.y) ? 1 : 0;
    const foodDown = (gameState.foodPosition.y > head.y) ? 1 : 0;

    return [
        movingLeft, movingRight, movingUp, movingDown,
        dangerLeft, dangerRight, dangerUp, dangerDown,
        foodLeft, foodRight, foodUp, foodDown
    ];
}
let model;

function createModel() {
    model = tf.sequential();

    // Input Layer: 12 sensors
    model.add(tf.layers.dense({
        units: 64,
        inputShape: [12],
        activation: 'relu'
    }));

    // Hidden Layer
    model.add(tf.layers.dense({
        units: 64,
        activation: 'relu'
    }));

    // Output Layer: 4 decisions (Left, Right, Top, Down)
    model.add(tf.layers.dense({
        units: 4,
        activation: 'linear' // Linear allows raw scores (Q-values)
    }));

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
}
createModel();
// Hyperparameters
const DISCOUNT_FACTOR = 0.95; // Value of future rewards
let EPSILON = 0.2; // Start with 20% random moves for exploration
const EPSILON_MIN = 0.01; // Minimum exploration rate
const EPSILON_DECAY = 0.995; // Decay rate per iteration

async function trainModel(memory) {
    document.getElementById("micro-out-div").innerText = "Training on " + memory.length + " steps...";
    const states = memory.map(m => m.state);      // Input: [12 sensors]
    const actions = memory.map(m => m.action);    // Action: 0, 1, 2, or 3
    const rewards = memory.map(m => m.reward);    // Reward: Numeric
    const nextStates = memory.map(m => m.nextState); // Next Input: [12 sensors]
    const dones = memory.map(m => m.done);        // Boolean: Did game end?

    // 2. Convert to Tensors (The GPU data format)
    const stateTensor = tf.tensor2d(states, [states.length, 12]);
    const nextStateTensor = tf.tensor2d(nextStates, [nextStates.length, 12]);

    // 3. Predict Q-values for Current and Next states
    const currentQ = model.predict(stateTensor);
    const nextQ = model.predict(nextStateTensor);

    // 4. Update the Q-values (The Math)
    // We want: CurrentQ[Action] = Reward + (0.9 * Max(NextQ))

    const currentQData = currentQ.arraySync(); // Download from GPU to CPU to edit
    const nextQData = nextQ.arraySync();       // Download from GPU

    for (let i = 0; i < memory.length; i++) {
        const action = actions[i];
        const reward = rewards[i];
        const done = dones[i];

        let newQ;
        if (done) {
            // If game ended, there is no future. Just the reward (Death = -10).
            newQ = reward;
        } else {
            // If game goes on, add best future guess
            // Math.max(...nextQData[i]) finds the highest score in [Left, Straight, Right]
            newQ = reward + (DISCOUNT_FACTOR * Math.max(...nextQData[i]));
        }

        // Update ONLY the action we took. Leave others alone.
        currentQData[i][action] = newQ;
    }

    // 5. Train the Model using the updated "Truth"
    // Input: Original States
    // Target: The updated Q-values
    const targetTensor = tf.tensor2d(currentQData, [memory.length, 4]);

    await model.fit(stateTensor, targetTensor, {
        epochs: 3, // Multiple passes for better learning
        shuffle: true
    });

    // Clean up tensors to prevent memory leak
    stateTensor.dispose();
    nextStateTensor.dispose();
    targetTensor.dispose();
    currentQ.dispose();
    nextQ.dispose();
    
    // Log tensor count to monitor memory
    console.log("Tensors in memory:", tf.memory().numTensors);
    
    // Decay epsilon
    if (EPSILON > EPSILON_MIN) {
        EPSILON *= EPSILON_DECAY;
    }
    
    document.getElementById("micro-out-div").innerText = "Training Complete (Tensors: " + tf.memory().numTensors + ", ε: " + EPSILON.toFixed(3) + ")";
}



var n = 1000;
var scoreArr = [];
//create json scheme for game states for total n games


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
var reward=0;
var action;
var score;
const gameState = {
    snakeBody: [{ x: 10, y: 10 }],
    foodPosition: { x: 5, y: 5 },
    wallDistance: { lw: 10, rw: cWidth - 10 + snakeBlockSize, tw: 10, bw: cHeight - 10 + snakeBlockSize },
    direction: { x: 1, y: 0 },
    score: 0,
    gameOver: false
};

var gameMemory = [];




function startGame() {

    score = 0;
    gameOverFlag = false;
    snakeDirection = { x: 1, y: 0 };
    snakBody = [{ x:snakeBlockSize + Math.floor(Math.random() * 19)*snakeBlockSize, y: snakeBlockSize+ Math.floor(Math.random() * 18)*snakeBlockSize }];
    spawnFood();

    // Synchronize initial gameState for AI sensors
    gameState.snakeBody = snakBody.map(segment => ({ x: segment.x, y: segment.y }));
    gameState.foodPosition = { x: foodX, y: foodY };
    gameState.direction = { x: snakeDirection.x, y: snakeDirection.y };
    gameState.score = score;
    gameState.gameOver = false;

    ctx.clearRect(0, 0, cWidth, cHeight);
    drawGrid();
    drawSnake();
    drawFood();
}

function drawGrid() {
    var gridSize = snakeBlockSize;
    ctx.beginPath(); // Reset path to prevent accumulation
    ctx.strokeStyle = "#bfbfbf6a";
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
}
function moveDown() {
    snakeDirection.x = 0;
    if (snakeDirection.y === -1) return; //prevent reverse
    snakeDirection.y = 1;
}
function moveLeft() {
    if (snakeDirection.x === 1) return; //prevent reverse
    snakeDirection.x = -1;
    snakeDirection.y = 0;
}
function moveRight() {
    if (snakeDirection.x === -1) return; //prevent reverse
    snakeDirection.x = 1;
    snakeDirection.y = 0;
}

function updateSnakePosition() {

    for (var i = snakBody.length - 1; i > 0; i--) {
        snakBody[i].x = snakBody[i - 1].x;
        snakBody[i].y = snakBody[i - 1].y;
    }
    snakBody[0].x += snakeDirection.x * snakeBlockSize;
    snakBody[0].y += snakeDirection.y * snakeBlockSize;



}



async function gameLoop() {
    ctx.clearRect(0, 0, cWidth, cHeight);
    
    // Reset reward at start of each frame
    reward = 0;

    const currentState = getSensorData(gameState);
    const distBefore = Math.abs(foodX - snakBody[0].x) + Math.abs(foodY - snakBody[0].y);

    var predictedAction;
    if (aiControlsEnabled) {
       
        if (i === 0) {
            // Set predictedAction to current direction (going straight)
            if (snakeDirection.x === -1) predictedAction = 0;
            else if (snakeDirection.x === 1) predictedAction = 1;
            else if (snakeDirection.y === -1) predictedAction = 2;
            else if (snakeDirection.y === 1) predictedAction = 3;
           
        } else if (i < distanceBasedThreshold) {
            // Use distance-based direction
            const targetDir = disanceBasedDirection(snakBody, foodX, foodY, snakeDirection);
            if (targetDir.x === -1) predictedAction = 0;
            else if (targetDir.x === 1) predictedAction = 1;
            else if (targetDir.y === -1) predictedAction = 2;
            else if (targetDir.y === 1) predictedAction = 3;
            
            // Apply direction change
            switch (predictedAction) {
                case 0: if (snakeDirection.x !== 1) moveLeft(); break;
                case 1: if (snakeDirection.x !== -1) moveRight(); break;
                case 2: if (snakeDirection.y !== 1) moveUp(); break;
                case 3: if (snakeDirection.y !== -1) moveDown(); break;
            }
        } else {
            // Epsilon-greedy: explore with probability EPSILON, exploit otherwise
            if (Math.random() < EPSILON) {
                predictedAction = Math.floor(Math.random() * 4); // Random action
            } else {
                tf.tidy(() => {
                    const inputTensor = tf.tensor2d([currentState], [1, 12]);
                    const prediction = model.predict(inputTensor);
                    predictedAction = prediction.argMax(1).dataSync()[0];
                });
            }
            // Apply direction change
            switch (predictedAction) {
                case 0: if (snakeDirection.x !== 1) moveLeft(); break;
                case 1: if (snakeDirection.x !== -1) moveRight(); break;
                case 2: if (snakeDirection.y !== 1) moveUp(); break;
                case 3: if (snakeDirection.y !== -1) moveDown(); break;
            }
        }
    }

    updateSnakePosition();
    hnadleCollision();

    // Determine action taken based on snakeDirection
    let actionTaken;
    if (snakeDirection.x === -1) actionTaken = 0;
    else if (snakeDirection.x === 1) actionTaken = 1;
    else if (snakeDirection.y === -1) actionTaken = 2;
    else if (snakeDirection.y === 1) actionTaken = 3;

    // Calculate reward for moving closer to food
    const distAfter = Math.abs(foodX - snakBody[0].x) + Math.abs(foodY - snakBody[0].y);
    if (!gameOverFlag && reward === 0) {
        
        reward = (distAfter < distBefore) ? 1 : -1; // Small reward for moving closer, penalty for moving away
        
    }
    if (gameOverFlag) reward = -10;

    // console.log("Reward this frame:", reward, "GameOver:", gameOverFlag);

    // Update game state for next sensor reading
    gameState.snakeBody = snakBody.map(segment => ({ x: segment.x, y: segment.y }));
    gameState.foodPosition = { x: foodX, y: foodY };
    gameState.direction = { x: snakeDirection.x, y: snakeDirection.y };
    gameState.score = score;
    gameState.gameOver = gameOverFlag;

    const nextState = getSensorData(gameState);

    // AI Memory Storage
    gameMemory.push({
        state: currentState,
        action: actionTaken,
        reward: reward,
        nextState: nextState,
        done: gameOverFlag
    });

    if (gameOverFlag) {
        console.log("Game Memory at End:", gameMemory);
        return;
    }

    // // Rendering logic
    // if (gameLoopInterval < 10) {
    //     gameLoopSkipped++;
    //     if (gameLoopSkipped >= Math.floor(10 / gameLoopInterval)) {
    //         gameLoopSkipped = 0;
    //         drawGrid(); drawSnake(); drawFood(); drawScore();
    //     }
    // } else {
    // }
    drawGrid(); drawSnake(); drawFood(); drawScore();
}

function hnadleCollision() {
    if (snakBody[0].x < 0 || snakBody[0].x >= cWidth || snakBody[0].y < 0 || snakBody[0].y >= cHeight) {
        gameOverFlag = true;
        gameOver();
    }
    //Food collision logic to be added here
    if (snakBody[0].x === foodX && snakBody[0].y === foodY) {
        reward += 10;
        score += 1;
        increaseSnakeLength();
        spawnFood();
    }
    //Self collision
    if (snakBody.length < 5) return;
    for (var i = 1; i < snakBody.length; i++) {
        if (snakBody[0].x === snakBody[i].x && snakBody[0].y === snakBody[i].y) {
            gameOverFlag = true;
            gameOver();
        }
    }
}

function spawnFood() {
    // Build a set of occupied positions for O(1) lookup
    const occupied = new Set();
    for (let segment of snakBody) {
        occupied.add(`${segment.x},${segment.y}`);
    }
    
    // Collect all valid (unoccupied) positions
    const validPositions = [];
    for (let x = 0; x < cWidth; x += snakeBlockSize) {
        for (let y = 0; y < cHeight; y += snakeBlockSize) {
            if (!occupied.has(`${x},${y}`)) {
                validPositions.push({ x, y });
            }
        }
    }
    
    // Pick a random valid position
    if (validPositions.length > 0) {
        const pos = validPositions[Math.floor(Math.random() * validPositions.length)];
        foodX = pos.x;
        foodY = pos.y;
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
    if (aiControlsEnabled) {
        startGame();
    } else {
        runUserGameLoop();
    }
}


//AI Iterations Loop

function disanceBasedDirection(snakeBody, foodX, foodY, currentDirection) {
    var head = snakeBody[0];
    var dx = foodX - head.x;
    var dy = foodY - head.y;

    let preferredMoves = [];
    if (Math.abs(dx) > Math.abs(dy)) {
        preferredMoves.push(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
        preferredMoves.push(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
    } else {
        preferredMoves.push(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
        preferredMoves.push(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
    }

    // Add remaining directions
    [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(m => {
        if (!preferredMoves.some(pm => pm.x === m.x && pm.y === m.y)) preferredMoves.push(m);
    });

    // Pick the first move that doesn't cause immediate death
    for (let move of preferredMoves) {
        let nextX = head.x + move.x * snakeBlockSize;
        let nextY = head.y + move.y * snakeBlockSize;

        // Wall check
        if (nextX < 0 || nextX >= cWidth || nextY < 0 || nextY >= cHeight) continue;

        // Body check
        let bodyCollision = false;
        for (let segment of snakeBody) {
            if (nextX === segment.x && nextY === segment.y) {
                bodyCollision = true;
                break;
            }
        }
        if (bodyCollision) continue;

        // Prevent 180-degree turns
        if (move.x === -currentDirection.x && move.y === -currentDirection.y) continue;

        return move;
    }

    return preferredMoves[0]; // Fallback
}

var i = 0;
var aiIntervalId;
var stopAiFlag = false;

function updateSpeed(val) {
    gameLoopInterval = parseInt(val);
    document.getElementById("speedValue").innerText = val + "ms";

    // If AI is running, we need to restart the interval to apply the new speed
    if (aiControlsEnabled && !stopAiFlag && aiIntervalId) {
        clearInterval(aiIntervalId);
        startAiInterval();
    }
}

function updateDistIter(val) {
    distanceBasedThreshold = parseInt(val);
    document.getElementById("distIterValue").innerText = val;
}

async function startAiInterval() {
    aiIntervalId = setInterval(async () => {
        if (!gameOverFlag && !stopAiFlag) {
            scoreArr[i] = score;
            await gameLoop();
        } else {
            clearInterval(aiIntervalId);
            if (stopAiFlag) return;

            await trainModel(gameMemory);
            gameMemory = []; // Clear memory after training

            i++;
            runAiIterations();
        }
    }, gameLoopInterval);
}

async function runAiIterations() {
    aiControlsEnabled = true;
    stopAiFlag = false;
    document.getElementById("micro-out-div").innerText = "AI Running...";
    if (i >= n || stopAiFlag) {
        // Auto-save model after all iterations complete
        if (i >= n) {
            await saveModel();
            document.getElementById("micro-out-div").innerText = "Training Complete! Model Auto-Saved.";
        }
        return;
    }
    drawGraph();
    IterationsDisplay.innerText = "Iteration: " + (i + 1);
    restartGame();
    startAiInterval();
}

function stopAi() {
    stopAiFlag = true;
    clearInterval(aiIntervalId);
    aiControlsEnabled = false;
    document.getElementById("micro-out-div").innerText = "AI Stopped";
}

async function saveModel() {
    try {
        await model.save('indexeddb://snake-model');
        document.getElementById("micro-out-div").innerText = "Model Saved to IndexedDB";
    } catch (e) {
        console.error("Save failed", e);
        document.getElementById("micro-out-div").innerText = "Save Failed";
    }
}

async function loadModel() {
    try {
        model = await tf.loadLayersModel('indexeddb://snake-model');
        model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
        isModelLoaded = true;
        document.getElementById("micro-out-div").innerText = "Model Loaded from IndexedDB";

        // Suggest disabling distance-based iterations for loaded models
        document.getElementById("distIterRange").value = 0;
        updateDistIter(0);
    } catch (e) {
        console.error("Load failed", e);
        document.getElementById("micro-out-div").innerText = "Load Failed (No saved model?)";
    }
}

async function clearModel() {
    try {
        const models = await tf.io.listModels();
        if (models['indexeddb://snake-model']) {
            await tf.io.removeModel('indexeddb://snake-model');
            isModelLoaded = false;
            document.getElementById("micro-out-div").innerText = "Saved Model Deleted";
        } else {
            document.getElementById("micro-out-div").innerText = "Nothing to delete";
        }
    } catch (e) {
        console.error("Clear failed", e);
        document.getElementById("micro-out-div").innerText = "Clear Error";
    }
}

function runUserGameLoop() {
    stopAi();
    aiControlsEnabled = false;
    document.getElementById("micro-out-div").innerText = "User Playing";

    // Set speed to a playable default for users if it's too fast
    if (gameLoopInterval < 50) {
        updateSpeed(120);
        document.getElementById("speedRange").value = 120;
    }

    startGame();
    var userIntervalId = setInterval(() => {
        if (gameOverFlag || aiControlsEnabled) {
            clearInterval(userIntervalId);
            return;
        }
        gameLoop();
    }, gameLoopInterval);
}

// const board = document.getElementsByClassName('board')
const spaces = document.querySelectorAll('.space')
const gameoverE = document.getElementById('gameover')
const scoreXE = document.getElementById('scoreX')
const scoreOE = document.getElementById('scoreO')
const turnE = document.getElementById('turn')
const restartE = document.getElementById('restart')
const playagain = document.getElementById('playagain')
const winnerE = document.getElementById('winner')


const ch = ['', 'O', 'X']
const reddish = '#f76737ff'
const bluish = '#5eecffff'
let state = [0, 0, 0, 0, 0, 0, 0, 0, 0]
let turn = 1 //P1 - O and P2 - X
let winner = 0 //0-NA 1-O 2-X 3-Draw
let scoreO = 0
let scoreX = 0
let turns = 0//number of times player have played their chance
scoreOE.parentElement.style = ` border-bottom:4px solid #fef5c0;`

//Game Logic

for (let i = 0; i < spaces.length; i++) {


    spaces[i].addEventListener('click', function (e) {



        if (turns < 9 && state[i] === 0) {
            //game is not over
            turns++;
            console.log(turns);

            const btn = e.target


            btn.innerText = ch[turn]//printing character
            state[i] = turn //storing state

            winner = checkWinner()//check winner

            if (winner > 0 || turns === 9) {
                console.log(`Winner is ${ch[winner]}`);
                if (winner === 1) {
                    scoreO++;
                }
                if (winner === 2) {
                    scoreX++;
                }
                gameover()
            }


            turn = 3 - turn //flipping turn
            turnE.innerText = ch[turn]
            if (turn === 1) {
                scoreOE.parentElement.style = ` border-bottom:4px solid #fef5c0;`
                scoreXE.parentElement.style = ` border-bottom:`

            } else {

                scoreOE.parentElement.style = ` border-bottom:`
                scoreXE.parentElement.style = ` border-bottom:4px solid #fef5c0;`

            }
            if (scoreO > 0) {

                scoreOE.innerText = scoreO
            }
            if (scoreX > 0) {

                scoreXE.innerText = scoreX
            }


        }

    })
}



//Force Restart
restartE.addEventListener('click', function (e) {
    restart();

})


function gameover() {
    //game is over- either someone won or draw
    gameoverE.style.visibility = "visible"
    gameoverE.style.animationName = "zoom"
    if (winner === 3) {
        //game draw
        console.log('Draw')
        winnerE.innerText = `Draw`
    }
    else {
        //show game winner
        console.log(`${ch[winner]}`)

        winnerE.innerText = `${ch[winner]}\n Winner`

    }

}
//play again
playagain.addEventListener('click', function (e) {
    restart();
    console.log('play again');
    gameoverE.style.animationName = ""

})

function checkWinner() {

    //horizontal
    for (let i = 0; i < 9; i += 3) {

        if (state[i] == turn && state[i + 1] === turn && state[i + 2] === turn) {
            showResult(i, i + 1, i + 2)
            return turn
        }
    }
    //vertical
    for (let i = 0; i < 3; i++) {

        if (state[i] === turn && state[i + 3] === turn && state[i + 6] === turn) {
            showResult(i, i + 3, i + 6)
            return turn
        }
    }
    //Diagonal
    if (state[0] === turn && state[4] === turn && state[8] === turn) {
        showResult(0, 4, 8)
        return turn
    }
    if (state[2] === turn && state[4] === turn && state[6] === turn) {
        showResult(2, 4, 6)
        return turn
    }

    if (turns === 9) {
        //Draw
        return 3
    }
    return 0
}

function showResult(i, j, k) {

    if (turn === 1) {
        spaces.item(i).style = `background-color:${reddish}`
        spaces.item(j).style = `background-color:${reddish}`
        spaces.item(k).style = `background-color:${reddish}`

    } else {
        spaces.item(i).style = `background-color:${bluish}`
        spaces.item(j).style = `background-color:${bluish}`
        spaces.item(k).style = `background-color:${bluish}`
    }
}

function restart() {
    console.log('restart');

    //Reset Values
    state = [0, 0, 0, 0, 0, 0, 0, 0, 0]
    winner = 0
    if (turns % 2 === 0) {

        turn = 3 - turn //P1 - O and P2 - X
    }
    turns = 0


    for (let i = 0; i < spaces.length; i++) {
        spaces.item(i).innerText = ``
        spaces.item(i).style = ``
    }
    turnE.innerText = ch[turn]
    if (turn === 1) {
        scoreOE.parentElement.style = ` border-bottom:4px solid #fef5c0;`
        scoreXE.parentElement.style = ` border-bottom:`

    } else {

        scoreOE.parentElement.style = ` border-bottom:`
        scoreXE.parentElement.style = ` border-bottom:4px solid #fef5c0;`

    }
    gameoverE.style.visibility = "hidden"

}

const btns = document.getElementsByTagName("button")
const displayE = document.getElementById("display")
const expressionE = displayE.children[0]
const resultE = displayE.children[1]

expressionE.innerHTML = ''
resultE.innerHTML = ''

let expression = ''
let result = ''

let parenCount = 0
let decimalCount = 0
let btnListIndex = [-1]
let lastBtnIndex = -1

for (let i = 0; i < btns.length; i++) {
    
    btns[i].addEventListener('click', function (e) {
        handleClick(i)
    })
}

function handleClick(i) {

    expressionE.scrollLeft = expressionE.scrollWidth
    
    //Handling Edge Cases
    let temp = expressionE.innerText
    let input = btns[i].innerText

    if (btns[i].className === "numbers") {

        // console.log(`num click`);

        if (input === '.') {
            if (decimalCount > 0) {
                // Multiple Decimals
                return
            }
            if (btns[lastBtnIndex]?.className != "numbers") {
                // Decimal at Prefix
                input = '0.'
                btnListIndex.push(16)//pushing 0's index
            }
            decimalCount++
        }

        //Storing input for next input validation
        lastBtnIndex = i
        btnListIndex.push(i) //Tracks btn clicks


    } else if (btns[i].className === "operators") {

        // console.log(`op click`);

        //Handling Edge Cases

        //Consecutive Operators 
        if (lastBtnIndex != -1&&(btns[lastBtnIndex].className === 'operators' || lastBtnIndex === 1)) {
            return
        }//Operator Prefix
        else if (temp === '' && input != '-') {
            return
        }
        else {

            //Storing input for next input validation
            lastBtnIndex = i
            btnListIndex.push(i) //Tracks btn clicks
        }

        decimalCount = 0


    } else if (btns[i].className === "symbols") {

        // console.log(`sym click`);
        switch (btns[i].id) {

            case "clear":
                if (temp != '') {
                    expressionE.innerText = temp.slice(0, -1)
                    expression = expressionE.innerText
                    switch (btnListIndex[btnListIndex.length - 1]) {
                        case 17:
                            // console.log('deleted decimal');

                            decimalCount--
                            break;

                        case 1:
                            // console.log('deleted openparen');
                            parenCount--
                            break;
                        case 2:
                            // console.log('deleted closedparen');
                            parenCount++
                            break;

                        default:
                            break;
                    }
                    btnListIndex.pop()
                    lastBtnIndex = btnListIndex[btnListIndex.length - 1]

                    evaluate()
                    return

                } else {
                    resultE.innerText = ''
                    result = ''

                    result
                    return
                }
                break;
            case "allClear":
                expressionE.innerText = ''
                resultE.innerText = ''
                expression = ''
                result = ''
                input = ''
                parenCount = 0
                decimalCount = 0
                lastBtnIndex = -1
                btnListIndex = [-1]
                return
                break;
            case "openParenthesis":
                parenCount++;
                // console.log(parenCount);
                // Default operator btw 'Num' or ')' and (

                if (temp != '' && btns[lastBtnIndex]?.className !== "operators" && lastBtnIndex != 1) {
                    input = '*('
                    btnListIndex.push(11) //pushing *'s index
                }

                lastBtnIndex = i
                btnListIndex.push(lastBtnIndex)

                break;
            case "closeParenthesis":
                if (parenCount > 0) {

                    parenCount--;
                    //Storing input for next input validation
                    lastBtnIndex = i
                    btnListIndex.push(lastBtnIndex)
                    // console.log(parenCount);
                } else {
                    return
                }
                break;

            case "equal":

                evaluate("equal")
                return
                break;
            default:
                break;
        }

        decimalCount = 0
    }


    expressionE.innerText += input //Update Expression Element
    expression = expressionE.innerText

    // console.log(` ${btnListIndex}  exp=${expression}  res=${result}  temp=${temp} lastBtnClass=${btns[lastBtnIndex] != null ? btns[lastBtnIndex].className : null}`);

    evaluate();

}

function evaluate(id) {


    if (lastBtnIndex != -1) {

        let validExpression = expression
        if (btns[lastBtnIndex].className === "operators") {
            //ignore last operator
            validExpression = validExpression.slice(0, -1)
        }

        for (let n = 0; n < parenCount; n++) {

            validExpression += ')'
            // console.log(validExpression);
        }
        try {
            result = eval(validExpression)

        } catch (error) {
            if (id === 'equal') {
                result = 'Error'
            } else {
                result = ''

            }
        }
        resultE.innerText = result
        resultE.scrollLeft = resultE.scrollWidth

        if (id === 'equal') {
            expressionE.style.color = 'rgb(172, 172, 172)'
            expressionE.style.fontSize = '20px'
            resultE.style.color = 'white'
            resultE.style.fontSize = '40px'
        } else {
            expressionE.style.color = ''
            expressionE.style.fontSize = ''
            resultE.style.color = ''
            resultE.style.fontSize = ''
        }


    }

}
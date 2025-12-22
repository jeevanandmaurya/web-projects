
function useLinearSearch() {
    return linearSearch;
}

function linearSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {

        //Simulation Delay
        setTimeout(() => {}, 0);

        if (arr[i] === target) {
            return i; // Return the index if the target is found
        }
    }
    return -1; // Return -1 if the target is not found
}




// Example usage:
const index = linearSearch([1, 2, 3, 4, 5], 3);
console.log(index); // Output: 2
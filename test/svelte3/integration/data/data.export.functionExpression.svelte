<script>
    /* Adds two numbers `a` and `b`*/
    export let add = function(a = 0, b = 0){
        return a + b
    },
    /**
     * Subtracts two numbers `b` from `a`
     * @param {number} a - first number
     * @param {number} [b=0] - second number
     * @returns {number} - the difference
     */
    subtract = function(a, b){
        return a - b;
    },
    /**
     * Multiplies two numbers `a` and `b`
     * @param a - first number
     * @param b - second number
     * @returns {number} - the total
     */
    multiply = (a = 0, b = 1) => {
        return a * b
    };

    export let done = function(){
        //nothing happens
    }

</script>
<script>
    /**
     * The method comment.
     * @param {string} param1 - the first parameter
     * @param {boolean} [param2=false] - the second parameter
     * @param param3 - the third parameter of type number
     * @param {any} param7
     * @returns {number} - return value description
     */
    export function publicMethod(
        param1, //this should use jsdoc from above
        param2, //this should use jsdoc from above
        param3 = 1, //type and default should be inferred, description from jsdoc
        param4 = [], //type should be inferred, no description
        param5 = {}, //type should be inferred, no description
        param6 = true, //type and default should be inferred, no description
        param7 // this should use jsdoc from above
    ) {
        return 0;
    };
</script>
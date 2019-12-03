<script>
  export let identifier = 1;

  function topLevelFunction() {
    /**
     * The component description
     * @component ComponentName
     * @example
     * <ComponentName identifier={identifier} />
     */

    innerFunction();
  }

  topLevelFunction();
</script>

<div>
  <div>
    <!--
        /**
        * The component description
        * @component ComponentName
        * @example
        * <ComponentName identifier={identifier} />
        */
        -->
  </div>
</div>
<div>
  <h1>Header {identifier}</h1>
</div>

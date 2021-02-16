<script>
    export let items = [];
</script>

<div>
    {#each items as item}
        <!-- 
            Render the one item markup based on data passed in slot property.
            @param {GenericListItem} prop The item of the list that should be rendered.
         -->
        <slot prop={item}></slot>
    {:else}
        <slot name="empty"></slot>
    {/each}
</div>
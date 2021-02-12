<script>
    export let items = [];
</script>

<div>
    {#each items as item}
        <slot prop={item}></slot>
    {:else}
        <slot name="empty"></slot>
    {/each}
</div>
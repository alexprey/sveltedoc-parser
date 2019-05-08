<ul>
    {#each items as item}
        <li>
            <slot name="item" item={item}></slot>
        </li>
    {/each}
</ul>

<script>
    let items = [];
</script>
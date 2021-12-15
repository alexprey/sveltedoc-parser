<ul>
    {#each items as item}
        <li>
            <!--
                The slot description.
                @param {string} item The slot parameter description.
            -->
            <slot name="item" item={item}></slot>
        </li>
    {/each}
</ul>

<script>
    let items = [];
</script>
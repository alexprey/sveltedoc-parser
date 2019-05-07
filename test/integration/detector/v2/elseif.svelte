<div>
    {#if rnd() < 0.3}
        <span>Completed with first try</span>
    {:elseif rnd() < 0.7}
        <span>Completed with second try</span>
    {/if}
</div>

<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let closable = false;
</script>

<div>
    <div>
        <!-- The internal content of the alert block. -->
        <slot></slot>
    </div>
    {#if closable}
        <div>
            <button on:click="{e => dispatch('close')}"></button>
        </div>
    {/if}
</div>
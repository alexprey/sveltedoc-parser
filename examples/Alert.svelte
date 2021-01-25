<script>
    /**
     * Simple box with constrast styling to notify users.
     * 
     * @component
     * 
     * @example
     * <Alert closable={true} on:close={() => ...}>
     *      User-defined content
     * </Alert>
     */

    import { createEventDispatcher } from 'svelte';
    
    const dispatch = createEventDispatcher();
    const EVENT = {
        CLOSE: "close"
    }

    export let closable = false;
</script>

<div>
    <div>
        <!-- The internal content of the alert block. -->
        <slot></slot>
    </div>
    {#if closable}
        <div>
            <!-- 
                The `close` event fired when user click to X button in the panel. 
                @event CloseEvent#close
            -->
            <button on:click={() => dispatch(EVENT.CLOSE)}>&times;</button>
        </div>
    {/if}
</div>
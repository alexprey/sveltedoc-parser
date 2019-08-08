<script>
    import { createEventDispatcher } from 'svelte';

    const customDispatcherName = createEventDispatcher();
</script>

<button on:click="{() => customDispatcherName('notify', 'data')}">
    FIRE!
</button>
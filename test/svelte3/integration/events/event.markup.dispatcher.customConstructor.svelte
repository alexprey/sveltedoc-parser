<script>
    import { createEventDispatcher as ced } from 'svelte';

    const customDispatcherName = ced();
</script>

<button on:click="{() => customDispatcherName('notify', 'data')}">
    FIRE!
</button>

<button on:click={() => customDispatcherName('notify2', 'data')}>
    FIRE!
</button>
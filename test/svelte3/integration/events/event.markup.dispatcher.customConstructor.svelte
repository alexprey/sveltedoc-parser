<script>
    import { createEventDispatcher as ced } from 'svelte';

    const customDispatcherName = ced();
</script>

<button on:click="{() => customDispatcherName('notify', 'data')}">
    FIRE!
</button>
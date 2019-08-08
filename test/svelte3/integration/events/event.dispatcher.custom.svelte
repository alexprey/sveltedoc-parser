<script>
    import { createEventDispatcher } from 'svelte';

    const customDispatcherName = createEventDispatcher();

    customDispatcherName('notify', 'data');
</script>
<script>
    import { createEventDispatcher as ced } from 'svelte';

    const customDispatcherName = ced();

    customDispatcherName('notify', 'data');
</script>
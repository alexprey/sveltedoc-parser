<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    import { EVENT, SIMPLE_EVENT } from './sharedEvents.importable.js';

    dispatch(EVENT.SIGNAL.NOTIFY);

    dispatch(SIMPLE_EVENT);
</script>
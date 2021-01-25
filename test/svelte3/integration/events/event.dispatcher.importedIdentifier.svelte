<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    import { EVENT, SIMPLE_EVENT } from './sharedEvents.js';

    dispatch(EVENT.SIGNAL.NOTIFY);

    dispatch(SIMPLE_EVENT);
</script>
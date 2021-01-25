<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    const EVENT = {
        SIGNAL: {
            NOTIFY: 'notify'
        }
    };

    const SIMPLE_EVENT = 'plain-notify';

    dispatch(EVENT.SIGNAL.NOTIFY);

    dispatch(SIMPLE_EVENT);
</script>
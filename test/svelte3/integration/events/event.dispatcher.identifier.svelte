<script>
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

    export const EXPORTED_EVENT = {
        SIGNAL: {
            NOTIFY: 'exported-notify'
        }
    };
    export const EXPORTED_SIMPLE_EVENT = 'exported-plain-notify';

    dispatch(EXPORTED_EVENT.SIGNAL.NOTIFY);
    dispatch(EXPORTED_SIMPLE_EVENT);
</script>
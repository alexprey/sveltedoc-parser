<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    const EVENT = {
        SIGNAL: {
            NOTIFY: 'notify'
        }
    };
    
    dispatch(EVENT['SIGNAL']['NOTIFY']);
</script>
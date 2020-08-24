<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    import EventBus from 'eventbus';

    const unsubscribe = EventBus.subscribe('income', (e) => {
        dispatch('change');
    });
</script>

<div>
    Simple component
</div>


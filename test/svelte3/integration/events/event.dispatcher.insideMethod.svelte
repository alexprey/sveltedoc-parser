<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    
    function someHandler() {
        dispatch('notify', 'data');
    }

    const anotherHandler = () => {
        dispatch('notify2');
    };
</script>
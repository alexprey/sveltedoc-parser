<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    dispatch('notify', 'data');

    function someFunc(cond){
        dispatch('start', 'data');
        if(cond){
            dispatch('end', 'data');
        }
    }
</script>
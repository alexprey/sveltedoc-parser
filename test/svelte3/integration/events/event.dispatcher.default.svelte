<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    dispatch('notify', 'data');

    function someFunc(cond){
        dispatch('start', 'data');
        if(cond){
            dispatch('end', 'data');
        }else if(!cond){
        	dispatch('running', 'data');
        }else{
         	dispatch('failed', 'data')
        }
    }
</script>
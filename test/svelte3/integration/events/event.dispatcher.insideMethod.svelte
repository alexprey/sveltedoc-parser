<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    
    function someHandler() {
        dispatch('notify', 'data');
    }

    const anotherHandler = () => {
        dispatch('notify2');
    };

    export function publicMethodHandler() {
        dispatch('notify3');
    }

    export const publicArrow = () => {
        dispatch('notify4');
    };
</script>
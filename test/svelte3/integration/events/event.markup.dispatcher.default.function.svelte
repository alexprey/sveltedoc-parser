<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
</script>

<button on:click="{function () { dispatch('notify'); }}">
    CLICK!
</button>
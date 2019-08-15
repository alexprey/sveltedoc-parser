<input bind:value={number} />
<PlusMinusControl bind:numberValue={number} />

<script>
    import PlusMinusControl from './PlusMinusControl.svelte';

    let number;
</script>
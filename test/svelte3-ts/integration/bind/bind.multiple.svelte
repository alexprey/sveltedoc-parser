<input bind:value={number} />
<PlusMinusControl bind:numberValue={number} />

<script lang="ts">
    import PlusMinusControl from './PlusMinusControl.svelte';

    let number: number;
</script>
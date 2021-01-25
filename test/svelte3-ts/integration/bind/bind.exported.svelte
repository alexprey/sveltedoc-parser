<ShopingCart bind:totalCost={totalCost} />

<script lang="ts">
    import ShopingCart from './ShopingCart.svelte';

    /**
     * The comment of public binded property.
     */
    export let totalCost: number;
</script>
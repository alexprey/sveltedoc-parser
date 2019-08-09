<ShopingCart bind:totalCost={totalCost} />

<script>
    import ShopingCart from './ShopingCart.svelte';

    /**
     * The comment of public binded property.
     */
    export let totalCost;
</script>
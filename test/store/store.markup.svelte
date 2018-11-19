<div>
    <h1>{$ApplicationName}</h1>
</div>
<div>
    <button type="button" on:click="$set({ ApplicationName: 'New application name' })">
        Change application name
    </button>
</div>

<script>
    export default {

    }
</script>
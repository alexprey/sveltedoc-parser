<script>
    function handleClickEvent() {
        console.log('Clickув');
    }
</script>

<div>
    <!-- Event fired when user clicked on button. -->
    <button on:click="{() => handleClickEvent()}" on:click>
        Click to fire
    </button>
</div>
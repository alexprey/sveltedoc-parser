<div>
    <button on:click="handleButtonClick(event)">
        Click to fire
    </button>
</div>

<script>
export default {
    methods: {
        handleButtonClick(event) {
            /**
             * Event fired when user clicked on button.
             */
            this.fire("click", event);
        }
    }
}
</script>
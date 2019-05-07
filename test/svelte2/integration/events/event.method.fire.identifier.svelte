<div>
    <button on:click="handleButtonClick(event)">
        Click to fire
    </button>
</div>

<script>

const ComponentEventNames = {
    Click: 'click'
};

export default {
    methods: {
        handleButtonClick(event) {
            /**
             * Event fired when user clicked on button.
             */
            this.fire(ComponentEventNames.Click, event);
        }
    }
}
</script>
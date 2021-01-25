<div>
    <button on:click="handleButtonClick(event)">
        Click to fire
    </button>
</div>

<script>

const ComponentEventNames = {
    Click: 'click',
    Alternate: {
        Press: 'press'
    },
};


export default {
    methods: {
        handleButtonClick(event) {
            /**
             * Event fired when user clicked on button.
             */
            this.fire(ComponentEventNames.Click, event);
        },
        handleButtonPress(event) {
            /**
             * Event fired when user pressed on button.
             */
            this.fire(ComponentEventNames.Alternate.Press, event);
        }
    }
}
</script>
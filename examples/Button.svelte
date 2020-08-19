<script>
    /**
     * The simple component button.
     * 
     * @component Button
     * @example
     * <Button text="Click there!" on:click={() => ...} />
     */

    /**
     * The text content of the button.
     * @type {string}
     */
    export let text = '';

    /**
     * The style type of the button.
     * @type {'default'|'primary'|'danger'|'success'}
     */
    export let type = 'default';

    /**
     * The size of the button.
     * @type {'small'|'normal'|'big'}
     */
    export let size = 'normal';
</script>

<button type="button" on:click>
    {text}
</button>
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

    /**
     * Additional options for the button.
     * @type {{ rtl: boolean, lang: string }}
     */
     export let options = { rtl: false, lang: 'en-us' };
</script>

<button type="button" on:click>
    {text}
</button>
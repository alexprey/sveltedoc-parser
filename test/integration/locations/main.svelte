<div ref:block on:click="fire('markupEvent')" on:mousemove>
    <slot name="body"></slot>
</div>

<script>
export default {
    data() {
        return {
            inlineTest: ''
        }
    },
    methods: {
        hello() {
            console.log('hello');
            this.fire('codeEvent');
        }
    }
}
</script>
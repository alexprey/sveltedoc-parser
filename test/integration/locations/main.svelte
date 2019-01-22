<div on:click="fire('markupEvent')">
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
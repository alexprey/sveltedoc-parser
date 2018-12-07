<div class="layout layout__{skin}">
    <div ref:header>
        <Header on:skinChanged="handleSkinChanged(event)">
            {pageHeader}
        </Header>
    </div>
    <div ref:menu>
        <Menu ref:menuComponent>
            {#each menuItems as item}
                <MenuItem {item} />
            {/each}
        </Menu>
    </div>
    <div ref:body>
        <slot></slot>
        
        <hr/>

        <div transition:delay>
            <MarkdownContent content={pageContent} />
        </div>
    </div>
    <div ref:footer>
        <slot name="footer"></slot>
    </div>
</div>

<style>
</style>

<script>
/**
 * The entry-point component for 'Overall' page of Web-Application.
 * @author Alexey Mulyukin
 */
export default {
    components: {
        Header: './Header.svelte',
        Menu: './Menu.svelte',
        MenuItem: './MenuItem.svelte',
        MarkdownContent: './MarkdownContent.svelte'
    },
    data() {
        return {
            /**
             * The skin type for layout.
             * @type {'default'|'night'}
             */
            skin: 'default',
            /**
             * The list of menu items.
             * @public
             */
            menuItems: [],
            /**
             * The page header.
             * @type {string}
             * @public
             */
            pageHeader: '',
            /**
             * The page content.
             * @type {string}
             * @public
             */
            pageContent: '',
            showSkinSelector: false,
            userKpiData: {},
            newsFeedUpdateTimeout: 10,
            copyright: '',
        };
    },
    computed: {
        /**
         * Indicates that mobile device are used.
         */
        isMobile: ({ _ }) => window.innerWidth <= 480,
        hasMenu: ({ menuItems }) => menuItems && menuItems.length > 0
    },
    helpers: {
        window
    },
    methods: {
        /**
         * Do some action based on action name value
         * @param {string} actionName - The name of action that should be performed.
         */
        doAction(actionName) {

        },
        /** @private */
        handleSkinChanged(event) {
            this.set({
                skin: event.value
            });

            this.fire('skinChanged', event);
        }
    },
    actions: {
        tooltip: (node) => {
            return {
                update() {

                },
                destroy() {
                    
                }
            }
        }
    },
    transitions: {
        delay: (node) => {
            return {
                duration: 100,
                delay: 100,
                css: 'visibility: hidden'
            };
        }
    }
}
</script>
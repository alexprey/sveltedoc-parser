/**
 * Represents a data structure of JSDoc keywords, like a `@type {string}`
 */
export interface JSDocKeyword {
    /**
     * The name of keyword.
     * @example for `@param {string} Description of this property`, this field equals a `param`.
     */
    name: string;
    /**
     * The description of keyword.
     * @example for `@param {string} Description of this property`, this field equals a `{string} Description of this property`.
     */
    description: string;
}

export interface JSDocType {
    /**
     * Kind of this type.
     */
    kind: 'type'|'union'|'const',
    /**
     * The text representation of this type.
     */
    text: string,
    /**
     * The type representation of this item.
     * @see `'type'|'const'` in `kind` field, then this field provide the name of JS type.
     * @see `'union'` in `kind` field, then this field provide the list of @see JSDocType  
     */
    type: string|JSDocType[],
    /**
     * The constant value related to this type, if can be provided.
     */
    value?: any
}

/**
 * Represents a source location of symbol.
 */
export interface SourceLocation {
    /**
     * The symbol start offset from document beginning.
     */
    start: number;

    /**
     * The symbol end offset from document beginning.
     */
    end: number;
}

export interface ISvelteItem {
    /**
     * The name of the item.
     */
    name: string;

    /**
     * The source code location of this item.
     * Provided only if requested by specific option parameter.
     * @deprecated This field marked as depricated, please use `locations` instead of this.
     */
    loc?: SourceLocation;

    /**
     * The list of source code locations for this item.
     * Provided only if requested by specific option parameter.
     */
    locations?: SourceLocation[];

    /**
     * The description of the item, provided from related comment.
     */
    description?: string|null;
    /**
     * The visibility of item.
     */
    visibility?: 'public'|'protected'|'private';
    /**
     * The list of parsed JSDoc keywords from related comment.
     */
    keywords?: JSDocKeyword[];
}

export interface SvelteDataBindMapping {
    /**
     * The parent component name or DOM element from which are was binded.
     */
    source: string;

    /**
     * The name of the property which are was binded.
     */
    property: string;
}

export interface SvelteDataItem extends ISvelteItem {
    /**
     * The JS type of property.
     */
    type?: JSDocType;
    /**
     * Kind of variable declaration.
     * @since Svelte V3
     * @since {2.0.0}
     */
    kind?: 'var'|'let'|'const';
    /**
     * Provides information about property binding.
     * @since Svelte V3
     * @since {2.1.0}
     */
    bind?: SvelteDataBindMapping[];
    /**
     * Indicates that this data item of component located in static context.
     * Variable should be declared in `<script scope="module" />` block.
     * @since Svelte V3
     * @since {2.0.0}
     */
    static?: boolean;
    /**
     * Indicates that this data item is declared as a readonly variable.
     * @since Svelte V3
     * @since {2.0.0}
     */
    readonly?: boolean;
    /**
     * The default value of property, if provided.
     */
    value?: any;

    /**
     * The original name of the imported item.
     * Used when aliace are used in import statement.
     * @since Svelte V3
     * @since {2.2.0}
     */
    originalName?: string;
    /**
     * The relative path of importing of this object.
     * When not defined, so variable is not provided.
     * @since Svelte V3
     * @since {2.2.0}
     */
    importPath?: string;
}

export interface SvelteComputedItem extends ISvelteItem {
    /**
     * The list of data or computed properties names, marked as depended to this property.
     */
    dependencies: string[]    
}

export interface SvelteMethodArgumentItem {
    /**
     * The name of method parameter.
     */
    name: string;
    /**
     * The JS type.
     */
    type: JSDocType;
    /**
     * Indicates, that this parameter is repeated.
     */
    repeated?: boolean;
    /**
     * Indicates, that this parameter is optional.
     */
    optional?: boolean;
    /**
     * The default value of optional parameter.
     */
    default?: string;
    /**
     * The description of the parameter.
     */
    description?: string;
    /**
     * Indicates that this data item of component located in static context.
     * Variable should be declared in `<script scope="module" />` block.
     * @since Svelte V3
     * @since {2.0.0}
     */
    static?: boolean;
}

export interface SvelteMethodItem extends ISvelteItem {
    /**
     * The list of parameter items for specified method.
     */
    args?: SvelteMethodArgumentItem[]
}

export interface SvelteComponentItem extends ISvelteItem {
    /**
     * The relative path to improted component.
     * @deprecated Use `importPath` instead of this property.
     */
    value: string;

    /**
     * The relative path of importing of this object.
     * When not defined, so variable is not provided.
     * @since Svelte V3
     * @since {2.2.0}
     */
    importPath?: string;
}

/**
 * Represents the event modificators.
 * 
 * @since Svelte V2.5
 * @since Svelte V3
 * @since {2.0.0}
 */
export type SvelteEventModificator = 'preventDefault'|'stopPropagation'|'passive'|'capture'|'once';

export interface SvelteEventItem extends ISvelteItem {
    /**
     * The name of HTML element if propagated standart JS Dom event or null.
     */
    parent?: string|null;

    /**
     * The list of event modificators.
     */
    modificators?: SvelteEventModificator[];
}

/**
 * The exposed slot parameter.
 * @since Svelte V3
 * @since {2.0.0}
 */
export interface SvelteSlotParameter extends ISvelteItem {

}

export interface SvelteSlotItem extends ISvelteItem {
    /**
     * List of exposed slot parameters.
     * @since Svelte V3
     * @since {2.0.0}
     */
    parameters?: SvelteSlotParameter[];
}

export interface SvelteRefItem extends ISvelteItem {
    /**
     * The name of HTML element or component that binded with this ref name.
     */
    parent?: string|null;
}

/**
 * Represents a Svelte component documentation object.
 */
export interface SvelteComponentDoc {
    /**
     * The name of the parsed component.
     */
    name?: string|null;
    /**
     * The Svelte compiler version that used for this document.
     */
    version?: number,
    /**
     * The component description.
     */
    description?: string|null;

    /**
     * The list of defined model properties.
     */
    data?: SvelteDataItem[];
    /**
     * The list of defined computed properties of component.
     */
    computed?: SvelteComputedItem[];
    
    /**
     * The list of included components.
     */
    components?: SvelteComponentItem[];
    /**
     * The list of fired events from parsed component.
     */
    events?: SvelteEventItem[];
    /**
     * The list of provided slots.
     */
    slots?: SvelteSlotItem[];
    /**
     * The list of references to nodes and components.
     */
    refs?: SvelteRefItem[];

    /**
     * The list of attached methods.
     */
    methods?: SvelteMethodItem[];
    /**
     * The list of attached actions.
     */
    actions?: SvelteMethodItem[];
    /**
     * The list of attached helpers.
     */
    helpers?: SvelteMethodItem[];
    /**
     * The list of transition methods to animate DOM elements.
     */
    transitions?: SvelteMethodItem[];

    /**
     * The list of event dispatchers that was created in this component.
     * @since Svelte V3
     * @since {2.1.0}
     */
    dispatchers?: SvelteMethodItem[];
}
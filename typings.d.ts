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

export interface JSDocTypeBase {
    /**
     * The text representation of this type.
     */
    text: string,
}

export interface JSDocTypeElement extends JSDocTypeBase {
    kind: 'type',
    /**
     * The name of JS type.
     */
    type: string,
}

export interface JSDocTypeConst extends JSDocTypeBase {
    kind: 'const',
    /**
     * The name of JS type.
     */
    type: string,
    /**
     * The constant value related to this type, if can be provided.
     */
    value?: any,
}

export interface JSDocTypeUnion extends JSDocTypeBase {
    kind: 'union',
    /**
     * The list of possible types.
     */
    type: JSDocType[]
}

export type JSDocType = JSDocTypeElement | JSDocTypeConst | JSDocTypeUnion;

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

export type JSVisibilityScope = 'public' | 'protected' | 'private';

export type JSVariableDeclarationKind = 'var' | 'let' | 'const';

export interface ISvelteItem {
    /**
     * The name of the item.
     */
    name: string;

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
    visibility?: JSVisibilityScope;
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
    kind?: JSVariableDeclarationKind;
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
    defaultValue?: any;

    /**
     * The original name of the imported item.
     * Used when aliace are used in import statement.
     * @since Svelte V3
     * @since {2.2.0}
     */
    originalName?: string;

    /**
     * The local name of the prop that was exported with aliace statement
     * @example
     * ```js
     * const local = 1;
     * export { local as public };
     * // `name` of this item will be `'public'`
     * // `localName` of this item will be `'local'`
     * ```
     * @since {3.0.1}
     */
    localName?: string;

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

export interface SvelteMethodParamItem {
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
     * @since {4.0.0}
     */
    defaultValue?: string;
    /**
     * The description of the parameter.
     * @since {4.0.0}
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

/**
 * @deprecated
 */
export type SvelteArgItem = SvelteMethodParamItem;
/**
 * @deprecated
 */
export type SvelteArgumentItem = SvelteMethodParamItem;

export interface SvelteMethodReturnItem {
    /**
     * The JSDocType of the return value.
     */
    type: JSDocType;

    /**
     * The description of the return value.
     */
    description?: string;
}

export interface SvelteMethodItem extends ISvelteItem {
    /**
     * The list of parameter items of the method.
     * @since {4.0.0}
     */
    params?: SvelteMethodParamItem[];

    /**
     * The return item of the method. This exists if an item with 'name' equal
     * to 'returns' or 'return' exists in 'keywords'.
     * @since {4.0.0}
     */
    return?: SvelteMethodReturnItem;
}

export interface SvelteComponentItem extends ISvelteItem {
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
export type SvelteEventModificator = 'preventDefault'|'stopPropagation'|'passive'|'capture'|'once'|'nonpassive';

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
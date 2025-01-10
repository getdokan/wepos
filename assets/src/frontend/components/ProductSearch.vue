<template>
    <div class="search-box" v-click-outside="outside">
        <form action="" autocomplete="off" @submit.prevent="handleProductScan">
            <input type="text" ref="productSearch" name="search" id="product-search" v-model="searchInput" :placeholder="placeholder" @focus.prevent="triggerFocus" @keyup.prevent="searchProducts">
            <span class="search-icon flaticon-musica-searcher" v-if="mode == 'product'"></span>
            <span class="search-icon flaticon-supermarket-scanner" v-if="mode == 'scan'"></span>
            <div class="search-type" v-hotkey="hotkeys">
                <a href="#" :class="{ active: mode == 'product'}" @click.prevent="changeMode('product')">{{ __( 'Product', 'wepos' ) }}</a>
                <a href="#" :class="{ active: mode == 'scan'}" @click.prevent="changeMode('scan')">{{ __( 'Scan', 'wepos' ) }}</a>
            </div>
            <div class="search-result" v-show="showResults && mode=='product'">
                <div v-if="searchableProduct.length">
                    <keyboard-control :listLength="searchableProduct.length" @key-down="onKeyDown" @key-up="onKeyUp">
                        <template slot-scope="{selectedIndex}">
                            <li v-for="(product, index) in searchableProduct" class="product-search-item" :class="{'selected': index === selectedIndex}" :key="index">
                                <template v-if="product.type == 'simple'">
                                    <a href="#" class="wepos-clearfix" @click="addToCartAction( product )">{{ product.name }}
                                        <span class="price">{{ formatPrice( product.price ) }}</span>
                                        <span class="sku" v-if="product.sku">{{ product.sku }}</span>
                                        <span class="action flaticon-enter-arrow wepos-right"></span>
                                    </a>
                                </template>
                                <template v-if="product.type == 'variable'">
                                    <a href="#" class="" @click.prevent="selectVariation( product )">{{ product.name }}
                                        <span class="price">{{ formatPrice( product.price ) }}</span>
                                        <span class="sku" v-if="product.sku">{{ product.sku }}</span>
                                        <span class="action flaticon-enter-arrow wepos-right"></span>
                                    </a>
                                </template>
                            </li>
                        </template>
                    </keyboard-control>
                </div>
                <div v-else class="no-data-found">
                    {{ __( 'No product found', 'wepos' ) }}
                </div>
                <div class="suggession">
                    <span class="term">
                        <span class="flaticon-swap"></span> {{ __( 'to navigate', 'wepos' ) }}
                    </span>
                    <span class="term">
                        <span class="flaticon-enter-arrow"></span> {{ __( 'to select', 'wepos' ) }}
                    </span>
                    <span class="term">
                        <strong>esc</strong> {{ __( 'to dismiss', 'wepos' ) }}
                    </span>
                </div>
            </div>
        </form>
        <modal :title="__( 'Select Variations', 'wepos' )" v-if="showVariationModal" @close="showVariationModal = false" width="500px" height="auto" :footer="true" :header="true">
            <template slot="body">
                <div class="variation-attribute-wrapper" v-for="attribute in selectedVariationProduct.attributes">
                    <div class="attribute">
                        <p>{{ attribute.name }}</p>
                        <div class="options">
                            <template v-for="option in attribute.options">
                                <label>
                                    <input type="radio" v-model="chosenAttribute[attribute.name]" :value="option">
                                    <div class="box">
                                        {{ option }}
                                    </div>
                                </label>
                            </template>
                        </div>
                    </div>
                </div>
            </template>

            <template slot="footer">
                <button class="add-variation-btn" :disabled="attributeDisabled" @click="addVariationProduct()">{{ __( 'Add Product', 'wepos' ) }}</button>
            </template>
        </modal>
    </div>
</template>

<script>
// import Modal from './Modal.vue';
import KeyboardControl from './KeyboardControl.vue';
import VueHotkey from 'v-hotkey';

let Modal = wepos_get_lib( 'Modal' );

export default {
    name: 'ProductInlineSearch',

    props: {
        products: {
            type: Array,
            default() {
                return [];
            }
        },
        settings: {
            type: Object,
            default() {
                return {};
            }
        }
    },

    components : {
        Modal,
        KeyboardControl
    },
    data() {
        return {
            showResults: false,
            showVariationModal: false,
            mode: 'scan',
            searchInput: '',
            searchableProduct: [],
            selectedVariationProduct: {},
            attributeDisabled: true,
            chosenAttribute: {},
        }
    },

    computed: {
        placeholder() {
            return ( this.mode == 'scan' ) ? this.__( 'Scan your product', 'wepos' ) : this.__( 'Search product by typing', 'wepos' );
        },

        hotkeys() {
            return {
                'f1': this.changeProductSearch,
                'f2': this.changeScan,
                'esc': this.searchClose,
            }
        }
    },

    watch: {
        chosenAttribute( newdata, olddata ) {
            if( Object.keys(newdata).length == this.selectedVariationProduct.attributes.length ) {
                this.attributeDisabled = false;
            }
        }
    },

    methods: {
        changeScan(e) {
            e.preventDefault();
            this.changeMode('scan');
        },

        changeProductSearch(e) {
            e.preventDefault();
            this.changeMode('product');
        },

        searchClose() {
            this.showResults = false;
            this.showVariationModal = false;
            this.changeMode('scan');
            this.$refs.productSearch.blur();
        },

        onKeyDown() {
            jQuery('.product-search-item.selected').next().children('a').focus();
        },

        onKeyUp() {
            jQuery('.product-search-item.selected').prev().children('a').focus();
        },

        triggerFocus() {
            this.showResults = true;
            this.$emit( 'onfocus' );
        },

        outside() {
            this.showResults = false;
            this.$emit( 'onblur' );
        },

        changeMode( mode ) {
            this.mode = mode;
            if ( this.mode == 'scan' ) {
                this.searchableProduct = [];
                this.showResults = false;
            }
            this.$refs.productSearch.focus();
        },

        handleProductScan() {
            if ( this.mode == 'product' ) {
                return;
            }
            var generalSettings = this.settings.wepos_general,
                field = generalSettings.barcode_scanner_field == 'custom' ? 'barcode' : generalSettings.barcode_scanner_field,
                selectedProduct = {},
                filterProduct = this.products.filter( (product) => {
                    if ( product.type == 'simple' ) {
                        if ( product[field].toString() == this.searchInput ) {
                            return true;
                        }
                    }
                    if ( product.type == 'variable' ) {
                        var ifFound = false;
                        if ( product.variations.length > 0 ) {
                            weLo_.forEach( product.variations, ( item, key ) => {
                                if ( item[field].toString() == this.searchInput ) {
                                    ifFound = true;
                                }
                            } );
                        }

                        if ( ifFound ) {
                            return true;
                        }
                    }
                    return false;
                } );

            if ( filterProduct.length > 0 ) {
                filterProduct = filterProduct[0];

                if ( filterProduct.type == 'variable' ) {
                    var variations = filterProduct.variations;
                    var selectedVariationProduct = variations.filter( (item) => {
                        if ( item[field].toString() == this.searchInput ) {
                            return true;
                        }
                        return false;
                    } );
                    selectedProduct           = selectedVariationProduct[0];
                    selectedProduct.parent_id = filterProduct.id;
                    selectedProduct.type      = filterProduct.type;
                    selectedProduct.name      = filterProduct.name;

                    this.$emit( 'onProductAdded', selectedProduct );
                } else {
                    this.$emit( 'onProductAdded', filterProduct );
                }
            }

            this.searchInput = '';
        },

        searchProducts( e ) {
            if ( 'product' !== this.mode || ! this.searchInput ) {
                return;
            }

            wepos.productIndexedDb.getProductsBySearchKeyword( this.searchInput ).then( response => {
                const eligibleProducts   = this.filterEligibleProducts( response );
                const eligibleProductIds = this.getProductIds( eligibleProducts );

                this.searchableProduct = this.products.filter( product => eligibleProductIds.includes( product.id ) );
            } );
        },

        selectVariation( product ) {
            this.selectedVariationProduct = product;
            this.showVariationModal       = true;
        },

        addVariationProduct() {
            var chosenVariationProduct = this.findMatchingVariations( this.selectedVariationProduct.variations, this.chosenAttribute );
            var variationProduct       = chosenVariationProduct[0];
            variationProduct.parent_id = this.selectedVariationProduct.id;
            variationProduct.type      = this.selectedVariationProduct.type;
            variationProduct.name      = this.selectedVariationProduct.name;

            this.$emit( 'onProductAdded', variationProduct );
            this.showVariationModal = false;
            this.chosenAttribute = {};
        },

        addToCartAction( product ) {
            this.$emit( 'onProductAdded', product );
        },

        filterEligibleProducts( products = [] ) {
            const eligibleProducts = products.filter( product => {
                if ( null !== product.stock && 0 === Number( product.stock ) ) {
                    return false;
                }

                if ( 0 === Number( product.price ) ) {
                    return false;
                }

                return true;
            } );

            return eligibleProducts;
        },

        getProductIds( products = [] ) {
            const productIds = [];

            products.forEach( product => {
                productIds.push( product.id );
            } );

            return productIds;
        },
    },

    mounted() {
        this.$refs.productSearch.focus();
    }
};


</script>

<style lang="less">

.variation-attribute-wrapper {
    padding: 10px 20px 0px;

    .attribute {
        margin-bottom: 15px;
        p {
            padding: 0;
            margin: 0;
            text-align: left;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .options {
            text-align: left;
            label {
                display: inline-block;
                input[type=radio] {
                    -webkit-appearance: none;
                    display: none;

                    &:checked {
                        + .box {
                            background: #1ABC9C;
                            color: #fff;
                            border: 1px solid #1ABC9C;
                        }
                    }
                }
                .box {
                    padding: 6px 10px;
                    border: 1px solid #E0E5EA;
                    margin-right: 5px;
                    margin-bottom: 5px;
                    cursor: pointer;
                    font-size: 13px;
                    border-radius: 3px;
                }
            }
        }
    }
}

.add-variation-btn {
    border: none;
    padding: 10px 10px;
    background: #3B80F4;
    color: #fff;
    border-radius: 3px;
    width: 150px;
    font-size: 14px;
    cursor: pointer;

    &:focus, &:active {
        outline: none;
    }

    &:disabled {
        background: #76A2ED;
    }
}

</style>

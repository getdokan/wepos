<template>
    <div id="wepos-main" v-cloak v-hotkey="hotkeys">
        <div class="content-product">
            <div class="top-panel wepos-clearfix">
                <div class="search-bar">
                    <product-search @onProductAdded="addToCart" :products="products" :settings="settings"></product-search>
                </div>
                <div class="category">
                    <multiselect
                        class="wepos-multiselect"
                        v-model="selectedCategory"
                        :options="categories"
                        selectLabel=""
                        deselectLabel=""
                        selectedLabel=""
                        :placeholder="__( 'Select a category', 'wepos' )"
                        @select="handleCategorySelect"
                        @remove="handleCategoryRemove"
                    >
                        <template slot="singleLabel" slot-scope="props">
                            {{props.option.name}}
                        </template>
                        <template slot="option" slot-scope="props">
                            <span>
                                <template v-for="pad in props.option.level">
                                    &nbsp;
                                </template>
                                {{ props.option.name }}
                            </span>
                        </template>

                        <template slot="noResult">
                            <div class="no-data-found">{{ __( 'Not found', 'wepos' ) }}</div>
                        </template>
                    </multiselect>
                </div>

                <div class="toggle-view">
                    <div class="product-toggle">
                        <span class="toggle-icon list-view flaticon-menu-button-of-three-horizontal-lines" @click="productView = 'list'" :class="{ active: productView == 'list'}"></span>
                        <span class="toggle-icon grid-view flaticon-menu" @click="productView = 'grid'" :class="{ active: productView == 'grid'}"></span>
                    </div>
                </div>
            </div>

            <div class="breadcrumb" v-if="getBreadCrums.length > 0">
                <ul>
                    <template v-for="breadcrumb in getBreadCrums">
                        <router-link tag="li" :to="{ name: 'Home', query: { category: breadcrumb.id }}">
                            <a>{{ breadcrumb.name }}</a>
                        </router-link>
                    </template>
                </ul>
                <span class="close-breadcrumb flaticon-cancel-music" @click.prevent="removeBreadcrums"></span>
            </div>
            <div class="items-wrapper" :class="productView" ref="items-wrapper">
                <template v-if="!productLoading">
                    <div class="item" v-if="getFilteredProduct.length > 0" v-for="product in getFilteredProduct">
                        <template v-if="product.type === 'simple'">
                            <div class="item-wrap" :class="{ 'disabled': ! hasStock( product ) }" @click.prevent="addToCart(product)">
                                <div class="img">
                                    <img :src="getProductImage(product)" :alt="getProductImageName( product )">
                                </div>
                                <div class="title" v-if="productView === 'grid'">
                                    {{ truncateTitle( product.name, 20 ) }}
                                </div>
                                <div class="title" v-else>
                                    <div class="product-name">{{ product.name }}</div>

                                    <ul class="meta">
                                        <li v-if="product.sku">
                                            <span class="label">{{ __( 'Sku :', 'wepos' ) }}</span>
                                            <span class="value">{{ product.sku }}</span>
                                        </li>
                                        <li>
                                            <span class="label">{{ __( 'Price :', 'wepos' ) }}</span>
                                            <span class="value" v-html="product.price_html"></span>
                                        </li>
                                    </ul>
                                </div>
                                <span class="add-product-icon flaticon-add" :class="productView"></span>
                            </div>
                        </template>

                        <template v-if="product.type === 'variable'">
                            <v-popover offset="10" popover-base-class="product-variation tooltip popover" placement="left-end">
                                <div class="item-wrap" @click="selectVariationProduct( product )">
                                    <div class="img">
                                        <img :src="getProductImage(product)" :alt="getProductImageName( product )">
                                    </div>
                                    <div class="title" v-if="productView === 'grid'">
                                        {{ truncateTitle( product.name, 20 ) }}
                                    </div>
                                    <div class="title" v-else>
                                        <div class="product-name">{{ product.name }}</div>
                                        <ul class="meta">
                                            <li>
                                                <span class="label">{{ __( 'Price :', 'wepos' ) }}</span>
                                                <span class="value" v-html="product.price_html"></span>
                                            </li>
                                        </ul>

                                    </div>
                                    <span class="add-product-icon flaticon-add" :class="productView"></span>
                                </div>
                                <template slot="popover">
                                    <div class="variation-header">
                                        {{ __( 'Select Variations', 'wepos' ) }}
                                    </div>
                                    <div class="variation-body">
                                        <template v-for="attribute in product.attributes">
                                            <div class="attribute">
                                                <p>{{ attribute.name }}</p>
                                                <div class="options">
                                                    <template v-for="option in attribute.options">
                                                        <label>
                                                            <input type="radio" v-model="selectedAttribute[attribute.name]" :value="option">
                                                            <div class="box">
                                                                {{ option }}
                                                            </div>
                                                        </label>
                                                    </template>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                    <div class="variation-footer">
                                        <button :disabled="attributeDisabled" @click.prevent="addVariationProduct">{{ __( 'Add Product', 'wepos' ) }}</button>
                                    </div>
                                </template>
                            </v-popover>
                        </template>
                    </div>
                    <div class="no-product-found" v-if="getFilteredProduct.length <= 0">
                        <img :src="wepos.assets_url+ '/images/no-product.png'" alt="" width="120px">
                        <p>{{ __( 'No Product Found', 'wepos' ) }}</p>
                    </div>
                </template>
                <div class="product-loading" v-if="productLoading">
                    <div class="spinner spinner-loading"></div>
                </div>
            </div>
        </div>
        <div class="content-cart">
            <div class="top-panel">
                <customer-search @onCustomerSelected="selectCustomer"></customer-search>
                <div class="action">
                    <div class="more-options">
                        <v-popover offset="5" popover-base-class="wepos-dropdown-menu tooltip popover" placement="bottom-end" :open="showQucikMenu">
                            <button class="wepos-button" @click.prevent="openQucikMenu()"><span class="more-icon flaticon-more"></span></button>
                            <template slot="popover">
                                <ul>
                                    <component
                                        v-for="(quickLinkListStartComponent, key) in quickLinkListStart"
                                        :key="key-`1`"
                                        :is="quickLinkListStartComponent"
                                    />
                                    <li><a href="#" @click.prevent="emptyCart"><span class="flaticon-empty-cart quick-menu-icon"></span>{{ __( 'Empty Cart', 'wepos' ) }}</a></li>
                                    <li><a href="#" @click.prevent="openHelp"><span class="flaticon-information quick-menu-icon"></span>{{ __( 'Help', 'wepos' ) }}</a></li>
                                    <li class="divider"></li>
                                    <component
                                        v-for="(component, index) in quickLinkList"
                                        :key="index"
                                        :is="component"
                                    />
                                    <li><a href="#" @click.prevent="logout"><span class="flaticon-logout quick-menu-icon"></span>{{ __( 'Logout', 'wepos' ) }}</a></li>
                                </ul>
                            </template>
                        </v-popover>
                    </div>
                </div>
            </div>
            <component
                v-for="(beforCartPanel, key ) in beforCartPanels"
                :key="key"
                :is="beforCartPanel"
            />
            <div class="cart-panel" v-if="settings.wepos_general">
                <div class="cart-content">
                    <table class="cart-table">
                        <thead>
                            <tr>
                                <th width="65%">{{ __( 'Product', 'wepos' ) }}</th>
                                <th width="15%">{{ __( 'Qty', 'wepos' ) }}</th>
                                <th width="30%">{{ __( 'Price', 'wepos' ) }}</th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="cartdata.line_items.length > 0">
                                <template v-for="(item,key) in cartdata.line_items">
                                    <tr>
                                        <td class="name" @click="toggleEditQuantity( item, key )">
                                            {{ item.name }}
                                            <div class="attribute" v-if="item.attribute.length > 0 && item.type === 'variable'">
                                                <ul>
                                                    <li v-for="attribute_item in item.attribute"><span class="attr_name">{{ attribute_item.name }}</span>: <span class="attr_value">{{ attribute_item.option }}</span></li>
                                                </ul>
                                            </div>
                                        </td>
                                        <td class="qty" @click="toggleEditQuantity( item, key )">{{ item.quantity }}</td>
                                        <td class="price" @click="toggleEditQuantity( item, key )">
                                            <template v-if="item.on_sale">
                                                <span class="sale-price">{{ formatPrice( item.quantity*item.sale_price ) }}</span>
                                                <span class="regular-price">{{ formatPrice( item.quantity*item.regular_price ) }}</span>
                                            </template>
                                            <template v-else>
                                                <span class="sale-price">{{ formatPrice( item.quantity*item.regular_price ) }}</span>
                                            </template>
                                        </td>
                                        <td class="action">
                                            <span class="flaticon-right-arrow" :class="{ open: item.editQuantity }" @click.prevent="toggleEditQuantity( item, key )"></span>
                                        </td>
                                        <td class="remove">
                                            <span class="flaticon-cancel-music" @click.prevent="removeItem(key)"></span>
                                        </td>
                                    </tr>
                                    <tr v-if="item.editQuantity" class="update-quantity-wrap">
                                        <td colspan="5">
                                            <span class="qty">{{ __( 'Quantity', 'wepos' ) }}</span>
                                            <span class="qty-number"><input type="number" min="1" step="1" v-model="item.quantity"></span>
                                            <span class="qty-action">
                                                <a href="#" class="add" @click.prevent="addQuantity( item, key )">&#43;</a>
                                                <a href="#" class="minus" @click.prevent="removeQuantity( item, key )">&#45;</a>
                                            </span>
                                        </td>
                                    </tr>
                                </template>
                            </template>
                            <template v-else>
                                <tr class="no-item">
                                    <td colspan="5">
                                        <img :src="wepos.assets_url+ '/images/empty-cart.png'" alt="" width="120px">
                                        <p>{{ __( 'Empty Cart', 'wepos' ) }}</p>
                                    </td>
                                </tr>
                            </template>
                         </tbody>
                    </table>
                </div>
                <div class="cart-calculation">
                    <form autocomplete="off">
                        <table class="cart-total-table">
                            <tbody>
                                <tr class="cart-meta-data">
                                    <td class="label">
                                        {{ __( 'Subtotal', 'wepos' ) }}
                                        <span class="name" v-if="settings.woo_tax.wc_tax_display_cart == 'incl' && $store.getters['Cart/getTotalLineTax'] > 0">
                                            {{ __( 'Including Tax', 'wepos' ) }}
                                        </span>
                                    </td>
                                    <td class="price">{{ formatPrice( $store.getters['Cart/getSubtotal'] ) }}</td>
                                    <td class="action"></td>
                                </tr>

                                <template v-if="cartdata.coupon_lines.length > 0">
                                    <tr class="cart-meta-data" v-for="(fee,key) in cartdata.coupon_lines">
                                        <template v-if="fee.type=='discount'">
                                            <td class="label">{{ __( 'Discount', 'wepos' ) }} <span class="name">{{ getDiscountAmount( fee ) }}</span></td>
                                            <td class="price">&minus;{{ formatPrice( Math.abs( fee.total ) ) }}</td>
                                            <td class="action"><span class="flaticon-cancel-music" @click="removeCouponLine(key)"></span></td>
                                        </template>
                                        <template v-else>
                                            <template v-if="cartdata.coupon_lines[key].isEdit">
                                                <td class="label" colspan="2">
                                                    <input type="text" class="fee-name" v-model="feeData.name" :placeholder="__( 'Fee Name', 'wepos' )" ref="fee_name">
                                                    <input type="number" class="fee-amount" min="0" step="any" v-model="feeData.value" :placeholder="__( 'Total', 'wepos' )" ref="fee_total">
                                                    <template v-if="settings.wepos_general.enable_fee_tax == 'yes'">
                                                        <label for="fee-tax-status"><input type="checkbox" id="fee-tax-status" class="fee-tax-status" v-model="feeData.tax_status" :true-value="'taxable'" :false-value="'none'"> {{ __( 'Taxable', 'wepos' ) }}</label>
                                                        <select class="fee-tax-class" v-model="feeData.tax_class" v-if="feeData.tax_status=='taxable'">
                                                            <option v-for="feeTax in availableTax" :value="feeTax.class == 'standard' ? '' : feeTax.class">{{ unSanitizeString( feeTax.class ) }} - {{ feeTax.percentage_rate }}</option>
                                                        </select>
                                                    </template>
                                                    <button :disabled="feeData.name == ''" @click.prevent="saveFee(key)">{{ __( 'Apply', 'wepos' ) }}</button>
                                                    <button class="cancel" @click.prevent="cancelEditFee(key)">{{ __( 'Cancel', 'wepos' ) }}</button>
                                                </td>
                                                <td class="action"><span class="flaticon-cancel-music" @click="removeCouponLine(key)"></span></td>
                                            </template>
                                            <template v-else>
                                                <td class="label" @dblclick.prevent="editFeeData(key)">{{ __( 'Fee', 'wepos' ) }} <span class="name">{{ fee.name }} {{ getDiscountAmount( fee ) }}</span></td>
                                                <td class="price">{{ formatPrice( Math.abs( fee.total ) ) }}</td>
                                                <td class="action"><span class="flaticon-cancel-music" @click="removeCouponLine(key)"></span></td>
                                            </template>
                                        </template>
                                    </tr>
                                </template>

                                <template v-if="cartdata.fee_lines.length > 0">
                                    <tr class="cart-meta-data" v-for="(fee,key) in cartdata.fee_lines">
                                        <template v-if="fee.type=='discount'">
                                            <td class="label">{{ __( 'Discount', 'wepos' ) }} <span class="name">{{ getDiscountAmount( fee ) }}</span></td>
                                            <td class="price">&minus;{{ formatPrice( Math.abs( fee.total ) ) }}</td>
                                            <td class="action"><span class="flaticon-cancel-music" @click="removeFeeLine(key)"></span></td>
                                        </template>
                                        <template v-else>
                                            <template v-if="cartdata.fee_lines[key].isEdit">
                                                <td class="label" colspan="2">
                                                    <input type="text" class="fee-name" v-model="feeData.name" :placeholder="__( 'Fee Name', 'wepos' )" ref="fee_name">
                                                    <input type="number" class="fee-amount" min="0" step="any" v-model="feeData.value" :placeholder="__( 'Total', 'wepos' )" ref="fee_total">
                                                    <template v-if="settings.wepos_general.enable_fee_tax == 'yes'">
                                                        <label for="fee-tax-status"><input type="checkbox" id="fee-tax-status" class="fee-tax-status" v-model="feeData.tax_status" :true-value="'taxable'" :false-value="'none'"> {{ __( 'Taxable', 'wepos' ) }}</label>
                                                        <select class="fee-tax-class" v-model="feeData.tax_class" v-if="feeData.tax_status=='taxable'">
                                                            <option v-for="feeTax in availableTax" :value="feeTax.class == 'standard' ? '' : feeTax.class">{{ unSanitizeString( feeTax.class ) }} - {{ feeTax.percentage_rate }}</option>
                                                        </select>
                                                    </template>
                                                    <button :disabled="feeData.name == ''" @click.prevent="saveFee(key)">{{ __( 'Apply', 'wepos' ) }}</button>
                                                    <button class="cancel" @click.prevent="cancelEditFee(key)">{{ __( 'Cancel', 'wepos' ) }}</button>
                                                </td>
                                                <td class="action"><span class="flaticon-cancel-music" @click="removeFeeLine(key)"></span></td>
                                            </template>
                                            <template v-else>
                                                <td class="label" @dblclick.prevent="editFeeData(key)">{{ __( 'Fee', 'wepos' ) }} <span class="name">{{ fee.name }} {{ getDiscountAmount( fee ) }}</span></td>
                                                <td class="price">{{ formatPrice( Math.abs( fee.total ) ) }}</td>
                                                <td class="action"><span class="flaticon-cancel-music" @click="removeFeeLine(key)"></span></td>
                                            </template>
                                        </template>
                                    </tr>
                                </template>
                                <tr class="tax" v-if="$store.getters['Cart/getTotalTax']">
                                    <td class="label">{{ settings.woo_tax.wc_tax_display_cart === 'incl' ? __( 'Fee Tax', 'wepos' ) : __( 'Tax', 'wepos' ) }}</td>
                                    <td class="price">{{ formatPrice( $store.getters['Cart/getTotalTax'] ) }}</td>
                                    <td class="action"></td>
                                </tr>
                                <tr class="cart-action">
                                    <td colspan="3">
                                        <fee-keypad @inputfee="setDiscount" :name="__( 'Discount', 'wepos' )" short-key="discount"></fee-keypad>
                                        <fee-keypad @inputfee="setFee" :name="__( 'Fee', 'wepos' )" short-key="fee"></fee-keypad>
                                        <customer-note @addnote="addCustomerNote" v-if="orderdata.customer_note == ''"></customer-note>
                                    </td>
                                </tr>
                                <tr class="note" v-if="orderdata.customer_note">
                                    <td colspan="2" class="note-text">
                                        {{ orderdata.customer_note }}
                                    </td>
                                    <td class="action"><span class="flaticon-cancel-music" @click.prevent="removeCustomerNote"></span></td>
                                </tr>
                                <tr class="pay-now" @click="initPayment()">
                                  <td>{{ __( 'Pay Now', 'wepos' ) }}</td>
                                  <td class="amount">{{ formatPrice( $store.getters['Cart/getTotal'] ) }}</td>
                                  <td class="icon"><span class="flaticon-right-arrow"></span></td>
                                </tr>
                            </tbody>
                        </table>
                    </form>
                </div>
            </div>
        </div>

        <modal v-if="showPaymentReceipt" @close="createNewSale()" width="600px" height="400px" >
            <template slot="body">
                <div class="wepos-payment-receipt">
                    <div class="sale-completed">
                        <img :src="wepos.assets_url+ '/images/sale-completed.png'" alt="" width="120px">
                        <h2>{{ __( 'Sale Completed', 'wepos' ) }}</h2>
                    </div>

                    <div class="print-section">
                        <print-receipt></print-receipt>
                        <button class="new-sale-btn" @click.prevent="createNewSale()">
                            <span class="icon flaticon-add"></span>
                            <span class="label">{{ __( 'New Sale', 'wepos' ) }}</span>
                        </button>
                    </div>
                </div>
            </template>
        </modal>

        <modal v-if="showHelp" @close="closeHelp()" width="700px" height="500px">
            <template slot="body">
                <div class="wepos-help-wrapper">
                    <h2>{{ __( 'Shortcut Keys', 'wepos' ) }}</h2>
                    <ul>
                        <li>
                            <span class="code"><code>f1</code></span>
                            <span class="title">{{ __( 'Search Product', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>f2</code></span>
                            <span class="title">{{ __( 'Scan Product', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>f3</code></span>
                            <span class="title">{{ __( 'Toggle Product View', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>f4</code></span>
                            <span class="title">{{ __( 'Add Fee in cart', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>f5</code></span>
                            <span class="title">{{ __( 'Add Discount in cart', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>f6</code></span>
                            <span class="title">{{ __( 'Add Customer note', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>f7</code></span>
                            <span class="title">{{ __( 'Customer Search', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>shift+f7</code></span>
                            <span class="title">{{ __( 'Add new Customer', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>f8</code></span>
                            <span class="title">{{ __( 'Create New Sale', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>shift+f8</code></span>
                            <span class="title">{{ __( 'Empty your cart', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>f9</code></span>
                            <span class="title">{{ __( 'Go to payment receipt', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>f10</code></span>
                            <span class="title">{{ __( 'Process Payment', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>ctrl/cmd+p</code></span>
                            <span class="title">{{ __( 'Print Receipt', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>ctrl/cmd+?</code></span>
                            <span class="title">{{ __( 'Show/Close(Toggle) Help', 'wepos' ) }}</span>
                        </li>
                        <li>
                            <span class="code"><code>esc</code></span>
                            <span class="title">{{ __( 'Close anything', 'wepos' ) }}</span>
                        </li>
                    </ul>
                </div>
            </template>
        </modal>

        <modal v-if="showModal" @open="focusCashInput()" @close="backToSale()" @enterpressed="processPayment()" width="98%" height="95vh">
            <template slot="body">
                <div class="wepos-checkout-wrapper">
                    <div class="left-content">
                        <div class="header">
                            {{ __( 'Sale Summary', 'wepos' ) }}
                        </div>
                        <div class="content">
                            <table class="sale-summary-cart">
                                <tbody>
                                    <tr v-for="item in cartdata.line_items">
                                        <td class="name">
                                            {{ item.name }}
                                            <div class="attribute" v-if="item.attribute.length > 0 && item.type === 'variable'">
                                                <ul>
                                                    <li v-for="attribute_item in item.attribute"><span class="attr_name">{{ attribute_item.name }}</span>: <span class="attr_value">{{ attribute_item.option }}</span></li>
                                                </ul>
                                            </div>
                                        </td>
                                        <td class="quantity">{{ item.quantity }}</td>
                                        <td class="price">
                                            <template v-if="item.on_sale">
                                                <span class="sale-price">{{ formatPrice( item.quantity*item.sale_price ) }}</span>
                                                <span class="regular-price">{{ formatPrice( item.quantity*item.regular_price ) }}</span>
                                            </template>
                                            <template v-else>
                                                <span class="sale-price">{{ formatPrice( item.quantity*item.regular_price ) }}</span>
                                            </template>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="footer">
                            <ul>
                                <li class="wepos-clearfix">
                                    <span class="wepos-left">
                                        {{ __( 'Subtotal', 'wepos' ) }}
                                        <span class="metadata" v-if="settings.woo_tax.wc_tax_display_cart == 'incl'">
                                            {{ __( 'Including Tax', 'wepos' ) }}
                                        </span>
                                    </span>
                                    <span class="wepos-right">{{ formatPrice( $store.getters['Cart/getSubtotal'] ) }}</span>
                                </li>

                                <template v-if="cartdata.coupon_lines.length > 0">
                                    <li class="wepos-clearfix" v-for="(fee,key) in cartdata.coupon_lines">
                                        <template v-if="fee.type=='discount'">
                                            <span class="wepos-left">{{ __( 'Discount', 'wepos' ) }} <span class="metadata">{{ fee.name }} {{ getDiscountAmount( fee ) }}</span></span>
                                            <span class="wepos-right">-{{ formatPrice( Math.abs( fee.total ) ) }}</span>
                                        </template>
                                        <template v-else>
                                            <span class="wepos-left">{{ __( 'Fee', 'wepos' ) }} <span class="metadata">{{ fee.name }} {{ getDiscountAmount( fee ) }}</span></span>
                                            <span class="wepos-right">{{ formatPrice( fee.total ) }}</span>
                                        </template>
                                    </li>
                                </template>

                                <template v-if="cartdata.fee_lines.length > 0">
                                    <li class="wepos-clearfix" v-for="(fee,key) in cartdata.fee_lines">
                                        <template v-if="fee.type=='discount'">
                                            <span class="wepos-left">{{ __( 'Discount', 'wepos' ) }} <span class="metadata">{{ fee.name }} {{ getDiscountAmount( fee ) }}</span></span>
                                            <span class="wepos-right">-{{ formatPrice( Math.abs( fee.total ) ) }}</span>
                                        </template>
                                        <template v-else>
                                            <span class="wepos-left">{{ __( 'Fee', 'wepos' ) }} <span class="metadata">{{ fee.name }} {{ getDiscountAmount( fee ) }}</span></span>
                                            <span class="wepos-right">{{ formatPrice( fee.total ) }}</span>
                                        </template>
                                    </li>
                                </template>
                                <li class="wepos-clearfix" v-if="$store.getters['Cart/getTotalTax']">
                                    <span class="wepos-left">{{ __( 'Tax', 'wepos' ) }}</span>
                                    <span class="wepos-right">{{ formatPrice( $store.getters['Cart/getTotalTax'] ) }}</span>
                                </li>
                                <li class="wepos-clearfix">
                                    <span class="wepos-left">{{ __( 'Order Total', 'wepos' ) }}</span>
                                    <span class="wepos-right">{{ formatPrice( $store.getters['Cart/getTotal'] ) }}</span>
                                </li>
                                <li class="wepos-clearfix">
                                    <span class="wepos-left">{{ __( 'Pay', 'wepos' ) }}</span>
                                    <span class="wepos-right">{{ formatPrice( $store.getters['Cart/getTotal'] ) }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div class="right-content">
                        <div class="header wepos-clearfix">
                            <h2 class="wepos-left">{{ __( 'Pay', 'wepos' ) }}</h2>
                            <span class="pay-amount wepos-right">{{ formatPrice( $store.getters['Cart/getTotal'] ) }}</span>
                        </div>

                        <div class="content">
                            <div class="payment-gateway">
                                <template v-if="availableGateways.length > 0">
                                    <label v-for="gateway in availableGateways">
                                        <input type="radio" name="gateway" checked :value="gateway.id" v-model="selectedGateway">  <!-- v-model="orderdata.payment_method" -->
                                        <span class="gateway" :class="`gateway-${gateway.id}`">
                                            {{ gateway.title }}
                                        </span>
                                    </label>
                                    <template v-if="emptyGatewayDiv > 0">
                                        <label v-for="n in emptyGatewayDiv" :key="n">
                                            <span class="grid-placeholder"></span>
                                        </label>
                                    </template>
                                </template>
                                <template v-else>
                                    <p>{{ __( 'No gateway found', 'wepos' ) }}</p>
                                </template>
                            </div>
                            <template v-if="orderdata.payment_method=='wepos_cash'">
                                <div class="payment-option">
                                    <div class="payment-amount">
                                        <div class="input-part">
                                            <div class="input-wrap">
                                                <p>{{ __( 'Cash', 'wepos' ) }}</p>
                                                <div class="input-addon">
                                                    <span class="currency">{{ wepos.currency_format_symbol }}</span>
                                                    <input id="input-cash-amount" type="text" v-model="cashAmount" ref="cashamount">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="change-money">
                                            <p>{{ __( 'Change money', 'wepos' ) }}: {{ formatPrice( changeAmount ) }}</p>
                                        </div>
                                    </div>
                                </div>
                            </template>

                            <component
                                v-for="(availableGatewayComponent, key ) in availableGatewayContent"
                                :key="key"
                                :is="availableGatewayComponent"
                                :availablegateways="availableGateways"
                            />
                        </div>

                        <div class="footer wepos-clearfix">
                            <a href="#" class="back-btn wepos-left" @click.prevent="backToSale()">{{ __( 'Back to Sale', 'wepos' ) }}</a>
                            <button class="process-checkout-btn wepos-right" @click.prevent="processPayment" :disabled="! $store.getters['Order/getCanProcessPayment']">{{ __( 'Process Payment', 'wepos' ) }}</button>
                        </div>
                    </div>
                </div>
            </template>
        </modal>

        <overlay :show="showOverlay"></overlay>

        <print-receipt-html v-show="createprintreceipt" v-if="showReceiptHtml" :printdata="printdata" :settings="settings"></print-receipt-html>

        <component
            v-for="(afterMainContent, key ) in afterMainContents"
            :key="key"
            :is="afterMainContent"
            :orderdata="orderdata"
            :printdata="printdata"
        />
    </div>
</template>

<script>

import Overlay from './Overlay.vue';
import ProductSearch from './ProductSearch.vue';
import CustomerSearch from './CustomerSearch.vue';
import FeeKeypad from './FeeKeypad.vue';
import MugenScroll from 'vue-mugen-scroll';
import PrintReceipt from './PrintReceipt.vue';
import PrintReceiptHtml from './PrintReceiptHtml.vue';
import CustomerNote from './CustomerNote.vue';

let Modal = wepos_get_lib( 'Modal' );

export default {

    name: 'Home',

    components : {
        ProductSearch,
        CustomerSearch,
        Overlay,
        Modal,
        MugenScroll,
        FeeKeypad,
        PrintReceipt,
        PrintReceiptHtml,
        CustomerNote
    },

    data () {
        return {
            showHelp: false,
            showQucikMenu: false,
            productView: 'grid',
            productLoading: false,
            viewVariationPopover: false,
            showModal: false,
            showPaymentReceipt: false,
            products: [],
            filteredProducts: [],
            totalPages: 1,
            page: 1,
            showOverlay: false,
            selectedVariationProduct: {},
            attributeDisabled: true,
            selectedAttribute: {},
            availableGateways: [],
            emptyGatewayDiv: 0,
            cashAmount: '',
            availableTax: [],
            settings: {},
            taxSettings: {},
            printdata: wepos.hooks.applyFilters( 'wepos_initial_print_data', {
                gateway: {
                    id: '',
                    title: ''
                },
            } ),
            feeData: {},
            createprintreceipt: false,
            selectedCategory: '',
            selectedGateway: '',
            categories: [],
            showReceiptHtml: wepos.hooks.applyFilters( 'wepos_render_receipt_html', true ),
            quickLinkList: wepos.hooks.applyFilters( 'wepos_quick_links', [] ),
            quickLinkListStart: wepos.hooks.applyFilters( 'wepos_quick_links_start', [] ),
            availableGatewayContent: wepos.hooks.applyFilters( 'wepos_avaialable_gateway_content', [] ),
            afterMainContents: wepos.hooks.applyFilters( 'wepos_after_main_content', [] ),
            beforCartPanels: wepos.hooks.applyFilters( 'wepos_before_cart_panel', [] ),
            couponData: {},
        }
    },
    computed: {
        cartdata() {
            return this.$store.state.Cart.cartdata;
        },
        orderdata() {
            return this.$store.state.Order.orderdata;
        },
        hotkeys() {
            return {
                'f3': this.toggleProductView,
                'f9': this.initPayment,
                'f10': this.processPayment,
                'f8': this.createNewSale,
                'shift+f8': this.emptyCart,
                'esc': this.backToSale,
                'meta+/': this.openHelp,
                'ctrl+/': this.openHelp
            }
        },
        getFilteredProduct() {
            if ( this.$route.query.category !== undefined ) {
                return  this.products.filter( (product) => {
                    var foundCat = weLo_.find( product.categories, { id : parseInt( this.$route.query.category ) } );
                    return foundCat != undefined && Object.keys(foundCat).length > 0;
                } );
            } else {
                return this.products;
            }
        },
        changeAmount() {
            var returnMoney = this.unFormat(this.cashAmount) - this.$store.getters['Cart/getTotal'];
            return returnMoney > 0 ? returnMoney: 0;
        },
        getBreadCrums() {
            if ( this.$route.query.category !== undefined ) {
                var categories = jQuery.extend(true, [], this.categories ),
                    selectedCat = weLo_.find( this.categories, { id: parseInt( this.$route.query.category ) } ),
                    selectedCatIndex = weLo_.findIndex( this.categories, selectedCat );

                var categoriesLoop = categories.splice(0, selectedCatIndex+1);
                var choosenCat = [];
                if ( categoriesLoop.length > 0 ) {
                    for ( var i = categoriesLoop.length-1; i >= 0; i-- ) {
                        if ( choosenCat.length > 0 ) {
                            var foundCat = weLo_.find( categoriesLoop, { id: categoriesLoop[i+1].parent_id } );
                            if ( foundCat != undefined ) {
                                choosenCat.push( foundCat );
                                if (  foundCat.parent_id == null ) {
                                    break
                                }
                            }
                        } else {
                            choosenCat.push( categoriesLoop[i] );
                        }
                    }

                    return choosenCat.slice().reverse();
                }
            }
            return [];
        }
    },

    watch: {
        selectedAttribute( newdata, olddata ) {
            if( Object.keys(newdata).length == this.selectedVariationProduct.attributes.length ) {
                this.attributeDisabled = false;
            }
        },
        '$route.query.order_key'() {
            if ( this.$route.query.order_key != '' && this.$route.query.payment == 'success' ) {
                this.showModal = false;
                this.showPaymentReceipt = true;
            };
        },
        '$route.query.category'() {
            this.selectedCategory = {
                id : -1,
                level: 0,
                name: this.__( 'All categories', 'wepos' ),
                parent_id: null
            };
            if ( this.$route.query.category !== undefined ) {
                this.selectedCategory = weLo_.find( this.categories, { id : parseInt( this.$route.query.category ) } )
            }
        },
        'selectedGateway'( newdata, olddata ) {
            var gateway = weLo_.find( this.availableGateways, { 'id' : newdata } );
            this.$store.dispatch( 'Order/setGatewayAction', gateway );
        },

        cashAmount( newdata, olddata ) {
            this.ableToProcess();
        },
    },

    methods: {
        openQucikMenu() {
            this.showQucikMenu = true;
        },
        openHelp(e) {
            e.preventDefault();
            this.showHelp = true;
            this.showQucikMenu = false;
        },
        closeHelp() {
            this.showHelp = false;
        },
        addCustomerNote( note ) {
            this.$store.dispatch( 'Order/setCustomerNoteAction', note );
        },
        removeCustomerNote() {
            this.$store.dispatch( 'Order/removeCustomerNoteAction' );
        },
        removeBreadcrums() {
            this.$router.push( { name: 'Home' } );
        },
        logout() {
            wepos.hooks.doAction( 'wepos_before_logout' );
            window.location.href = wepos.logout_url.toString();
        },
        emptyCart() {
            this.$store.dispatch( 'Cart/emptyCartAction' );
            this.$store.dispatch( 'Order/emptyOrderdataAction' );

            this.printdata = wepos.hooks.applyFilters( 'wepos_initial_print_data', {
                gateway: {
                    id: '',
                    title: ''
                },
            } );

            this.showPaymentReceipt = false;
            this.cashAmount = '';
            this.eventBus.$emit( 'emptycart', this.orderdata );
            this.showQucikMenu = false;
        },
        toggleProductView(e) {
            e.preventDefault();
            this.productView = ( this.productView == 'grid' ) ? 'list' : 'grid';
        },
        createNewSale() {
            this.$router.push({
                name: 'Home',
            });
            this.emptyCart();
        },
        ableToProcess() {
            let canProcess = this.cartdata.line_items.length > 0 && this.isSelectGateway();

            if( this.selectedGateway === 'wepos_cash' ) {
                 canProcess = this.unFormat(this.cashAmount)
                    >= this.truncateNumber(this.$store.getters['Cart/getTotal'])
                    && canProcess;
            }

            console.log( canProcess );

            this.$store.dispatch( 'Order/setCanProcessPaymentAction', canProcess );
        },
        processPayment(e) {
            if ( ! this.$store.getters['Order/getCanProcessPayment'] ) {
                return;
            }
            var self = this,
                gateway = weLo_.find( this.availableGateways, { 'id' : this.orderdata.payment_method } ),
                orderdata = wepos.hooks.applyFilters( 'wepos_order_form_data', {
                    billing: this.orderdata.billing,
                    shipping: this.orderdata.shipping,
                    line_items: this.cartdata.line_items,
                    fee_lines: this.cartdata.fee_lines,
                    coupon_lines: this.cartdata.coupon_lines,
                    customer_id: this.orderdata.customer_id,
                    customer_note: this.orderdata.customer_note,
                    payment_method: this.orderdata.payment_method,
                    payment_method_title: this.orderdata.payment_method_title,
                    meta_data: [
                        {
                            key: '_wepos_is_pos_order',
                            value: true
                        },
                        {
                            key: '_wepos_cash_tendered_amount',
                            value: self.cashAmount.toString()
                        },
                        {
                            key: '_wepos_cash_change_amount',
                            value: self.changeAmount.toString()
                        }
                    ]
                }, this.orderdata, this.cartdata );

            var $contentWrap = jQuery('.wepos-checkout-wrapper');
            $contentWrap.block({ message: null, overlayCSS: { background: '#fff url(' + wepos.ajax_loader + ') no-repeat center', opacity: 0.4 } });

            wepos.api.post( wepos.rest.root + wepos.rest.wcversion + '/orders', orderdata )
            .done( response => {
                const orderResult = response;
                const totalTaxes  = {};

                // Looping through line items and get total tax for each items.
                orderResult.line_items.forEach( item => {
                    totalTaxes[item.product_id] = item.total_tax
                } );

                // Preserve total tax amount for each of the line items to the cart.
                this.cartdata.line_items.forEach( item => {
                    item.total_tax = totalTaxes[ item.product_id ];
                } );

                wepos.api.post( wepos.rest.root + wepos.rest.posversion + '/payment/process', response )
                .done( data => {
                    if ( data.result == 'success' ) {
                        this.$router.push({
                            name: 'Home',
                            query: {
                                order_key: response.order_key,
                                payment: 'success'
                            }
                        });

                        this.printdata = wepos.hooks.applyFilters( 'wepos_after_payment_print_data', {
                            line_items: this.cartdata.line_items,
                            fee_lines: this.cartdata.fee_lines,
                            coupon_lines: this.cartdata.coupon_lines,
                            subtotal: this.$store.getters['Cart/getSubtotal'],
                            taxtotal: this.$store.getters['Cart/getTotalTax'],
                            ordertotal: this.$store.getters['Cart/getTotal'],
                            gateway: {
                                id: response.payment_method,
                                title: response.payment_method_title
                            },
                            order_id: response.number,
                            order_date: response.date_created,
                            cashamount: this.cashAmount.toString(),
                            changeamount: this.changeAmount.toString()
                        }, orderdata );

                        $contentWrap.unblock();
                    } else {
                        $contentWrap.unblock();
                    }
                }).fail( data => {
                    $contentWrap.unblock();
                    alert( data.responseJSON.message );
                });
            }).fail( response => {
                $contentWrap.unblock();
                alert( response.responseJSON.message );
            } );
        },

        initPayment() {
            if( this.$store.state.Cart.cartdata.line_items.length <= 0 ) {
              return;
            }

            this.showModal = true;
            this.$store.dispatch( 'Order/setGatewayAction', this.availableGateways[0] );
            this.selectedGateway = this.availableGateways[0].id;
        },

        backToSale() {
            this.showModal = false;
            this.showHelp = false;
            // Remove gateway selections
        },
        isSelectGateway() {
            return !( this.orderdata.payment_method == undefined || this.orderdata.payment_method == '' );
        },
        getProductImage(product) {
            return ( product.images.length > 0 ) ? product.images[0].woocommerce_thumbnail : wepos.placeholder_image;
        },
        getProductImageName(product) {
            return ( product.images.length > 0 ) ? product.images[0].name : product.name;
        },
        setDiscount( value, type ) {
            this.createCoupon( value, type, this.dispatchCoupon );
        },
        createCoupon( amount, discount_type, callback ) {
            let self = this;
            let id   = Date.now();
            let code = discount_type + id + amount;

            self.couponData = {};

            const discountdata = {
                code: code,
                amount: amount,
                usage_limit: 1,
                meta_data : [
                    {
                        key: 'wepos_cart_discount',
                        value: 'yes',
                    },
                ],
            }

            if ( 'percent' ===  discount_type ) {
                discountdata.discount_type = discount_type;
            }

            wepos.api.post( wepos.rest.root + wepos.rest.posversion + '/coupons', discountdata )
                .done( data => {
                    self.couponData = data;

                    callback( data, discount_type );
                } ).fail( data => {
                    alert( data.responseJSON.message );
            } );
        },
        dispatchCoupon( couponData, type ) {
            this.$store.dispatch(
                'Cart/addDiscountAction',
                {
                    title: this.__( 'Discount', 'wepos' ),
                    value: couponData,
                    type
                }
            );
        },
        saveFee( key ) {
            this.$store.dispatch( 'Cart/saveFeeValueAction', { key: key, feeData: this.feeData } );
            this.feeData = {};
        },
        cancelEditFee( key ) {
            this.$store.dispatch( 'Cart/cancelSaveFeeValueAction', key );
            this.feeData = {};
        },
        editFeeData(key) {
            this.$store.dispatch( 'Cart/editFeeValueAction', key );
            this.feeData = Object.assign( {}, this.cartdata.fee_lines[key] );
            this.$nextTick(() => {
                jQuery( this.$refs.fee_name ).focus();
            })
        },
        setFee( value, type ) {
            this.$store.dispatch( 'Cart/addFeeAction', { title: this.__( 'Fee', 'wepos' ), value: value, type: type } );
        },
        removeCouponLine( key ) {
            this.$store.dispatch( 'Cart/removeCouponLineItemsAction', key );
        },
        removeFeeLine( key ) {
            this.$store.dispatch( 'Cart/removeFeeLineItemsAction', key );
        },
        getDiscountAmount( fee ) {
            return fee.discount_type === 'percent' || fee.fee_type === 'percent' ? this.formatNumber( fee.value ) + '%' : this.formatPrice( fee.total );
        },
        fetchProducts() {
            if ( this.page == 1 ) {
                this.productLoading = true;
            }

            if ( ( this.totalPages >= this.page ) ) {
                wepos.api.get( wepos.rest.root + wepos.rest.posversion + '/products?status=publish&per_page=30&page=' + this.page )
                .done( ( response, status, xhr ) => {
                    this.appendProducts( response );
                    this.page += 1;
                    this.totalPages = parseInt( xhr.getResponseHeader('X-WP-TotalPages') );
                    this.productLoading = false;
                }).then( ( response, status, xhr ) => {
                    this.fetchProducts();
                });
            } else {
                this.productLoading = false;
            }
        },
        appendProducts( products ) {
            products.forEach( product => {
                if ( "variable" === product.type && this.isAllVariationsDisabled( product ) ) {
                    return;
                }

                this.products = this.products.concat( product );
            });
        },
        isAllVariationsDisabled( product ) {
            let isDisabled = true;

            product.attributes.forEach( attribute => {
                if ( true === attribute.variation ) {
                    isDisabled = false;
                }
            } );

            return isDisabled;
        },
        maybeRemoveDeletedProduct( cartData ) {
            return new Promise( ( resolve, reject ) => {
                if ( ! cartData ) {
                    return resolve( cartData );
                }

                if ( ! cartData.line_items || cartData.line_items.length < 1 ) {
                    return resolve( cartData );
                }

                let productIds = cartData.line_items.map( ( lineItem ) => {
                    return lineItem.product_id;
                });

                wepos.api.get( wepos.rest.root + wepos.rest.posversion + '/products?include=' + productIds.toString() )
                .then( ( response ) => {
                    let foundProducts = response.map( ( product ) => {
                        return product.id;
                    });

                    cartData.line_items.forEach( ( product, key ) => {
                        if ( ! foundProducts.includes( product.product_id ) ) {
                            cartData.line_items.splice( key, 1 );
                            localStorage.setItem( 'cartdata', JSON.stringify( cartData ) );
                        }
                    });

                    return resolve( cartData );
                })
                .fail( () => {
                    return reject( cartData );
                });
            });
        },

        selectCustomer( customer ) {
            this.$store.dispatch( 'Order/setCustomerAction', customer );
        },
        selectVariationProduct( product ) {
            this.viewVariationPopover = true;
            this.selectedVariationProduct = product;
        },
        addVariationProduct() {
            let chosenVariationProduct = this.findMatchingVariations( this.selectedVariationProduct.variations, this.selectedAttribute );
            let variationProduct       = chosenVariationProduct[0];

            if ( ! this.hasStock( variationProduct ) ) {
                this.toast( {
                    title: this.__( 'This product is out of stock.', 'wepos' ),
                    type: 'error',
                });
            }

            variationProduct.parent_id = this.selectedVariationProduct.id;
            variationProduct.type      = this.selectedVariationProduct.type;
            variationProduct.name      = this.selectedVariationProduct.name;
            variationProduct.type      = this.selectedVariationProduct.type;
            this.selectedAttribute     = {};
            this.attributeDisabled     = true;
            this.$store.dispatch( 'Cart/addToCartAction', variationProduct );
        },
        addToCart( product ) {
            if ( ! this.hasStock( product ) ) {
                this.toast( {
                    title: this.__( 'Product is out of stock!', 'wepos-pro' ),
                    type: 'error',
                } );
                return;
            }

            this.$store.dispatch( 'Cart/addToCartAction', product );
        },
        toggleEditQuantity( product, key ) {
            this.$store.dispatch( 'Cart/toggleEditQuantityAction', key );
        },
        removeItem( key ) {
            this.$store.dispatch( 'Cart/removeCartItemAction', key );
        },
        addQuantity( item, key ) {
            this.$store.dispatch( 'Cart/addItemQuantityAction', key );
        },
        removeQuantity( item, key ) {
            this.$store.dispatch( 'Cart/removeItemQuantityAction', key );
        },
        fetchGateway() {
            wepos.api.get( wepos.rest.root + wepos.rest.posversion + '/payment/gateways' )
            .done( response => {
                this.availableGateways = response;
                this.emptyGatewayDiv = 4-(this.availableGateways.length%4);
            });
        },
        truncateTitle( text, length ) {
            return weLo_.truncate( text, { 'length' : length });
        },
        unSanitizeString( str ) {
            return str.split('-').map(function capitalize(part) {
                return part.charAt(0).toUpperCase() + part.slice(1);
            }).join(' ');
        },
        fetchSettings() {
            wepos.api.get( wepos.rest.root + wepos.rest.posversion + '/settings' )
            .done( response => {
                this.settings = response;
                this.$store.dispatch( 'Cart/setSettingsAction', response );
            });
        },
        fetchTaxes() {
            wepos.api.get( wepos.rest.root + wepos.rest.posversion + '/taxes' )
            .done( response => {
                this.availableTax = response;
                this.$store.dispatch( 'Cart/setAvailableTaxAction', response );
            });
        },
        handleCategorySelect( selectedOption, id ) {
            if ( selectedOption.id == '-1' ) {
                this.$router.push( { name: 'Home' } );
            } else {
                this.$router.push( { name: 'Home', query: { 'category' : selectedOption.id } } );
            }
        },
        handleCategoryRemove( selectedOption, id ) {
            this.$router.push( { name: 'Home' } );
            this.selectedCategory = {
                id : -1,
                level: 0,
                name: this.__( 'All categories', 'wepos' ),
                parent_id: null
            };
        },
        fetchCategories() {
            wepos.api.get( wepos.rest.root + wepos.rest.wcversion + '/products/categories?hide_empty=true&_fields=id,name,parent_id&per_page=100' )
            .then( response => {
                response.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
                var tree = function (response, root) {
                    var r = [], o = {};
                    response.forEach(function (a) {
                        o[a.id] = { response: a, children: o[a.id] && o[a.id].children };
                        if (a.parent_id === root) {
                            r.push(o[a.id]);
                        } else {
                            o[a.parent_id] = o[a.parent_id] || {};
                            o[a.parent_id].children = o[a.parent_id].children || [];
                            o[a.parent_id].children.push(o[a.id]);
                        }
                    });
                    return r;
                }(response, null);

                var selectedCat = {
                    id : -1,
                    level: 0,
                    name: this.__( 'All categories', 'wepos' ),
                    parent_id: null
                };
                var sorted = tree.reduce(function traverse(level) {
                    return function (r, a) {
                        a.response.level = level
                        return r.concat(a.response, (a.children || []).reduce(traverse(level + 1), []));
                    };
                }(0), []);
                this.categories = sorted;

                this.categories.unshift( selectedCat );
                this.selectedCategory = selectedCat;

                if ( this.$route.query.category !== undefined ) {
                    this.selectedCategory = weLo_.find( response, { id : parseInt( this.$route.query.category ) } );
                }
            } );
        },
        filterProducts() {
            this.products = this.products.filter( ( product ) => {
                return weLo_.findIndex( product.categories, { id : this.$route.query.category } ) > 0;
            } );
        },

        fetchTaxSettings() {
            wepos.api.get( wepos.rest.root + wepos.rest.wcversion + '/settings/tax' )
            .done( response => {
                this.taxSettings = response;
            });
        },

        focusCashInput() {
            let inputCashAmount = document.querySelector('#input-cash-amount');
            inputCashAmount.focus();
        },
    },

    async created() {
        this.fetchSettings();
        this.fetchTaxes();
        this.fetchProducts();
        this.fetchGateway();
        this.fetchCategories();
        // this.fetchTaxSettings();

        if ( typeof(localStorage) != 'undefined' ) {
            try {
                var cartdata = JSON.parse( localStorage.getItem( 'cartdata' ) );
                var orderdata = JSON.parse( localStorage.getItem( 'orderdata' ) );
                cartdata = await this.maybeRemoveDeletedProduct( cartdata );
                this.$store.dispatch( 'Cart/setCartDataAction', cartdata );
                this.$store.dispatch( 'Order/setOrderDataAction', orderdata );
            } catch( cartdata ) {
                var orderdata = JSON.parse( localStorage.getItem( 'orderdata' ) );
                this.$store.dispatch( 'Cart/setCartDataAction', cartdata );
                this.$store.dispatch( 'Order/setOrderDataAction', orderdata );
            }
        }

        window.addEventListener('beforeunload', () => {
            if ( typeof( localStorage ) != 'undefined' ) {
                localStorage.setItem( 'cartdata', JSON.stringify( this.$store.state.Cart.cartdata ) );
                localStorage.setItem( 'orderdata', JSON.stringify( this.$store.state.Order.orderdata ) );
            }
        }, false)
    }
};
</script>

<style lang="less">

#wepos-main {
    padding: 20px;
    display: flex;

    .content-product {
        flex: 2;
        margin-right: 20px;

        .top-panel {
            // display: flex;
            margin-bottom: 20px;

            .search-bar {
                width: 56%;
                margin-right: 2%;
                float:left;

                .search-box {
                    position: relative;

                    input#product-search {
                        width: 100%;
                        font-size: 14px;
                        height: 35px;
                        border: 1px solid #E9EDF0;
                        line-height: 10px;
                        padding-right: 120px;
                        padding-left: 32px;
                        box-sizing: border-box;
                        border-radius: 3px;
                        box-shadow: 0 3px 15px 0 rgba(0,0,0,.02);

                        &::placeholder {
                            color: #999DAC;
                            font-size: 13px;
                        }

                        &:-ms-input-placeholder {
                            color: #999DAC;
                            font-size: 13px;
                        }

                        &::-ms-input-placeholder {
                            color: #999DAC;
                            font-size: 13px;
                        }

                        &:focus {
                            outline: none;
                        }
                    }

                    span.search-icon {
                        position: absolute;
                        left: 10px;
                        top: 8px;
                        color: #3B80F4;
                        height: 10px;

                        &:before {
                            font-size: 14px;
                        }
                    }

                    .search-type {
                        position: absolute;
                        top: 0px;
                        right: 0;

                        a {
                            text-decoration: none;
                            font-size: 13px;
                            display: inline-block;
                            height: 35px;
                            padding: 10px;
                            box-sizing: border-box;
                            margin-left: -2px;
                            color: #BDC0C9;
                            line-height: 14px;

                            &.active {
                                background: #3B80F4;
                                color: #fff;
                            }
                            &:first-child {
                                border-left: 1px solid #E9EBED;
                            }
                            &:last-child {
                                border-top-right-radius: 3px;
                                border-bottom-right-radius: 3px;
                            }
                        }
                    }

                    .search-result {
                        background: #fff;
                        position: absolute;
                        width: 100%;
                        box-sizing: border-box;
                        border: 1px solid #e9edf0;
                        border-top: none;
                        border-bottom-left-radius: 3px;
                        border-bottom-right-radius: 3px;
                        box-shadow: 0 30px 45px -10px rgba(0,0,0,.2);
                        z-index: 999;
                        .no-data-found {
                            padding: 20px;
                            text-align: center;
                            color: #758598;
                        }

                        ul {
                            margin: 0;
                            padding: 0;
                            list-style-type: none;
                            max-height: 300px;
                            overflow: scroll;
                            li {
                                a {
                                    text-decoration: none;
                                    color: #212121;
                                    padding: 8px 10px;
                                    display: block;
                                    border-bottom: 1px solid #e9edf0;

                                    span {
                                        font-size: 11px;
                                        color: #758598;
                                        margin-left: 10px;

                                        &.action {
                                            visibility: hidden;

                                            &:before {
                                                font-size: 12px;
                                            }
                                        }
                                    }

                                    &:hover {
                                        span.action {
                                            visibility: visible;
                                        }
                                    }
                                }

                                &:last-child {
                                    a {
                                        border-bottom: none;
                                    }
                                }

                                &.selected {
                                    background: #f6f7fb;
                                    a {
                                        span.action {
                                            visibility: visible;
                                        }
                                    }
                                }
                            }
                        }

                        .suggession {
                            padding: 12px;
                            background: #F6F7FB;
                            color: #999DAC;
                            font-size: 11px;
                            border-top: 1px solid #ECEEF0;

                            span.term {
                                margin-right: 15px;

                                span {
                                    &:before {
                                        font-size: 9px;
                                        color: #5D5D5D;
                                        margin-right: 2px;
                                    }
                                }

                                strong {
                                    color: #5D5D5D;
                                    margin-right: 2px;
                                }
                            }
                        }
                    }
                }
            }

            .category {
                width: 26%;
                margin-right: 2%;
                float:left;
                position: relative;

                select#product-category {
                    -moz-appearance:none; /* Firefox */
                    -webkit-appearance:none; /* Safari and Chrome */
                    appearance:none;

                    width: 100%;
                    border: 1px solid #E9EDF0;
                    background: #fff;
                    padding: 9px;
                    border-radius: 3px;
                    box-sizing: border-box;
                    font-size: 13px;
                    color: #758598;
                    box-shadow: 0 3px 15px 0 rgba(0,0,0,.02);

                    &:focus {
                        outline: none;
                    }
                }

                span.select-arrow {
                    position: absolute;
                    top: 9px;
                    right: 9px;

                    &:before {
                        font-size: 13px;
                        color: #758598;
                        margin-left: 0px;
                    }
                }

            }
            .toggle-view {
                width: 14%;
                float: left;
                text-align: right;

                .toggle-icon {
                    padding: 8px 10px;
                    background: #fff;
                    display: inline-block;
                    border: 1px solid #E9EDF0;
                    box-shadow: 0 3px 15px 0 rgba(0,0,0,.02);
                    color: #BDC0C9;
                    cursor: pointer;

                    &.active {
                        color: #3B80F4;
                    }

                    &:before {
                        margin-left: 0px;
                        font-size: 13px;
                    }

                    &.list-view {
                        margin-right: -4px;
                        border-right: none;
                    }
                }
            }
        }

        .breadcrumb {
            background: #fff;
            box-shadow: 0 3px 15px 0 rgba(0,0,0,.02);
            padding: 8px 12px;
            position: relative;
            margin-bottom: 20px;

            span.close-breadcrumb {
                position: absolute;
                top: 5px;
                right: 15px;
                color: #9b59b6;
                cursor: pointer;

                &:before {
                    font-size: 9px;
                }
            }

            ul {
                margin: 0px;
                padding: 0px;
                line-height: 16px;

                li {
                    display: inline-block;

                    &:after {
                        font-family: 'Flaticon';
                        content: '\f10b';
                        font-size: 9px;
                        margin-left: 7px;
                        margin-right: 4px;
                        color: #758598;
                    }

                    &:last-child {
                        &:after {
                            content: '';
                        }
                    }

                    a {
                        font-size: 13px;
                        color: #9B59B6;
                        text-decoration: none;
                    }
                }
            }
        }

        .items-wrapper {
            &.grid {
                display: flex;
                flex-flow: row wrap;
                justify-content: flex-start;
                margin: 0 -10px;
                overflow: auto;
                height: 84.9vh;
                .item {
                    flex-basis: 20%;
                    -ms-flex: auto;
                    box-sizing: border-box;
                    text-align: center;
                    padding: 0 10px;
                    margin-bottom: 20px;
                    &:focus {
                        outline: none;
                    }
                    .item-wrap {
                        background: #fff;
                        margin-bottom: -2px;
                        cursor: pointer;
                        position: relative;
                        &:focus {
                            outline: none;
                            -webkit-appearance:none
                        }
                        img {
                            width: 100%;
                        }

                        .title {
                            padding: 10px 5px;
                            margin-top: -3px;
                            color: #212121;
                            font-size: 13px;
                            border-top: 1px solid #E9EDF0;
                        }
                        .add-product-icon {
                            position: absolute;
                            top: 0;
                            right: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0,0,0,0.3);
                            visibility: hidden;
                            &:before {
                                color: #fff;
                                font-weight: normal;
                                margin-top: 40%;
                                display: inline-block;
                                font-size: 35px;
                                text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
                            }
                        }

                        &:hover {
                            .add-product-icon {
                                visibility: visible;
                            }
                        }
                    }

                    .disabled {
                        border: 1px solid #ffcbcb;
                        opacity: 0.4;
                        cursor: not-allowed;
                    }
                }
            }
            &.list {
                overflow: auto;
                height: 84.9vh;
                .item {
                    .item-wrap {
                        background: #fff;
                        overflow: hidden;
                        position: relative;
                        margin-bottom: 20px;
                        cursor: pointer;
                        border-radius: 3px;
                        box-shadow: 0 3px 15px 0 rgba(0,0,0,.02);
                        .img {
                            width: 80px;
                            height: 80px;
                            float: left;
                            margin-right: 20px;
                            border-right: 1px solid #F0F2F4;
                            img {
                                width: 100%;
                                height: 100%;
                            }
                        }

                        .title {
                            float: left;
                            height: 100%;
                            font-size: 14px;
                            font-weight: bold;
                            position: absolute;
                            top: 40px;
                            left: 100px;
                            height: 44px;
                            margin-top: -22px;
                            max-width: 78%;

                            .product-name {
                                margin-bottom: 8px;
                            }

                            ul.meta {
                                margin: 0;
                                padding: 0;
                                list-style: none;
                                font-size: 13px;
                                font-weight: normal;

                                li {
                                    display: inline-block;

                                    .label {
                                        color: #758598;
                                        margin-right: 3px;
                                    }

                                    .value {
                                        del {
                                            color: #9095a5;
                                            margin-right: 3px;
                                        }
                                    }

                                    &:after {
                                        content: "|";
                                        color: #e9ebed;
                                        display: inline-block;
                                        margin: 0px 7px;
                                    }

                                    &:last-child {
                                        &:after {
                                            content: "";
                                        }
                                    }
                                }
                            }
                        }
                        .add-product-icon {
                            position: absolute;
                            top: 35%;
                            right: 3%;
                            &:before {
                                color: #1A9ED4;
                                font-weight: normal;
                            }
                        }
                    }
                }
            }
            .product-loading {
                display: block;
                position: relative;
                width: 100%;
                padding: 10px;
                text-align: center;
                font-size: 16px;
                color: #c6cace;
            }
            .no-product-found {
                text-align: center;
                width: 100%;
                vertical-align: middle;
                margin: auto 0px;

                p {
                    font-size: 18px;
                    color: #c6cace;
                }
            }
        }
    }

    .content-cart {
        flex: 1.3;
        height: 94.5vh;

        .top-panel {
            display: flex;
            margin-bottom: 20px;

            .customer-search-box {
                flex: 7;
                position: relative;

                input#customer-search {
                    width: 100%;
                    padding: 10px;
                    height: 33px;
                    font-size: 14px;
                    height: 35px;
                    border: 1px solid #E9EDF0;
                    line-height: 10px;
                    padding-left: 35px;
                    box-sizing: border-box;
                    border-radius: 3px;
                    box-shadow: 0 3px 15px 0 rgba(0,0,0,.02);

                    &::placeholder {
                        color: #999DAC;
                        font-size: 13px;
                    }

                    &:-ms-input-placeholder {
                        color: #999DAC;
                        font-size: 13px;
                    }

                    &::-ms-input-placeholder {
                        color: #999DAC;
                        font-size: 13px;
                    }

                    &:focus {
                        outline: none;
                    }
                }

                span.add-new-customer {
                    position: absolute;
                    top: 9px;
                    right: 10px;

                    &:before {
                        font-size: 15px;
                        color: #BDC0C9;
                        cursor: pointer;
                    }
                }

                .search-result {
                    background: #fff;
                    position: absolute;
                    width: 100%;
                    z-index: 99;
                    box-sizing: border-box;
                    border: 1px solid #e9edf0;
                    border-top: none;
                    border-bottom-left-radius: 3px;
                    border-bottom-right-radius: 3px;
                    box-shadow: 0 30px 45px -10px rgba(0,0,0,.2);

                    .no-data-found {
                        padding: 20px;
                        text-align: center;
                        color: #758598;
                    }

                    ul {
                        margin: 0;
                        padding: 0;
                        list-style-type: none;
                        max-height: 300px;
                        overflow: scroll;
                        li {
                            a {
                                text-decoration: none;
                                color: #212121;
                                padding: 8px 10px;
                                display: block;
                                border-bottom: 1px solid #e9edf0;

                                span {
                                    font-size: 13px;
                                    color: #758598;
                                    margin-left: 10px;

                                    &.avatar {
                                        img {
                                            width: 20px;
                                            border-radius: 20px;
                                        }
                                    }

                                    &.name {
                                        font-size: 14px;
                                        color: #212121;
                                        margin-left: 6px;
                                        line-height: 18px;
                                    }

                                    &.action {
                                        visibility: hidden;

                                        &:before {
                                            font-size: 12px;
                                        }
                                    }
                                }

                                &:hover {
                                    span.action {
                                        visibility: visible;
                                    }
                                }
                            }

                            &:last-child {
                                a {
                                    border-bottom: none;
                                }
                            }
                            &.selected {
                                background: #f6f7fb;
                                a {
                                    span.action {
                                        visibility: visible;
                                    }
                                }
                            }
                        }
                    }

                    .suggession {
                        padding: 12px;
                        background: #F6F7FB;
                        color: #999DAC;
                        font-size: 11px;
                        border-top: 1px solid #ECEEF0;

                        span.term {
                            margin-right: 15px;

                            span {
                                &:before {
                                    font-size: 9px;
                                    color: #5D5D5D;
                                    margin-right: 2px;
                                }
                            }

                            strong {
                                color: #5D5D5D;
                                margin-right: 2px;
                            }
                        }
                    }
                }


                svg.customer-icon {
                    position: absolute;
                    left: 10px;
                    top: 8px;
                }
            }

            .action {
                flex: 1;

                .more-options {
                    text-align: right;

                    span.more-icon {
                        &:before {
                            font-size: 16px;
                            color: #BDC0C9;
                        }
                    }
                }
            }
        }

        .cart-panel {
            background: #fff;
            height: 90%;
            box-shadow: 0 3px 15px 0 rgba(0,0,0,.02);
            position: relative;
            display: flex;
            flex-flow: column wrap;
            border-radius: 3px;

            .cart-calculation {
                width: 100%;
                flex-grow: 0;

                table.cart-total-table {
                    width: 100%;
                    border-collapse: collapse;

                    tbody {
                        tr {
                            border-bottom: 1px solid #ECEEF0;
                            height: 35px;
                            display: table-row;
                            line-height: 20px;

                            &:first-child {
                                border-top: 1px solid #ECEEF0;
                            }

                            &:last-child {
                                border-bottom: none;
                            }

                            &:nth-child(odd) {
                                background: #FAFBFE;
                            }

                            td {
                                padding: 9px 12px;
                                font-weight: bold;
                                line-height: 20px;

                                &:last-child {
                                    text-align: right;
                                }

                                &.label {
                                    width: 45%;
                                }
                                &.price {
                                    width: 45%;
                                    text-align: right;
                                }
                                &.action {
                                    width: 6%;

                                    span {
                                        &:before {
                                            font-size: 7px;
                                            padding: 5px;
                                            border-radius: 50px;
                                            cursor: pointer;
                                            background: #BDC0C9;
                                            color: #FFFFFF;
                                            border: none;
                                        }

                                        &:hover {
                                            &:before {
                                                background: #E9485E;
                                                color: #FFFFFF;
                                                border: none;
                                            }
                                        }
                                    }
                                }
                            }

                            &.cart-action {
                                td {
                                    text-align: left;

                                    a {
                                        text-decoration: none;
                                        color: #3B80F4;
                                        font-size: 12px;
                                        padding: 5px 8px;
                                        background: #fff;
                                        border: 1px solid #E0E5EA;
                                        border-radius: 3px;
                                        margin-right: 5px;
                                    }
                                }
                            }

                            &.cart-meta-data {
                                td {
                                    &.label {
                                        span.name {
                                            color: #758598;
                                            font-size: 12px;
                                            margin-left: 5px;
                                            font-weight: normal;
                                        }
                                        label {
                                            font-weight: normal;
                                            margin-right: 5px;
                                        }
                                        .fee-name {
                                            width: 15%;
                                        }
                                        .fee-amount {
                                            width: 15%;
                                            margin-right: 5px;
                                        }
                                        select.fee-tax-class {
                                            width: 22%;
                                            border: 1px solid #E9EBED;
                                            background: #fff;
                                            border-radius: 3px;
                                            padding: 5px 5px;
                                            height: 24px;
                                            &:focus {
                                                outline: none;
                                            }
                                        }

                                    }
                                    input[type=text],
                                    input[type=number] {
                                        border: 1px solid #ECEEF0;
                                        border-radius: 3px;
                                        padding: 5px 8px;
                                        width: 50%;

                                        &:focus {
                                            outline: none;
                                            -webkit-appearance:none;
                                        }

                                        &::placeholder {
                                            color: #999DAC;
                                            font-size: 13px;
                                        }

                                        &:-ms-input-placeholder {
                                            color: #999DAC;
                                            font-size: 13px;
                                        }

                                        &::-ms-input-placeholder {
                                            color: #999DAC;
                                            font-size: 13px;
                                        }
                                    }
                                    button {
                                        border: 1px solid #3B80F4;
                                        background: #3B80F4;
                                        color: #fff;
                                        padding: 5px 8px;
                                        border-radius: 3px;
                                        cursor: pointer;
                                        margin-left: 5px;

                                        &.cancel {
                                            border: 1px solid #afafaf;
                                            background: #ffff;
                                            color: #222;
                                        }

                                        &:disabled {
                                            background: #76A2ED;
                                            border-color: #76A2ED;
                                        }
                                    }
                                }
                            }

                            &.note {
                                .note-text {
                                    font-weight: normal;
                                }
                            }

                            &.pay-now {
                                background: #1ABC9C;
                                color: #fff;
                                cursor: pointer;
                                font-size: 16px;

                                td {
                                    padding: 18px 10px 18px 12px;
                                    &.amount {
                                        text-align: right;
                                    }
                                    &.icon {
                                        padding: 0px 5px;
                                        text-align: left;
                                        line-height: 25px;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            .cart-content {
                flex: 5;
                overflow-x: scroll;
                table.cart-table {
                    width: 100%;
                    border-collapse: collapse;

                    thead {
                        tr {
                            text-align: left;
                            border-bottom: 1px solid #ECEEF0;
                            box-shadow: 0 3px 15px 0px rgba(0,0,0,.04);
                            color: #3B80F4;
                            font-size: 13px;

                            th {
                                padding: 8px 12px;
                                line-height: 19px;
                            }
                        }
                    }

                    tbody {
                        tr {
                            border-bottom: 1px solid #eceef0;
                            height: 35px;
                            display: table-row;
                            line-height: 20px;

                            &.no-item {
                                height: 55vh;
                                border-bottom: none;
                                text-align: center;

                                p {
                                    color: #C6CACE;
                                    font-size: 17px;
                                }
                            }

                            td {
                                padding: 8px 12px;
                                font-size: 13px;

                                &.name {
                                    font-weight: bold;

                                    .attribute {
                                        ul {
                                            margin: 0;
                                            padding: 0;
                                            list-style: none;
                                            li {
                                                display: inline-block;
                                                margin-right: 5px;
                                                font-size: 12px;
                                                font-weight: normal;

                                                .attr_name {
                                                    color: #758598;
                                                }
                                            }
                                        }
                                    }
                                }

                                &.price {
                                    span {
                                        display: block;

                                        &.regular-price {
                                            font-size: 11px;
                                            text-decoration: line-through;
                                            color: #9095A5;
                                            padding-left: 5px;
                                        }
                                    }
                                }

                                &.action, &.remove {
                                    span {
                                        &:before {
                                            font-size: 8px;
                                            background: #BDC0C9;
                                            color: #fff;
                                            border-radius: 50px;
                                            border: .84px solid #BDC0C9;
                                            cursor: pointer;
                                            display: inline-block;
                                            width: 20px;
                                            text-align: center;
                                        }

                                        &.open {
                                            &:before {
                                                -webkit-transform: rotate(90deg);
                                                -moz-transform: rotate(90deg);
                                                -o-transform: rotate(90deg);
                                                -ms-transform: rotate(90deg);
                                                transform: rotate(89deg);
                                                background: #3b80f4;
                                                border: .84px solid #3b80f4;
                                            }
                                        }
                                    }
                                }

                                &.remove {
                                    span {
                                        &:before {
                                            color: #FFFFFF;
                                            border: none;
                                        }

                                        &:hover {
                                            &:before {
                                                background: #E9485E;
                                                color: #FFFFFF;
                                                border: none;
                                            }
                                        }
                                    }
                                }
                            }

                            &.update-quantity-wrap {
                                td {
                                    padding: 10px;
                                    background: #F6F7FB;
                                    span {
                                        margin-right: 5px;

                                        input[type=number] {
                                            -webkit-appearance: none;
                                            outline: none;
                                            border: 1px solid #ECEEF0;
                                            padding: 5px;
                                            font-size: 13px;
                                            border-radius: 3px;
                                            width: 60px;
                                            margin-right: 5px;

                                            &::-webkit-inner-spin-button,
                                            &::-webkit-outer-spin-button {
                                                -webkit-appearance: none;
                                                margin: 0;
                                            }
                                        }

                                        &.qty-action {
                                            a {
                                                text-decoration: none;
                                                display: inline-block;
                                                font-size: 18px;
                                                font-weight: bold;
                                                color: #999DAC;
                                                background: #fff;
                                                margin-right: 3px;
                                                width: 25px;
                                                height: 23px;
                                                text-align: center;
                                                border-radius: 3px;
                                                border: 1px solid #ECEEF0;

                                                &.add {
                                                    color: #fff;
                                                    background: #3B80F4;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    .wepos-help-wrapper {
        padding: 15px 20px;
        margin-top: 20px;
        h2 {
            margin: 0px;
            padding: 0px 0px 15px;
            margin-bottom: 15px;
            border-bottom: 1px solid #ECEEF0;
            color: #C6CACE;
            font-weight: normal;
        }

        ul {
            margin: 0px;
            padding: 0px;
            list-style: none;

            li {
                display: inline-block;
                width: 48%;
                margin-right: 2%;
                margin-bottom: 20px;

                &:nth-child(even) {
                    margin-right: 0px;
                }

                span {
                    display: block;

                    &.code {
                        float: left;
                        width: 40%;
                        color: #758598;
                        font-size: 15px;
                    }

                    &.title {
                        float: left;
                        display: block;
                        width: 58%;
                    }
                }
            }
        }

    }
}

/* Media queries */
@media screen and (max-width: 768px) {
    #wepos-main {
        display: table-row;

        .content-cart {
            .cart-panel .cart-content table.cart-table {
                height: fit-content;
            }

            min-height: 200px;
        }
    }
}
</style>

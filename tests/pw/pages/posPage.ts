import { ConsoleMessage, Page, expect } from '@playwright/test';
import { BasePage } from '@pages/basePage';
import { selector } from '@pages/selectors';
import { data } from '@utils/testData';
import { helpers } from '@utils/helpers';
import { productDetails, customerDetails, cashierProfileDetails, paymentGateway, responseBody } from '@utils/interfaces';

const { WEPOS_PRO } = process.env;

// selectors
const wepos = selector.admin.wepos;
const pos = selector.admin.wepos.viewPos;

export class Pos extends BasePage {
    outlet: string;
    counter: string;

    constructor(page: Page, outlet = '', counter = '') {
        super(page);
        this.outlet = outlet;
        this.counter = counter;
    }

    // navigation

    async goToPos(outlet = this.outlet, counter = this.counter) {
        await this.goIfNotThere(data.subUrls.backend.wepos.viewPos);
        const isLoginVisible = await this.isVisible(pos.loginForm);
        if (WEPOS_PRO && isLoginVisible) {
            await this.selectByLabel(pos.outlet, outlet);
            await this.selectByLabel(pos.counter, counter);
            await this.clickAndWaitForResponsesAndLoadState(data.subUrls.api.wepos.posDashboard, pos.goToPos);
        }
        await this.multipleElementVisible(pos.posSections);
    }

    async gotoPosSubmenu(submenu: string) {
        await this.goToPos();
        await this.goIfNotThere(submenu);
    }

    // pos render properly
    async posRenderProperly() {
        await this.goToPos();

        // search product
        await this.toBeVisible(pos.searchProduct);
        await this.toBeVisible(pos.searchType('Product'));
        await this.toBeVisible(pos.searchType('Scan'));

        // category
        await this.toBeVisible(pos.categoryDropdown);

        // layout style
        await this.toBeVisible(pos.layoutStyle('grid'));
        await this.toBeVisible(pos.layoutStyle('list'));

        // product container
        await this.toBeVisible(pos.productContainer);

        // customer
        await this.toBeVisible(pos.searchCustomer);
        await this.toBeVisible(pos.addNewCustomer);

        // more option
        await this.toBeVisible(pos.moreOption);

        // cart
        await this.toBeVisible(pos.cart.cart);

        // subtotal
        await this.toBeVisible(pos.cart.subtotal);

        // cart options
        await this.toBeVisible(pos.cart.addDiscount);
        await this.toBeVisible(pos.cart.addFee);
        await this.toBeVisible(pos.cart.addNote);

        // pay now
        await this.toBeVisible(pos.cart.payNow);
    }

    // search product
    async searchProduct(productName: string) {
        await this.goToPos();
        await this.click(pos.searchType('Product'));
        await this.clearInputField(pos.searchProduct);
        await this.type(pos.searchProduct, productName);
        await this.toBeVisible(pos.searchedProduct(productName));
    }

    // filter product
    async filterProducts(categoryName: string) {
        await this.goToPos();
        await this.click(pos.categoryDropdown);
        await this.click(pos.uncategorized);
        await this.toBeVisible(pos.selectedCategory(categoryName));
    }

    // toggle layout
    async toggleLayout(style: string) {
        await this.goToPos();
        await this.click(pos.layoutStyle(style));
        await this.toContainClass(pos.productContainer, style);
    }

    // search customer
    async searchCustomer(customerEmail: string) {
        await this.goToPos();
        await this.clearInputField(pos.searchCustomer);
        await this.type(pos.searchCustomer, customerEmail);
        await this.toContainText(pos.searchedCustomer, customerEmail);
    }

    async updateCustomerFields(customerDetails: customerDetails) {
        await this.clearAndType(pos.customerDetails.firstName, customerDetails.firstName);
        await this.clearAndType(pos.customerDetails.lastName, customerDetails.lastName);
        await this.clearAndType(pos.customerDetails.email, customerDetails.email);
        await this.clearAndType(pos.customerDetails.address1, customerDetails.address1);
        await this.clearAndType(pos.customerDetails.address2, customerDetails.address2);

        await this.click(pos.customerDetails.countryDropdown);
        await this.clearAndType(pos.customerDetails.countryInput, customerDetails.country);
        await this.click(pos.customerDetails.searchedCountry);

        await this.click(pos.customerDetails.stateDropdown);
        await this.clearAndType(pos.customerDetails.stateInput, customerDetails.state);
        await this.click(pos.customerDetails.searchedState);

        await this.clearAndType(pos.customerDetails.city, customerDetails.city);
        await this.clearAndType(pos.customerDetails.zipCode, customerDetails.zipCode);
        await this.clearAndType(pos.customerDetails.phone, customerDetails.phone);
    }

    // add new customer
    async addCustomer(customerDetails: customerDetails) {
        await this.goToPos();
        await this.click(pos.addNewCustomer);
        await this.updateCustomerFields(customerDetails);
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.customers, pos.customerDetails.addCustomer, 201);
        await this.toHaveValue(pos.searchCustomer, `${customerDetails.firstName} ${customerDetails.lastName}`);
    }

    // empty cart
    async emptyCart() {
        await this.goToPos();
        await this.click(pos.moreOption);
        await this.click(pos.moreOptions.emptyCart);
        await this.toBeVisible(pos.cart.emptyCart);
    }

    // view keyboard shortcut
    async viewKeyboardShortcut() {
        await this.goToPos();
        await this.click(pos.moreOption);
        await this.click(pos.moreOptions.help);
        await this.toBeVisible(pos.shortcutKeys);

        await this.click(wepos.modal.closeModal);
    }

    //  switch counter
    async switchCounter(outletName: string, counterName: string) {
        await this.goToPos();
        await this.click(pos.moreOption);
        await this.clickAndWaitForResponseAndLoadState(data.subUrls.api.wepos.cashiers, pos.moreOptions.switchCounter);
        await this.goToPos(outletName, counterName);
    }

    //  logout
    async logout() {
        await this.goToPos();
        await this.click(pos.moreOption);
        await this.clickAndWaitForLoadState(pos.moreOptions.logout);
        const loggedInUser = await this.getCurrentUser();
        expect(loggedInUser).toBeUndefined();
    }

    // add product to cart
    async addToCart(productName: string) {
        await this.searchProduct(productName);
        await this.pressOnSelector(pos.searchedProduct(productName), 'Enter');
        await this.toBeVisible(pos.cart.cartProduct(productName));
    }

    // add customer to cart
    async addCustomerToCart(customerEmail: string, customerName: responseBody) {
        await this.searchCustomer(customerEmail);
        await this.click(pos.searchedCustomer);
        await this.toHaveValue(pos.searchCustomer, customerName);
    }

    // update cart product quantity
    async editCartProductQuantity(productName: string, quantity: string) {
        await this.addToCart(productName);
        await this.click(pos.cart.editCartProduct(productName));
        await this.clearAndType(pos.cart.productQuantityInput(productName), quantity);
        await this.toContainText(pos.cart.cartProductQuantity(productName), quantity);
    }

    // remove product from cart
    async removeCartProduct(productName: string) {
        await this.addToCart(productName);
        await this.click(pos.cart.removeCartProduct(productName));
        await this.notToBeVisible(pos.cart.cartProduct(productName));
    }

    // add discount
    async addDiscount(productName: string, type: string, amount: string) {
        await this.addToCart(productName);
        await this.click(pos.cart.addDiscount);
        await this.clearAndType(pos.cart.feeDetails.feeInput, amount);
        await this.clickAndWaitForResponse(data.subUrls.api.wc.coupons, pos.cart.feeDetails.feeType(type), 201);
        await this.toContainText(pos.cart.feeDetails.feeAmount('Discount'), amount);
    }

    // add fee
    async addFee(productName: string, type: string, amount: string) {
        await this.addToCart(productName);
        await this.click(pos.cart.addFee);
        await this.clearAndType(pos.cart.feeDetails.feeInput, amount);
        await this.click(pos.cart.feeDetails.feeType(type));
        await this.toContainText(pos.cart.feeDetails.feeAmount('Fee'), amount);
    }

    // add note
    async addNote(productName: string, note: string) {
        await this.addToCart(productName);
        await this.click(pos.cart.addNote);
        await this.clearAndType(pos.cart.noteDetails.noteInput, note);
        await this.click(pos.cart.noteDetails.addNote);
        await this.toContainText(pos.cart.noteText, note);
    }

    // complete sale
    async completeSale(productName: string, paymentGateway: paymentGateway, closeModal: boolean = true) {
        await this.addToCart(productName);
        if (paymentGateway.name === 'cash') {
            await this.click(pos.cart.payNow);
            const amount = (await this.getElementText(pos.saleSummary.payAmount)) as string;
            await this.clearAndType(pos.saleSummary.cashInput, helpers.removeCurrencySign(amount));
        } else {
            await this.addCustomerToCart(paymentGateway.card.customer.customerEmail, paymentGateway.card.customer.customerFullName);
            await this.click(pos.cart.payNow);

            await this.click(pos.saleSummary.byCard);
            await this.clearAndType(pos.saleSummary.card.last4Digit, paymentGateway.card.last4Digit);
            await this.selectByValue(pos.saleSummary.card.cardType, paymentGateway.card.cardType);
            await this.clearAndType(pos.saleSummary.card.invoiceNumber, paymentGateway.card.invoiceNumber);
        }
        await this.clickAndAcceptAndWaitForResponse(data.subUrls.api.wc.orders, pos.saleSummary.processPayment, 201);
        await this.toBeVisible(pos.saleSummary.saleCompleted);
        await this.toBeVisible(pos.saleSummary.printReceipt);

        // close modal
        closeModal && (await this.click(wepos.modal.closeModal));
    }

    // complete sale with print receipt
    async completeSaleWithPrintReceipt(productName: string, paymentGateway: paymentGateway) {
        await this.completeSale(productName, paymentGateway, false);

        // add event listener to print button for assertion
        const pageFunction = (node: any) => node.addEventListener('click', () => console.log('Print button clicked!'));
        await this.evaluate(pos.saleSummary.printReceipt, pageFunction);
        const res = (await this.clickAndWaitForEvent('console', pos.saleSummary.printReceipt)) as unknown as ConsoleMessage;
        expect(res.text()).toBe('Print button clicked!');

        // await this.click(pos.saleSummary.printReceipt);
        await this.toBeVisible(pos.saleSummary.saleCompleted);
        await this.toBeVisible(pos.saleSummary.printReceipt);

        // close modal
        await this.click(wepos.modal.closeModal);
    }

    // products

    // view products
    async viewProducts() {
        await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.products);

        await this.toBeVisible(pos.products.productsText);
        await this.toBeVisible(pos.products.bulkAction);
        await this.toBeVisible(pos.products.apply);
        await this.toBeVisible(pos.products.searchProduct);
        await this.toBeVisible(pos.products.productTable);
        await this.toBeVisible(pos.products.pagination);
    }

    // search products
    async searchProductOnProductPage(productName: string) {
        await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.products);

        await this.clearAndType(pos.products.searchProduct, productName);
        await this.keyPressOnLocator(pos.products.searchProduct, data.key.enter);
        await this.toBeVisible(pos.products.productRow(productName));
    }

    // edit product
    async editProduct(productName: string, productDetails: productDetails) {
        await this.searchProductOnProductPage(productName);
        await this.click(pos.products.productRowAction(productName));
        await this.click(pos.products.editProduct);

        await this.clearAndType(pos.products.quickEdit.title, productDetails.title);

        await this.click(pos.products.quickEdit.categoryDropdown);
        await this.clearAndType(pos.products.quickEdit.categoryInput, productDetails.category);
        await this.click(pos.products.quickEdit.searchedCategory);

        await this.click(pos.products.quickEdit.tagsDropdown);
        await this.clearAndType(pos.products.quickEdit.tagsInput, productDetails.tag);
        await this.click(pos.products.quickEdit.searchedTags);

        await this.clearAndType(pos.products.quickEdit.sku, productDetails.sku);
        await this.clearAndType(pos.products.quickEdit.price, productDetails.price);
        await this.clearAndType(pos.products.quickEdit.salePrice, String(Number(productDetails.price) - 20));
        await this.clearAndType(pos.products.quickEdit.weight, productDetails.weight);
        await this.selectByValue(pos.products.quickEdit.visibility, productDetails.visibility);
        await this.checkLocator(pos.products.quickEdit.manageStocks);
        await this.clearAndType(pos.products.quickEdit.stockQuantity, productDetails.stockQuantity);
        await this.selectByValue(pos.products.quickEdit.allowBackOrders, productDetails.allowBackOrders);
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.products, pos.products.update);
    }

    // delete product
    async deleteProduct(productName: string) {
        await this.searchProductOnProductPage(productName);
        await this.click(pos.products.productRowAction(productName));
        await this.click(pos.products.deleteProduct);
        await this.clickAndWaitForResponse(data.subUrls.api.wc.products, wepos.confirmAction);
        await this.toBeVisible(pos.products.productDeleteMessage);
    }

    // bulk action on product
    async bulkActionOnProducts(productName: string, action: string) {
        if (!productName) {
            await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.products);
            await this.click(pos.products.allRows);
        } else {
            await this.searchProductOnProductPage(productName);
            await this.click(pos.products.productCheckBox(productName));
        }
        await this.selectByValue(pos.products.bulkAction, action);
        await this.clickAndWaitForResponse(data.subUrls.api.wc.products, pos.products.apply);
    }

    // orders

    // view orders
    async viewOrders() {
        await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.orders);

        await this.toBeVisible(pos.orders.ordersText);
        await this.toBeVisible(pos.orders.bulkAction);
        await this.toBeVisible(pos.orders.apply);
        await this.toBeVisible(pos.orders.searchOrder);
        await this.toBeVisible(pos.orders.orderTable);
        await this.toBeVisible(pos.orders.pagination);
    }

    // filter orders
    async filterOrders(input: string, filterType: string) {
        await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.orders);
        switch (filterType) {
            case 'by-customer': {
                await this.click(pos.orders.filter);
                await this.click(pos.orders.filters.filterByCustomer.customerDropdown);
                await this.clearAndType(pos.orders.filters.filterByCustomer.customerInput, input);
                await this.click(pos.orders.filters.filterByCustomer.searchedCustomer);
                await this.clickAndWaitForResponseAndLoadState(data.subUrls.api.wepos.orders, pos.orders.filters.filter);
                break;
            }
            case 'by-status': {
                await this.clickAndWaitForResponseAndLoadState(data.subUrls.api.wepos.orders, pos.orders.filters.filterByStatus(input));
                break;
            }
            default:
                break;
        }

        await this.wait(1);
        const count = await this.getElementCount(pos.orders.numberOfRowsFound);
        await this.toHaveCount(pos.orders.orderRowByCustomer(input), Number(count));
    }

    // search order
    async searchOrder(orderNumber: string) {
        await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.orders);

        await this.clearAndType(pos.orders.searchOrder, orderNumber);
        await this.keyPressOnLocator(pos.orders.searchOrder, data.key.enter);
        await this.toBeVisible(pos.orders.orderRow(orderNumber));
    }

    // go to order details
    async goToOrderDetails(orderNumber: string) {
        await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.orders);
        await this.goIfNotThere(data.subUrls.backend.wepos.submenu.orderDetails(orderNumber));
    }

    // view order details
    async viewOrderDetails(orderNumber: string) {
        await this.goToOrderDetails(orderNumber);

        await this.toBeVisible(pos.orders.orderDetails.ordersText);
        await this.multipleElementVisible(pos.orders.orderDetails.sections);
        await this.toBeVisible(pos.orders.orderDetails.orderNoteInput);
        await this.toBeVisible(pos.orders.orderDetails.orderNoteType);
        await this.toBeVisible(pos.orders.orderDetails.addNote);
    }

    // add order note
    async addOrderNote(orderNumber: string, orderNote: string) {
        await this.goToOrderDetails(orderNumber);
        await this.clearAndType(pos.orders.orderDetails.orderNoteInput, orderNote);
        await this.click(pos.orders.orderDetails.addNote);
        await this.toBeVisible(pos.orders.orderDetails.orderNoteCreated);
    }

    // delete order note
    async deleteOrderNote(orderNumber: string, orderNote: string) {
        await this.goToOrderDetails(orderNumber);
        await this.clearAndType(pos.orders.orderDetails.orderNoteInput, orderNote);
        await this.click(pos.orders.orderDetails.deleteNote(orderNote));
        await this.toBeVisible(pos.orders.orderDetails.orderNoteDeleted);
    }

    // customers

    // view customers
    async viewCustomers() {
        await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.customers);

        await this.toBeVisible(pos.customers.customerText);
        await this.toBeVisible(pos.customers.addNewCustomer);
        await this.toBeVisible(pos.customers.bulkAction);
        await this.toBeVisible(pos.customers.apply);
        await this.toBeVisible(pos.customers.searchCustomer);
        await this.toBeVisible(pos.customers.customerTable);
        await this.toBeVisible(pos.customers.pagination);
    }

    // search customers
    async searchCustomerOnCustomerPage(customerEmail: string) {
        await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.customers);

        await this.clearAndType(pos.customers.searchCustomer, customerEmail);
        await this.keyPressOnLocator(pos.customers.searchCustomer, data.key.enter);
        await this.toBeVisible(pos.customers.customerRowByEmail(customerEmail));
    }

    // add customer on customer page
    async addCustomerOnCustomerPage(customerDetails: customerDetails) {
        await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.customers);
        await this.click(pos.customers.addNewCustomer);
        await this.updateCustomerFields(customerDetails);
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.customers, pos.customerDetails.addCustomer, 201);
        await this.toBeVisible(pos.customers.customerAddMessage);
    }

    // edit customer
    async editCustomer(customerEmail: string, customerDetails: customerDetails) {
        await this.searchCustomerOnCustomerPage(customerEmail);
        await this.click(pos.customers.customerRowAction(customerEmail));
        await this.click(pos.customers.editCustomer);
        await this.updateCustomerFields(customerDetails);
        await this.clickAndWaitForResponse(data.subUrls.api.wc.customers, pos.customerDetails.addCustomer);
        await this.toBeVisible(pos.customers.customerUpdateMessage);
    }

    // delete customer
    async deleteCustomer(customerEmail: string) {
        await this.searchCustomerOnCustomerPage(customerEmail);
        await this.click(pos.customers.customerRowAction(customerEmail));
        await this.click(pos.customers.deleteCustomer);
        await this.clickAndWaitForResponse(data.subUrls.api.wc.customers, wepos.confirmAction);
        await this.toBeVisible(pos.customers.customerDeleteMessage);
    }

    // bulk action on customer
    async bulkActionOnCustomers(customerEmail: string, action: string) {
        if (!customerEmail) {
            await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.customers);
            await this.click(pos.customers.allRows);
        } else {
            await this.searchCustomerOnCustomerPage(customerEmail);
            await this.click(pos.customers.customerCheckBox(customerEmail));
        }
        await this.selectByValue(pos.customers.bulkAction, action);
        await this.click(pos.customers.apply);
        await this.clickAndWaitForResponse(data.subUrls.api.wc.customers, wepos.confirmAction);
        await this.toBeVisible(pos.customers.customerBatchUpdateMessage);
    }

    // update cashier profile
    async updateCashierProfile(profileDetails: cashierProfileDetails) {
        await this.gotoPosSubmenu(data.subUrls.backend.wepos.submenu.settings);

        await this.clearAndType(pos.settings.firstName, profileDetails.firstName);
        await this.clearAndType(pos.settings.lastName, profileDetails.lastName);
        await this.clearAndType(pos.settings.phone, profileDetails.phone);
        await this.clearAndType(pos.settings.address, profileDetails.address);

        await this.clickAndWaitForResponse(data.subUrls.api.wepos.profile, pos.settings.update);
    }
}

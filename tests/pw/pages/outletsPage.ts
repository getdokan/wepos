import { Page } from '@playwright/test';
import { BasePage } from '@pages/basePage';
import { selector } from '@pages/selectors';
import { data } from '@utils/testData';
import { outlet, counter, cashier } from '@utils/interfaces';
import { helpers } from '@utils/helpers';

// selectors
const wepos = selector.admin.wepos;
const outlets = selector.admin.wepos.outlets;

export class Outlets extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // navigation

    async goToOutlets() {
        await this.goIfNotThere(data.subUrls.backend.wepos.outlets);
        await this.reload(); //todo: need to fix this
    }

    // outlets render properly
    async outletsRenderProperly() {
        await this.goToOutlets();

        await this.toBeVisible(outlets.outletsText);
        await this.toBeVisible(outlets.addOutlet);

        const outletExists = await this.page.isVisible(outlets.noOutletsFound);

        if (!outletExists) {
            console.log('No outlet found');
            return;
        }

        await this.notToHaveCount(outlets.outlets, 0);
        await this.notToHaveCount(outlets.outletBody.outletHeader, 0);
        await this.notToHaveCount(outlets.outletBody.outletContent, 0);
        await this.notToHaveCount(outlets.outletBody.outletFooter, 0);
    }

    // update outlet fields
    async updateOutletFields(outlet: outlet) {
        // outlet name
        await this.clearAndType(outlets.outletDetails.outletName, outlet.outletName);

        // outlet location
        await this.clearAndType(outlets.outletDetails.outletLocation.address1, outlet.address1);
        await this.clearAndType(outlets.outletDetails.outletLocation.address2, outlet.address2);

        await this.click(outlets.outletDetails.outletLocation.countryDropdown);
        await this.clearAndType(outlets.outletDetails.outletLocation.countryInput, outlet.country);
        await this.click(outlets.outletDetails.outletLocation.searchedCountry);

        await this.click(outlets.outletDetails.outletLocation.stateDropdown);
        await this.clearAndType(outlets.outletDetails.outletLocation.stateInput, outlet.state);
        await this.click(outlets.outletDetails.outletLocation.searchedState);

        await this.clearAndType(outlets.outletDetails.outletLocation.city, outlet.city);
        await this.clearAndType(outlets.outletDetails.outletLocation.zipCode, outlet.zipCode);

        // contact details
        await this.clearAndType(outlets.outletDetails.contactDetails.email, outlet.email);
        await this.clearAndType(outlets.outletDetails.contactDetails.phone, outlet.phone);
        await this.clearAndType(outlets.outletDetails.contactDetails.fax, outlet.fax);
        await this.clearAndType(outlets.outletDetails.contactDetails.website, outlet.website);
    }

    // add outlet
    async addOutlet(outlet: outlet) {
        await this.goToOutlets();
        await this.click(outlets.addOutlet);
        await this.updateOutletFields(outlet);
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.outlet, outlets.createOutlet);
        await this.toBeVisible(outlets.outlet(outlet.outletName));
    }

    // edit outlet
    async editOutlet(outletName: string, outlet: outlet) {
        await this.goToOutlets();
        await this.click(outlets.outletMoreOption(outletName));
        await this.click(outlets.outletMoreOptions.editOutlet);
        await this.updateOutletFields(outlet);
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.outlet, outlets.updateOutlet);
        await this.toBeVisible(outlets.outlet(outlet.outletName));
    }

    // delete outlet
    async deleteOutlet(outletName: string) {
        await this.goToOutlets();
        await this.click(outlets.outletMoreOption(outletName));
        await this.click(outlets.outletMoreOptions.deleteOutlet);
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.outlet, wepos.confirmAction);
        await this.notToBeVisible(outlets.outlet(outletName));
    }

    // add counter
    async addCounter(outletName: string, counter: counter) {
        await this.goToOutlets();
        await this.click(outlets.outletMoreOption(outletName));
        await this.click(outlets.outletMoreOptions.addCounter);
        await this.clearAndType(outlets.counter.name, counter.name);
        await this.clearAndType(outlets.counter.number, counter.number);
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.outlet, outlets.counter.addCounter);
        await this.toBeVisible(outlets.outletContent.counter(counter.name));
    }

    // edit counter
    async editCounter(counterName: string, counter: counter) {
        await this.goToOutlets();
        await this.hover(outlets.outletContent.counter(counterName));
        await this.click(outlets.outletContent.editCounter(counterName));
        await this.clearAndType(outlets.counter.name, counter.name);
        await this.clearAndType(outlets.counter.number, counter.number);
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.outlet, outlets.counter.updateCounter);
        await this.toBeVisible(outlets.outletContent.counter(counter.name));
    }

    // delete counter
    async deleteCounter(counterName: string) {
        await this.goToOutlets();
        await this.hover(outlets.outletContent.counter(counterName));
        await this.click(outlets.outletContent.deleteCounter(counterName));
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.outlet, outlets.outletContent.confirmDelete);
        await this.notToBeVisible(outlets.outletContent.counter(counterName));
    }

    // add cashier
    async addCashier(outletName: string, cashier: cashier | string, existingCashier: boolean = false) {
        await this.goToOutlets();
        await this.click(outlets.outletMoreOption(outletName));
        await this.click(outlets.outletMoreOptions.addCashier);
        await this.click(outlets.cashier.cashierDropdown);

        if (existingCashier) {
            await this.clearAndType(outlets.cashier.cashierInput, cashier as string);
            await this.click(outlets.cashier.searchedCashier);
            await this.clickAndWaitForResponse(data.subUrls.api.wepos.outlet, outlets.cashier.assignCashier);
            await this.toBeVisible(outlets.outletContent.cashier(helpers.capitalizeWords(cashier as string)));
        } else {
            await this.clearAndType(outlets.cashier.cashierInput, '......'); // to invoke add cashier option
            await this.click(outlets.cashier.createCashier);

            if (typeof cashier !== 'string') {
                // cashier details
                await this.clearAndType(outlets.cashier.cashierDetails.firstName, cashier.firstName);
                await this.clearAndType(outlets.cashier.cashierDetails.lastName, cashier.lastName);
                await this.clearAndType(outlets.cashier.cashierDetails.email, cashier.email);
                await this.clearAndType(outlets.cashier.cashierDetails.phone, cashier.phone);
                await this.clearAndType(outlets.cashier.cashierDetails.website, cashier.website);
                await this.clickAndWaitForResponse(data.subUrls.api.wepos.outlet, outlets.cashier.cashierDetails.create);
                await this.toBeVisible(outlets.outletContent.cashier(helpers.capitalizeWords(`${cashier.firstName} ${cashier.lastName}`)));
            }
        }
    }

    // delete cashier
    async deleteCashier(outletName: string, cashierName: string) {
        await this.goToOutlets();
        await this.click(outlets.outletContent.outletCashier(outletName));
        await this.hover(outlets.outletContent.cashier(helpers.capitalizeWords(cashierName)));
        await this.click(outlets.outletContent.deleteCashier(cashierName));
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.outlet, outlets.outletContent.confirmDelete);
        await this.notToBeVisible(outlets.outletContent.cashier(helpers.capitalizeWords(cashierName)));
    }
}

import { Page } from '@playwright/test';
import { BasePage } from '@pages/basePage';
import { selector } from '@pages/selectors';
import { data } from '@utils/testData';

// selectors
const reports = selector.admin.wepos.reports;

export class Reports extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // navigation

    async goToReports() {
        await this.goIfNotThere(data.subUrls.backend.wepos.reports);
    }

    // reports render properly
    async reportsRenderProperly() {
        await this.goToReports();

        await this.toBeVisible(reports.reportText);
        await this.toBeVisible(reports.exportReport);

        // check if overview elements are  visible
        await this.multipleElementVisible(reports.overview);

        const noReports = await this.isVisible(reports.noReports);
        if (noReports) {
            console.log('No reports found');
        } else {
            await this.toBeVisible(reports.reportsTable);
        }
    }

    // filter reports
    async filterReports(input: string, action: string, clearFilter = true) {
        await this.goToReports();
        const filterSectionIsVisible = await this.isVisible(reports.filterSection);
        !filterSectionIsVisible && (await this.click(reports.filterReport));

        switch (action) {
            case 'by-paymentMethod':
                await this.click(reports.filters.filterByPaymentMethod);
                break;

            case 'by-customer':
                await this.click(reports.filters.filterByCustomer);
                break;

            case 'by-outlet':
                await this.click(reports.filters.filterByOutlet);
                break;

            case 'by-cashier':
                await this.click(reports.filters.filterByCashier);
                break;

            default:
                break;
        }
        await this.clearAndType(reports.filters.filterInput, input);
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.payment, reports.filters.result(input));

        await this.notToHaveCount(reports.filters.closeFilteredResult, 0);
        clearFilter && (await this.clearFilter());
    }

    // clear filter
    async clearFilter() {
        await this.goToReports();
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.payment, reports.filters.reset);
        await this.toHaveCount(reports.filters.closeFilteredResult, 0);
    }

    // export report
    async exportReport() {
        await this.goToReports();
        await this.clickAndWaitForDownload(reports.exportReport);
    }
}

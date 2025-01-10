import { Page } from '@playwright/test';
import { BasePage } from '@pages/basePage';
import { selector } from '@pages/selectors';
import { data } from '@utils/testData';
import { receipt } from '@utils/interfaces';

// selectors
const receipts = selector.admin.wepos.receipts;

export class Receipts extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // navigation

    async goToReceipts() {
        await this.goIfNotThere(data.subUrls.backend.wepos.receipts);
    }

    async ensureSectionIsOpen(section: any) {
        const sectionDetailsNotVisible = await this.hasClass(section, 'rotate');
        if (sectionDetailsNotVisible) {
            await this.click(section);
        }
    }

    // receipts render properly
    async receiptsRenderProperly() {
        await this.goToReceipts();

        // receipts text is visible
        await this.toBeVisible(receipts.receiptsText);

        // buttons are visible
        await this.toBeVisible(receipts.backToOutlets);
        await this.toBeVisible(receipts.saveReceipt);

        // sections are visible
        await this.toBeVisible(receipts.receiptSection);
        await this.toBeVisible(receipts.settingsSection);
        await this.toBeVisible(receipts.receiptPage);

        await this.multipleElementVisible(receipts.sections);

        // logo details are visible
        const { uploadedImage, ...logoDetails } = receipts.logoDetails;
        await this.multipleElementVisible(logoDetails);

        // style details are visible
        await this.ensureSectionIsOpen(receipts.sections.stylesSection);
        await this.multipleElementVisible(receipts.styleDetails);

        // header details are visible
        await this.ensureSectionIsOpen(receipts.sections.headerDetailsSection);
        await this.multipleElementVisible(receipts.headersDetails);

        // item details are visible
        await this.ensureSectionIsOpen(receipts.sections.itemDetailsSection);
        await this.multipleElementVisible(receipts.itemDetails);

        // footer details are visible
        await this.ensureSectionIsOpen(receipts.sections.footerDetailsSection);
        const { footerHtmlBody, ...footerDetails } = receipts.footerDetails;
        await this.multipleElementVisible(footerDetails);
    }

    // set receipt logo
    async setReceiptLogo(receipt: receipt['logoDetails']) {
        await this.goToReceipts();
        await this.clickIfVisible(receipts.logoDetails.uploadedImage);
        await this.click(receipts.logoDetails.uploadLogo);
        await this.uploadMedia(receipt.logo);
        await this.clearAndType(receipts.logoDetails.width, receipt.width);
        await this.clearAndType(receipts.logoDetails.height, receipt.height);

        // save receipt
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.receipts, receipts.saveReceipt);
    }

    // set receipt style
    async setReceiptStyle(receipt: receipt['styleDetails']) {
        await this.goToReceipts();
        await this.ensureSectionIsOpen(receipts.sections.stylesSection);

        // style settings
        await this.clearAndType(receipts.styleDetails.paddingTop, receipt.paddingTop);
        await this.clearAndType(receipts.styleDetails.paddingRight, receipt.paddingRight);
        await this.clearAndType(receipts.styleDetails.paddingBottom, receipt.paddingBottom);
        await this.clearAndType(receipts.styleDetails.paddingLeft, receipt.paddingLeft);
        await this.clearAndType(receipts.styleDetails.headerFontSize, receipt.headerFontSize);
        await this.clearAndType(receipts.styleDetails.paragraphFontSize, receipt.paragraphFontSize);

        // save receipt
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.receipts, receipts.saveReceipt);
    }

    // ser receipt header details
    async setReceiptHeaderDetails(receipt: receipt['headersDetails']) {
        await this.goToReceipts();
        await this.ensureSectionIsOpen(receipts.sections.headerDetailsSection);

        // header details
        await this.enableSwitcher(receipts.headersDetails.showOutletName);
        await this.enableSwitcher(receipts.headersDetails.showOutletPhone);
        await this.clearAndType(receipts.headersDetails.phoneLabel, receipt.phoneLabel);
        await this.enableSwitcher(receipts.headersDetails.showOutletEmail);
        await this.clearAndType(receipts.headersDetails.emailLabel, receipt.emailLabel);
        await this.enableSwitcher(receipts.headersDetails.showOutletFaxNumber);
        await this.enableSwitcher(receipts.headersDetails.showOutletWebsite);
        await this.enableSwitcher(receipts.headersDetails.showOutletAddress);
        await this.enableSwitcher(receipts.headersDetails.showCashierCounterInfo);
        await this.clearAndType(receipts.headersDetails.cashierNameLabel, receipt.cashierNameLabel);
        await this.clearAndType(receipts.headersDetails.counterNameLabel, receipt.counterNameLabel);
        await this.enableSwitcher(receipts.headersDetails.showOrderDate);
        await this.enableSwitcher(receipts.headersDetails.showOrderInvoiceNumber);
        await this.clearAndType(receipts.headersDetails.invoiceIdLabel, receipt.invoiceIdLabel);
        await this.enableSwitcher(receipts.headersDetails.showCustomerInfo);
        await this.clearAndType(receipts.headersDetails.customerNameLabel, receipt.customerNameLabel);
        await this.clearAndType(receipts.headersDetails.counterIdLabel, receipt.counterIdLabel);
        await this.enableSwitcher(receipts.headersDetails.showTaxNumber);
        await this.clearAndType(receipts.headersDetails.taxLabel, receipt.taxLabel);
        await this.clearAndType(receipts.headersDetails.taxNumber, receipt.taxNumber);
        await this.enableSwitcher(receipts.headersDetails.showOrderNote);

        // save receipt
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.receipts, receipts.saveReceipt);
    }

    // set receipt item details
    async setReceiptItemDetails(receipt: receipt['itemDetails']) {
        await this.goToReceipts();
        await this.ensureSectionIsOpen(receipts.sections.itemDetailsSection);

        // item details
        await this.enableSwitcher(receipts.itemDetails.showUnitCostColumn);
        await this.clearAndType(receipts.itemDetails.productColumnLabel, receipt.productColumnLabel);
        await this.clearAndType(receipts.itemDetails.unitCostColumnLabel, receipt.unitCostColumnLabel);
        await this.clearAndType(receipts.itemDetails.quantityColumnLabel, receipt.quantityColumnLabel);
        await this.clearAndType(receipts.itemDetails.totalColumnLabel, receipt.totalColumnLabel);
        await this.enableSwitcher(receipts.itemDetails.showDiscountRow);
        await this.enableSwitcher(receipts.itemDetails.showTaxRow);
        await this.enableSwitcher(receipts.itemDetails.showFeeRow);
        await this.enableSwitcher(receipts.itemDetails.showPaymentMethod);

        // save receipt
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.receipts, receipts.saveReceipt);
    }

    // set receipt footer details
    async setReceiptFooterDetails(footerText: string) {
        await this.goToReceipts();
        await this.ensureSectionIsOpen(receipts.sections.footerDetailsSection);

        // footer details
        await this.enableSwitcher(receipts.footerDetails.showFooterSection);
        await this.typeFrameSelector(receipts.footerDetails.footerIframe, receipts.footerDetails.footerHtmlBody, footerText);

        // save receipt
        await this.clickAndWaitForResponse(data.subUrls.api.wepos.receipts, receipts.saveReceipt);
    }
}

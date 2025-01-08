import { Page } from '@playwright/test';
import { BasePage } from '@pages/basePage';
import { selector } from '@pages/selectors';
import { data } from '@utils/testData';
import { weposSettings } from '@utils/interfaces';

// selectors
const settings = selector.admin.wepos.settings;

export class SettingsPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // navigation

    async goToWeposSettings() {
        await this.goIfNotThere(data.subUrls.backend.wepos.settings);
    }

    // settings

    // wepos settings render properly
    async weposSettingsRenderProperly() {
        await this.goToWeposSettings();

        // settings text is visible
        await this.toBeVisible(settings.settingsText);

        // settings section elements are visible
        await this.multipleElementVisible(settings.sections);

        // settings save changes is visible
        await this.toBeVisible(settings.saveChanges('general'));
    }

    // wepos settings

    // admin set wepos selling settings
    async setWeposGeneralSettings(general: weposSettings['general']) {
        await this.goToWeposSettings();
        await this.click(settings.menus.general);

        // commission settings
        await this.selectByValue(settings.general.calculateTaxForFee, general.calculateTaxForFee);
        await this.selectByValue(settings.general.barcodeScannerField, general.barcodeScannerField);

        // save settings
        await this.clickAndWaitForResponseAndLoadState(data.subUrls.ajax, settings.saveChanges('general'));
        await this.toContainText(settings.saveSuccessMessage, general.saveSuccessMessage);
    }

    // admin set wepos receipts settings
    async setWeposReceiptsSettings(receipts: weposSettings['receipts']) {
        await this.goToWeposSettings();
        await this.click(settings.menus.receipts);

        // order receipt header & footer
        await this.typeFrameSelector(settings.receipts.headerIframe, settings.receipts.headerHtmlBody, receipts.orderReceiptHeader);
        await this.typeFrameSelector(settings.receipts.footerIframe, settings.receipts.footerHtmlBody, receipts.orderReceiptFooter);

        // save settings
        await this.clickAndWaitForResponseAndLoadState(data.subUrls.ajax, settings.saveChanges('receipts'));
        await this.toContainText(settings.saveSuccessMessage, receipts.saveSuccessMessage);
    }
}

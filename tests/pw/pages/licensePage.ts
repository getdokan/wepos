import { Page } from '@playwright/test';
import { BasePage } from '@pages/basePage';
import { selector } from '@pages/selectors';
import { data } from '@utils/testData';

// selectors
const licenseAdmin = selector.admin.wepos.license;

export class LicensePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    // license

    // license render properly
    async adminLicenseRenderProperly() {
        await this.goto(data.subUrls.backend.wepos.license);

        // license settings text is visible
        await this.toBeVisible(licenseAdmin.licenseText);

        // license section elements are visible
        const { activateLicense, ...activateSection } = licenseAdmin.activateSection;
        await this.multipleElementVisible(activateSection);
    }

    // activate license
    async activateLicense(key: string, type = 'correct') {
        await this.goto(data.subUrls.backend.wepos.license);
        const alreadyActivated = await this.isVisible(licenseAdmin.deactivateLicense);
        if (!alreadyActivated) {
            await this.clearAndType(licenseAdmin.activateSection.licenseKeyInput, key);
            await this.clickAndWaitForResponse(data.subUrls.backend.wepos.license, licenseAdmin.activateSection.activateLicense);
            if (type === 'correct') {
                await this.toContainText(licenseAdmin.successNotice, 'License activated successfully.');
                await this.toBeVisible(licenseAdmin.activateLicenseInfo);
                await this.toBeVisible(licenseAdmin.refreshLicense);
            } else {
                await this.toContainText(licenseAdmin.errorNotice, 'Invalid License Key');
            }
        } else {
            console.log('License already activated!!');
        }
    }

    // refresh license
    async refreshLicense() {
        await this.goto(data.subUrls.backend.wepos.license);
        await this.clickAndWaitForResponse(data.subUrls.backend.wepos.license, licenseAdmin.refreshLicense);
        await this.toContainText(licenseAdmin.successNotice, 'License refreshed successfully.');
    }

    // deactivate license
    async deactivateLicense() {
        await this.goto(data.subUrls.backend.wepos.license);
        await this.clickAndWaitForResponse(data.subUrls.backend.wepos.license, licenseAdmin.deactivateLicense);
        await this.toContainText(licenseAdmin.successNotice, 'License deactivated successfully.');
        await this.notToBeVisible(licenseAdmin.refreshLicense);
    }
}

import { __ } from '@wordpress/i18n';
import type { SettingsElement } from '@wedevs/plugin-ui';

export const POS_SETTINGS_SUBPAGE_ID = 'wepos_pos_settings_main';

/**
 * Build the POS Settings subpage — nested under the main Settings page
 * alongside General / Receipts / Access.
 *
 * Hierarchy: subpage → tab → section → field.
 * The subpage is the save scope; `dependency_key` values carry
 * `section.field` so saves can be regrouped per REST section.
 */
export function buildPosSettingsSubpage(
	priority = 40
): SettingsElement {
	return {
		id: POS_SETTINGS_SUBPAGE_ID,
		type: 'subpage',
		label: __( 'POS Settings', 'wepos' ),
		description: __(
			'Configure POS currency, taxes, and barcode scanning.',
			'wepos'
		),
		icon: 'Store',
		priority,
		children: [ buildGeneralTab(), buildTaxTab(), buildBarcodeTab() ],
	} as unknown as SettingsElement;
}

function buildGeneralTab(): SettingsElement {
	return {
		id: 'pos_settings_general',
		type: 'tab',
		label: __( 'General', 'wepos' ),
		children: [
			{
				id: 'pos_general_currency',
				type: 'section',
				label: __( 'Currency', 'wepos' ),
				children: [
					customField(
						'woo_general.currency',
						'currency_select',
						__( 'Currency', 'wepos' )
					),
					selectField(
						'woo_general.currency_pos',
						__( 'Currency Position', 'wepos' ),
						[
							{ value: 'left', label: __( 'Left', 'wepos' ) },
							{ value: 'right', label: __( 'Right', 'wepos' ) },
							{
								value: 'left_space',
								label: __( 'Left with space', 'wepos' ),
							},
							{
								value: 'right_space',
								label: __( 'Right with space', 'wepos' ),
							},
						]
					),
					textField(
						'woo_general.price_decimal_sep',
						__( 'Decimal Separator', 'wepos' )
					),
					textField(
						'woo_general.price_thousand_sep',
						__( 'Thousand Separator', 'wepos' )
					),
					numberField(
						'woo_general.price_num_decimals',
						__( 'Number of Decimals', 'wepos' ),
						{ min: 0, max: 6 }
					),
					selectField(
						'woo_general.thousands_group_style',
						__( 'Thousands Group Style', 'wepos' ),
						[
							{
								value: 'thousand',
								label: __( 'Thousand (10,000)', 'wepos' ),
							},
							{
								value: 'lakh',
								label: __( 'Lakh (1,00,000)', 'wepos' ),
							},
							{
								value: 'wan',
								label: __( 'Wan (1,0000)', 'wepos' ),
							},
						]
					),
				],
			},
		],
	} as unknown as SettingsElement;
}

function buildTaxTab(): SettingsElement {
	return {
		id: 'pos_settings_tax',
		type: 'tab',
		label: __( 'Tax', 'wepos' ),
		children: [
			{
				id: 'pos_tax_main',
				type: 'section',
				label: __( 'Tax Configuration', 'wepos' ),
				children: [
					switchField(
						'woo_tax.wc_tax_enabled',
						__( 'Enable Taxes', 'wepos' )
					),
					switchField(
						'woo_tax.wc_prices_include_tax',
						__( 'Prices Entered Inclusive of Tax', 'wepos' )
					),
					selectField(
						'woo_tax.wc_tax_based_on',
						__( 'Calculate Tax Based On', 'wepos' ),
						[
							{
								value: 'shipping',
								label: __(
									'Customer Shipping Address',
									'wepos'
								),
							},
							{
								value: 'billing',
								label: __(
									'Customer Billing Address',
									'wepos'
								),
							},
							{
								value: 'base',
								label: __( 'Shop Base Address', 'wepos' ),
							},
						]
					),
					customField(
						'woo_tax.wc_shipping_tax_class',
						'tax_class_select',
						__( 'Shipping Tax Class', 'wepos' )
					),
					switchField(
						'woo_tax.wc_tax_round_at_subtotal',
						__( 'Round Tax at Subtotal', 'wepos' )
					),
					selectField(
						'woo_tax.wc_tax_display_shop',
						__( 'Display Prices in Shop', 'wepos' ),
						[
							{
								value: 'incl',
								label: __( 'Including tax', 'wepos' ),
							},
							{
								value: 'excl',
								label: __( 'Excluding tax', 'wepos' ),
							},
						]
					),
					selectField(
						'woo_tax.wc_tax_display_cart',
						__( 'Display Prices in Cart', 'wepos' ),
						[
							{
								value: 'incl',
								label: __( 'Including tax', 'wepos' ),
							},
							{
								value: 'excl',
								label: __( 'Excluding tax', 'wepos' ),
							},
						]
					),
					selectField(
						'woo_tax.wc_tax_total_display',
						__( 'Tax Total Display', 'wepos' ),
						[
							{
								value: 'single',
								label: __( 'As a single total', 'wepos' ),
							},
							{
								value: 'itemized',
								label: __( 'Itemized', 'wepos' ),
							},
						]
					),
					switchField(
						'wepos_general.enable_fee_tax',
						__( 'Calculate Tax on Fees', 'wepos' )
					),
				],
			},
		],
	} as unknown as SettingsElement;
}

function buildBarcodeTab(): SettingsElement {
	return {
		id: 'pos_settings_barcode',
		type: 'tab',
		label: __( 'Barcode', 'wepos' ),
		children: [
			{
				id: 'pos_barcode_main',
				type: 'section',
				label: __( 'Barcode Scanner', 'wepos' ),
				children: [
					textField(
						'wepos_barcode.prefix',
						__( 'Prefix', 'wepos' ),
						{
							description: __(
								'Characters stripped from the beginning of scanned codes before product lookup.',
								'wepos'
							),
						}
					),
					textField(
						'wepos_barcode.suffix',
						__( 'Suffix', 'wepos' ),
						{
							description: __(
								'Characters stripped from the end of scanned codes before product lookup.',
								'wepos'
							),
						}
					),
					numberField(
						'wepos_barcode.averageTimeThreshold',
						__( 'Scanner Debounce (ms)', 'wepos' ),
						{
							min: 1,
							description: __(
								'Average time between keystrokes below this threshold is treated as a scanner input.',
								'wepos'
							),
						}
					),
					numberField(
						'wepos_barcode.minimumLength',
						__( 'Minimum Barcode Length', 'wepos' ),
						{ min: 0 }
					),
				],
			},
		],
	} as unknown as SettingsElement;
}

/* ───── field helpers ────────────────────────────────────────────────── */

function textField(
	key: string,
	label: string,
	extra: Partial< SettingsElement > = {}
): SettingsElement {
	return {
		id: `field_${ key }`,
		type: 'field',
		variant: 'text',
		label,
		dependency_key: key,
		...extra,
	} as unknown as SettingsElement;
}

function numberField(
	key: string,
	label: string,
	extra: Partial< SettingsElement > = {}
): SettingsElement {
	return {
		id: `field_${ key }`,
		type: 'field',
		variant: 'number',
		label,
		dependency_key: key,
		...extra,
	} as unknown as SettingsElement;
}

function switchField(
	key: string,
	label: string,
	extra: Partial< SettingsElement > = {}
): SettingsElement {
	return {
		id: `field_${ key }`,
		type: 'field',
		variant: 'switch',
		label,
		dependency_key: key,
		enable_state: { value: 'yes', title: __( 'Yes', 'wepos' ) },
		disable_state: { value: 'no', title: __( 'No', 'wepos' ) },
		...extra,
	} as unknown as SettingsElement;
}

function selectField(
	key: string,
	label: string,
	options: { value: string; label: string }[],
	extra: Partial< SettingsElement > = {}
): SettingsElement {
	return {
		id: `field_${ key }`,
		type: 'field',
		variant: 'select',
		label,
		dependency_key: key,
		options,
		...extra,
	} as unknown as SettingsElement;
}

function customField(
	key: string,
	variant: string,
	label: string,
	extra: Partial< SettingsElement > = {}
): SettingsElement {
	return {
		id: `field_${ key }`,
		type: 'field',
		variant,
		label,
		dependency_key: key,
		...extra,
	} as unknown as SettingsElement;
}

import { __ } from '@wordpress/i18n';
import type { SettingsElement } from '@wedevs/plugin-ui';

export const POS_SETTINGS_SUBPAGE_ID = 'wepos_pos_settings_main';

export type SectionPermissions = {
	can_view: Record< string, boolean >;
	can_edit: Record< string, boolean >;
};

/**
 * Drop fields whose REST section is hidden by view permissions and
 * mark fields read-only when their section is view-only (no edit).
 *
 * Fields use `dependency_key = "<section>.<field>"`; the prefix is the
 * cap-managed section.
 */
function applyPermsToFields(
	fields: SettingsElement[],
	perms?: SectionPermissions
): SettingsElement[] {
	if ( ! perms ) {
		return fields;
	}

	const out: SettingsElement[] = [];

	for ( const field of fields ) {
		const typed = field as unknown as {
			dependency_key?: string;
			perm_section?: string;
		};
		const key = typed.dependency_key;
		const dot = key ? key.indexOf( '.' ) : -1;

		// Resolve the cap-managed section this field belongs to. Defaults
		// to the dependency_key prefix (e.g. `woo_tax.foo` → `woo_tax`) but
		// fields may opt into a different section via `perm_section` when
		// they live in a tab whose permission scope differs from their
		// REST storage bucket (e.g. `wepos_general.enable_fee_tax` rendered
		// inside the Tax tab — gated by tax caps, saved to wepos_general).
		const section = typed.perm_section
			|| ( key && dot >= 0 ? key.slice( 0, dot ) : '' );

		if ( ! section ) {
			out.push( field );
			continue;
		}

		if ( perms.can_view[ section ] === false ) {
			continue;
		}

		if ( perms.can_edit[ section ] === false ) {
			out.push( {
				...field,
				disabled: true,
			} as unknown as SettingsElement );
			continue;
		}

		out.push( field );
	}

	return out;
}

/**
 * Build the POS Settings subpage — nested under the main Settings page
 * alongside General / Receipts / Access.
 *
 * Hierarchy: subpage → tab → section → field.
 * The subpage is the save scope; `dependency_key` values carry
 * `section.field` so saves can be regrouped per REST section.
 */
export function buildPosSettingsSubpage(
	priority = 40,
	perms?: SectionPermissions
): SettingsElement | null {
	const tabs = [
		buildGeneralTab( perms ),
		buildTaxTab( perms ),
		buildBarcodeTab( perms ),
	].filter( ( t ): t is SettingsElement => t !== null );

	if ( tabs.length === 0 ) {
		return null;
	}

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
		children: tabs,
	} as unknown as SettingsElement;
}

/**
 * Build a tab when at least one section's view perms allow it.
 * Returns null when every field would be filtered out.
 */
function buildTabIfAllowed(
	tab: SettingsElement,
	perms: SectionPermissions | undefined
): SettingsElement | null {
	const sections = ( tab.children || [] ) as SettingsElement[];
	const filteredSections: SettingsElement[] = [];

	for ( const section of sections ) {
		const fields = applyPermsToFields(
			( section.children || [] ) as SettingsElement[],
			perms
		);
		if ( fields.length === 0 ) {
			continue;
		}
		filteredSections.push( {
			...section,
			children: fields,
		} as unknown as SettingsElement );
	}

	if ( filteredSections.length === 0 ) {
		return null;
	}

	return {
		...tab,
		children: filteredSections,
	} as unknown as SettingsElement;
}

function buildGeneralTab(
	perms?: SectionPermissions
): SettingsElement | null {
	const tab = {
		id: 'pos_settings_general',
		type: 'tab',
		label: __( 'General', 'wepos' ),
		children: [
			{
				id: 'pos_general_configuration',
				type: 'section',
				label: __( 'General Configuration', 'wepos' ),
				children: [
					// Two separate rows, each using the sibling Currency
					// section's `FieldRow` layout (label + description on
					// the left, control on the right). Renderers are
					// registered via the `default_customer` and
					// `default_customer_cashier` variant filters in
					// Settings.tsx. Both participate in plugin-ui's save
					// flow, so the tab's main "Save Changes" button
					// persists them together.
					customField(
						'woo_general.default_customer',
						'default_customer',
						__( 'Default Customer', 'wepos' ),
						{
							description: __(
								'Customer assigned to new POS orders when no customer is selected. Per-outlet overrides take precedence.',
								'wepos'
							),
						}
					),
					customField(
						'woo_general.default_customer_is_cashier',
						'default_customer_cashier',
						__( 'Default Customer is Cashier', 'wepos' )
					),
				],
			},
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

	return buildTabIfAllowed( tab, perms );
}

function buildTaxTab(
	perms?: SectionPermissions
): SettingsElement | null {
	const tab = {
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
						__( 'Calculate Tax on Fees', 'wepos' ),
						// Field sits inside Tax tab → gate by tax caps
						// even though it persists under wepos_general.
						{ perm_section: 'woo_tax' } as Partial< SettingsElement >
					),
				],
			},
		],
	} as unknown as SettingsElement;

	return buildTabIfAllowed( tab, perms );
}

function buildBarcodeTab(
	perms?: SectionPermissions
): SettingsElement | null {
	const tab = {
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

	return buildTabIfAllowed( tab, perms );
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

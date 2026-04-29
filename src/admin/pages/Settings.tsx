import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Settings as SettingsUI,
	Button,
	toast,
	type SettingsElement,
} from '@wedevs/plugin-ui';
import { LoaderCircle, Save } from 'lucide-react';
import { applyFilters as wpApplyFilters } from '@wordpress/hooks';
import { applyFilters } from '@react/hooks/useExtensions';
import {
	buildPosSettingsSubpage,
	POS_SETTINGS_SUBPAGE_ID,
	type SectionPermissions,
} from './pos-settings/schema';
import {
	ReferenceDataContext,
	type ReferenceData,
} from './pos-settings/reference-data';
import { registerPosSettingsFields } from './pos-settings/register';

// Register custom POS Settings field variants (country_state, customer_search,
// currency_select, tax_class_select) once at module load so they're available
// the first time the Settings page mounts.
registerPosSettingsFields();

const POS_SETTINGS_SECTIONS = [
	'woo_general',
	'woo_tax',
	'wepos_general',
	'wepos_barcode',
];

/**
 * Shape of the `weposAdmin` global set by Dashboard.php via wp_localize_script.
 */
interface WeposAdminData {
	ajaxurl: string;
	nonce: string;
	rest: {
		root: string;
		nonce: string;
	};
	settings_sections: Array< {
		id: string;
		title: string;
		icon: string;
	} >;
	settings_fields: Record<
		string,
		Record<
			string,
			{
				name: string;
				label: string;
				desc?: string;
				type: string;
				default?: string;
				options?: Record< string, string >;
				placeholder?: string;
				min?: number;
				max?: number;
				step?: number;
			}
		>
	>;
	allowed_pages: string[];
	access_data: Record<
		string,
		{
			name: string;
			capabilities: {
				wepos: Record< string, boolean >;
				wc: Record< string, boolean >;
				wp: Record< string, boolean >;
				pages: Record< string, boolean >;
				settings?: Record< string, boolean >;
			};
		}
	>;
	// Dokan vendor context (present when Dokan is active)
	is_dokan_active?: boolean;
	is_vendor?: boolean;
	vendor_id?: number;
	is_vendor_staff?: boolean;
}

declare global {
	interface Window {
		weposAdmin: WeposAdminData;
	}
}

/* ─── Mappers ──────────────────────────────────────────────────────────── */

const VARIANT_MAP: Record< string, string > = {
	text: 'text',
	email: 'text',
	url: 'text',
	number: 'number',
	textarea: 'textarea',
	select: 'select',
	radio: 'radio_capsule',
	checkbox: 'switch',
	multicheck: 'multicheck',
	wpeditor: 'textarea',
	color: 'color_picker',
	html: 'html',
};

const ICON_MAP: Record< string, string > = {
	'dashicons-admin-generic': 'Settings',
	'dashicons-media-text': 'FileText',
	'dashicons-cart': 'ShoppingCart',
	'dashicons-admin-users': 'Users',
	'dashicons-money-alt': 'DollarSign',
	'dashicons-store': 'Store',
};

function stripHtml( html: string ): string {
	const tmp = document.createElement( 'div' );
	tmp.innerHTML = html;
	return tmp.textContent || tmp.innerText || '';
}

/* ─── Access schema constants ─────────────────────────────────────────── */

/**
 * Default roles to display in the Access tab.
 * Pro can add 'cashier' via the `wepos_access_display_roles` filter.
 */
const DEFAULT_DISPLAY_ROLES = [
	'administrator',
	'editor',
	'shop_manager',
	'cashier',
	'seller',
	'vendor_staff',
];

/**
 * Capability group labels and ordering.
 */
const CAP_GROUPS: Array< { key: string; label: string } > = [
	{ key: 'wepos', label: __( 'wePOS', 'wepos' ) },
	{ key: 'settings', label: __( 'Settings', 'wepos' ) },
	{ key: 'pages', label: __( 'wePOS Pages', 'wepos' ) },
	{ key: 'wc', label: __( 'WooCommerce', 'wepos' ) },
	{ key: 'wp', label: __( 'WordPress', 'wepos' ) },
];

/**
 * Human-readable labels for capabilities.
 * The keys must match the raw capability slugs used in AccessController.
 */
const CAP_LABELS: Record< string, string > = {
	// wePOS
	access_wepos: __( 'Access POS', 'wepos' ),
	manage_wepos: __( 'Manage POS', 'wepos' ),
	wepos_view_all_outlets: __( 'View All Outlets', 'wepos' ),

	// Settings sections
	view_general_settings: __( 'View General Settings', 'wepos' ),
	edit_general_settings: __( 'Edit General Settings', 'wepos' ),
	view_tax_settings: __( 'View Tax Settings', 'wepos' ),
	edit_tax_settings: __( 'Edit Tax Settings', 'wepos' ),
	view_barcode_settings: __( 'View Barcode Settings', 'wepos' ),
	edit_barcode_settings: __( 'Edit Barcode Settings', 'wepos' ),

	// WooCommerce
	create_customers: __( 'Create Customers', 'wepos' ),
	read_private_products: __( 'Read Private Products', 'wepos' ),
	edit_products: __( 'Edit Products', 'wepos' ),
	edit_others_products: __( "Edit Others' Products", 'wepos' ),
	edit_published_products: __( 'Edit Published Products', 'wepos' ),
	read_private_shop_orders: __( 'Read Private Shop Orders', 'wepos' ),
	publish_shop_orders: __( 'Publish Shop Orders', 'wepos' ),
	edit_shop_orders: __( 'Edit Shop Orders', 'wepos' ),
	edit_others_shop_orders: __( "Edit Others' Shop Orders", 'wepos' ),
	edit_users: __( 'Edit Users', 'wepos' ),
	list_users: __( 'List Users', 'wepos' ),
	manage_product_terms: __( 'Manage Product Terms', 'wepos' ),
	read_private_shop_coupons: __( 'Read Private Shop Coupons', 'wepos' ),

	// WordPress
	read: __( 'Read', 'wepos' ),

	// wePOS Pages
	wepos_page_settings: __( 'Settings Page', 'wepos' ),
	wepos_page_view_pos: __( 'View POS Page', 'wepos' ),
	wepos_page_dashboard: __( 'Dashboard Page', 'wepos' ),
	wepos_page_outlets: __( 'Outlets Page', 'wepos' ),
	wepos_page_receipts: __( 'Receipts Page', 'wepos' ),
	wepos_page_license: __( 'License Page', 'wepos' ),
};

/* ─── Schema builders ─────────────────────────────────────────────────── */

/**
 * Build schema elements for standard settings sections (General, Receipts, etc.).
 * Returns a flat array for the plugin-ui formatter.
 */
function buildStandardSchema(
	sections: WeposAdminData[ 'settings_sections' ],
	fields: WeposAdminData[ 'settings_fields' ]
): SettingsElement[] {
	const elements: SettingsElement[] = [];

	sections.forEach( ( section, i ) => {
		// Skip access — it has its own builder
		if ( section.id === 'wepos_access' ) {
			return;
		}

		elements.push( {
			id: section.id,
			type: 'subpage',
			label: section.title,
			icon: ICON_MAP[ section.icon ] || 'Settings',
			page_id: 'wepos_settings',
			priority: ( i + 1 ) * 10,
		} as SettingsElement );

		const sectionId = `${ section.id }_section`;
		elements.push( {
			id: sectionId,
			type: 'section',
			label: '',
			page_id: section.id,
			priority: 10,
		} as SettingsElement );

		const sectionFields = fields[ section.id ] || {};
		Object.values( sectionFields ).forEach( ( field, j ) => {
			const variant = VARIANT_MAP[ field.type ] || 'text';
			const isSwitch = variant === 'switch';

			elements.push( {
				id: field.name,
				type: 'field',
				label: field.label,
				description: field.desc ? stripHtml( field.desc ) : '',
				dependency_key: field.name,
				variant,
				value: field.default ?? '',
				default: field.default ?? '',
				placeholder: field.placeholder ?? '',
				section_id: sectionId,
				priority: ( j + 1 ) * 10,
				options: field.options
					? Object.entries( field.options ).map(
							( [ val, lbl ] ) => ( {
								value: val,
								label: lbl,
							} )
						)
					: [],
				// Plugin-ui's switch variant needs explicit on/off values —
				// otherwise it treats the default string `'no'` as truthy and
				// renders stuck-ON.
				...( isSwitch
					? {
							enable_state: { value: 'yes', title: __( 'Enabled', 'wepos' ) },
							disable_state: { value: 'no', title: __( 'Disabled', 'wepos' ) },
						}
					: {} ),
				...( field.min !== undefined ? { min: field.min } : {} ),
				...( field.max !== undefined ? { max: field.max } : {} ),
			} as SettingsElement );
		} );
	} );

	return elements;
}

/**
 * Convert flat schema elements to hierarchical by building parent-child relationships.
 */
function convertFlatToHierarchical(
	flatElements: SettingsElement[]
): SettingsElement[] {
	const subpages: SettingsElement[] = [];
	let currentSubpage: SettingsElement | null = null;
	let currentSection: SettingsElement | null = null;

	for ( const elem of flatElements ) {
		if ( elem.type === 'subpage' ) {
			const subpage: SettingsElement = {
				...elem,
				children: [],
			};
			subpages.push( subpage );
			currentSubpage = subpage;
			currentSection = null;
		} else if ( elem.type === 'section' || elem.type === 'tab' ) {
			if ( currentSubpage ) {
				const section: SettingsElement = {
					...elem,
					children: [],
				};
				currentSubpage.children!.push( section );
				currentSection = section;
			}
		} else if ( elem.type === 'field' && currentSection ) {
			currentSection.children!.push( elem );
		}
	}

	return subpages;
}

/**
 * Build hierarchical schema for the Access subpage.
 * Returns hierarchical structure with children arrays to preserve dependency_key values.
 */
function buildAccessSchema(
	accessData: WeposAdminData[ 'access_data' ],
	sectionPriority: number
): SettingsElement[] {
	if ( ! accessData || typeof accessData !== 'object' ) {
		return [];
	}

	const displayRoles = applyFilters< string[] >(
		'wepos_access_display_roles',
		DEFAULT_DISPLAY_ROLES
	);

	const roles = displayRoles.filter(
		( slug: string ) => accessData[ slug ]
	);

	const tabChildren: SettingsElement[] = [];

	roles.forEach( ( roleSlug: string, roleIdx: number ) => {
		const role = accessData[ roleSlug ];
		const tabId = `access_tab_${ roleSlug }`;
		const sectionChildren: SettingsElement[] = [];

		CAP_GROUPS.forEach( ( group, groupIdx ) => {
			const caps =
				role.capabilities[
					group.key as keyof typeof role.capabilities
				];
			if ( ! caps || Object.keys( caps ).length === 0 ) {
				return;
			}

			const sectionId = `access_${ roleSlug }_${ group.key }`;
			const fieldChildren: SettingsElement[] = [];

			Object.entries( caps ).forEach(
				( [ cap, enabled ]: [ string, boolean ], capIdx: number ) => {
					const fieldKey = `access__${ roleSlug }__${ cap }`;

					// Lock essential caps for administrator — always ON, not toggleable
					const isLockedForAdmin =
						roleSlug === 'administrator' &&
						( cap === 'access_wepos' ||
							cap === 'manage_wepos' ||
							cap === 'wepos_view_all_outlets' ||
							cap === 'read' ||
							cap.startsWith( 'wepos_page_' ) ||
							cap.endsWith( '_settings' ) );

					fieldChildren.push( {
						id: fieldKey,
						type: 'field',
						variant: 'switch',
						label: CAP_LABELS[ cap ] || cap,
						dependency_key: fieldKey,
						value: isLockedForAdmin ? 'yes' : enabled ? 'yes' : 'no',
						default: isLockedForAdmin ? 'yes' : enabled ? 'yes' : 'no',
						disabled: isLockedForAdmin,
						enable_state: {
							value: 'yes',
							title: __( 'Enabled', 'wepos' ),
						},
						disable_state: {
							value: 'no',
							title: __( 'Disabled', 'wepos' ),
						},
						priority: ( capIdx + 1 ) * 10,
						children: [],
					} as unknown as SettingsElement );
				}
			);

			sectionChildren.push( {
				id: sectionId,
				type: 'section',
				label: group.label,
				priority: ( groupIdx + 1 ) * 10,
				children: fieldChildren,
			} as SettingsElement );
		} );

		tabChildren.push( {
			id: tabId,
			type: 'tab',
			label: role.name,
			priority: ( roleIdx + 1 ) * 10,
			children: sectionChildren,
		} as SettingsElement );
	} );

	const subpage = {
		id: 'wepos_access',
		type: 'subpage',
		label: __( 'Access', 'wepos' ),
		description: __(
			'By default, access to the POS is limited to Administrator, Editor, Shop Manager and Cashier roles. It is recommended that you do not change the default settings unless you are fully aware of the consequences.',
			'wepos'
		),
		icon: 'ShieldCheck',
		priority: sectionPriority,
		children: tabChildren,
	} as unknown as SettingsElement;

	return [ subpage ];
}

/**
 * Build the Payment Gateways subpage — a single full-width slot that the
 * `payment_gateways_table` field variant fills with its own React UI.
 * The component owns its REST roundtrips, so the SettingsUI value/onChange
 * plumbing isn't used.
 */
function buildPaymentGatewaysSubpage( priority: number ): SettingsElement {
	const subpageId = 'wepos_payment_gateways';
	const sectionId = `${ subpageId }_section`;

	return {
		id: subpageId,
		type: 'subpage',
		label: __( 'Payment Gateways', 'wepos' ),
		icon: 'CreditCard',
		priority,
		children: [
			{
				id: sectionId,
				type: 'section',
				label: '',
				priority: 10,
				children: [
					{
						id: 'wepos_payment_gateways_table',
						type: 'field',
						variant: 'payment_gateways_table',
						label: '',
						dependency_key: 'wepos_payment_gateways_table',
						value: '',
						priority: 10,
					} as unknown as SettingsElement,
				],
			} as SettingsElement,
		],
	} as unknown as SettingsElement;
}

/**
 * Build full schema as hierarchical structure (page with children).
 * This ensures the formatter passes it through unchanged, preserving dependency_key.
 */
function buildSchema(
	sections: WeposAdminData[ 'settings_sections' ],
	fields: WeposAdminData[ 'settings_fields' ],
	accessData: WeposAdminData[ 'access_data' ],
	perms?: SectionPermissions
): SettingsElement[] {
	const rootPage = {
		id: 'wepos_settings',
		type: 'page',
		label: __( 'Settings', 'wepos' ),
		icon: 'Settings',
		priority: 10,
		children: [],
	} as unknown as SettingsElement;

	// Get standard schema subpages (flat elements)
	const flatElements = buildStandardSchema( sections, fields );
	const standardSubpages = convertFlatToHierarchical( flatElements );
	rootPage.children!.push( ...standardSubpages );

	// Payment Gateways subpage — slotted between standard tabs and Access.
	rootPage.children!.push(
		buildPaymentGatewaysSubpage( ( standardSubpages.length + 1 ) * 10 )
	);

	// Get access schema (already hierarchical) — hidden for Dokan vendors
	// and their staff (vendors get a Dokan staff permissions matrix instead).
	const isVendor = window.weposAdmin?.is_vendor === true;
	const isVendorStaff = window.weposAdmin?.is_vendor_staff === true;

	if ( ! isVendor && ! isVendorStaff ) {
		const accessPriority =
			( sections.findIndex( ( s ) => s.id === 'wepos_access' ) + 1 ) * 10 ||
			( sections.length + 1 ) * 10;
		const accessSubpages = buildAccessSchema( accessData, accessPriority );
		rootPage.children!.push( ...accessSubpages );
	}

	// POS Settings subpage — always last, after Access. Hidden when
	// view perms strip every section.
	const posPriority =
		( rootPage.children!.length + 1 ) * 10 + 100;
	const posSubpage = buildPosSettingsSubpage( posPriority, perms );

	if ( posSubpage ) {
		rootPage.children!.push( posSubpage );
	}

	return [ rootPage ];
}

/**
 * Split `{ section.field: value }` back into REST-payload shape
 * `{ section: { field: value } }`, keeping only known POS Settings sections.
 */
function groupPosSettingsBySection(
	flat: Record< string, unknown >
): Record< string, Record< string, unknown > > {
	const grouped: Record< string, Record< string, unknown > > = {};
	for ( const [ key, value ] of Object.entries( flat ) ) {
		const dot = key.indexOf( '.' );
		if ( dot < 0 ) continue;
		const section = key.slice( 0, dot );
		if ( ! POS_SETTINGS_SECTIONS.includes( section ) ) continue;
		const field = key.slice( dot + 1 );
		if ( ! grouped[ section ] ) grouped[ section ] = {};
		grouped[ section ][ field ] = value;
	}
	return grouped;
}

/**
 * Flatten POS Settings sections from the REST response into dot-keyed map
 * (`woo_general.store_name`) for the plugin-ui values state.
 */
function flattenPosSettings(
	response: Record< string, unknown >
): Record< string, unknown > {
	const flat: Record< string, unknown > = {};
	for ( const section of POS_SETTINGS_SECTIONS ) {
		const bucket = response[ section ];
		if ( bucket && typeof bucket === 'object' ) {
			for ( const [ field, value ] of Object.entries(
				bucket as Record< string, unknown >
			) ) {
				flat[ `${ section }.${ field }` ] = value;
			}
		}
	}
	return flat;
}

/* ─── Value helpers ────────────────────────────────────────────────────── */

/**
 * Flatten `{ section: { field: value } }` → `{ field: value }`.
 */
function flattenValues(
	nested: Record< string, Record< string, unknown > >
): Record< string, unknown > {
	const flat: Record< string, unknown > = {};

	for ( const sectionValues of Object.values( nested ) ) {
		if ( sectionValues && typeof sectionValues === 'object' ) {
			for ( const [ key, value ] of Object.entries( sectionValues ) ) {
				flat[ key ] = value;
			}
		}
	}

	return flat;
}

/**
 * Parse an access dependency_key into role slug, group, and capability.
 * Key format: access__{role}__{cap}
 */
function parseAccessKey(
	key: string
): { role: string; cap: string } | null {
	const match = key.match( /^access__([^_]+(?:_[^_]+)*)__(.+)$/ );
	if ( ! match ) return null;
	return { role: match[ 1 ], cap: match[ 2 ] };
}

/* ─── Component ────────────────────────────────────────────────────────── */

const Settings = () => {
	const [ values, setValues ] = useState< Record< string, unknown > >( {} );
	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ referenceData, setReferenceData ] = useState< ReferenceData >( {
		currencies: {},
		tax_classes: {},
	} );
	const [ permissions, setPermissions ] = useState< SectionPermissions >( {
		can_view: {},
		can_edit: {},
	} );

	const {
		settings_sections: rawSections,
		settings_fields,
		ajaxurl,
		nonce,
		rest,
	} = window.weposAdmin;

	const [ accessData, setAccessData ] = useState<
		WeposAdminData[ 'access_data' ]
	>( () => window.weposAdmin.access_data );

	// wp_localize_script can serialize PHP arrays as JS objects.
	const settings_sections: WeposAdminData[ 'settings_sections' ] =
		Array.isArray( rawSections )
			? rawSections
			: Object.values( rawSections || {} );

	// Build the flat schema from PHP-provided data.
	const schema = useMemo( () => {
		const base = buildSchema(
			settings_sections,
			settings_fields,
			accessData,
			permissions
		);

		return applyFilters< SettingsElement[] >(
			'wepos_react_settings_schema',
			base
		);
	}, [ settings_sections, settings_fields, accessData, permissions ] );

	// Load current settings values on mount via REST.
	useEffect( () => {
		fetch( `${ rest.root }wepos/v1/settings`, {
			method: 'GET',
			headers: { 'X-WP-Nonce': rest.nonce },
		} )
			.then( ( res ) => res.json() )
			.then( ( response ) => {
				const defaults: Record< string, unknown > = {};

				for ( const sectionFields of Object.values(
					settings_fields
				) ) {
					for ( const field of Object.values( sectionFields ) ) {
						if ( field.default !== undefined ) {
							defaults[ field.name ] = field.default;
						}
					}
				}

				const saved = flattenValues(
					response as Record< string, Record< string, unknown > >
				);

				// Dot-keyed POS Settings values (woo_general.*, woo_tax.*, etc.)
				const posSettings = flattenPosSettings(
					response as Record< string, unknown >
				);

				// Reference data needed by custom POS Settings fields.
				const typed = response as {
					currencies?: ReferenceData[ 'currencies' ];
					tax_classes?: ReferenceData[ 'tax_classes' ];
					_permissions?: SectionPermissions;
				};
				setReferenceData( {
					currencies: typed.currencies || {},
					tax_classes: typed.tax_classes || {},
				} );

				if ( typed._permissions ) {
					setPermissions( {
						can_view: typed._permissions.can_view || {},
						can_edit: typed._permissions.can_edit || {},
					} );
				}

				// Merge access values from the pre-loaded access_data
				const accessValues: Record< string, unknown > = {};
				if ( accessData ) {
					for ( const [ roleSlug, role ] of Object.entries(
						accessData
					) ) {
						for ( const [ , caps ] of Object.entries(
							role.capabilities
						) ) {
							for ( const [ cap, enabled ] of Object.entries(
								caps
							) ) {
								accessValues[
									`access__${ roleSlug }__${ cap }`
								] = enabled ? 'yes' : 'no';
							}
						}
					}
				}

				setValues( {
					...defaults,
					...saved,
					...posSettings,
					...accessValues,
				} );
			} )
			.catch( ( err ) => {
				console.error( 'wePos: failed to load settings', err );
			} )
			.finally( () => setLoading( false ) );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const handleChange = useCallback(
		( _scopeId: string, key: string, value: unknown ) => {
			setValues( ( prev ) => ( { ...prev, [ key ]: value } ) );
		},
		[]
	);

	/**
	 * Save handler — routes access settings to their dedicated REST endpoint,
	 * all other sections to the unified /wepos/v1/settings endpoint with
	 * their section payload keyed by the admin section id.
	 */
	const handleSave = useCallback(
		async (
			scopeId: string,
			_treeValues: Record< string, unknown >,
			flatValues: Record< string, unknown >
		) => {
			if ( scopeId === 'wepos_access' ) {
				const applied = await saveAccessSettings(
					flatValues,
					rest,
					accessData
				);
				if ( applied ) {
					setAccessData( ( prev ) => {
						const next: WeposAdminData[ 'access_data' ] = {
							...prev,
						};
						for ( const [ roleSlug, capsData ] of Object.entries(
							applied
						) ) {
							const prevRole = next[ roleSlug ];
							if ( ! prevRole ) continue;
							const mergedCaps: typeof prevRole.capabilities = {
								wepos: { ...prevRole.capabilities.wepos },
								wc: { ...prevRole.capabilities.wc },
								wp: { ...prevRole.capabilities.wp },
								pages: { ...prevRole.capabilities.pages },
								settings: {
									...( prevRole.capabilities.settings || {} ),
								},
							};
							for ( const [ group, caps ] of Object.entries(
								capsData
							) ) {
								const target = mergedCaps[
									group as keyof typeof mergedCaps
								] as Record< string, boolean >;
								Object.assign( target, caps );
							}
							next[ roleSlug ] = {
								...prevRole,
								capabilities: mergedCaps,
							};
						}
						return next;
					} );
				}
				return;
			}

			setSaving( true );

			try {
				let payload: Record< string, Record< string, unknown > > = {};

				if ( scopeId === POS_SETTINGS_SUBPAGE_ID ) {
					payload = groupPosSettingsBySection( flatValues );
				} else {
					payload[ scopeId ] = flatValues;
				}

				const res = await fetch( `${ rest.root }wepos/v1/settings`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-WP-Nonce': rest.nonce,
					},
					body: JSON.stringify( payload ),
				} );

				if ( ! res.ok ) {
					throw new Error( 'save_failed' );
				}

				if ( scopeId === POS_SETTINGS_SUBPAGE_ID ) {
					const updated = await res.clone().json();
					setValues( ( prev ) => ( {
						...prev,
						...flattenPosSettings(
							updated as Record< string, unknown >
						),
					} ) );
					const typed = updated as {
						currencies?: ReferenceData[ 'currencies' ];
						tax_classes?: ReferenceData[ 'tax_classes' ];
					};
					setReferenceData( {
						currencies: typed.currencies || {},
						tax_classes: typed.tax_classes || {},
					} );
				}

				toast.success(
					__( 'Settings saved successfully.', 'wepos' )
				);
			} catch {
				toast.error( __( 'Failed to save settings.', 'wepos' ) );
			} finally {
				setSaving( false );
			}
		},
		[ rest, accessData ]
	);

	return (
		<div className="wepos-admin-settings -mx-[20px] -mt-[10px]">
			<ReferenceDataContext.Provider value={ referenceData }>
				<SettingsUI
					schema={ schema }
					values={ values }
					onChange={ handleChange }
					onSave={ handleSave }
					loading={ loading }
					title={ __( 'Settings', 'wepos' ) }
					hookPrefix="wepos"
					applyFilters={ wpApplyFilters }
					renderSaveButton={ ( { scopeId, dirty, onSave: save } ) => {
						// Payment Gateways tab owns its own Save button —
						// hide the SettingsUI one to avoid two competing controls.
						if ( scopeId === 'wepos_payment_gateways' ) {
							return null;
						}

						if ( scopeId === POS_SETTINGS_SUBPAGE_ID ) {
							const canEditAny = POS_SETTINGS_SECTIONS.some(
								( s ) => permissions.can_edit[ s ] !== false
							);
							if ( ! canEditAny ) {
								return null;
							}
						}

						return (
							<Button
								onClick={ save }
								disabled={ ! dirty || saving }
							>
								{ saving ? (
									<LoaderCircle className="size-4 mr-2 animate-spin" />
								) : (
									<Save className="size-4 mr-2" />
								) }
								{ __( 'Save Changes', 'wepos' ) }
							</Button>
						);
					} }
				/>
			</ReferenceDataContext.Provider>
		</div>
	);
};

/* ─── Access save helper ──────────────────────────────────────────────── */

/**
 * Save access capability changes via REST API.
 * Compares against the original data and only sends roles that have actual changes.
 */
async function saveAccessSettings(
	scopeValues: Record< string, unknown >,
	restConfig: { root: string; nonce: string },
	originalAccessData: WeposAdminData[ 'access_data' ]
): Promise< Record< string, Record< string, Record< string, boolean > > > | null > {
	// Group values by role
	const roleUpdates: Record<
		string,
		Record< string, Record< string, boolean > >
	> = {};

	for ( const [ key, value ] of Object.entries( scopeValues ) ) {
		const parsed = parseAccessKey( key );
		if ( ! parsed ) continue;

		const { role, cap } = parsed;
		const enabled = value === 'yes' || value === true;

		// Determine which group this cap belongs to
		let group = 'wp';
		if (
			cap === 'access_wepos' ||
			cap === 'manage_wepos' ||
			cap === 'wepos_view_all_outlets'
		) {
			group = 'wepos';
		} else if ( cap.startsWith( 'wepos_page_' ) ) {
			group = 'pages';
		} else if (
			/^(view|edit)_(general|tax|barcode)_settings$/.test( cap )
		) {
			group = 'settings';
		} else if ( cap !== 'read' ) {
			group = 'wc';
		}

		if ( ! roleUpdates[ role ] ) {
			roleUpdates[ role ] = {};
		}
		if ( ! roleUpdates[ role ][ group ] ) {
			roleUpdates[ role ][ group ] = {};
		}
		roleUpdates[ role ][ group ][ cap ] = enabled;
	}

	// Only keep roles that have actual changes compared to original data.
	const changedRoles: typeof roleUpdates = {};

	for ( const [ roleSlug, capsData ] of Object.entries( roleUpdates ) ) {
		const originalRole = originalAccessData?.[ roleSlug ];
		if ( ! originalRole ) continue;

		let hasChanges = false;

		for ( const [ group, caps ] of Object.entries( capsData ) ) {
			const originalCaps =
				originalRole.capabilities[
					group as keyof typeof originalRole.capabilities
				] || {};
			for ( const [ cap, enabled ] of Object.entries( caps ) ) {
				if ( ( originalCaps as Record< string, boolean > )[ cap ] !== enabled ) {
					hasChanges = true;
					break;
				}
			}
			if ( hasChanges ) break;
		}

		if ( hasChanges ) {
			changedRoles[ roleSlug ] = capsData;
		}
	}

	if ( Object.keys( changedRoles ).length === 0 ) {
		toast.info( __( 'No changes to save.', 'wepos' ) );
		return null;
	}

	try {
		// Send one request per changed role
		for ( const [ roleSlug, capsData ] of Object.entries( changedRoles ) ) {
			const response = await fetch(
				`${ restConfig.root }wepos/v1/settings/access`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-WP-Nonce': restConfig.nonce,
					},
					body: JSON.stringify( { [ roleSlug ]: capsData } ),
				}
			);

			if ( ! response.ok ) {
				throw new Error( 'Failed to update' );
			}
		}

		toast.success( __( 'Access settings saved successfully.', 'wepos' ) );
		return changedRoles;
	} catch {
		toast.error( __( 'Failed to save access settings.', 'wepos' ) );
		return null;
	}
}

export default Settings;

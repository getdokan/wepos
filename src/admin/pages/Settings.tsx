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
import type { ReactNode } from 'react';

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
			capabilities: Record< string, Record< string, boolean > >;
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

/**
 * Save handler signature for extensions registered via the
 * `wepos_react_settings_save_handlers` filter. Returning `null` (or
 * `{ handled: false }`) lets the next handler — and ultimately the lite
 * default flow — run. Returning `{ handled: true }` short-circuits the
 * save and lets the handler push values/response back into lite state.
 */
export type SettingsSaveHandlerArgs = {
	scopeId: string;
	flatValues: Record< string, unknown >;
	rest: { root: string; nonce: string };
	setSaving: ( saving: boolean ) => void;
};

export type SettingsSaveHandlerResult = {
	handled: boolean;
	values?: Record< string, unknown >;
	response?: Record< string, unknown >;
} | null;

export type SettingsSaveHandler = (
	args: SettingsSaveHandlerArgs
) => Promise< SettingsSaveHandlerResult > | SettingsSaveHandlerResult;

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
 * Lite-owned capability groups.
 *
 * Extensions add their own groups via `wepos_react_access_cap_groups`
 * (e.g. wepos-pro pushes the "Settings" group).
 */
const CAP_GROUPS_LITE: Array< { key: string; label: string } > = [
	{ key: 'wepos', label: __( 'wePOS', 'wepos' ) },
	{ key: 'pages', label: __( 'wePOS Pages', 'wepos' ) },
	{ key: 'wc', label: __( 'WooCommerce', 'wepos' ) },
	{ key: 'wp', label: __( 'WordPress', 'wepos' ) },
];

/**
 * Lite-owned capability labels.
 *
 * Caps without a registered label are skipped during render — extensions
 * that introduce new caps (e.g. wepos-pro's `wepos_view_all_outlets`,
 * `view_general_settings`, …) must register labels via
 * `wepos_react_access_cap_labels`.
 */
const CAP_LABELS_LITE: Record< string, string > = {
	// wePOS
	access_wepos: __( 'Access POS', 'wepos' ),
	manage_wepos: __( 'Manage POS', 'wepos' ),

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
 *
 * Cap groups & labels are filterable so extensions can register their own.
 * A cap is rendered only when a label is registered for it (lite-owned or
 * Pro-extension), keeping unfamiliar caps out of the UI.
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

	const capGroups = applyFilters< Array< { key: string; label: string } > >(
		'wepos_react_access_cap_groups',
		CAP_GROUPS_LITE
	);

	const capLabels = applyFilters< Record< string, string > >(
		'wepos_react_access_cap_labels',
		CAP_LABELS_LITE
	);

	const tabChildren: SettingsElement[] = [];

	roles.forEach( ( roleSlug: string, roleIdx: number ) => {
		const role = accessData[ roleSlug ];
		const tabId = `access_tab_${ roleSlug }`;
		const sectionChildren: SettingsElement[] = [];

		capGroups.forEach( ( group: { key: string; label: string }, groupIdx: number ) => {
			const rawCaps = role.capabilities[ group.key ];
			if ( ! rawCaps || Object.keys( rawCaps ).length === 0 ) {
				return;
			}

			const sectionId = `access_${ roleSlug }_${ group.key }`;
			const fieldChildren: SettingsElement[] = [];

			Object.entries( rawCaps ).forEach(
				(
					[ cap, enabled ]: [ string, boolean ],
					capIdx: number
				) => {
					// Hide caps without a registered label — keeps unrecognized
					// (e.g. inactive-extension) caps out of the UI.
					if ( ! capLabels[ cap ] ) {
						return;
					}

					const fieldKey = `access__${ roleSlug }__${ cap }`;

					// Administrator caps are always ON and not toggleable.
					const isLockedForAdmin = roleSlug === 'administrator';

					fieldChildren.push( {
						id: fieldKey,
						type: 'field',
						variant: 'switch',
						label: capLabels[ cap ],
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

			if ( fieldChildren.length === 0 ) {
				return;
			}

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
 * Build full schema as hierarchical structure (page with children).
 *
 * Extensions add subpages via `wepos_react_settings_schema`. The filter
 * receives `{ accessData, response }` so handlers can use response data
 * (currencies, permissions, etc.) when constructing their schema.
 */
function buildSchema(
	sections: WeposAdminData[ 'settings_sections' ],
	fields: WeposAdminData[ 'settings_fields' ],
	accessData: WeposAdminData[ 'access_data' ],
	response: Record< string, unknown >
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

	return applyFilters< SettingsElement[] >(
		'wepos_react_settings_schema',
		[ rootPage ],
		{ accessData, response }
	);
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
	// Raw REST response — passed to filter callbacks so extensions can
	// extract response-specific data (reference data, permissions, …)
	// without re-fetching.
	const [ response, setResponse ] = useState< Record< string, unknown > >( {} );

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

	// Build the schema from PHP-provided data + extension contributions.
	const schema = useMemo(
		() =>
			buildSchema(
				settings_sections,
				settings_fields,
				accessData,
				response
			),
		[ settings_sections, settings_fields, accessData, response ]
	);

	// Load current settings values on mount via REST.
	useEffect( () => {
		fetch( `${ rest.root }wepos/v1/settings`, {
			method: 'GET',
			headers: { 'X-WP-Nonce': rest.nonce },
		} )
			.then( ( res ) => res.json() )
			.then( ( rawResponse ) => {
				setResponse( rawResponse );

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
					rawResponse as Record< string, Record< string, unknown > >
				);

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

				// Extensions (e.g. Pro POS Settings) merge in their own values
				// derived from the raw response.
				const initial = applyFilters< Record< string, unknown > >(
					'wepos_react_settings_initial_values',
					{
						...defaults,
						...saved,
						...accessValues,
					},
					rawResponse
				);

				setValues( initial );
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
	 * Save handler — extension save handlers run first; if none claims the
	 * scope, lite handles `wepos_access` via the dedicated access endpoint
	 * and any other scope via `/wepos/v1/settings`.
	 */
	const handleSave = useCallback(
		async (
			scopeId: string,
			_treeValues: Record< string, unknown >,
			flatValues: Record< string, unknown >
		) => {
			// Collect handlers contributed by extensions and try each in turn.
			const handlers = applyFilters< SettingsSaveHandler[] >(
				'wepos_react_settings_save_handlers',
				[]
			);
			for ( const handler of handlers ) {
				const result = await handler( {
					scopeId,
					flatValues,
					rest,
					setSaving,
				} );
				if ( result && result.handled ) {
					if ( result.values ) {
						setValues( ( prev ) => ( {
							...prev,
							...result.values!,
						} ) );
					}
					if ( result.response ) {
						setResponse( result.response );
					}
					return;
				}
			}

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
							const mergedCaps: Record<
								string,
								Record< string, boolean >
							> = {};
							for ( const [ g, caps ] of Object.entries(
								prevRole.capabilities
							) ) {
								mergedCaps[ g ] = { ...caps };
							}
							for ( const [ group, caps ] of Object.entries(
								capsData
							) ) {
								if ( ! mergedCaps[ group ] ) {
									mergedCaps[ group ] = {};
								}
								Object.assign( mergedCaps[ group ], caps );
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
				const payload: Record< string, Record< string, unknown > > = {
					[ scopeId ]: flatValues,
				};

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

	const settingsUI = (
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
				// Extensions can override the save button per scope.
				// Returning `false` suppresses the button entirely;
				// returning `null`/`undefined` falls through to lite's default.
				const overridden = applyFilters< ReactNode | false | null >(
					'wepos_react_settings_save_button',
					null,
					{ scopeId, dirty, save, saving, response }
				);
				if ( overridden === false ) {
					return null;
				}
				if ( overridden !== null && overridden !== undefined ) {
					return overridden as ReactNode;
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
	);

	// Extensions can wrap the settings UI with their own context providers
	// (e.g. wepos-pro injects the POS Settings reference-data context).
	const wrappedSettingsUI = applyFilters< ReactNode >(
		'wepos_react_settings_root_wrapper',
		settingsUI,
		{ response }
	);

	return (
		<div className="wepos-admin-settings -mx-[20px] -mt-[10px]">
			{ wrappedSettingsUI }
		</div>
	);
};

/* ─── Access save helper ──────────────────────────────────────────────── */

/**
 * Save access capability changes via REST API.
 *
 * Resolves each cap's group from the loaded `accessData` rather than
 * pattern-matching cap names — this keeps the routing agnostic to which
 * extension contributed any given group/cap (lite or Pro).
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

		const originalRole = originalAccessData?.[ role ];
		if ( ! originalRole ) continue;

		// Resolve the cap's group from the source-of-truth structure.
		let group: string | null = null;
		for ( const [ g, caps ] of Object.entries( originalRole.capabilities ) ) {
			if ( Object.prototype.hasOwnProperty.call( caps, cap ) ) {
				group = g;
				break;
			}
		}
		if ( ! group ) continue;

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
				( originalRole.capabilities[ group ] as Record<
					string,
					boolean
				> ) || {};
			for ( const [ cap, enabled ] of Object.entries( caps ) ) {
				if ( originalCaps[ cap ] !== enabled ) {
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

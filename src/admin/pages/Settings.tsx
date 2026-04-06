import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Settings as SettingsUI,
	Button,
	toast,
	type SettingsElement,
} from '@wedevs/plugin-ui';
import { LoaderCircle, Save } from 'lucide-react';
import { applyFilters } from '@react/hooks/useExtensions';

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
];

/**
 * Capability group labels and ordering.
 */
const CAP_GROUPS: Array< { key: string; label: string } > = [
	{ key: 'wepos', label: __( 'WePOS', 'wepos' ) },
	{ key: 'wc', label: __( 'WooCommerce', 'wepos' ) },
	{ key: 'wp', label: __( 'WordPress', 'wepos' ) },
	{ key: 'pages', label: __( 'WePOS Pages', 'wepos' ) },
];

/**
 * Human-readable labels for capabilities.
 * The keys must match the raw capability slugs used in AccessController.
 */
const CAP_LABELS: Record< string, string > = {
	// WePOS
	access_wepos: __( 'Access WePOS', 'wepos' ),
	manage_wepos: __( 'Manage WePOS', 'wepos' ),
	wepos_view_all_outlets: __( 'View All Outlets', 'wepos' ),

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

	// WePOS Pages
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
			elements.push( {
				id: field.name,
				type: 'field',
				label: field.label,
				description: field.desc ? stripHtml( field.desc ) : '',
				dependency_key: field.name,
				variant: VARIANT_MAP[ field.type ] || 'text',
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
							cap.startsWith( 'wepos_page_' ) );

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
 * Build full schema as hierarchical structure (page with children).
 * This ensures the formatter passes it through unchanged, preserving dependency_key.
 */
function buildSchema(
	sections: WeposAdminData[ 'settings_sections' ],
	fields: WeposAdminData[ 'settings_fields' ],
	accessData: WeposAdminData[ 'access_data' ]
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

	// Get access schema (already hierarchical) — hidden for Dokan vendors.
	const isVendor = window.weposAdmin?.is_vendor === true;

	if ( ! isVendor ) {
		const accessPriority =
			( sections.findIndex( ( s ) => s.id === 'wepos_access' ) + 1 ) * 10 ||
			( sections.length + 1 ) * 10;
		const accessSubpages = buildAccessSchema( accessData, accessPriority );
		rootPage.children!.push( ...accessSubpages );
	}

	return [ rootPage ];
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

	const {
		settings_sections: rawSections,
		settings_fields,
		access_data: accessData,
		ajaxurl,
		nonce,
		rest,
	} = window.weposAdmin;

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
			accessData
		);

		return applyFilters< SettingsElement[] >(
			'wepos_react_settings_schema',
			base
		);
	}, [ settings_sections, settings_fields, accessData ] );

	// Load current settings values on mount.
	useEffect( () => {
		const formData = new FormData();
		formData.append( 'action', 'wepos_get_setting_values' );
		formData.append( 'nonce', nonce );

		fetch( ajaxurl, { method: 'POST', body: formData } )
			.then( ( res ) => res.json() )
			.then( ( response ) => {
				if ( response.success && response.data ) {
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

					const saved = flattenValues( response.data );

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
						...accessValues,
					} );
				}
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
	 * Save handler — routes to AJAX for standard settings,
	 * or to REST API for access settings.
	 */
	const handleSave = useCallback(
		async (
			scopeId: string,
			_treeValues: Record< string, unknown >,
			flatValues: Record< string, unknown >
		) => {
			if ( scopeId === 'wepos_access' ) {
				await saveAccessSettings( flatValues, rest, accessData );
				return;
			}

			// Standard settings save via AJAX
			setSaving( true );

			try {
				const formData = new FormData();
				formData.append( 'action', 'wepos_save_settings' );
				formData.append( 'nonce', nonce );
				formData.append( 'section', scopeId );

				for ( const [ key, value ] of Object.entries( flatValues ) ) {
					formData.append(
						`settingsData[${ key }]`,
						String( value ?? '' )
					);
				}

				const res = await fetch( ajaxurl, {
					method: 'POST',
					body: formData,
				} );

				const result = await res.json();

				if ( result.success ) {
					toast.success(
						__( 'Settings saved successfully.', 'wepos' )
					);
				} else {
					toast.error(
						__( 'Failed to save settings.', 'wepos' )
					);
				}
			} catch {
				toast.error( __( 'Failed to save settings.', 'wepos' ) );
			} finally {
				setSaving( false );
			}
		},
		[ ajaxurl, nonce, rest ]
	);

	return (
		<div className="wepos-admin-settings -mx-[20px] -mt-[10px]">
			<SettingsUI
				schema={ schema }
				values={ values }
				onChange={ handleChange }
				onSave={ handleSave }
				loading={ loading }
				title={ __( 'Settings', 'wepos' ) }
				hookPrefix="wepos"
				renderSaveButton={ ( { dirty, onSave: save } ) => (
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
				) }
			/>
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
) {
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
		if ( cap === 'access_wepos' || cap === 'manage_wepos' ) {
			group = 'wepos';
		} else if ( cap.startsWith( 'wepos_page_' ) ) {
			group = 'pages';
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
		return;
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
	} catch {
		toast.error( __( 'Failed to save access settings.', 'wepos' ) );
	}
}

export default Settings;

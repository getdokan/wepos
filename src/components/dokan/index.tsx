/**
 * Dokan compatibility — admin component registrations.
 *
 * Registers Dokan-specific UI components on wepos filter hooks so they are
 * rendered by the outlet form (and any future extension points) only when
 * Dokan is active and the current user is an admin.
 */
import { addComponentFilter } from '@react/hooks/useExtensions';
import VendorSearch from './VendorSearch';

declare const window: any;

const wepos = window.weposAdmin || {};
const isDokanActive = !! wepos.is_dokan_active;
const isAdmin = !! wepos.is_admin_user;

if ( isDokanActive && isAdmin ) {
	addComponentFilter(
		'wepos_outlet_form_vendor_section',
		'wepos/dokan-vendor-search',
		VendorSearch,
	);
}

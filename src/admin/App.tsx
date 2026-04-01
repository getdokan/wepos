import { useMemo, useEffect } from '@wordpress/element';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { applyFilters } from '@react/hooks/useExtensions';
import Settings from './pages/Settings';
import Placeholder from './pages/Placeholder';

export interface WeposAdminRouteConfig {
	path: string;
	element: React.ReactNode;
	replace?: boolean;
	page_key?: string;
}

/**
 * Fix WordPress admin menu highlighting for hash-based routing.
 * Same pattern as the Vue admin's admin-menu-fix.js.
 */
function useAdminMenuFix() {
	const location = useLocation();

	useEffect( () => {
		const $ = ( window as any ).jQuery;
		if ( ! $ ) {
			return;
		}

		const menuRoot = $( '#toplevel_page_wepos' );
		const currentUrl = window.location.href;
		const currentPath = currentUrl.substring(
			currentUrl.indexOf( 'admin.php' )
		);

		$( 'ul.wp-submenu li', menuRoot ).removeClass( 'current' );

		$( 'ul.wp-submenu a', menuRoot ).each( function (
			_index: number,
			el: HTMLElement
		) {
			if ( $( el ).attr( 'href' ) === currentPath ) {
				$( el ).parent().addClass( 'current' );
			}
		} );
	}, [ location ] );
}

/**
 * Map route paths to page keys for access control.
 * Pro extends this via the wepos_react_admin_routes filter (page_key field).
 */
const ROUTE_PAGE_KEY_MAP: Record< string, string > = {
	'/settings': 'settings',
};

const App = () => {
	useAdminMenuFix();

	const allowedPages: string[] =
		( window as any ).weposAdmin?.allowed_pages || [];

	const additionalRoutes = applyFilters< WeposAdminRouteConfig[] >(
		'wepos_react_admin_routes',
		[]
	);

	// Build route-to-page_key map from additional routes.
	const routePageKeys = useMemo( () => {
		const map = { ...ROUTE_PAGE_KEY_MAP };
		for ( const route of additionalRoutes ) {
			if ( route.page_key ) {
				map[ route.path ] = route.page_key;
			}
		}
		return map;
	}, [ additionalRoutes ] );

	// Get switchable page keys from the panel switcher data so we can
	// render placeholder routes for pages that don't have React components yet.
	const switchableKeys =
		( window as any ).weposPanelSwitch?.supported_keys || [];

	const allRoutes = useMemo( () => {
		const routes: Record< string, React.ReactNode > = {
			'/settings': <Settings />,
		};

		// Allow extensions to replace base routes.
		for ( const route of additionalRoutes ) {
			if ( route.replace && routes[ route.path ] !== undefined ) {
				routes[ route.path ] = route.element;
			}
		}

		// Add extra routes from extensions.
		for ( const route of additionalRoutes ) {
			if ( ! route.replace && ! routes[ route.path ] ) {
				routes[ route.path ] = route.element;
			}
		}

		// Add placeholder routes for switchable pages that don't have
		// a React component registered yet (e.g., pro pages).
		for ( const key of switchableKeys ) {
			const path = '/' + key;
			if ( ! routes[ path ] ) {
				routes[ path ] = <Placeholder />;
			}
		}

		// Filter out routes the user cannot access based on page caps.
		for ( const path of Object.keys( routes ) ) {
			const pageKey = routePageKeys[ path ];
			if ( pageKey && ! allowedPages.includes( pageKey ) ) {
				delete routes[ path ];
			}
		}

		return routes;
	}, [ additionalRoutes, switchableKeys, allowedPages, routePageKeys ] );

	// Find the first available route to use as the fallback redirect.
	const fallbackPath = Object.keys( allRoutes )[ 0 ] || '/settings';

	return (
		<Routes>
			{ Object.entries( allRoutes ).map( ( [ path, element ] ) => (
				<Route key={ path } path={ path } element={ element } />
			) ) }
			<Route
				path="*"
				element={ <Navigate to={ fallbackPath } replace /> }
			/>
		</Routes>
	);
};

export default App;

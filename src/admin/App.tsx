import { useMemo, useEffect } from '@wordpress/element';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { applyFilters } from '@react/hooks/useExtensions';
import Settings from './pages/Settings';

export interface WeposAdminRouteConfig {
	path: string;
	element: React.ReactNode;
	replace?: boolean;
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

const App = () => {
	useAdminMenuFix();

	const additionalRoutes = applyFilters< WeposAdminRouteConfig[] >(
		'wepos_react_admin_routes',
		[]
	);

	const { baseRoutes, extraRoutes } = useMemo( () => {
		const defaults: Record< string, React.ReactNode > = {
			'/settings': <Settings />,
		};

		// Allow extensions to replace base routes.
		for ( const route of additionalRoutes ) {
			if ( route.replace && defaults[ route.path ] !== undefined ) {
				defaults[ route.path ] = route.element;
			}
		}

		// Collect routes that are not replacements and not already in defaults.
		const extra = additionalRoutes.filter(
			( r ) =>
				! r.replace &&
				! Object.keys( defaults ).includes( r.path )
		);

		return { baseRoutes: defaults, extraRoutes: extra };
	}, [ additionalRoutes ] );

	return (
		<Routes>
			{ Object.entries( baseRoutes ).map( ( [ path, element ] ) => (
				<Route key={ path } path={ path } element={ element } />
			) ) }
			{ extraRoutes.map( ( route ) => (
				<Route
					key={ route.path }
					path={ route.path }
					element={ route.element }
				/>
			) ) }
			<Route path="*" element={ <Navigate to="/settings" replace /> } />
		</Routes>
	);
};

export default App;

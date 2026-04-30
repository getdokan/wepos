import React, { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { applyFilters } from './hooks/useExtensions';
import HomePage from './pages/Home';
import OrdersPage from './pages/Orders';
import CustomersPage from './pages/Customers';

export interface WeposRouteConfig {
	path: string;
	element: React.ReactNode;
	/** When true, this route replaces a base route with the same path */
	replace?: boolean;
}

export type RouteGuardFn = ( pathname: string ) => {
	allowed: boolean;
	redirectTo?: string;
};

/**
 * Wrapper component that applies the route guard filter.
 * If no guard is registered (base wepos without pro), all routes are allowed.
 */
const GuardedRoute: React.FC< { children: React.ReactNode } > = ( {
	children,
} ) => {
	const guard = applyFilters< RouteGuardFn | null >(
		'wepos_react_route_guard',
		null,
	);

	if ( guard ) {
		const result = guard( window.location.hash.replace( '#', '' ) || '/' );
		if ( ! result.allowed ) {
			return <Navigate to={ result.redirectTo || '/login' } replace />;
		}
	}

	return <>{ children }</>;
};

const App: React.FC = () => {
	// Allow pro/extensions to inject additional routes or replace existing ones
	const additionalRoutes = applyFilters< WeposRouteConfig[] >(
		'wepos_react_routes',
		[],
	);

	// Build base routes, allowing pro to replace them
	const baseRoutes = useMemo( () => {
		const defaults: Record< string, React.ReactNode > = {
			'/': <HomePage />,
			'/orders': <OrdersPage />,
			'/customers': <CustomersPage />,
		};

		// If pro provides a route with replace=true, use it instead of the default
		for ( const route of additionalRoutes ) {
			if ( route.replace && defaults[ route.path ] !== undefined ) {
				defaults[ route.path ] = route.element;
			}
		}

		return defaults;
	}, [ additionalRoutes ] );

	// Extra routes that don't replace base routes
	const extraRoutes = useMemo(
		() =>
			additionalRoutes.filter(
				( r ) =>
					! r.replace &&
					! Object.keys( baseRoutes ).includes( r.path ),
			),
		[ additionalRoutes, baseRoutes ],
	);

	return (
		<Routes>
			{ Object.entries( baseRoutes ).map( ( [ path, element ] ) => (
				<Route
					key={ path }
					path={ path }
					element={
						<GuardedRoute>{ element }</GuardedRoute>
					}
				/>
			) ) }
			{ extraRoutes.map( ( route ) => (
				<Route
					key={ route.path }
					path={ route.path }
					element={ route.element }
				/>
			) ) }
		</Routes>
	);
};

export default App;

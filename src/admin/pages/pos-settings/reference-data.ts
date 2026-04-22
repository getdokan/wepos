import { useContext, createContext } from '@wordpress/element';

/**
 * Reference data (currencies, tax classes) is loaded once at the page level
 * from `GET /wepos/v1/settings` and exposed through context so child field
 * components can consume it without each calling the REST API.
 */

export interface ReferenceData {
	currencies: Record< string, { name: string; symbol: string } >;
	tax_classes: Record< string, string >;
}

export const ReferenceDataContext = createContext< ReferenceData >( {
	currencies: {},
	tax_classes: {},
} );

export function useCurrenciesRef() {
	return useContext( ReferenceDataContext ).currencies;
}

export function useTaxClassesRef() {
	return useContext( ReferenceDataContext ).tax_classes;
}

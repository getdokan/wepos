import { useState, useEffect, useCallback, useRef } from 'react';
import { posAPI } from '../api';

const LEGACY_STORAGE_KEY = 'wepos_barcode_settings';

export interface BarcodeSettings {
	averageTimeThreshold: number;
	minimumLength: number;
	prefix: string;
	suffix: string;
}

const DEFAULT_SETTINGS: BarcodeSettings = {
	averageTimeThreshold: 24,
	minimumLength: 8,
	prefix: '',
	suffix: '',
};

function coerceSettings( raw: unknown ): BarcodeSettings | null {
	if ( ! raw || typeof raw !== 'object' ) {
		return null;
	}

	const source = raw as Partial< Record< keyof BarcodeSettings, unknown > >;

	const next: BarcodeSettings = { ...DEFAULT_SETTINGS };

	if ( source.averageTimeThreshold !== undefined ) {
		const n = Number( source.averageTimeThreshold );
		if ( Number.isFinite( n ) ) next.averageTimeThreshold = n;
	}
	if ( source.minimumLength !== undefined ) {
		const n = Number( source.minimumLength );
		if ( Number.isFinite( n ) ) next.minimumLength = n;
	}
	if ( typeof source.prefix === 'string' ) {
		next.prefix = source.prefix;
	}
	if ( typeof source.suffix === 'string' ) {
		next.suffix = source.suffix;
	}

	return next;
}

function readLegacyLocalStorage(): BarcodeSettings | null {
	try {
		const stored = localStorage.getItem( LEGACY_STORAGE_KEY );
		if ( ! stored ) return null;
		return coerceSettings( JSON.parse( stored ) );
	} catch {
		return null;
	}
}

function clearLegacyLocalStorage() {
	try {
		localStorage.removeItem( LEGACY_STORAGE_KEY );
	} catch {
		// ignore
	}
}

export function useBarcodeSettings() {
	const [ settings, setSettings ] = useState< BarcodeSettings >(
		() => readLegacyLocalStorage() ?? { ...DEFAULT_SETTINGS }
	);
	const [ loaded, setLoaded ] = useState( false );
	const outletIdRef = useRef< number | undefined >( undefined );

	// One-time bootstrap: pull server state and migrate stale localStorage.
	useEffect( () => {
		let cancelled = false;

		( async () => {
			try {
				const response = await posAPI.settings.getSettings();
				const remote = coerceSettings(
					( response as unknown as { wepos_barcode?: unknown } )
						.wepos_barcode
				);

				if ( cancelled ) return;

				if ( remote ) {
					setSettings( remote );
				}

				// Migrate legacy client storage to the server once.
				const legacy = readLegacyLocalStorage();
				if ( legacy && ! remote ) {
					try {
						await posAPI.settings.updateSettings( {
							wepos_barcode: legacy,
						} );
						setSettings( legacy );
					} catch {
						// ignore — fall back to local defaults on failure
					}
				}
				clearLegacyLocalStorage();
			} catch {
				// Keep the defaults / legacy values already in state.
			} finally {
				if ( ! cancelled ) {
					setLoaded( true );
				}
			}
		} )();

		return () => {
			cancelled = true;
		};
	}, [] );

	const persist = useCallback( async ( next: BarcodeSettings ) => {
		try {
			await posAPI.settings.updateSettings(
				{ wepos_barcode: next },
				outletIdRef.current
			);
		} catch {
			// Leave in-memory state as-is; UI reflects last user input.
		}
	}, [] );

	const updateSettings = useCallback(
		( updates: Partial< BarcodeSettings > ) => {
			setSettings( ( prev ) => {
				const next = { ...prev, ...updates };
				void persist( next );
				return next;
			} );
		},
		[ persist ]
	);

	const restoreDefaults = useCallback( () => {
		setSettings( { ...DEFAULT_SETTINGS } );
		void persist( { ...DEFAULT_SETTINGS } );
	}, [ persist ] );

	return {
		settings,
		updateSettings,
		restoreDefaults,
		loaded,
	};
}

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'wepos_barcode_settings';

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

function loadSettings(): BarcodeSettings {
	try {
		const stored = localStorage.getItem( STORAGE_KEY );
		if ( stored ) {
			return { ...DEFAULT_SETTINGS, ...JSON.parse( stored ) };
		}
	} catch {
		// ignore parse errors
	}
	return { ...DEFAULT_SETTINGS };
}

function saveSettings( settings: BarcodeSettings ) {
	try {
		localStorage.setItem( STORAGE_KEY, JSON.stringify( settings ) );
	} catch {
		// ignore storage errors
	}
}

export function useBarcodeSettings() {
	const [ settings, setSettings ] = useState< BarcodeSettings >( loadSettings );

	useEffect( () => {
		saveSettings( settings );
	}, [ settings ] );

	const updateSettings = useCallback( ( updates: Partial< BarcodeSettings > ) => {
		setSettings( ( prev ) => ( { ...prev, ...updates } ) );
	}, [] );

	const restoreDefaults = useCallback( () => {
		setSettings( { ...DEFAULT_SETTINGS } );
	}, [] );

	return {
		settings,
		updateSettings,
		restoreDefaults,
	};
}

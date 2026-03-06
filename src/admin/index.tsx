import React from 'react';
import { createRoot } from 'react-dom/client';
import * as ReactRouterDOM from 'react-router-dom';
import { HashRouter } from 'react-router-dom';
import * as PluginUI from '@wedevs/plugin-ui';
import { ThemeProvider, type ThemeTokens } from '@wedevs/plugin-ui';
import { SlotFillProvider } from '@wordpress/components';
import App from './App';
import { weposHooks } from '@react/hooks/useExtensions';
import './styles/main.css';

// Populate the pre-declared global objects (created by PHP inline script before
// any bundles load) with the real module exports.
Object.assign( ( window as any ).__weposReactRouterDOM, ReactRouterDOM );
Object.assign( ( window as any ).__weposPluginUI, PluginUI );

const container = document.getElementById( 'wepos-admin-react-app' );

const weposTokens: ThemeTokens = {
	background: 'oklch(1 0 0)',
	foreground: 'oklch(0 0 0)',
	card: 'oklch(1 0 0)',
	cardForeground: 'oklch(0 0 0)',
	popover: 'oklch(1 0 0)',
	popoverForeground: 'oklch(0 0 0)',
	primary: 'oklch(.511 .262 276.966)',
	primaryForeground: 'oklch(0.9850 0 0)',
	secondary: 'oklch(0.9700 0 0)',
	secondaryForeground: 'oklch(.511 .262 276.966)',
	muted: 'oklch(0.9700 0 0)',
	mutedForeground: 'oklch(0.5560 0 0)',
	accent: 'oklch(0.9700 0 0)',
	accentForeground: 'oklch(.511 .262 276.966)',
	destructive: 'oklch(0.5770 0.2450 27.3250)',
	destructiveForeground: 'oklch(1 0 0)',
	border: 'oklch(0.9220 0 0)',
	input: 'oklch(0.9220 0 0)',
	ring: 'oklch(0.8100 0.1000 252)',
	chart1: 'oklch(0.8100 0.1000 252)',
	chart2: 'oklch(0.6200 0.1900 260)',
	chart3: 'oklch(0.5500 0.2200 263)',
	chart4: 'oklch(0.4900 0.2200 264)',
	chart5: 'oklch(0.4200 0.1800 266)',
	sidebar: 'oklch(0.9850 0 0)',
	sidebarForeground: 'oklch(0.1450 0 0)',
	sidebarPrimary: 'oklch(0.2050 0 0)',
	sidebarPrimaryForeground: 'oklch(0.9850 0 0)',
	sidebarAccent: 'oklch(0.9700 0 0)',
	sidebarAccentForeground: 'oklch(0.2050 0 0)',
	sidebarBorder: 'oklch(0.9220 0 0)',
	sidebarRing: 'oklch(0.7080 0 0)',
	fontSans:
		"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
	fontSerif:
		"ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
	fontMono:
		"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
	radius: '0.625rem',
	'shadow-x': '0',
	'shadow-y': '1px',
	'shadow-blur': '3px',
	'shadow-spread': '0px',
	'shadow-opacity': '0.1',
	'shadow-color': 'oklch(0 0 0)',
	'shadow-2xs': '0 1px 3px 0px hsl(0 0% 0% / 0.05)',
	'shadow-xs': '0 1px 3px 0px hsl(0 0% 0% / 0.05)',
	'shadow-sm':
		'0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
	shadow: '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
	'shadow-md':
		'0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)',
	'shadow-lg':
		'0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10)',
	'shadow-xl':
		'0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10)',
	'shadow-2xl': '0 1px 3px 0px hsl(0 0% 0% / 0.25)',
	'tracking-normal': '0em',
	spacing: '0.25rem',
};

if ( ! container ) {
	console.error( 'WePos: React admin app container not found' );
} else {
	weposHooks.doAction( 'wepos_react_admin_before_render' );

	const root = createRoot( container );

	root.render(
		<React.StrictMode>
			<ThemeProvider pluginId="wepos-admin" tokens={ weposTokens }>
				<SlotFillProvider>
					<HashRouter>
						<App />
					</HashRouter>
				</SlotFillProvider>
			</ThemeProvider>
		</React.StrictMode>
	);
}

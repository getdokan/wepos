import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider, Toaster, type ThemeTokens } from '@wedevs/plugin-ui';
import { SlotFillProvider } from '@wordpress/components';
import App from './App';
import ShadowContainer from '../components/ShadowContainer';
import { weposHooks } from '@react/hooks/useExtensions';
import '../components/dokan';
// CSS import kept so webpack extracts it to wepos-admin-react.css.
// The stylesheet is loaded inside the Shadow DOM via <link>, not in <head>.
import './styles/main.css';

// `react-router-dom` and `@wedevs/plugin-ui` are externalized in webpack and
// read from globals populated by the `wepos-components` carrier bundle.

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
	destructive: 'oklch(0.577 0.245 27.325)',
	success: 'oklch(0.508 0.118 165.612)',
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
	console.error( 'wePos: React admin app container not found' );
} else {
	weposHooks.doAction( 'wepos_react_admin_before_render' );

	const cssUrls: string[] =
		( window as any ).weposAdmin?.adminCssUrls || [];

	const root = createRoot( container );

	root.render(
		<React.StrictMode>
			<ShadowContainer cssUrls={ cssUrls }>
				<ThemeProvider pluginId="wepos-admin" tokens={ weposTokens }>
					<SlotFillProvider>
						<HashRouter>
							<App />
							<Toaster position="bottom-center" richColors />
						</HashRouter>
					</SlotFillProvider>
				</ThemeProvider>
			</ShadowContainer>
		</React.StrictMode>
	);
}

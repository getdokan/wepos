// Side-effect: bundle `@wedevs/plugin-ui` + `react-router-dom` into the
// `wepos-components` carrier and publish them on `window` so other entries
// (wepos-react, wepos-admin-react, wepos-appearance, wepos-pro-*) can
// externalize the imports instead of duplicating ~3.5MB per bundle.
import * as PluginUI from '@wedevs/plugin-ui';
import { toast } from '@wedevs/plugin-ui';
import * as ReactRouterDOM from 'react-router-dom';

const w = window as unknown as {
	__weposPluginUI?: Record<string, unknown>;
	__weposReactRouterDOM?: Record<string, unknown>;
	__weposToast?: Record<string, unknown>;
};

w.__weposPluginUI = w.__weposPluginUI || {};
w.__weposReactRouterDOM = w.__weposReactRouterDOM || {};
w.__weposToast = w.__weposToast || {};

Object.assign( w.__weposPluginUI, PluginUI );
Object.assign( w.__weposReactRouterDOM, ReactRouterDOM );
Object.assign( w.__weposToast, toast as unknown as Record<string, unknown> );

import DateTimeHtml from './components/DateTimeHtml';
import * as utils from './frontend/utils/helpers';
import ThemeModeSwitcher, { ThemeModeSwitcherShared } from './frontend/components/ThemeModeSwitcher';
import { setThemeModeWithTransition } from './frontend/utils/themeModeTransition';

export { DateTimeHtml, utils, ThemeModeSwitcher, ThemeModeSwitcherShared, setThemeModeWithTransition };

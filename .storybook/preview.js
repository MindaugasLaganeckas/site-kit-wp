/**
 * Storybook preview config.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import cloneDeep from 'lodash/cloneDeep';
import { addDecorator } from '@storybook/react';

/**
 * Internal dependencies
 */
import '../assets/sass/wpdashboard.scss';
import '../assets/sass/adminbar.scss';
import '../assets/sass/admin.scss';
import './assets/sass/wp-admin.scss';
import { bootstrapFetchMocks } from './fetch-mocks';
// TODO: Remove when legacy data API is removed.
import { googlesitekit as dashboardData } from '../.storybook/data/wp-admin-admin.php-page=googlesitekit-dashboard-googlesitekit';

bootstrapFetchMocks();

const resetGlobals = () => {
	global._googlesitekitLegacyData = cloneDeep( dashboardData );
	global._googlesitekitLegacyData.admin.assetsRoot = '';
	global._googlesitekitLegacyData.isStorybook = true;
	global._googlesitekitBaseData = {
		homeURL: 'http://example.com/',
		referenceSiteURL: 'http://example.com/',
		userIDHash: 'storybook',
		adminURL: 'http://example.com/wp-admin/',
		assetsURL: 'http://example.com/wp-content/plugins/google-site-kit/dist/assets/',
		blogPrefix: 'wp_',
		ampMode: false,
		isNetworkMode: false,
		isFirstAdmin: true,
		isOwner: true,
		splashURL: 'http://example.com/wp-admin/admin.php?page=googlesitekit-splash',
		proxySetupURL: 'http://example.com/wp-admin/index.php?action=googlesitekit_proxy_setup&nonce=abc123',
		proxyPermissionsURL: 'http://example.com/wp-admin/index.php?action=googlesitekit_proxy_permissions&nonce=abc123',
		trackingEnabled: false,
		trackingID: 'UA-000000000-1',
	};
	global._googlesitekitEntityData = {
		currentEntityURL: null,
		currentEntityType: null,
		currentEntityTitle: null,
		currentEntityID: null,
	};
	global._googlesitekitUserData = {
		user: {
			id: 1,
			name: 'Wapuu WordPress',
			email: 'wapuu.wordpress@gmail.com',
			picture: 'https://wapu.us/wp-content/uploads/2017/11/WapuuFinal-100x138.png',
		},
		connectURL: 'http://example.com/wp-admin/admin.php?page=googlesitekit-splash&googlesitekit_connect=1&nonce=abc123',
		initialVersion: '',
		verified: true,
		userInputState: 'completed',
		permissions: {
			googlesitekit_authenticate: true,
			googlesitekit_setup: true,
			googlesitekit_view_posts_insights: true,
			googlesitekit_view_dashboard: true,
			googlesitekit_view_module_details: true,
			googlesitekit_manage_options: true,
			googlesitekit_publish_posts: true,
		},
	};
};
resetGlobals();

addDecorator( ( story ) => {
	resetGlobals();
	return story();
} );

// Global Decorator.
addDecorator( ( story ) => (
	<div className="googlesitekit-plugin-preview js">
		<div className="googlesitekit-plugin">{ story() }</div>
	</div>
) );

// TODO Would be nice if this wrote to a file. This logs our Storybook data to the browser console. Currently it gets put in .storybook/storybook-data and used in tests/backstop/scenarios.js.
// eslint-disable-next-line no-console
console.log( '__STORYBOOK_CLIENT_API__.raw()', global.__STORYBOOK_CLIENT_API__.raw() );

export const parameters = {
	layout: 'fullscreen',
};

/**
 * User Input Component Stories.
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
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import UserInputApp from '../assets/js/components/user-input/UserInputApp';
import { CORE_USER } from '../assets/js/googlesitekit/datastore/user/constants';
import { WithTestRegistry } from '../tests/js/utils';

storiesOf( 'User Input', module )
	.add( 'UserInputApp', () => {
		return (
			<WithTestRegistry callback={ ( registry ) => {
				// Don't mark the user input as completed in this story.
				registry.dispatch( CORE_USER ).receiveUserInputState( 'missing' );
			} } features={ [ 'userInput' ] }>
				<div className="-googlesitekit-plugin-preview">
					<UserInputApp />
				</div>
			</WithTestRegistry>
		);
	} );

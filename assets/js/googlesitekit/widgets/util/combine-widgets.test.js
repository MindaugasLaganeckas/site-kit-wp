/**
 * Widgets combination utilities tests.
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
 * Internal dependencies
 */
import { combineWidgets } from './combine-widgets';
import { getWidgetLayout } from './get-widget-layout';
import { WIDTH_GRID_CLASS_MAP, HIDDEN_CLASS } from './constants';
import { WIDGET_WIDTHS } from '../datastore/constants';
import ReportZero from '../../../components/ReportZero';
import ActivateModuleCTA from '../../../components/ActivateModuleCTA';
import CompleteModuleActivationCTA from '../../../components/CompleteModuleActivationCTA';
import Null from '../../../components/Null';

describe( 'combineWidgets', () => {
	const getQuarterWidget = ( slug ) => ( { slug, width: WIDGET_WIDTHS.QUARTER } );
	const getHalfWidget = ( slug ) => ( { slug, width: WIDGET_WIDTHS.HALF } );

	const getRegularState = () => null;
	const getReportZeroState = ( moduleSlug ) => ( { Component: ReportZero, metadata: { moduleSlug } } );
	const getActivateModuleCTAState = ( moduleSlug ) => ( { Component: ActivateModuleCTA, metadata: { moduleSlug } } );
	const getCompleteModuleActivationCTAState = ( moduleSlug ) => ( { Component: CompleteModuleActivationCTA, metadata: { moduleSlug } } );
	const getNullState = () => ( { Component: Null, metadata: {} } );

	// Every test case below corresponds to a matching story in `stories/widgets.stories.js` under
	// "Global/Widgets/Widget Area/Special combination states".
	it( 'does not combine adjacent widgets of different component and metadata', () => {
		const widgets = [
			getQuarterWidget( 'test1' ),
			getQuarterWidget( 'test2' ),
			getQuarterWidget( 'test3' ),
			getQuarterWidget( 'test4' ),
		];
		const widgetStates = {
			// Every widget here is in a different state than the adjacent ones, so there is nothing to combine.
			test1: getRegularState(),
			test2: getReportZeroState( 'search-console' ),
			test3: getReportZeroState( 'analytics' ),
			test4: getActivateModuleCTAState( 'adsense' ),
		};
		const expected = {
			gridClassNames: [
				WIDTH_GRID_CLASS_MAP[ WIDGET_WIDTHS.QUARTER ],
				WIDTH_GRID_CLASS_MAP[ WIDGET_WIDTHS.QUARTER ],
				WIDTH_GRID_CLASS_MAP[ WIDGET_WIDTHS.QUARTER ],
				WIDTH_GRID_CLASS_MAP[ WIDGET_WIDTHS.QUARTER ],
			],
			overrideComponents: [
				null,
				null,
				null,
				null,
			],
		};

		const layout = getWidgetLayout( widgets, widgetStates );
		expect( combineWidgets( widgets, widgetStates, layout ) ).toEqual( expected );
	} );

	it( 'combines adjacent widgets of the same component per the same metadata', () => {
		const widgets = [
			getQuarterWidget( 'test1' ),
			getQuarterWidget( 'test2' ),
			getQuarterWidget( 'test3' ),
			getQuarterWidget( 'test4' ),
		];
		const widgetStates = {
			// This will result in two groups, one for test1 and test2, the other for test3 and test4, since both
			// widgets in each group have matching state.
			test1: getReportZeroState( 'search-console' ),
			test2: getReportZeroState( 'search-console' ),
			test3: getReportZeroState( 'analytics' ),
			test4: getReportZeroState( 'analytics' ),
		};
		const expected = {
			gridClassNames: [
				[ HIDDEN_CLASS ],
				[ 'mdc-layout-grid__cell', 'mdc-layout-grid__cell--span-6' ],
				[ HIDDEN_CLASS ],
				[ 'mdc-layout-grid__cell', 'mdc-layout-grid__cell--span-6' ],
			],
			overrideComponents: [
				null,
				widgetStates.test2,
				null,
				widgetStates.test4,
			],
		};

		const layout = getWidgetLayout( widgets, widgetStates );
		expect( combineWidgets( widgets, widgetStates, layout ) ).toEqual( expected );
	} );

	it( 'combines adjacent widgets of the same component and metadata only within the same row', () => {
		const widgets = [
			getHalfWidget( 'test1' ),
			getHalfWidget( 'test2' ),
			getHalfWidget( 'test3' ),
			getHalfWidget( 'test4' ),
		];
		const widgetStates = {
			// Only test3 and test4 will be combined. While test2 is adjacent and has matching state, it is within
			// the previous row, so should not be included in the combination.
			test1: getReportZeroState( 'search-console' ),
			test2: getActivateModuleCTAState( 'analytics' ),
			test3: getActivateModuleCTAState( 'analytics' ),
			test4: getActivateModuleCTAState( 'analytics' ),
		};
		const expected = {
			gridClassNames: [
				WIDTH_GRID_CLASS_MAP[ WIDGET_WIDTHS.HALF ],
				WIDTH_GRID_CLASS_MAP[ WIDGET_WIDTHS.HALF ],
				[ HIDDEN_CLASS ],
				[ 'mdc-layout-grid__cell', 'mdc-layout-grid__cell--span-12' ],
			],
			overrideComponents: [
				null,
				null,
				null,
				widgetStates.test4,
			],
		};

		const layout = getWidgetLayout( widgets, widgetStates );
		expect( combineWidgets( widgets, widgetStates, layout ) ).toEqual( expected );
	} );

	it( 'combines adjacent widgets of the same component and metadata, using a more complex example', () => {
		const widgets = [
			getHalfWidget( 'test1' ),
			getHalfWidget( 'test2' ),
			getQuarterWidget( 'test3' ),
			getQuarterWidget( 'test4' ),
			getQuarterWidget( 'test5' ),
			getQuarterWidget( 'test6' ),
			getQuarterWidget( 'test7' ),
		];
		const widgetStates = {
			// Only test1 and test2 will be combined. test3 has matching state but is within the following row,
			// test4 and test6 are not adjacent so they won't be combined despite having the same state.
			test1: getCompleteModuleActivationCTAState( 'search-console' ),
			test2: getCompleteModuleActivationCTAState( 'search-console' ),
			test3: getCompleteModuleActivationCTAState( 'search-console' ),
			test4: getCompleteModuleActivationCTAState( 'analytics' ),
			test5: getRegularState(),
			test6: getCompleteModuleActivationCTAState( 'analytics' ),
			test7: getNullState( 'analytics' ),
		};
		const expected = {
			gridClassNames: [
				[ HIDDEN_CLASS ],
				[ 'mdc-layout-grid__cell', 'mdc-layout-grid__cell--span-12' ],
				WIDTH_GRID_CLASS_MAP[ WIDGET_WIDTHS.QUARTER ],
				WIDTH_GRID_CLASS_MAP[ WIDGET_WIDTHS.QUARTER ],
				WIDTH_GRID_CLASS_MAP[ WIDGET_WIDTHS.QUARTER ],
				WIDTH_GRID_CLASS_MAP[ WIDGET_WIDTHS.QUARTER ],
				[ HIDDEN_CLASS ],
			],
			overrideComponents: [
				null,
				widgetStates.test2,
				null,
				null,
				null,
				null,
				null,
			],
		};

		const layout = getWidgetLayout( widgets, widgetStates );
		expect( combineWidgets( widgets, widgetStates, layout ) ).toEqual( expected );
	} );
} );

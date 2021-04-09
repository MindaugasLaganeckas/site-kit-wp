/**
 * SettingsModule component.
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
import PropTypes from 'prop-types';
import { filter, map } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { applyFilters } from '@wordpress/hooks';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import PencilIcon from '../../../svg/pencil.svg';
import TrashIcon from '../../../svg/trash.svg';
import {
	activateOrDeactivateModule,
	getReAuthURL,
	showErrorNotification,
	getModulesData,
	listFormat,
} from '../../util';
import { refreshAuthentication } from '../../util/refresh-authentication';
import Link from '../Link';
import Button from '../../components/Button';
import data, { TYPE_MODULES } from '../../components/data';
import SettingsOverlay from '../../components/settings/SettingsOverlay';
import Spinner from '../Spinner';
import GenericError from '../legacy-notifications/generic-error';
import Dialog from '../../components/Dialog';
import ModuleIcon from '../ModuleIcon';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import SettingsRenderer from '../settings/SettingsRenderer';
import VisuallyHidden from '../VisuallyHidden';
import { Grid, Row, Cell } from '../../material-components/layout';
const { withSelect } = Data;

/**
 * A single module. Keeps track of its own active state and settings.
 */
class SettingsModule extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			isSaving: false,
			active: props.active,
			setupComplete: props.setupComplete,
			dialogActive: false,
		};

		this.deactivate = this.deactivate.bind( this );
		this.activateOrDeactivate = this.activateOrDeactivate.bind( this );
		this.handleDialog = this.handleDialog.bind( this );
		this.handleCloseModal = this.handleCloseModal.bind( this );
		this.handleConfirmRemoveModule = this.handleConfirmRemoveModule.bind( this );
		this.handleConfirmOrCancel = this.handleConfirmOrCancel.bind( this );
		this.handleCancel = this.handleCancel.bind( this );
		this.handleEdit = this.handleEdit.bind( this );
	}

	componentDidMount() {
		global.addEventListener( 'keyup', this.handleCloseModal, false );
	}

	componentWillUnmount() {
		global.removeEventListener( 'keyup', this.handleCloseModal );
	}

	async activateOrDeactivate() {
		try {
			const { active } = this.state;
			const newActiveState = ! active;

			this.setState( { isSaving: true } );

			await activateOrDeactivateModule(
				data,
				this.props.slug,
				newActiveState
			);

			await refreshAuthentication();

			if ( false === newActiveState ) {
				data.invalidateCacheGroup( TYPE_MODULES, this.props.slug );
			}

			this.setState( {
				isSaving: false,
				active: newActiveState,
			} );

			global.location = getReAuthURL( this.props.slug, false );
		} catch ( err ) {
			showErrorNotification( GenericError, {
				id: 'activate-module-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: err.message,
				format: 'small',
				type: 'win-error',
			} );
			this.setState( { isSaving: false } );
		}
	}

	deactivate() {
		const { autoActivate } = this.props;

		if ( autoActivate ) {
			return;
		}

		this.activateOrDeactivate();
	}

	handleDialog() {
		this.setState( ( prevState ) => {
			return {
				dialogActive: ! prevState.dialogActive,
			};
		} );
	}

	// Handle user click on the confirm removal button.
	handleConfirmRemoveModule() {
		this.deactivate();
	}

	handleCloseModal( e ) {
		if ( ESCAPE === e.keyCode ) {
			this.setState( {
				dialogActive: false,
			} );
		}
	}

	handleConfirmOrCancel() {
		const {
			setupComplete,
		} = this.state;

		const {
			hasSettings,
			slug,
			onCancel,
			onConfirm,
		} = this.props;

		if ( hasSettings && setupComplete && typeof onConfirm === 'function' ) {
			onConfirm( slug );
		} else if ( typeof onCancel === 'function' ) {
			onCancel( slug );
		}
	}

	handleCancel() {
		const {
			slug,
			onCancel,
		} = this.props;

		if ( typeof onCancel === 'function' ) {
			onCancel( slug );
		}
	}

	handleEdit() {
		const {
			slug,
			onEdit,
		} = this.props;

		if ( typeof onEdit === 'function' ) {
			onEdit( slug );
		}
	}

	// Find modules that depend on a module.
	getDependentModules() {
		const { slug } = this.props;
		const modules = getModulesData();
		const dependants = {};

		if ( modules[ slug ].dependants ) {
			modules[ slug ].dependants.forEach( ( dependantSlug ) => {
				if ( modules[ dependantSlug ] ) {
					dependants[ dependantSlug ] = modules[ dependantSlug ];
				}
			} );
		}

		return dependants;
	}

	render() {
		const {
			setupComplete,
			dialogActive,
		} = this.state;

		const {
			name,
			slug,
			homepage,
			isEditing,
			isOpen,
			handleAccordion,
			hasSettings,
			canSubmitChanges,
			provides,
			isSaving,
			error,
			autoActivate,
		} = this.props;
		const moduleKey = `${ slug }-module`;
		const isConnected = applyFilters( `googlesitekit.Connected-${ slug }`, setupComplete );
		const connectedClassName = isConnected
			? 'googlesitekit-settings-module__status-icon--connected'
			: 'googlesitekit-settings-module__status-icon--not-connected';

		/* translators: %s: module name */
		const subtitle = sprintf( __( 'By disconnecting the %s module from Site Kit, you will no longer have access to:', 'google-site-kit' ), name );

		const isSavingModule = isSaving === `${ slug }-module`;

		// Disable other modules during editing
		const modulesBeingEdited = filter( isEditing, ( module ) => module );
		const editActive = 0 < modulesBeingEdited.length;

		const dependentModules = listFormat( map( this.getDependentModules(), 'name' ) );

		// Set button text based on state.
		let buttonText = __( 'Close', 'google-site-kit' );
		if ( hasSettings && setupComplete ) {
			if ( isSavingModule ) {
				buttonText = __( 'Saving…', 'google-site-kit' );
			} else {
				buttonText = __( 'Confirm Changes', 'google-site-kit' );
			}
		}

		return (
			<div
				className={ classnames(
					'googlesitekit-settings-module',
					'googlesitekit-settings-module--active',
					`googlesitekit-settings-module--${ slug }`,
					{ 'googlesitekit-settings-module--error': error && editActive && isEditing[ moduleKey ] }
				) }
				key={ moduleKey }
			>
				{ editActive && ! isEditing[ moduleKey ] && <SettingsOverlay compress={ ! isOpen } /> }
				<button
					className={ classnames(
						'googlesitekit-settings-module__header',
						{ 'googlesitekit-settings-module__header--open': isOpen }
					) }
					id={ `googlesitekit-settings-module__header--${ slug }` }
					type="button"
					role="tab"
					aria-selected={ !! isOpen }
					aria-expanded={ !! isOpen }
					aria-controls={ `googlesitekit-settings-module__content--${ slug }` }
					onClick={ handleAccordion.bind( null, slug ) }
				>
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-6-desktop
								mdc-layout-grid__cell--span-4-tablet
								mdc-layout-grid__cell--span-4-phone
							">
								<h3 className="
									googlesitekit-heading-4
									googlesitekit-settings-module__title
								">
									<ModuleIcon slug={ slug } size={ 24 } className="googlesitekit-settings-module__title-icon" />
									{ name }
								</h3>
							</div>
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-6-desktop
								mdc-layout-grid__cell--span-4-tablet
								mdc-layout-grid__cell--span-4-phone
								mdc-layout-grid__cell--align-middle
								mdc-layout-grid__cell--align-right-tablet
							">
								<p className="googlesitekit-settings-module__status">
									{
										isConnected
											? sprintf(
												/* translators: %s: module name. */
												__( '%s is connected', 'google-site-kit' ),
												name
											)
											: sprintf(
												/* translators: %s: module name. */
												__( '%s is not connected', 'google-site-kit' ),
												name
											)
									}
									<span className={ classnames(
										'googlesitekit-settings-module__status-icon',
										connectedClassName
									) }>
										<VisuallyHidden>
											{ isConnected
												? __( 'Connected', 'google-site-kit' )
												: __( 'Not Connected', 'google-site-kit' )
											}
										</VisuallyHidden>
									</span>
								</p>
							</div>
						</div>
					</div>
				</button>
				<div
					className={ classnames(
						'googlesitekit-settings-module__content',
						{ 'googlesitekit-settings-module__content--open': isOpen }
					) }
					id={ `googlesitekit-settings-module__content--${ slug }` }
					role="tabpanel"
					aria-hidden={ ! isOpen }
					aria-labelledby={ `googlesitekit-settings-module__header--${ slug }` }
				>
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<SettingsRenderer
									slug={ slug }
									isEditing={ isEditing[ moduleKey ] }
									isOpen={ isOpen }
								/>
							</Cell>
						</Row>
					</Grid>
					<footer className="googlesitekit-settings-module__footer">
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-6-desktop
									mdc-layout-grid__cell--span-8-tablet
									mdc-layout-grid__cell--span-4-phone
								">
									{ isEditing[ moduleKey ] || isSavingModule ? (
										<Fragment>
											<Button
												onClick={ this.handleConfirmOrCancel }
												disabled={ isSavingModule || ! canSubmitChanges }
												id={ hasSettings && setupComplete ? `confirm-changes-${ slug }` : `close-${ slug }` }
											>
												{ buttonText }
											</Button>
											<Spinner isSaving={ isSavingModule } />
											{ hasSettings &&
											<Link
												className="googlesitekit-settings-module__footer-cancel"
												onClick={ this.handleCancel }
												inherit
											>
												{ __( 'Cancel', 'google-site-kit' ) }
											</Link>
											}
										</Fragment>
									) : ( ( hasSettings || ! autoActivate ) &&
									<Link
										className="googlesitekit-settings-module__edit-button"
										onClick={ this.handleEdit }
										inherit
									>
										{ __( 'Edit', 'google-site-kit' ) }
										<PencilIcon
											className="googlesitekit-settings-module__edit-button-icon"
											width="10"
											height="10"
										/>
									</Link>
									) }
								</div>
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-6-desktop
									mdc-layout-grid__cell--span-8-tablet
									mdc-layout-grid__cell--span-4-phone
									mdc-layout-grid__cell--align-middle
									mdc-layout-grid__cell--align-right-desktop
								">
									{ isEditing[ moduleKey ] && ! autoActivate && (
										<Link
											className="googlesitekit-settings-module__remove-button"
											onClick={ this.handleDialog }
											inherit
											danger
										>
											{
												/* translators: %s: module name */
												sprintf( __( 'Disconnect %s from Site Kit', 'google-site-kit' ), name )
											}
											<TrashIcon
												className="googlesitekit-settings-module__remove-button-icon"
												width="13"
												height="13"
											/>
										</Link>
									) }
									{ ! isEditing[ moduleKey ] && (
										<Link
											href={ homepage }
											className="googlesitekit-settings-module__cta-button"
											inherit
											external
										>
											{
												/* translators: %s: module name */
												sprintf( __( 'See full details in %s', 'google-site-kit' ), name )
											}
										</Link>
									) }
								</div>
							</div>
						</div>
					</footer>
				</div>
				<Dialog
					dialogActive={ dialogActive }
					handleDialog={ this.handleDialog }
					/* translators: %s: module name */
					title={ sprintf( __( 'Disconnect %s from Site Kit?', 'google-site-kit' ), name ) }
					subtitle={ subtitle }
					onKeyPress={ this.handleCloseModal }
					provides={ provides }
					handleConfirm={ this.handleConfirmRemoveModule }
					dependentModules={ dependentModules
						? sprintf(
							/* translators: %1$s: module name, %2$s: list of dependent modules */
							__( 'these active modules depend on %1$s and will also be disconnected: %2$s', 'google-site-kit' ),
							name,
							dependentModules
						) : false
					}
					danger
				/>
			</div>
		);
	}
}

SettingsModule.propTypes = {
	name: PropTypes.string,
	slug: PropTypes.string,
	homepage: PropTypes.string,
	isEditing: PropTypes.object,
	handleDialog: PropTypes.func,
	hasSettings: PropTypes.bool,
	canSubmitChanges: PropTypes.bool,
	required: PropTypes.array,
	active: PropTypes.bool,
	setupComplete: PropTypes.bool,
	onEdit: PropTypes.func,
	onConfirm: PropTypes.func,
	onCancel: PropTypes.func,
};

SettingsModule.defaultProps = {
	name: '',
	slug: '',
	homepage: '',
	isEditing: {},
	handleDialog: null,
	active: false,
	setupComplete: false,
	onEdit: null,
	onConfirm: null,
	onCancel: null,
};

export default compose( [
	withSelect( ( select, { slug } ) => {
		const module = select( CORE_MODULES ).getModule( slug );
		const canSubmitChanges = select( CORE_MODULES ).canSubmitChanges( slug );

		return {
			hasSettings: !! module?.SettingsEditComponent,
			canSubmitChanges,
		};
	} ),
] )( SettingsModule );

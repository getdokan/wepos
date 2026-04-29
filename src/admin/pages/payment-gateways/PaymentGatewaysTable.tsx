import {
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	Input,
	Switch,
	toast,
} from '@wedevs/plugin-ui';
import {
	ArrowDown,
	ArrowUp,
	ExternalLink,
	LoaderCircle,
	Save,
} from 'lucide-react';

interface PaymentGatewayRow {
	id: string;
	order: number;
	enabled: boolean;
	title: string;
	description: string;
	method_title: string;
	method_description: string;
	wc_enabled: boolean;
	is_native: boolean;
	icon: string;
	admin_settings_url: string;
}

interface PaymentGatewaysResponse {
	default_gateway: string;
	gateways: PaymentGatewayRow[];
}

declare const window: any;

const PaymentGatewaysTable = () => {
	const [ rows, setRows ] = useState< PaymentGatewayRow[] >( [] );
	const [ defaultGateway, setDefaultGateway ] = useState< string >( '' );
	const [ loading, setLoading ] = useState( true );
	const [ saving, setSaving ] = useState( false );
	const [ dirty, setDirty ] = useState( false );

	const rest = window.weposAdmin?.rest;

	const reload = useCallback( async () => {
		setLoading( true );
		try {
			const res = await fetch(
				`${ rest.root }wepos/v1/settings/payment-gateways`,
				{ headers: { 'X-WP-Nonce': rest.nonce } }
			);
			const data: PaymentGatewaysResponse = await res.json();
			const sorted = [ ...data.gateways ].sort(
				( a, b ) => a.order - b.order
			);
			setRows( sorted );
			setDefaultGateway( data.default_gateway );
			setDirty( false );
		} catch ( err ) {
			console.error( 'Failed to load payment gateways', err );
			toast.error(
				__( 'Failed to load payment gateways.', 'wepos' )
			);
		} finally {
			setLoading( false );
		}
	}, [ rest ] );

	useEffect( () => {
		reload();
	}, [ reload ] );

	const updateRow = useCallback(
		( id: string, patch: Partial< PaymentGatewayRow > ) => {
			setRows( ( prev ) =>
				prev.map( ( row ) =>
					row.id === id ? { ...row, ...patch } : row
				)
			);
			setDirty( true );
		},
		[]
	);

	const moveRow = useCallback( ( index: number, direction: -1 | 1 ) => {
		setRows( ( prev ) => {
			const next = [ ...prev ];
			const target = index + direction;
			if ( target < 0 || target >= next.length ) return prev;
			[ next[ index ], next[ target ] ] = [ next[ target ], next[ index ] ];
			// Renumber order for stable persistence.
			return next.map( ( row, i ) => ( { ...row, order: i } ) );
		} );
		setDirty( true );
	}, [] );

	const setDefault = useCallback( ( id: string ) => {
		setDefaultGateway( id );
		setDirty( true );
	}, [] );

	const save = useCallback( async () => {
		setSaving( true );
		try {
			const payload = {
				default_gateway: defaultGateway,
				gateways: rows.map( ( row, i ) => ( {
					id: row.id,
					order: i,
					enabled: row.enabled,
					title: row.title,
					description: row.description,
				} ) ),
			};

			const res = await fetch(
				`${ rest.root }wepos/v1/settings/payment-gateways`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-WP-Nonce': rest.nonce,
					},
					body: JSON.stringify( payload ),
				}
			);

			if ( ! res.ok ) {
				throw new Error( 'save_failed' );
			}

			const fresh: PaymentGatewaysResponse = await res.json();
			const sorted = [ ...fresh.gateways ].sort(
				( a, b ) => a.order - b.order
			);
			setRows( sorted );
			setDefaultGateway( fresh.default_gateway );
			setDirty( false );
			toast.success(
				__( 'Payment gateway settings saved.', 'wepos' )
			);
		} catch ( err ) {
			console.error( err );
			toast.error( __( 'Failed to save payment gateways.', 'wepos' ) );
		} finally {
			setSaving( false );
		}
	}, [ defaultGateway, rest, rows ] );

	const enabledCount = useMemo(
		() => rows.filter( ( r ) => r.enabled ).length,
		[ rows ]
	);

	if ( loading ) {
		return (
			<div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
				<LoaderCircle className="size-4 animate-spin" />
				{ __( 'Loading payment gateways…', 'wepos' ) }
			</div>
		);
	}

	return (
		<div className="space-y-4 p-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-base font-semibold text-foreground">
						{ __( 'POS Payment Gateways', 'wepos' ) }
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						{ __(
							'Choose which gateways are available at the POS, set their order, override their titles, and pick a default. Settings here are independent of WooCommerce storefront payments.',
							'wepos'
						) }
					</p>
				</div>
				<Button onClick={ save } disabled={ ! dirty || saving }>
					{ saving ? (
						<LoaderCircle className="mr-2 size-4 animate-spin" />
					) : (
						<Save className="mr-2 size-4" />
					) }
					{ __( 'Save Changes', 'wepos' ) }
				</Button>
			</div>

			<div className="overflow-hidden rounded-lg border border-border">
				<table className="w-full text-sm">
					<thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
						<tr>
							<th className="w-16 px-3 py-2 text-left">
								{ __( 'Order', 'wepos' ) }
							</th>
							<th className="w-24 px-3 py-2 text-left">
								{ __( 'Enabled', 'wepos' ) }
							</th>
							<th className="px-3 py-2 text-left">
								{ __( 'Gateway', 'wepos' ) }
							</th>
							<th className="px-3 py-2 text-left">
								{ __( 'Title shown in POS', 'wepos' ) }
							</th>
							<th className="w-28 px-3 py-2 text-center">
								{ __( 'Default', 'wepos' ) }
							</th>
							<th className="w-12 px-3 py-2"></th>
						</tr>
					</thead>
					<tbody>
						{ rows.length === 0 && (
							<tr>
								<td
									colSpan={ 6 }
									className="px-3 py-6 text-center text-sm text-muted-foreground"
								>
									{ __(
										'No payment gateways found. Install or activate a WooCommerce gateway first.',
										'wepos'
									) }
								</td>
							</tr>
						) }
						{ rows.map( ( row, index ) => (
							<tr
								key={ row.id }
								className="border-t border-border align-top"
							>
								<td className="px-3 py-3">
									<div className="flex items-center gap-1">
										<button
											type="button"
											className="rounded border border-border p-1 hover:bg-muted disabled:opacity-40"
											onClick={ () => moveRow( index, -1 ) }
											disabled={ index === 0 }
											aria-label={ __( 'Move up', 'wepos' ) }
										>
											<ArrowUp className="size-3" />
										</button>
										<button
											type="button"
											className="rounded border border-border p-1 hover:bg-muted disabled:opacity-40"
											onClick={ () => moveRow( index, 1 ) }
											disabled={ index === rows.length - 1 }
											aria-label={ __( 'Move down', 'wepos' ) }
										>
											<ArrowDown className="size-3" />
										</button>
									</div>
								</td>
								<td className="px-3 py-3">
									<Switch
										checked={ row.enabled }
										onCheckedChange={ ( checked: boolean ) =>
											updateRow( row.id, { enabled: checked } )
										}
									/>
								</td>
								<td className="px-3 py-3">
									<div className="font-medium text-foreground">
										{ row.method_title }
										{ row.is_native && (
											<span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
												{ __( 'POS', 'wepos' ) }
											</span>
										) }
										{ ! row.wc_enabled && ! row.is_native && (
											<span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
												{ __( 'Disabled in WC', 'wepos' ) }
											</span>
										) }
									</div>
									<div className="mt-1 text-xs text-muted-foreground">
										{ row.method_description ||
											row.description ||
											row.id }
									</div>
								</td>
								<td className="px-3 py-3">
									<Input
										value={ row.title }
										onChange={ (
											e: React.ChangeEvent< HTMLInputElement >
										) =>
											updateRow( row.id, {
												title: e.target.value,
											} )
										}
										placeholder={ row.method_title }
									/>
								</td>
								<td className="px-3 py-3 text-center">
									<input
										type="radio"
										name="wepos_default_gateway"
										checked={ defaultGateway === row.id }
										onChange={ () => setDefault( row.id ) }
										disabled={ ! row.enabled }
									/>
								</td>
								<td className="px-3 py-3">
									<a
										href={ row.admin_settings_url }
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center text-muted-foreground hover:text-foreground"
										title={ __(
											'Open WooCommerce gateway settings',
											'wepos'
										) }
									>
										<ExternalLink className="size-4" />
									</a>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>

			<p className="text-xs text-muted-foreground">
				{ enabledCount }{ ' ' }
				{ __( 'gateway(s) enabled for POS.', 'wepos' ) }{ ' ' }
				{ defaultGateway && (
					<>
						{ __( 'Default:', 'wepos' ) }{ ' ' }
						<code>{ defaultGateway }</code>
					</>
				) }
			</p>
		</div>
	);
};

export default PaymentGatewaysTable;

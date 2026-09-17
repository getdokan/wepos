import { __ } from '@wordpress/i18n';
import { Check, Crown, Lock } from 'lucide-react';
import { COMPARISON_ROWS } from './data';

const CheckCell = () => (
	<span className="inline-flex size-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdfa_100%)]">
		<Check className="size-5 text-[#009966]" />
	</span>
);

const LockCell = () => (
	<span className="inline-flex size-10 items-center justify-center rounded-full bg-[#f5f5f4]/60">
		<Lock className="size-5 text-[#79716b]" />
	</span>
);

const FeatureComparison = () => (
	<div className="flex w-full max-w-[1000px] flex-col items-start gap-11 lg:flex-row lg:justify-center">
		<div className="flex w-full flex-col gap-4 lg:w-[385px] lg:shrink-0">
			<h2 className="m-0 text-[30px] font-bold leading-[1.3] text-[#1f2937]">
				{ __(
					'Powerful Features Available Only in wePOS Pro',
					'wepos'
				) }
			</h2>
			<p className="m-0 text-sm leading-[1.4] text-[#6b7280]">
				{ __(
					'You are on the free version. Unlock advanced reports, multi-outlet control, CSV export, and full Dokan vendor support when you upgrade to wePOS Pro.',
					'wepos'
				) }
			</p>
		</div>

		<div className="w-full overflow-hidden rounded-2xl border border-[rgba(231,229,228,0.5)] bg-white bg-[radial-gradient(circle_at_top_right,rgba(212,186,158,0.08)_0%,rgba(255,255,255,0)_50%)] lg:flex-1">
			<table className="w-full border-collapse text-left">
				<thead>
					<tr className="bg-[linear-gradient(173deg,#fffbf2_0%,#fafaf9_50%,rgba(240,253,250,0.3)_100%)]">
						<th className="border-b border-[rgba(231,229,228,0.7)] px-10 py-5 text-sm font-semibold text-[#4b5563]">
							{ __( 'Feature', 'wepos' ) }
						</th>
						<th className="w-[120px] border-b border-[rgba(231,229,228,0.7)] px-5 py-5 text-center text-sm font-semibold text-[#4b5563]">
							{ __( 'Lite', 'wepos' ) }
						</th>
						<th className="w-[120px] border-b border-[rgba(231,229,228,0.7)] px-5 py-5 text-sm font-semibold text-[#4b5563]">
							<span className="flex items-center justify-center gap-2">
								{ __( 'Pro', 'wepos' ) }
								<span className="inline-flex size-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffb900_0%,#fe9a00_100%)]">
									<Crown className="size-4 text-white" />
								</span>
							</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{ COMPARISON_ROWS.map( ( row, index ) => (
						<tr
							key={ row.feature }
							className={
								index < COMPARISON_ROWS.length - 1
									? 'border-b border-[rgba(231,229,228,0.6)]'
									: ''
							}
						>
							<td className="px-10 py-[11px] text-sm font-semibold text-[#4b5563]">
								{ row.feature }
							</td>
							<td className="px-5 py-[11px] text-center">
								{ row.lite ? <CheckCell /> : <LockCell /> }
							</td>
							<td className="px-5 py-[11px] text-center">
								<CheckCell />
							</td>
						</tr>
					) ) }
				</tbody>
			</table>
		</div>
	</div>
);

export default FeatureComparison;

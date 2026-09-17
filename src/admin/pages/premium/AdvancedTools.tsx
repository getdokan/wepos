import { __ } from '@wordpress/i18n';
import PrimaryLink from './PrimaryLink';
import SectionHeading from './SectionHeading';
import { PRO_TOOLS, UPGRADE_URL } from './data';

const AdvancedTools = () => (
	<section className="flex w-full flex-col items-center gap-10 border border-[#e5e7eb] bg-[#d2d6e4] px-6 py-[72px]">
		<SectionHeading
			title={ __( 'Advanced Tools for Serious Retail', 'wepos' ) }
			description={ __(
				'Everything you need to take your counter from working to fully in control, built into wePOS Pro.',
				'wepos'
			) }
		/>

		<div className="grid w-full max-w-[1000px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
			{ PRO_TOOLS.map( ( { icon: Icon, title, description } ) => (
				<div
					key={ title }
					className="flex flex-col gap-5 rounded-[20px] border border-[#e5e7eb] bg-white p-5"
				>
					<Icon className="size-9 shrink-0 text-[#4f39f6]" />
					<div className="flex flex-col gap-3">
						<h3 className="m-0 text-lg font-bold leading-[1.3] text-[#111827]">
							{ title }
						</h3>
						<p className="m-0 text-sm leading-[1.4] text-[#1f2937]">
							{ description }
						</p>
					</div>
				</div>
			) ) }
		</div>

		<PrimaryLink href={ UPGRADE_URL }>
			{ __( 'Show all Pro Features', 'wepos' ) }
		</PrimaryLink>
	</section>
);

export default AdvancedTools;

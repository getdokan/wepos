interface SectionHeadingProps {
	title: string;
	description?: string;
	align?: 'center' | 'left';
	className?: string;
}

const SectionHeading = ( {
	title,
	description,
	align = 'center',
	className = '',
}: SectionHeadingProps ) => (
	<div
		className={ `flex flex-col gap-4 ${
			align === 'center' ? 'items-center text-center' : 'items-start'
		} ${ className }` }
	>
		<h2 className="m-0 text-[30px] font-bold leading-[1.3] text-[#1f2937]">
			{ title }
		</h2>
		{ description && (
			<p className="m-0 max-w-[912px] text-sm leading-[1.4] text-[#6b7280]">
				{ description }
			</p>
		) }
	</div>
);

export default SectionHeading;

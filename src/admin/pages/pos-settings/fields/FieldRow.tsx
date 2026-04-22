import type { ReactNode } from 'react';
import type { SettingsElement } from '@wedevs/plugin-ui';

interface Props {
	element: SettingsElement;
	children: ReactNode;
	layout?: 'horizontal' | 'full-width';
}

/**
 * Match plugin-ui's FieldWrapper row layout for custom variants.
 * `horizontal`: label on left (col-span-8), field on right (col-span-4).
 * `full-width`: label on top, field fills next row.
 */
export default function FieldRow( {
	element,
	children,
	layout = 'horizontal',
}: Props ) {
	const hasLabel = Boolean( element.label && element.label.length > 0 );

	if ( layout === 'full-width' ) {
		return (
			<div
				className="flex flex-col gap-3 w-full p-4"
				id={ element.id }
				data-testid={ `settings-field-${ element.id }` }
			>
				{ hasLabel && (
					<span className="text-sm font-semibold text-foreground">
						{ element.label }
					</span>
				) }
				<div className="w-full">{ children }</div>
				{ element.description && (
					<p className="text-xs leading-relaxed text-muted-foreground">
						{ element.description }
					</p>
				) }
			</div>
		);
	}

	return (
		<div
			className="grid grid-cols-12 gap-2 items-center w-full p-4"
			id={ element.id }
			data-testid={ `settings-field-${ element.id }` }
		>
			{ hasLabel && (
				<div className="sm:col-span-8 col-span-12">
					<div className="flex flex-col gap-1 w-full">
						<span className="text-sm font-semibold text-foreground">
							{ element.label }
						</span>
						{ element.description && (
							<div className="text-xs leading-relaxed text-muted-foreground">
								{ element.description }
							</div>
						) }
					</div>
				</div>
			) }
			<div
				className={
					hasLabel
						? 'sm:col-span-4 col-span-12 flex sm:justify-end'
						: 'col-span-12'
				}
			>
				{ children }
			</div>
		</div>
	);
}

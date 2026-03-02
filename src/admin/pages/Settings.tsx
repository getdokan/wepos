import { __ } from '@wordpress/i18n';

const Settings = () => {
	return (
		<div className="wepos-admin-settings p-6">
			<h2 className="text-xl font-semibold mb-4">
				{ __( 'Settings', 'wepos' ) }
			</h2>
			<p className="text-muted-foreground">
				{ __( 'React settings page — coming soon.', 'wepos' ) }
			</p>
		</div>
	);
};

export default Settings;

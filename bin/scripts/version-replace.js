const fs = require( 'fs-extra' );
const rif = require( 'replace-in-file' );

const pluginFiles = [
	'assets/**/*',
	'includes/**/*',
	'templates/**/*',
	'src/**/*',
	'wepos.php',
];

const { version } = JSON.parse( fs.readFileSync( 'package.json' ) );

async function runVersionReplace() {
	console.log( `Running version replacement for v${ version }...` );

	try {
		const results = await rif.replaceInFile( {
			files: pluginFiles,
			from: [ /WEPOS_SINCE/g ],
			to: version,
		} );

		const changedFiles = results
			.filter( ( result ) => result.hasChanged )
			.map( ( result ) => result.file );
		console.log(
			`Version replacement complete. ${ changedFiles.length } file(s) modified.`
		);
	} catch ( error ) {
		console.error( 'Error during version replacement:', error );
		process.exit( 1 );
	}
}

runVersionReplace();

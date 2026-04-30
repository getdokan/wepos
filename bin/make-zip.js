#!/usr/bin/env node
/*
 * Plugin ZIP Maker (Node.js)
 *
 * Usage: node bin/make-zip.js
 * - Reads version from package.json
 * - Updates wepos.php header Version and public $version
 * - Reads .distignore for exclusion patterns
 * - Creates dist/wepos-<version>.zip with a curated file list
 */

const path = require( 'path' );
const fs = require( 'fs-extra' );
const archiver = require( 'archiver' );
// globby is ESM-only in v14+. We'll import it dynamically in the async IIFE.
const { replaceInFile } = require( 'replace-in-file' );

// Parse .distignore file and convert entries to globby-compatible ignore patterns.
//
// Handles:
//   /dirname        → dirname/<glob>
//   /path/to/dir    → path/to/dir/<glob>
//   filename.ext    → <glob>/filename.ext
//   /<glob>/.ext    → <glob>/.ext
function parseDistIgnore( filePath ) {
	if ( ! fs.pathExistsSync( filePath ) ) {
		return [];
	}

	const content = fs.readFileSync( filePath, 'utf8' );
	return content
		.split( '\n' )
		.map( ( line ) => line.trim() )
		.filter( ( line ) => line && ! line.startsWith( '#' ) )
		.map( ( line ) => {
			// Root-relative directory: /dirname → dirname/**
			if ( line.startsWith( '/' ) ) {
				const stripped = line.slice( 1 );
				// If it already has a glob wildcard, keep as-is (minus leading /)
				if ( stripped.includes( '*' ) ) {
					return stripped;
				}
				// If it has a file extension, treat as a file
				if ( path.extname( stripped ) ) {
					return stripped;
				}
				// Otherwise treat as directory
				return `${ stripped }/**`;
			}

			// Already a glob pattern (e.g. /**/.DS_Store)
			if ( line.includes( '*' ) ) {
				// Strip leading / if present in glob
				return line.replace( /^\//, '' );
			}

			// Plain filename — match anywhere
			return `**/${ line }`;
		} );
}

( async () => {
	try {
		const root = path.resolve( __dirname, '..' );
		const pluginSlug = 'wepos';

		console.log( '\n💃 Time to build the wePOS ZIP file 🕺\n' );

		// 1) Read version from package.json
		console.log( '📖 Reading version from package.json...' );
		const pkgPath = path.join( root, 'package.json' );
		const pkgJson = JSON.parse( await fs.readFile( pkgPath, 'utf8' ) );
		const version = pkgJson.version;
		if ( ! version ) {
			throw new Error( 'package.json missing version' );
		}
		console.log( `📌 Version: ${ version }` );

		// 2) Update Version header and public $version in main plugin file
		console.log( '\n🔄 Updating version strings...' );
		const mainFile = path.join( root, 'wepos.php' );

		if ( ! ( await fs.pathExists( mainFile ) ) ) {
			throw new Error( `Main plugin file not found: ${ mainFile }` );
		}

		await replaceInFile( {
			files: mainFile,
			from: /(\n\s*\*?\s*Version:\s*)([^\r\n]+)/im,
			to: `$1${ version }`,
		} );

		await replaceInFile( {
			files: mainFile,
			from: /(public\s+\$version\s*=\s*')[^']+('\s*;)/m,
			to: `$1${ version }$2`,
		} );

		// Optional: also keep readme.txt Stable tag in sync if present
		const readmePath = path.join( root, 'readme.txt' );
		if ( await fs.pathExists( readmePath ) ) {
			try {
				await replaceInFile( {
					files: readmePath,
					from: /(\nStable tag:\s*)([^\r\n]+)/i,
					to: `$1${ version }`,
				} );
			} catch ( e ) {
				// non-fatal if pattern not found
			}
		}
		console.log( '✅ Version strings updated' );

		// 3) Prepare dist output
		console.log( '\n📦 Preparing dist output...' );
		const distDir = path.join( root, 'dist' );
		await fs.ensureDir( distDir );
		const zipPath = path.join(
			distDir,
			`${ pluginSlug }-${ version }.zip`
		);

		// 4) Build include globs and read exclusions from .distignore
		// wepos has both Vue (assets/js, assets/css) and React (build/) outputs
		console.log( '📂 Collecting files...' );
		const includeGlobs = [
			'assets/**',
			'build/**',
			'dependencies/**',
			'includes/**',
			'languages/**',
			'templates/**',
			'vendor/**',
			'*.php',
			'readme.txt',
			'license',
			'license.txt',
			'composer.json',
		];

		const distIgnorePath = path.join( root, '.distignore' );
		const ignoreGlobs = parseDistIgnore( distIgnorePath );

		if ( ! ignoreGlobs.length ) {
			console.log( '⚠️  No .distignore found, using default exclusions' );
		}

		// Dynamically import globby (ESM-only)
		const { globby } = await import( 'globby' );

		const files = await globby( includeGlobs, {
			cwd: root,
			dot: false,
			ignore: ignoreGlobs,
			onlyFiles: true,
			followSymbolicLinks: false,
		} );

		if ( ! files.length ) {
			throw new Error( 'No files matched to include in the ZIP.' );
		}
		console.log( `✅ Found ${ files.length } files to include` );

		// 5) Create zip with top-level folder pluginSlug/
		console.log( '\n🎁 Creating archive...' );
		await new Promise( ( resolve, reject ) => {
			const output = fs.createWriteStream( zipPath );
			const archive = archiver( 'zip', { zlib: { level: 9 } } );

			output.on( 'close', resolve );
			output.on( 'error', reject );
			archive.on( 'error', reject );

			archive.pipe( output );

			for ( const rel of files ) {
				const abs = path.join( root, rel );
				const dest = path.posix.join(
					`${ pluginSlug }`,
					rel.replace( /\\/g, '/' )
				);
				archive.file( abs, { name: dest } );
			}

			archive.finalize();
		} );

		const stats = await fs.stat( zipPath ).catch( () => null );
		const sizeMb = stats ? ( stats.size / 1048576 ).toFixed( 2 ) : '0.00';

		console.log( `\n🎉 Done. You've built wePOS! 🎉` );
		console.log( `📦 Created ZIP: ${ zipPath } (${ sizeMb } MB)\n` );
	} catch ( err ) {
		console.error( '\n❌ Error building ZIP:', err.message || err );
		process.exit( 1 );
	}
} )();

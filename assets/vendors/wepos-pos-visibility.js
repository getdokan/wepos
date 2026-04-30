/**
 * POS Visibility — Publish-metabox mini-editor.
 *
 * Progressively enhances the collapsed "POS visibility: X [Edit]" widget
 * rendered by \WeDevs\WePOS\Admin\Products::add_pos_visibility_field()
 * into a WordPress-style Publish-box mini-editor (Edit / OK / Cancel).
 *
 * The form is complete without this script — the radio inputs carry the
 * meta key name, so whichever one is checked when the post is saved gets
 * persisted. This file only provides the visual toggle and the live
 * label update, matching WordPress core's Catalog-visibility UX.
 *
 * Self-scoped: no hardcoded radio name, no globals — everything is
 * resolved from DOM IDs under `#wepos-pos-visibility`.
 *
 * @since 1.5.0
 */
( function () {
	var section = document.getElementById( 'wepos-pos-visibility' );
	if ( ! section ) {
		return;
	}

	var display = document.getElementById( 'wepos-pos-visibility-display' );
	var show    = document.getElementById( 'wepos-pos-visibility-show' );
	var editor  = document.getElementById( 'wepos-pos-visibility-select' );
	var cancel  = document.getElementById( 'wepos-pos-visibility-cancel' );
	var save    = document.getElementById( 'wepos-pos-visibility-save' );

	if ( ! display || ! show || ! editor || ! cancel || ! save ) {
		return;
	}

	var radios = editor.querySelectorAll( 'input[type="radio"]' );

	function checkedRadio() {
		for ( var i = 0; i < radios.length; i++ ) {
			if ( radios[ i ].checked ) {
				return radios[ i ];
			}
		}
		return null;
	}

	// Snapshot of the radio that was checked when the editor opened,
	// so Cancel can revert to it.
	var original = checkedRadio();

	function toggle() {
		var hidden = editor.style.display === 'none' || editor.style.display === '';
		editor.style.display = hidden ? 'block' : 'none';
		show.style.display   = hidden ? 'none'  : 'inline';
	}

	function updateDisplay() {
		var checked = checkedRadio();
		if ( checked ) {
			display.textContent = checked.parentNode.textContent.trim();
		}
	}

	show.addEventListener( 'click', function ( e ) {
		e.preventDefault();
		toggle();
	} );

	cancel.addEventListener( 'click', function ( e ) {
		e.preventDefault();
		if ( original ) {
			original.checked = true;
		}
		updateDisplay();
		toggle();
	} );

	save.addEventListener( 'click', function ( e ) {
		e.preventDefault();
		// The radio is the actual form field — it submits with the post
		// regardless of whether OK is clicked. OK only updates the label
		// and closes the editor.
		original = checkedRadio();
		updateDisplay();
		toggle();
	} );
} )();

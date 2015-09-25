/**
 * Social Paper FEE Javascript
 *
 * Implements additional processing via callbacks from WP FEE events
 *
 * @package Social_Paper
 * @subpackage Template
 */

/**
 * Create SocialPaper object
 */
var SocialPaper = SocialPaper || {};

// TinyMCE content editor instance
SocialPaper.editor = {};

// comments association array
SocialPaper.comments = new Array;

/**
 * When the page is ready
 */
jQuery(document).ready( function($) {

	/**
	 * Init Inline Comments array
	 */
	function social_paper_init_comments() {

		// reset array
		SocialPaper.comments = [];

		// get current
		$('.fee-content-original').find( '[data-incom]' ).each( function( i, element ) {

			// construct default data
			var data = {
				is_new: false,
				is_modified: false,
				original: $(element).attr( 'data-incom' ),
				modified: $(element).attr( 'data-incom' ),
			};

			// add to array
			SocialPaper.comments.push( data );

		});

		console.log( 'Init SocialPaper.comments', SocialPaper.comments );

	}

	/**
	 * Get an item from the Inline Comments array
	 */
	function social_paper_get_comment_by_original( identifier ) {

		// init as not found
		var found = false;

		// iterate through items and find relevant one
		SocialPaper.comments.forEach( function( item ) {
			if ( item.original == identifier ) {
				found = item;
				return false;
			}
		});

		if ( found ) {
			return found;
		} else {
			return false;
		}

	}

	/**
	 * Get an item from the Inline Comments array
	 */
	function social_paper_get_comment_by_modified( identifier ) {

		// init as not found
		var found = false;

		// iterate through items and find relevant one
		SocialPaper.comments.forEach( function( item ) {
			if ( item.modified == identifier ) {
				found = item;
				return false;
			}
		});

		if ( found ) {
			return found;
		} else {
			return false;
		}

	}

	/**
	 * Add an item to the Inline Comments array
	 */
	function social_paper_add_comment( data ) {
		SocialPaper.comments.push( data );
		//console.log( 'Add item to SocialPaper.comments', data );
	}

	/**
	 * Update an item in the Inline Comments array
	 */
	function social_paper_update_comment( data ) {

		// iterate through items and find relevant one
		SocialPaper.comments.forEach( function( item ) {
			if ( item.original == data.original ) {
				item = data;
				return false;
			}
		});

	}

	/**
	 * Remove Inline Comments 'data-incom' attributes from TinyMCE content
	 */
	function social_paper_clear_incom_attributes() {

		var items;

		// get raw post content and wrap in temporary div
		items = $('<div>').html( SocialPaper.editor.getContent() );

		// strip Inline Comments data attribute
		items.find( '[data-incom]' ).each( function( i, element ) {
			element.removeAttribute( 'data-incom' );
		});

		// overwrite current content
		SocialPaper.editor.setContent( items.html(), {format : 'html'} );

	}

	/**
	 * Add Inline Comments 'data-incom' attributes to TinyMCE content
	 */
	function social_paper_copy_incom_content() {

		// overwrite current content
		SocialPaper.editor.setContent( $('.fee-content-original').html(), {format : 'html'} );

	}

	/**
	 * Hook into WP FEE initialisation
	 */
	$(document).on( 'fee-editor-init', function( event ) {

		// store editor in our "global"
		SocialPaper.editor = tinyMCE.get( window.wpActiveEditor );

		// we will probably need to check if there's a non-collapsed selection
		// on keydown

		// when keys are held down so that they repeatedly fire, only keydown
		// events are triggered

		// add keydown tracker code
		SocialPaper.editor.on( 'keydown', function( event ) {

			var node, item, identifier, attr, data, number, current

			//console.log( 'keyup event', event );
			//console.log( 'keyup event code', event.keyCode );
			//console.log( 'editor.selection', editor.selection );

			// return?
			if ( event.keyCode == tinymce.util.VK.ENTER ) {

				// get new node
				node = SocialPaper.editor.selection.getNode();

				// parse node to jQuery object
				item = $( node );

				// get identifier
				identifier = item.prop( 'tagName' ).substr( 0, 5 );

				// get data-incom attribute value
				data = item.attr( 'data-incom' );

				// strip identifer from data to get number
				number = parseInt( data.replace( identifier, '' ) );

				// bump all p tags greater than this
				item.nextAll( 'p' ).each( function( i, el ) {

					var element, current_identifier, current, becomes, comment_data;

					// convert to jQuery object
					element = $( el );

					// get current identifier
					current_identifier = element.attr( 'data-incom' );

					// get current item's number
					current = parseInt( current_identifier.replace( identifier, '' ) );

					// becomes
					becomes = identifier + ( current + 1 );

					// increment data
					element.attr( 'data-incom', becomes );

					// update data
					comment_data = social_paper_get_comment_by_modified( current_identifier );
					comment_data.modified = becomes;
					comment_data.is_modified = true;

					// update tracker array
					social_paper_update_comment( comment_data );

				});

				// finally, bump this item
				item.attr( 'data-incom', identifier + ( number + 1 ) );

				// add to array
				social_paper_add_comment( {
					is_new: true,
					is_modified: false,
					original: identifier + number,
					modified: identifier + ( number + 1 ),
				} );

			}

			// delete?
			if ( event.keyCode == tinymce.util.VK.DELETE || event.keyCode == tinymce.util.VK.BACKSPACE ) {

				// whether backspace, forward-delete, word-delete or any other
				// we need to check all existing paragraphs and match against
				// the current ones.

				// the 'node' var gives us the position of the caret after the
				// delete has taken place, so that if paragraphs are merged, we
				// can (a) decrement the paras that follow, (b) merge the comment
				// associations for the two merged paras.

				// get new node
				node = SocialPaper.editor.selection.getNode();
				console.log( 'node', node );

			}

			// space?
			if ( event.keyCode == 32 ) {

				// if there's a non-collapsed selection on keydown, we need to
				// check all existing paragraphs and match against
				// the current ones.

			}

			/*
			// paste?
			if ( tinymce.util.VK ) {
			}
			*/

			/*
			// cut?
			if ( tinymce.util.VK ) {
			}
			*/

		});

		// add change tracker code
		SocialPaper.editor.on( 'change', function(e) {
			//console.log('change event', e);
			//console.log('change event type', e.type);
		});

	});

	/**
	 * Hook into WP FEE activation
	 */
	$(document).on( 'fee-on', function( event ) {

		//console.log( 'fee-on' );

		// if Inline Comments present
		if ( window.incom ) {

			// fade out bubbles
			$('#incom_wrapper').fadeOut();

			// build array
			social_paper_init_comments();

			// copy content
			social_paper_copy_incom_content();

		}

		// always fade out comments and comment form
		$('#comments, #respond').fadeOut();

		// test for our localisation object
		if ( 'undefined' !== typeof Social_Paper_FEE_i18n ) {

			// switch editing toggle button text
			$('#wp-admin-bar-edit span').text( Social_Paper_FEE_i18n.button_disable );

		}

	});

	/**
	 * Hook into WP FEE deactivation
	 */
	$(document).on( 'fee-off', function( event ) {

		//console.log( 'fee-off' );

		// if Inline Comments present
		if ( window.incom ) {

			// fade in bubbles
			$('#incom_wrapper').fadeIn();

			// rebuild - requires the latest Github Inline Comments
			// https://github.com/kevinweber/inline-comments/
			if ( window.incom.rebuild ) {
				window.incom.rebuild();
			}

		}

		// always fade in comments and comment form
		$('#comments, #respond').fadeIn();

		// test for our localisation object
		if ( 'undefined' !== typeof Social_Paper_FEE_i18n ) {

			// switch editing toggle button text
			$('#wp-admin-bar-edit span').text( Social_Paper_FEE_i18n.button_enable );

		}

	});

	/**
	 * Hook into WP FEE before save
	 *
	 * Currently used to strip 'data-incom' attribute from post content before
	 * it is sent to the server. This prevents the attributes being saved in the
	 * post content.
	 *
	 * Can also be used to add items to be saved along with the post data. See
	 * example code at foot of function.
	 */
	$(document).on( 'fee-before-save', function( event ) {

		//console.log( 'fee-before-save' );

		// if Inline Comments present
		if ( window.incom ) {

			// clear Inline Comments attributes
			social_paper_clear_incom_attributes();

			SocialPaper.comments.forEach( function( item ) {

				if ( item.is_modified && ! item.is_new ) {

					$('li[data-incom-comment="' + item.original + '"]' ).each( function( i, el ) {
						if ( ! $(el).hasClass( 'sp_processed' ) ) {
							$(el).attr( 'data-incom-comment', item.modified );
							$(el).addClass( 'sp_processed' );
						}
					});

				}

			});

			// remove processed identifier
			$('li.sp_processed').removeClass( 'sp_processed' );

		}

		/*
		// example additions

		// add nonce
		wp.fee.post.social_paper_nonce = function() {
			return $('#social_paper_nonce').val();
		};

		// add a value
		wp.fee.post.social_paper_value = function() {
			return $('#social_paper_value').val();
		};
		*/

	});

	/**
	 * Hook into WP FEE after save
	 */
	$(document).on( 'fee-after-save', function( event ) {

		//console.log( 'fee-after-save' );

	});

});



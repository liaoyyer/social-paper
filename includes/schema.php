<?php

/**
 * CAC Social Paper schema.
 *
 * Defines post types, taxonomies, and other data types.
 *
 * @since 1.0
 */

add_action( 'init', 'cacsp_register_post_types' );
add_action( 'init', 'cacsp_register_taxonomies', 15 );

/**
 * Register post types.
 *
 * @since 1.0
 */
function cacsp_register_post_types() {
	$labels = array(
		'name'               => _x( 'Papers', 'papers general name', 'cac-social-paper' ),
		'singular_name'      => _x( 'Paper', 'papers singular name', 'cac-social-paper' ),
		'add_new'            => _x( 'Add New', 'paper', 'cac-social-paper' ),
		'add_new'            => __( 'Add New Paper', 'cac-social-paper' ),
		'edit_item'          => __( 'Edit Paper', 'cac-social-paper' ),
		'new_item'           => __( 'New Paper', 'cac-social-paper' ),
		'view_item'          => __( 'View Paper', 'cac-social-paper' ),
		'search_items'       => __( 'Search Papers', 'cac-social-paper' ),
		'not_found'          => __( 'No papers found.', 'cac-social-paper' ),
		'not_found_in_trash' => __( 'No papers found in Trash.', 'cac-social-paper' ),
		'all_items'          => __( 'All Papers', 'cac-social-paper' ),
	);

	register_post_type( 'cacsp_paper', array(
		'labels' => $labels,
		'public' => true,
		'capability_type' => 'paper',
		'capabilities' => array(
			'delete_posts'           => 'delete_papers',
			'delete_private_posts'   => 'delete_private_papers',
			'delete_published_posts' => 'delete_published_papers',
			'delete_others_posts'    => 'delete_others_papers',
			'edit_private_posts'     => 'edit_private_papers',
			'edit_published_posts'   => 'edit_published_papers'
		),
		'rewrite' => array(
			'slug' => 'papers',
			'with_front' => false,
		),
		'supports' => array( 'title', 'editor', 'comments', 'thumbnail', 'buddypress-activity' ),
		'has_archive' => true,
		'bp_activity' => array(
			'format_callback' => 'cacsp_format_activity_action',
		),
	) );
}

/**
 * Register taxonomies.
 *
 * @since 1.0
 */
function cacsp_register_taxonomies() {
	// Paper tags.
	register_taxonomy( 'cacsp_paper_tag', 'cacsp_paper', array(
		'hierarchical' => false,
		'rewrite' => array(
			'with_front' => false,
			'slug' => 'tag',
		),
	) );
}

/**
 * Maps basic capabilities for our 'cacsp_paper' post type.
 *
 * @since 1.0
 *
 * @param  array  $caps    The mapped caps
 * @param  string $cap     The cap being mapped
 * @param  int    $user_id The user id in question
 * @param  array  $args    Optional parameters passed to has_cap(). For us, this means the post ID.
 * @return array
 */
function cacsp_map_basic_meta_caps( $caps, $cap, $user_id, $args ) {
	switch ( $cap ) {
		case 'edit_paper' :
		case 'delete_paper' :
		case 'read_paper' :
			$post = get_post( $args[0] );
			$post_type = get_post_type_object( $post->post_type );

			// Set an empty array for the caps
			$caps = array();

			// Sanity check!
			if( 'cacsp_paper' !== $post->post_type ) {
				return $caps;
			}

			break;

		default :
			return $caps;
			break;
	}

	switch ( $cap ) {
		case 'edit_paper' :
			if ( $user_id == $post->post_author ) {
				$caps[] = $post_type->cap->edit_posts;
			} else {
				$caps[] = $post_type->cap->edit_others_posts;
			}

			break;

		case 'delete_paper' :
			if ( $user_id == $post->post_author ) {
				$caps[] = $post_type->cap->delete_posts;
			} else {
				$caps[] = $post_type->cap->delete_others_posts;
			}

			break;

		case 'read_paper' :
			if ( 'private' != $post->post_status ) {
				$caps[] = 'read';
			} elseif ( $user_id == $post->post_author ) {
				$caps[] = 'read';
			} else {
				$caps[] = $post_type->cap->read_private_posts;
			}

			break;
	}

	return $caps;
}
add_filter( 'map_meta_cap', 'cacsp_map_basic_meta_caps', 10, 4 );

/**
 * Add capabilities for subscribers and contributors.
 *
 * By default, subscribers and contributors do not have caps to post, edit or
 * delete papers. This function injects these caps for users with these roles.
 *
 * @param  array  $caps    The mapped caps
 * @param  string $cap     The cap being mapped
 * @param  int    $user_id The user id in question
 * @param  array  $args    Optional parameters passed to has_cap(). For us, this means the post ID.
 * @return array
 */
function cacsp_map_extra_meta_caps( $caps, $cap, $user_id, $args ) {
	switch ( $cap ) {
		// give user these caps
		case 'publish_papers' :
		case 'edit_papers' : // handles adding tags/categories
			break;

		// meta caps
		case 'edit_paper' :
		case 'delete_paper' :
			// bail if someone else's event
			if ( ! empty( $caps[0] ) && false !== strpos( $caps[0], 'others' ) ) {
				return $caps;
			}

			break;

		case 'read_paper' :
			if ( get_post( $args[0] )->post_status === 'publish' ) {
				return array( 'exist' );
			}

			// Make sure authors can view their own post
			if ( (int) get_post( $args[0] )->post_author === $user_id ) {
				return array( 'exist' );
			}

			return $caps;
			break;

		// allow files to be uploaded via AJAX
		case 'upload_files' :
			if ( defined( 'DOING_AJAX' ) && true === constant( 'DOING_AJAX' ) ) {
				if ( false === isset( $_REQUEST['post_id'] ) ) {
					return $caps;
				}

				if ( false === current_user_can( 'edit_paper', $_REQUEST['post_id'] ) ) {
					return $caps;
				}

				$user_id = get_current_user_id();

			} else {
				return $caps;
			}

			break;

		default :
			return $caps;
			break;
	}

	// make sure user is valid
	$user = new WP_User( $user_id );
	if ( ! is_a( $user, 'WP_User' ) || empty( $user->ID ) ) {
		return $caps;
	}

	/**
	 * Filters Social Paper basic meta caps.
	 *
	 * @param array   Pass 'exist' cap so users are able to manage papers.
	 * @param array   $caps The mapped caps
	 * @param string  $cap The cap being mapped
	 * @param WP_User The user being tested for the cap.
	 */
	return apply_filters( 'cacsp_map_extra_meta_caps', array( 'exist' ), $caps, $cap, $user );
}
add_filter( 'map_meta_cap', 'cacsp_map_extra_meta_caps', 15, 4 );

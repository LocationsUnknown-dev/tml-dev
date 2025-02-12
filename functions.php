<?php
/**
 * Twenty Twenty-Four functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package Twenty Twenty-Four
 * @since Twenty Twenty-Four 1.0
 */

/**
 * Register block styles.
 */
if ( ! function_exists( 'twentytwentyfour_block_styles' ) ) :
	function twentytwentyfour_block_styles() {
		register_block_style(
			'core/details',
			array(
				'name'         => 'arrow-icon-details',
				'label'        => __( 'Arrow icon', 'twentytwentyfour' ),
				'inline_style' => '
					.is-style-arrow-icon-details {
						padding-top: var(--wp--preset--spacing--10);
						padding-bottom: var(--wp--preset--spacing--10);
					}
					.is-style-arrow-icon-details summary {
						list-style-type: "\2193\00a0\00a0\00a0";
					}
					.is-style-arrow-icon-details[open]>summary {
						list-style-type: "\2192\00a0\00a0\00a0";
					}',
			)
		);
		register_block_style(
			'core/post-terms',
			array(
				'name'         => 'pill',
				'label'        => __( 'Pill', 'twentytwentyfour' ),
				'inline_style' => '
					.is-style-pill a,
					.is-style-pill span:not([class], [data-rich-text-placeholder]) {
						display: inline-block;
						background-color: var(--wp--preset--color--base-2);
						padding: 0.375rem 0.875rem;
						border-radius: var(--wp--preset--spacing--20);
					}
					.is-style-pill a:hover {
						background-color: var(--wp--preset--color--contrast-3);
					}',
			)
		);
		register_block_style(
			'core/list',
			array(
				'name'         => 'checkmark-list',
				'label'        => __( 'Checkmark', 'twentytwentyfour' ),
				'inline_style' => '
					ul.is-style-checkmark-list {
						list-style-type: "\2713";
					}
					ul.is-style-checkmark-list li {
						padding-inline-start: 1ch;
					}',
			)
		);
		register_block_style(
			'core/navigation-link',
			array(
				'name'         => 'arrow-link',
				'label'        => __( 'With arrow', 'twentytwentyfour' ),
				'inline_style' => '
					.is-style-arrow-link .wp-block-navigation-item__label:after {
						content: "\2197";
						padding-inline-start: 0.25rem;
						vertical-align: middle;
						text-decoration: none;
						display: inline-block;
					}',
			)
		);
		register_block_style(
			'core/heading',
			array(
				'name'         => 'asterisk',
				'label'        => __( 'With asterisk', 'twentytwentyfour' ),
				'inline_style' => "
					.is-style-asterisk:before {
						content: '';
						width: 1.5rem;
						height: 3rem;
						background: var(--wp--preset--color--contrast-2, currentColor);
						clip-path: path('M11.93.684v8.039l5.633-5.633 1.216 1.23-5.66 5.66h8.04v1.737H13.2l5.701 5.701-1.23 1.23-5.742-5.742V21h-1.737v-8.094l-5.77 5.77-1.23-1.217 5.743-5.742H.842V9.98h8.162l-5.701-5.7 1.23-1.231 5.66 5.66V.684h1.737Z');
						display: block;
					}
					.is-style-asterisk:empty:before,
					.is-style-asterisk:-moz-only-whitespace:before {
						content: none;
					}
					.is-style-asterisk.has-text-align-center:before {
						margin: 0 auto;
					}
					.is-style-asterisk.has-text-align-right:before {
						margin-left: auto;
					}
					.rtl .is-style-asterisk.has-text-align-left:before {
						margin-right: auto;
					}",
			)
		);
	}
endif;
add_action( 'init', 'twentytwentyfour_block_styles' );

/**
 * Enqueue block stylesheets.
 */
if ( ! function_exists( 'twentytwentyfour_block_stylesheets' ) ) :
	function twentytwentyfour_block_stylesheets() {
		wp_enqueue_block_style(
			'core/button',
			array(
				'handle' => 'twentytwentyfour-button-style-outline',
				'src'    => get_parent_theme_file_uri( 'assets/css/button-outline.css' ),
				'ver'    => wp_get_theme( get_template() )->get( 'Version' ),
				'path'   => get_parent_theme_file_path( 'assets/css/button-outline.css' ),
			)
		);
	}
endif;
add_action( 'init', 'twentytwentyfour_block_stylesheets' );

/**
 * Register pattern categories.
 */
if ( ! function_exists( 'twentytwentyfour_pattern_categories' ) ) :
	function twentytwentyfour_pattern_categories() {
		register_block_pattern_category(
			'twentytwentyfour_page',
			array(
				'label'       => _x( 'Pages', 'Block pattern category', 'twentytwentyfour' ),
				'description' => __( 'A collection of full page layouts.', 'twentytwentyfour' ),
			)
		);
	}
endif;
add_action( 'init', 'twentytwentyfour_pattern_categories' );

/**
 * Enqueue theme scripts and styles.
 */
function your_theme_enqueue_scripts() {
	if ( ! is_admin() ) {
		// Enqueue external CSS.
		wp_enqueue_style( 'leaflet-css', 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css', array(), '1.9.3' );
		wp_enqueue_style( 'markercluster-css', 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css', array(), '1.5.3' );
		wp_enqueue_style( 'markercluster-default-css', 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css', array(), '1.5.3' );

		// Enqueue external JavaScript libraries.
		wp_enqueue_script( 'leaflet-js', 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.js', array(), '1.9.3', true );
		wp_enqueue_script( 'markercluster-js', 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js', array( 'leaflet-js' ), '1.5.3', true );
		wp_enqueue_script( 'leaflet-heat', 'https://unpkg.com/leaflet.heat/dist/leaflet-heat.js', array( 'leaflet-js' ), null, true );

		// Enqueue your custom modular script.
		wp_enqueue_script( 'app-script', get_template_directory_uri() . '/assets/js/app.js', array(), '1.0', true );

		// Enqueue the pako library for decompressing gzip files.
		wp_enqueue_script( 'pako-js', 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js', array(), '2.1.0', true );

		// Enqueue the trails module.
		wp_enqueue_script( 'trails-script', get_template_directory_uri() . '/assets/js/trails.js', array('leaflet-js', 'pako-js'), '1.0', true );
	}
}
add_action( 'wp_enqueue_scripts', 'your_theme_enqueue_scripts' );

/**
 * Add type="module" attribute to the main app script.
 */
function add_module_attribute( $tag, $handle, $src ) {
	if ( 'app-script' === $handle ) {
		$tag = '<script type="module" src="' . esc_url( $src ) . '"></script>';
	}
	return $tag;
}
add_filter( 'script_loader_tag', 'add_module_attribute', 10, 3 );

<?php
/*
Plugin Name: Ephemeral API Key for Map Access (with Referrer & Error Handling)
Description: Issues a temporary API key to front-end visitors and validates both the API key and referrer on the Hidden Google Sheets API endpoint. This ensures that only requests originating from pages on "themissinglist.com" can access the API.
Version: 1.2
Author: Your Name
*/

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

define( 'MAP_API_KEY_EXPIRY', 1800 ); // Key validity: 30 minutes
define( 'ALLOWED_REFERRER_DOMAIN', 'themissinglist.com' );

/**
 * Generate an ephemeral API key.
 *
 * Combines the current timestamp and visitor IP, then signs the data using a secret derived from WordPress salts.
 *
 * @return string Base64-encoded token.
 */
function generate_map_api_key() {
    $timestamp = time();
    $data = $timestamp . ':' . $_SERVER['REMOTE_ADDR'];
    // Use a secret key (using AUTH_KEY if defined)
    $secret = defined('AUTH_KEY') ? AUTH_KEY : 'default_secret';
    $signature = hash_hmac( 'sha256', $data, $secret );
    $token = base64_encode( $timestamp . ':' . $signature );
    return $token;
}

/**
 * Validate an ephemeral API key.
 *
 * Checks that the token is well-formed, unexpired, and that the signature matches.
 *
 * @param string $token The API key token.
 * @return bool True if valid, false otherwise.
 */
function validate_map_api_key( $token ) {
    $decoded = base64_decode( $token );
    if ( ! $decoded ) {
        return false;
    }
    $parts = explode( ':', $decoded );
    if ( count( $parts ) !== 2 ) {
        return false;
    }
    $timestamp = intval( $parts[0] );
    $signature = $parts[1];

    // Check if the key has expired.
    if ( ( time() - $timestamp ) > MAP_API_KEY_EXPIRY ) {
        return false;
    }

    // Recompute signature using the visitor's IP.
    $data = $timestamp . ':' . $_SERVER['REMOTE_ADDR'];
    $secret = defined('AUTH_KEY') ? AUTH_KEY : 'default_secret';
    $expected = hash_hmac( 'sha256', $data, $secret );
    return hash_equals( $expected, $signature );
}

/**
 * Set the API key cookie for front-end visitors.
 *
 * Runs on every page load (front-end only) and sets a cookie if one isn’t already present.
 */
function set_map_api_key_cookie() {
    if ( ! is_admin() && ! isset( $_COOKIE['map_api_key'] ) ) {
        $token = generate_map_api_key();
        $expire = time() + MAP_API_KEY_EXPIRY;
        // Set the cookie: HTTP-only and secure if SSL is enabled.
        setcookie( 'map_api_key', $token, $expire, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true );
        $_COOKIE['map_api_key'] = $token; // Make it available immediately.
    }
}
add_action( 'init', 'set_map_api_key_cookie' );

/**
 * Secure API endpoint callback.
 *
 * Validates both the ephemeral API key (from a cookie) and the HTTP referrer.
 * If the referrer is missing or does not contain the allowed domain, or if the API key is invalid, the request is rejected.
 *
 * @param WP_REST_Request $request The REST API request.
 * @return WP_REST_Response|WP_Error
 */
function secure_hiddengs_get_locations( WP_REST_Request $request ) {
    // Referrer check: Only allow if the referrer header contains the allowed domain.
    $referrer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
    if ( empty($referrer) || stripos($referrer, ALLOWED_REFERRER_DOMAIN) === false ) {
        return new WP_Error( 'unauthorized', 'Access Denied: Invalid referrer.', array( 'status' => 403 ) );
    }

    // API key check: Validate the ephemeral API key from the cookie.
    $token = isset( $_COOKIE['map_api_key'] ) ? $_COOKIE['map_api_key'] : '';
    if ( ! $token || ! validate_map_api_key( $token ) ) {
        return new WP_Error( 'unauthorized', 'Access Denied: Invalid or expired API key. Please refresh the page to obtain a new key.', array( 'status' => 403 ) );
    }

    // The published Google Sheets CSV URL.
    $google_sheets_url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTeLvpkIrdp6sH5tqTyx8B9pSLKRZdeWp8_DWTvFsXvu_q6H2jRO-yn1gq-aZ_6kyL6z-IQI7EHR6AS/pub?gid=0&single=true&output=csv';

    // Fetch the CSV data.
    $response = wp_remote_get( $google_sheets_url );
    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'data_fetch_error', 'Unable to fetch data from Google Sheets.', array( 'status' => 500 ) );
    }
    $csv = wp_remote_retrieve_body( $response );
    if ( empty( $csv ) ) {
        return new WP_Error( 'empty_data', 'No data returned from Google Sheets.', array( 'status' => 500 ) );
    }

    // Parse the CSV.
    $lines = explode( "\n", $csv );
    $data  = array();
    if ( count( $lines ) > 1 ) {
        $headers = str_getcsv( array_shift( $lines ) );
        foreach ( $lines as $line ) {
            if ( trim( $line ) === '' ) {
                continue;
            }
            $row = str_getcsv( $line );
            if ( count( $row ) < count( $headers ) ) {
                continue;
            }
            $item = array();
            foreach ( $headers as $index => $header ) {
                $item[ trim( $header ) ] = isset( $row[ $index ] ) ? $row[ $index ] : '';
            }
            $data[] = $item;
        }
    } else {
        return new WP_Error( 'parsing_error', 'CSV parsing failed: Not enough data.', array( 'status' => 500 ) );
    }
    return rest_ensure_response( $data );
}

/**
 * Register the secure API endpoint.
 */
add_action( 'rest_api_init', function () {
    register_rest_route( 'hiddengs/v1', '/locations', array(
        'methods'             => 'GET',
        'callback'            => 'secure_hiddengs_get_locations',
        'permission_callback' => '__return_true', // Public access; our custom checks handle security.
    ));
});

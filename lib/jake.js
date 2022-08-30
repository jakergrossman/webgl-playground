"use strict";

/**
 * Linearly interpolate between two values
 *
 * @param a Number Start value
 * @param b Number End value
 * @param t Number Interpolation factor
 */
export function lerp(a, b, t) {
    return a + t * (b - a);
}

/**
 * Generate a random number in range [a, b)
 *
 * @param a Number Lower bound (inclusive)
 * @param b Number Upper bound (exclusive)
 */
export function rand(a, b) {
    return lerp(a, b, Math.random());
}

/**
 * Generate `<script>` tags for loading shaders with twgl.
 *
 * @param uris - A list of URIs to fetch and generate script tags from
 */
export async function generateShaderScriptTags(...uris) {
    for (const uri of uris) {
        const response = await fetch(uri);
        if (response.status === 200) {
            const source = await response.text();

            /* delete existing tag if present */
            let oldTag = document.getElementById(uri);
            if (oldTag !== null) {
                oldTag.remove();
            }

            let tag = document.createElement("script");
            tag.text = source;
            tag.type = "notjs";
            tag.id = uri;

            document.body.appendChild(tag);
        } else {
            throw "Could not load \"" + uri + "\"";
        }
    }
}

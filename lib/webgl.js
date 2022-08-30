"use strict";

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

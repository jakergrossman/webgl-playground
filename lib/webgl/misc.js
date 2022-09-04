import { fetchText, fetchTextSync } from "../misc.js";

/**
 * Generate `<script>` tags for loading shaders with twgl.
 *
 * @param uris - A list of URIs to fetch and generate script tags from
 */
export async function generateShaderScriptTags(...uris) {
    for (const uri of uris) {
        const source = await fetchText(uri);

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
    }
}

/**
 * Generate `<script>` tags for loading shaders with twgl.
 *
 * @param uris - A list of URIs to fetch and generate script tags from
 */
export function generateShaderScriptTagsSync(...uris) {
    for (const uri of uris) {
        const source = fetchTextSync(uri);

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
    }
}

export function notSupported(nowebgl=true) {
    if (nowebgl) {
        window.location.replace("../no-webgl");
    } else {
        window.location.href = "../not-supported";
    }
}

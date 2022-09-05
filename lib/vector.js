/* 2/3/4D vector */
export class Vector {
    /* name of components */
    static names = [ "x", "y", "z", "w" ];

    static assertSameSize(vec1, vec2) {
        if (vec1.length != vec2.length) {
            throw new TypeError("Vector: Mismatched vector sizes (" + vec1.length + "," + vec2.length + ")");
        }
    }

    constructor(...components) {
        if (components.length > 4) {
            throw new TypeError("Vector: Too many components (>4)");
        }

        this.length = components.length;

        for (let i = 0; i < components.length; i++) {
            this[Vector.names[i]] = components[i];
        }
    }

    components() {
        return Vector.names.filter(n=>this.hasOwnProperty(n));
    }

    /**
     * Return a copy of the current vector
     */
    copy() {
        return new Vector(...this.serialize());
    }

    /**
     * Return an array of components
     * for easy passing to functions which may
     * expect an array (for example, GLSL uniforms)
     */
    serialize() {
        return this.components().map(n=>this[n]);
    }

    /**
     * OBJECT METHODS
     *
     * These methods modify the object upon which they are called.
     *
     * So, vec1.add(vec2) is not an equivalent call as vec2.add(vec1),
     * even though the resulting vector for assignment is
     */

    scalar(t) {
        for (const c of this.components()) {
            this[c] *= t;
        }
        return this;
    }

    add(vec) {
        if (this.length != vec.length) {
            throw new TypeError("Vector: Mismatched vector sizes (" + this.length + "," + vec.length + ")");
        }

        for (const c of vec.components()) {
            this[c] += vec[c];
        }

        return this;
    }

    sub(vec) {
        Vector.assertSameSize(this, vec);

        for (const c of vec.components()) {
            this[c] -= vec[c];
        }

        return this;
    }

    /* ELEMENT wise multiplication, like glsl vecx */
    mult(vec) {
        Vector.assertSameSize(this, vec);

        for (const c of vec.components()) {
            this[c] *= vec[c];
        }

        return this;
    }

    /* ELEMENT wise division, like glsl vecx */
    div(vec) {
        Vector.assertSameSize(this, vec);

        for (const c of vec.components()) {
            this[c] /= vec[c];
        }

        return this;
    }

    /**
     * STATIC METHODS
     *
     * These methods operate on vector without modifying them.
     * They do so by copying the vector that would be modified,
     * then modifying the copy and returning that instead
     */

    static scalar(vec, t) {
        let copy = vec.copy();
        for (const c of vec.components()) {
            copy[c] *= t;
        }
        return copy;
    }

    static add(vec1, vec2) {
        Vector.assertSameSize(vec1, vec2);
        let copy = vec1.copy();

        for (const c of vec2.components()) {
            copy[c] += vec2[c];
        }

        return copy;
    }

    static sub(vec1, vec2) {
        Vector.assertSameSize(vec1, vec2);

        let copy = vec1.copy();

        for (const c of vec2.components()) {
            copy[c] -= vec2[c];
        }

        return copy;
    }

    static mult(vec1, vec2) {
        Vector.assertSameSize(vec1, vec2);

        let copy = vec1.copy();

        for (const c of vec2.components()) {
            copy[c] *= vec2[c];
        }

        return copy;
    }

    static div(vec1, vec2) {
        Vector.assertSameSize(vec1, vec2);

        let copy = vec1.copy();

        for (const c of vec2.components()) {
            copy[c] /= vec2[c];
        }

        return copy;
    }
}

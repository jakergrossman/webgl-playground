export class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        return this;
    };
}

export function allSubsets(arr) {
    return arr.reduce((subsets, value) =>
        subsets.concat(subsets.map(set => [...set, value])), [[]]).slice(1);
}

/* 2/3/4D vector */
export class Vector {
    /* name of components */
    static names = [ "x", "y", "z", "w" ];
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
        let comps = [];
        for (const key of Vector.names) {
            if (this.hasOwnProperty(key)) {
                comps.push(key);
            }
        }
        return comps;
    }

    copy() {
        return new Vector(...this.serialize());
    }

    scalar(t) {
        for (const c of this.components()) {
            this[c] *= t;
        }
        return this;
    }

    static scalar(vec, t) {
        let copy = vec.copy();
        for (const c of vec.components()) {
            copy[c] *= t;
        }
        return copy;
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

    static add(vec1, vec2) {
        if (vec1.length != vec2.length) {
            throw new TypeError("Vector: Mismatched vector sizes (" + vec1.length + "," + vec2.length + ")");
        }

        let copy = vec1.copy();

        for (const c of vec2.components()) {
            copy[c] += vec2[c];
        }

        return copy;
    }

    sub(vec) {
        if (this.length != vec.length) {
            throw new TypeError("Vector: Mismatched vector sizes (" + this.length + "," + vec.length + ")");
        }

        for (const c of vec.components()) {
            this[c] -= vec[c];
        }

        return this;
    }

    static sub(vec1, vec2) {
        if (vec1.length != vec2.length) {
            throw new TypeError("Vector: Mismatched vector sizes (" + vec1.length + "," + vec2.length + ")");
        }

        let copy = vec1.copy();

        for (const c of vec2.components()) {
            copy[c] -= vec2[c];
        }

        return copy;
    }

    mult(vec) {
        if (this.length != vec.length) {
            throw new TypeError("Vector: Mismatched vector sizes (" + this.length + "," + vec.length + ")");
        }

        for (const c of vec.components()) {
            this[c] *= vec[c];
        }

        return this;
    }

    static mult(vec1, vec2) {
        if (vec1.length != vec2.length) {
            throw new TypeError("Vector: Mismatched vector sizes (" + vec1.length + "," + vec2.length + ")");
        }

        let copy = vec1.copy();

        for (const c of vec2.components()) {
            copy[c] *= vec2[c];
        }

        return copy;
    }

    div(vec) {
        if (this.length != vec.length) {
            throw new TypeError("Vector: Mismatched vector sizes (" + this.length + "," + vec.length + ")");
        }

        for (const c of vec.components()) {
            this[c] /= vec[c];
        }

        return this;
    }

    static div(vec1, vec2) {
        if (vec1.length != vec2.length) {
            throw new TypeError("Vector: Mismatched vector sizes (" + vec1.length + "," + vec2.length + ")");
        }

        let copy = vec1.copy();

        for (const c of vec2.components()) {
            copy[c] /= vec2[c];
        }

        return copy;
    }

    serialize() {
        let values = [];
        for (const c of this.components()) {
            values.push(this[c]);
        }
        return values;
    }
}

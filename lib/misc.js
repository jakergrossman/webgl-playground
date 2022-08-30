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
 * Generate N-dimensional array of null values
 *
 * @param dims Number|Object A scalar or list of dimensions
 * @param val Object|Function Default value or callback that returns default value
 */
export function createNDArray(ns, val=null) {
    if (typeof(ns) === "number") {
        return createNDArray([ns], val); // interpret as single dimension
    }

    if (ns.length > 0) {
        const dim = ns[0];
        const rest = ns.slice(1);
        let arr = new Array();
        for (let i = 0; i < dim; i++) {
            arr.push(createNDArray(rest, val));
        }

        return arr;
    } else {
        if (typeof val === "function") {
            return val();
        } else {
            return val;
        }
    }
}

/**
 * Create a list of evenly spaced values in range,
 * specified by the number of values
 *
 * @param a Number Start value
 * @param b Number End value
 * @param steps Number Number of values
 */
export function linSpace(a, b, steps=50) {
    const stepSize = (b - a) / steps;

    let data = [];
    for (let i = 0; i < steps; i++) {
        data.push(a + i*stepSize);
    }

    return data;
}

/**
 * Create a list of evenly spaced values in range,
 * specified by the step size
 *
 * @param a Number Start value
 * @param b Number End value
 * @param stepSize Number Number of steps
 */
export function arange(a, b, stepSize=1.0) {
    const numSteps = Math.floor((b - a) / stepSize);

    let data = [];
    for (let i = 0; i < numSteps; i++) {
        data.push(a + i*stepSize);
    }

    return data;
}

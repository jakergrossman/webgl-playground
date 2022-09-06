/**
 * Fluent WebGLProgram + TWGL wrapper for managing variables and data
 *
 * Heavily inspired by: https://github.com/skeeto/perlin-noise/tree/9f4957074d82385214311e8ce9caf2a70932c4b5/webgl/src
 */
import * as twgl from "../../dep/twgl.js/dist/4.x/twgl-full.module.js";

import { fetchTextSync } from "../misc.js";
import { Vector } from "../vector.js";

export class Program {
    constructor(gl, vertURI, fragURI) {
        this.gl = gl;
        const sources = [vertURI, fragURI].map(fetchTextSync);
        this.programInfo = twgl.createProgramInfo(gl, sources);
        if (!this.programInfo) {
            throw new Error("Could not create shader");
        }

        this.uniformInfo = {};
        this.bufferInfo = null;
        this.screenSize = new Vector(0, 0);
    }

    /**
     * Tell WebGL to use this program right now
     * 
     * @returns {Program} this
     */
    use() {
        this.gl.useProgram(this.programInfo.program);
        return this;
    }

    /**
     * Save uniform information and optionally bind with TWGL
     *
     * @param {Object} uniforms Uniform object to merge with existing uniformInfo
     * @param {Boolean} bind Whether to attempt to bind uniforms
     * @returns {Program} this
     */
    uniforms(uniforms, bind=true) {
        if (uniforms) {
            /* merge uniforms */
            this.uniformInfo = {...this.uniformInfo, ...uniforms}
        }

        if (bind) {
            twgl.setUniforms(this.programInfo, this.uniformInfo);
        }

        return this;
    }

    /**
     * Set bufferInfo from an object of arrays
     * with twgl.createBufferFromArrays
     *
     * @param {twgl.Arrays} arrays Your data
     * @param {Number|Object} numComponents A number specifiying the size of all arrays, 
     *                                      or an object mapping array names to sizes
     * @param {twgl.BufferInfo} srcBufferInfo An existing bufferInfo to forward
     * @returns {Program} this
     */
    arrays(arrays, numComponents, srcBufferInfo) {
        let arrObj = {};
        if (numComponents) {
            /* 'arrays' is a raw array object */
            for (const arr in arrays) {
                arrObj[arr] = {
                    data: arrays[arr]
                }

                if (typeof numComponents === "number") {
                    /* all arrays are sized the same */
                    arrObj[arr].numComponents = numComponents;
                } else if (typeof numComponents === "object") {
                    arrObj[arr].numComponents = numComponents[arr];
                }
            }
        } else {
            /* 'arrays' are already sized (from twgl.createAugmentedTypedArray, presumably) */
            arrObj = arrays;
        }

        this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, arrObj, srcBufferInfo);

        return this;
    }

    /**
     * Set buffers and attributes, creating a new bufferInfo object
     * if arguments are passed.
     *
     * @param {twgl.Arrays} arrays Your data
     * @param {twgl.BufferInfo} srcBufferInfo An existing bufferInfo to forward
     * @returns {Program} this
     */
    buffersAndAttributes(arrays, srcBufferInfo) {
        if (arrays || srcBufferInfo) {
            this.arrays(arrays, srcBufferInfo);
        }

        twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);

        return this;
    }

    /**
     * Draw buffer info
     *
     * @param {Number} mode Drawing mode
     * @returns {Program} this
     */
    draw(mode) {
        twgl.drawBufferInfo(this.gl, this.bufferInfo, mode);

        return this;
    }

    /**
     * Run a callback if gl is currently in an error state
     *
     * @param {Function} callback The callback to execute
     * @returns {Program} this
     */
    glError(callback, ...args) {
        const err = this.gl.getError()
        if (err !== this.gl.NO_ERROR) {
            callback(err, ...args);
        }

        return this;
    }

    /**
     * Resize the canvas and viewport to the display size
     *
     * @param {jake.Vector} saveVector A vector object to save the new screen size to
     */
    sizeToScreen() {
        twgl.resizeCanvasToDisplaySize(this.gl.canvas);
        this.screenSize.x = this.gl.canvas.width;
        this.screenSize.y = this.gl.canvas.height;
        this.gl.viewport(0, 0, ...this.screenSize.serialize());

        return this;
    }

    /**
     * Set color and clear with mask
     *
     * @param {Object} presets Object describing presets (if any) to set before clearing
     * @param {GLbitfield} mask Which buffers to clear 
     *                          (e.g.: COLOR_BUFFER_BIT, DEPTH_BUFFER_BIT, or STENCIL_BUFFER_BIT)
     *
     *                          Used when you don't want to change the buffer preset,
     *                          but still want to clear
     */
    clear(presets, mask) {
        for (const [name, value] of Object.entries(presets)) {
            switch (name.toLowerCase()) {
                case "color":
                    this.gl.clearColor(...value);
                    mask |= this.gl.COLOR_BUFFER_BIT;
                    break;
                case "depth":
                    this.gl.clearDepth(value);
                    mask |= this.gl.DEPTH_BUFFER_BIT;
                    break;
                case "stencil":
                    this.gl.clearStencil(value);
                    mask |= this.gl.STENCIL_BUFFER_BIT;
                    break;
                default:
                    throw new Error("\"" + name + "\" is not one of {color, depth, stencil}");
            }
        }

        this.gl.clear(mask);

        return this;
    }
}

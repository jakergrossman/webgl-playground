/* Create and return a shader
 *
 * @param gl WebGLRenderingContext A valid WebGL2 context
 * @param shaderInfo Object An object describing the shader.
 *                          Must contain at least two properties:
 *                              uri: The resource URI for the shader
 *                              type: The type of shader
 *                                    (e.g.: gl.FRAGMENT_SHADER, gl.VERTEX_SHADER, etc.)
 */
async function createShader(gl, shaderInfo) {
    const response = await fetch(shaderInfo.uri);
    if (response.status === 200) {
        // remove leading whitespace so that the
        // shader compiler doesn't complain
        const source = (await response.text()).trimStart();

        let shader = gl.createShader(shaderInfo.type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!status) {
            const error = gl.getShaderInfoLog(shader);
            throw "Could not compile shader '" + shaderInfo.uri + "' \n" + error;
        }

        return shader;
    } else {
        console.log(response);
    }
}

/* Create and return an OpenGL program object
 *
 * @param gl WebGLRenderingContext A valid WebGL2 context
 * @param shaderList Object A list of shaderInfo objects.
 * @param transformFeedbackVaryings
 */
async function createGLProgram(gl, shaderList, transformFeedbackVaryings) {
    let program = gl.createProgram();
    for (const shaderInfo of shaderList) {
        let shader = await createShader(gl, shaderInfo);
        gl.attachShader(program, shader);
    }

    /* specify varyings to capture in feedback buffer */
    if (transformFeedbackVaryings !== null) {
        gl.transformFeedbackVaryings(
            program, transformFeedbackVaryings, gl.INTERLEAVED_ATTRIBS);
    }

    gl.linkProgram(program);

    const status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
        const error = gl.getProgramInfoLog(program);
        throw "Could not link program.\n" + error;
    }

    return program;
}

/* Generate an object containing attribute locations from program objects
 *
 * @param program WebGLProgram A WebGL Program
 * @param objects Object A list of objects representing program objects.
 *                       Each object has 3 properties:
 *                          name: Name of the object
 *                          comp: # of components
 *                          type: data type
 */
function generateAttributeLocationsObject(gl, program, objects) {
    let locationsObject = {}
    for (const obj of objects) {
        locationsObject[obj.name] = {
            location: gl.getAttribLocation(program, obj.name),
            comp: obj.comp,
            type: obj.type,
        }
    }

    return locationsObject;
}

async function render(gl, callback, args, prevTimestamp, timestamp) {
    let timeDelta = timestamp - prevTimestamp;

    if (timeDelta >= 500.0) {
        // pretend no time has passed, probably
        // in other tab or something
        timeDelta = 0.0;
    }

    callback(gl, timeDelta, ...args);

    window.requestAnimationFrame(async newTimestamp => {
        await render(gl, callback, args, timestamp, newTimestamp);
    });
}

/* Linearly interpolate between two values
 *
 * @param a Number start value
 * @param b Number end value
 * @param t Number A value in the range [0.0, 1.0] to describe interpolation
 */
function lerp(a, b, t) {
    if (t < 0.0 || t > 1.0) {
        throw "lerp: t is not in the range [0.0, 1.0] (" + t + ")";
    }

    return a + t * (b - a);
}

/* Generate random data
 *
 * @param dimensions Object list of dimensions
 * @param arrayType - The type of the array (e.g.: Float32Array, Int8Array, etc.)
 * @param min Number minimum value
 * @param max Number maximum value
 */
function randomData(dimensions, arrayType, min, max) {
    if (dimensions.length > 0) {
        const len = dimensions.reduce((x,y) => x*y);
        let data = [];
        for (let i = 0; i < len; i++) {
            data.push(lerp(min, max, Math.random()));
        }

        return new arrayType(data);
    } else {
        return undefined;
    }
}

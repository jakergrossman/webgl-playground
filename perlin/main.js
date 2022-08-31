"use strict";

import * as twgl from "../dep/twgl.js/dist/4.x/twgl-full.module.js";
import * as jake from "../lib/jake.module.js";

const gl = document.getElementById("screen").getContext("webgl2");
if (!gl) {
    throw new Error("WebGL2 is not supported");
}

// initialize WebGL2 program
const shaders = [ "shaders/identity.vert", "shaders/perlin.frag" ];
const program = new jake.webgl.Program(gl, ...shaders);

const arrays = {
    position: [
        1.0,  1.0,
       -1.0,  1.0,
        1.0, -1.0,
       -1.0, -1.0,
    ],
};

program
    .arrays(arrays, 2)
    .uniforms({
        scale: 0.25,
        zDepth: 0.0,
        seed: jake.rand(0, 100),
        rgb: 0,
    }, false);

let zSpeed = 0.03;

// initialize controls
const controlPane  = document.getElementById("controls");
const scaleControl = controlPane.elements[0];
const zSpeedControl = controlPane.elements[1];
const seedControl = controlPane.elements[2];
const rgbControl = controlPane.elements[3];

// initial values
scaleControl.value  = program.uniformInfo.scale;
zSpeedControl.value = zSpeed;
seedControl.value   = program.uniformInfo.seed;
rgbControl.checked  = program.uniformInfo.rgb;

controlPane.oninput = updateParameters;

/**
 * convert a scale value in the range [0, 1] to a value in the range
 * [min, max] on the quadratic curve (min-max)x^2 + min
 */
function quadComp(scale, min, max) {
    let c = (max - min) * scale * scale + min;
    return c;
}

function updateParameters() {
    zSpeed = parseFloat(zSpeedControl.value),
    program.uniforms({
        scale: quadComp(parseFloat(scaleControl.value), 2, 1000),
        seed: parseFloat(seedControl.value),
        rgb: rgbControl.checked,
    }, false);
}

function draw() {
    program.uniformInfo.zDepth += zSpeed;

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.83, 0.83, 0.83, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    program
        .use()
        .buffersAndAttributes()
        .uniforms()
        .draw(gl.TRIANGLE_STRIP)
        .glError(err => {
            throw new Error("WebGL2 Rendering Error: " + err);
        });

    requestAnimationFrame(draw);
}

updateParameters();
requestAnimationFrame(draw);

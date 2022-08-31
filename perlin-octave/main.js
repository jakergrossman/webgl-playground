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
        zDepth: 0.0,
        seed: jake.rand(0, 100),
        octaves: 2,
        persistence: 0.5,
        lacunarity: 2.0,
    }, false);

let zSpeed = 0.03;

// initialize controls
const controlPane  = document.getElementById("controls");
const octaveControl = controlPane.elements[0];
const persistenceControl = controlPane.elements[1];
const lacunarityControl = controlPane.elements[2];
const zSpeedControl = controlPane.elements[3];

// initial values
octaveControl.value  = program.uniformInfo.octaves;
persistenceControl.value  = program.uniformInfo.persistence;
lacunarityControl.value  = program.uniformInfo.lacunarity;
zSpeedControl.value = zSpeed;

controlPane.oninput = updateParameters;

function updateParameters() {
    zSpeed = parseFloat(zSpeedControl.value),
    program.uniforms({
        octaves: parseInt(octaveControl.value),
        persistence: parseFloat(persistenceControl.value),
        lacunarity: parseFloat(lacunarityControl.value),
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

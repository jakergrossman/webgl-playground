"use strict";

import * as twgl from "../dep/twgl.js/dist/4.x/twgl-full.module.js";
twgl.setDefaults({attribPrefix: ""});
import * as jake from "../lib/jake.module.js";

const gl = document.getElementById("screen").getContext("webgl2");
if (!gl) {
    throw new Error("WebGL2 is not supported");
}

const shaders = [ "shaders/identity.vert", "shaders/perlin.frag" ];
await jake.webgl.generateShaderScriptTags(...shaders);

const programInfo = twgl.createProgramInfo(gl, shaders);

const arrays = {
    position: twgl.primitives.createAugmentedTypedArray(2, 4),
};

arrays.position.push(1.0, 1.0);
arrays.position.push(-1.0, 1.0);
arrays.position.push(1.0, -1.0);
arrays.position.push(-1.0, -1.0);

const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

let zSpeed = 0.03;
const uniforms = {
    scale: 30.0,
    zDepth: 0.0,
    seed: jake.rand(0, 100),
    rgb: 0,
};

// initialize controls
const controlPane  = document.getElementById("controls");
const scaleControl = controlPane.elements[0];
const zSpeedControl = controlPane.elements[1];
const seedControl = controlPane.elements[2];
const rgbControl = controlPane.elements[3];

// initial values
scaleControl.value  = uniforms.scale;
zSpeedControl.value = zSpeed;
seedControl.value   = uniforms.seed;
rgbControl.checked  = false;

controlPane.oninput = updateParameters;

function updateParameters() {
    uniforms.scale = parseFloat(scaleControl.value);
    zSpeed         = parseFloat(zSpeedControl.value);
    uniforms.seed  = parseFloat(seedControl.value);
    uniforms.rgb   = rgbControl.checked;
}

function draw() {
    uniforms.zDepth += zSpeed;  

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.83, 0.83, 0.83, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_STRIP);

    if (gl.getError() !== gl.NO_ERROR) {
        throw new Error("WebGL2 Rendering Error");
    }

    requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

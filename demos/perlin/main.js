"use strict";

import * as jake from "../../lib/jake.module.js";

const gl = document.getElementById("screen").getContext("webgl2");
if (!gl) {
    jake.webgl.notSupported();
}

// initialize WebGL2 program
const shaders = [ "shaders/identity.vert", "shaders/perlin.frag" ];
const program = new jake.webgl.Program(gl, ...shaders);
const screenSize = new jake.Vector(0, 0);

const arrays = {
    position: [
        1.0,  1.0,
       -1.0,  1.0,
        1.0, -1.0,
       -1.0, -1.0,
    ],
};

controls = new jake.webgl.ControlPanel([
    { type: "range", name: "scale", min: 0, max: 1, step: 0.001, value: 0.25 },
    { type: "range", name: "zspeed", min: 0, max: 0.075, step: 0.005, value: 0.03 },
    { type: "range", name: "seed", min: 1, max: 100, step: 0.01, value: jake.rand(1, 100) },
    { type: "checkbox", name: "rgb" },
]).instantiate(["frosted"]);

program
    .arrays(arrays, 2)
    .uniforms({
        zDepth: 0,
        ...controls.values
    }, false);


let zspeed = 0.03;
controls.form.oninput = updateParameters;

/**
 * convert a scale value in the range [0, 1] to a value in the range
 * [min, max] on the quadratic curve (min-max)x^2 + min
 */
function quadComp(scale, min, max) {
    let c = (max - min) * scale * scale + min;
    return c;
}

function updateParameters() {
    zspeed = parseFloat(controls.zspeedControl.value),
    program.uniforms({
        scale: quadComp(parseFloat(controls.scaleControl.value), 2, 1000),
        seed: parseFloat(controls.seedControl.value),
        rgb: controls.rgbControl.checked,
    }, false);

    controls.scaleDisplay.innerText = program.uniformInfo.scale.toFixed(0);
    controls.zspeedDisplay.innerText = zspeed.toFixed(3);
    controls.seedDisplay.innerText = program.uniformInfo.seed.toFixed(2);
}

function draw() {
    program.uniformInfo.zDepth += zspeed;
    program
        .use()
        .sizeToScreen(screenSize)
        .clear({color: [0.83, 0.83, 0.83, 1]})
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

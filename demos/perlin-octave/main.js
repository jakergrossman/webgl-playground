"use strict";

import * as twgl from "../../dep/twgl.js/dist/4.x/twgl-full.module.js";
import * as jake from "../../lib/jake.module.js";

const gl = document.getElementById("screen").getContext("webgl2");
if (!gl) {
    window.location.replace("../no-webgl");
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

controls = new jake.webgl.ControlPanel([
    { type: "range", name: "octaves", min: 1, max: 10, step: 1, value: 2 },
    { type: "range", name: "persistence", min: 0, max: 1, step: 0.05, value: 0.5 },
    { type: "range", name: "lacunarity", min: 1, max: 4, step: 0.25, value: 2 },
    { type: "range", name: "zspeed", min: 0, max: 0.075, step: 0.005, value: 0.03 },
]).instantiate(["frosted"]);

program
    .arrays(arrays, 2)
    .uniforms({
        zDepth: 0.0,
        seed: jake.rand(0, 100),
        ...controls.values,
    }, false);

let zspeed = 0.03;

controls.form.oninput = updateParameters;

function updateParameters() {
    zspeed = parseFloat(controls.zspeedControl.value),
    program.uniforms(controls.values, false);

    controls.octavesDisplay.innerText = program.uniformInfo.octaves;
    controls.persistenceDisplay.innerText = program.uniformInfo.persistence;
    controls.lacunarityDisplay.innerText = program.uniformInfo.lacunarity;
    controls.zspeedDisplay.innerText = zspeed;
}

function draw() {
    program.uniformInfo.zDepth += zspeed;

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

"use strict";

import * as twgl from "../../dep/twgl.js/dist/4.x/twgl-full.module.js";
twgl.setDefaults({attribPrefix: "i_"});
import * as jake from "../../lib/jake.module.js";

const gl = document.getElementById("screen").getContext("webgl2");
if (!gl) {
    jake.webgl.notSupported();
}

const numLines = 10000;

const shaders = [ "demos/lines/shaders/lines.vert", "demos/lines/shaders/lines.frag" ];
const program = new jake.webgl.Program(gl, ...shaders);

const arrays = {
    position: twgl.primitives.createAugmentedTypedArray(2, numLines*2),
    color: twgl.primitives.createAugmentedTypedArray(3, numLines*2, Uint8Array),
};

const hue = jake.rand(0, 360);
for (let i = 0; i < numLines; i++) {
    const u = i / numLines,
          h = (360 + hue + (Math.abs(u-0.5) * 100)) % 360,
          s = Math.sin(u * Math.PI * 2) * 0.25 + 0.75,
          v = .4;
    const color = chroma.hsv(h, s, v);

    arrays.position.push(u, 1);
    arrays.color.push(color.rgb());
    
    arrays.position.push(u, 0);
    arrays.color.push(color.brighten().desaturate().rgb());
}

const offsets = [0, 0, 0, 1];
const centers = [0, 0, 0, 0];
const mult    = [1, 2, 0, 0];

const uniforms = {
    u_matrix: twgl.m4.identity(),
    u_offsets: offsets,
    u_centers: centers,
    u_mult: mult,
};

program
    .arrays(arrays)
    .uniforms(uniforms, false);

const randTimeOffset = jake.rand(0,100000); // 0-1000 seconds
function render(time) {
    time = (time + randTimeOffset) * 0.001; // seconds

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    offsets[0] = Math.sin(time);
    offsets[1] = Math.sin(time * 0.13) * Math.PI * 2;
    offsets[2] = Math.sin(time * 0.43) * 0.5 + 1;
    offsets[3] = Math.cos(time * 0.17) * 0.5 + 0.5;

    centers[0] = Math.sin(time * 0.163) * 0.0;
    centers[1] = Math.cos(time * 0.267) * 0.0;
    centers[2] = Math.sin(time * 0.367) * 0.0;
    centers[3] = Math.cos(time * 0.497) * 0.5;

    mult[1] = (Math.sin(time * 0.1) * 0.5 + 0.5) * 3;

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    twgl.m4.ortho(-aspect, aspect, 1, -1, -1, 1, program.uniformInfo.u_matrix);

    program
        .use()
        .buffersAndAttributes()
        .uniforms(uniforms)
        .draw(gl.LINES);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);

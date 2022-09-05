"use strict";

import * as jake from "../../lib/jake.module.js";

const gl = document.getElementById("c").getContext("webgl2");

if (!gl) {
    jake.webgl.notSupported();
}

let shaderPrograms = [
    [ "shaders/update.vert", "shaders/update.frag" ],
    [ "shaders/render.vert", "shaders/render.frag" ],
];

let [physicsProgram, drawProgram] = shaderPrograms.map(n=>new jake.webgl.Program(gl, ...n));

const numParticles = 1000;
const minAge = 1;
const maxAge = 1.5;

const initialParticleData = jake.arange(numParticles)
    .map(_ => {
        const lifetime = jake.rand(minAge, maxAge);
        return [
            // position
            0, 0,

            // age -> lifeTime+1 for first cycle reset
            lifetime+1,
            lifetime,

            // velocity
            0,0
        ]
    });
        

function initialParticleData(minAge, maxAge) {
}

"use strict";

import * as twgl from "../dep/twgl.js/dist/4.x/twgl-full.module.js";
import * as jake from "../lib/jake.module.js";
const Vector = jake.Vector;

/* TODO: mobile, couldn't get pan or zoom to work */
if (jake.mobileCheck()) {
    jake.webgl.notSupported(false);
    throw ""; // DO NOT CONTINUE AND FLASH
}

// initialize controls
const controlPane  = document.getElementById("controls");
const iterControl = controlPane.elements[0];
const animControl = controlPane.elements[1];
const iterDisplay = document.querySelector("#iterControl+span");
const scaleDisplay = document.getElementById("scaleDisplay");

let zoom = 0.8;
let numIterations = 30;
let screenSize = null;
let click = false;
let center = new Vector(0, 0);
let program = init();
let minZoom = 0.2;
let maxZoom = 200000.001;
let animate = false;
let animDirection = 1;

requestAnimationFrame(draw);

/* handle mousewheel actions */
function scroll(event) {
    event.preventDefault();
    const {x, y, deltaY} = event;
    const zoomFactor = Math.pow(2, Math.sign(deltaY) * -0.5);
    const newZoom =  Math.max(minZoom, Math.min(maxZoom, zoomFactor * zoom));
    const screenPos = new Vector(x, y);
    let screenSize = new Vector(program.gl.canvas.width, program.gl.canvas.height);
    let uv = screenPos.copy().scalar(2).sub(screenSize).scalar(1 / screenSize.y);
    uv.x *= -1;
    center.add(uv.scalar((zoom - newZoom) / (zoom * newZoom) / 2));
    zoom = newZoom;
}

/* handle param update */
function paramUpdate() {
    if (!animControl.checked) {
        numIterations = parseInt(iterControl.value);
    }
    iterControl.value = numIterations;
    iterDisplay.innerText = numIterations;
}

/* handle dragging */
function pan(event) {
    if (!click) return;
    const { movementX, movementY } = event;
    const screenPos = new Vector(movementX, movementY);
    let clipPos = screenPos.div(screenSize).scalar(2 / zoom);
    clipPos.y *= -1;
    center.sub(clipPos);
}

/* initialize shader program, controls */
function init() {
    const canvas = document.getElementById("screen");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        jake.webgl.notSupported();
    }

    // initialize WebGL2 program
    const shaders = [ "shaders/identity.vert", "shaders/mandelbrot.frag" ];
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

    /* controls */
    controlPane.oninput = paramUpdate;
    iterControl.value = numIterations;
    iterDisplay.innerText = numIterations;
    canvas.onwheel = scroll;
    canvas.onmousemove = pan;
    canvas.onmousedown = () => { click = true; }
    canvas.onmouseleave = canvas.onmouseup = () => { click = false; }

    screenSize = new Vector(gl.canvas.width, gl.canvas.height);

    return program;
}

let then = 0;
function draw(now) {
    now *= 0.1;
    const dt = now - then;
    then = now;

    const gl = program.gl;

    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    screenSize.x = gl.canvas.width;
    screenSize.y = gl.canvas.height;

    gl.clearColor(0.83, 0.83, 0.83, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let text = zoom.toString();
    scaleDisplay.innerText = text.slice(0, text.indexOf(".")+4);

    if (animControl.checked) {
        numIterations += Math.floor(2.5 * animDirection * dt);
        iterControl.value = numIterations;
        paramUpdate();
        if (numIterations < 5 || numIterations > 995) {
            numIterations = Math.max(5, Math.min(995, numIterations));
            animDirection *= -1;
        }
    }

    program
        .use()
        .buffersAndAttributes()
        .uniforms({
            screen: screenSize.serialize(),
            center: center.serialize(),
            zoom: zoom,
            numIterations: numIterations,
            dt: dt
        })
        .draw(gl.TRIANGLE_STRIP)
        .glError(err => {
            throw new Error("WebGL2 Rendering Error: " + err);
        });

    requestAnimationFrame(draw);
}

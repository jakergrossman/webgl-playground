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
const zoomDisplay = document.getElementById("zoomDisplay");

/* starting values */
let zoom = 0.45;
let numIterations = 30;
let animDirection = 1;

/* limits */
let minZoom = 0.2;
let maxZoom = 200000;
let minIterations = 5;
let maxIterations = 995;

/* graphics parameters */
let screenSize = new Vector(0,0);
let click = false;
let center = new Vector(0, 0);

let program = init();

requestAnimationFrame(draw);

/* handle mousewheel actions */
function scroll(event) {
    event.preventDefault();
    const {x, y, deltaY} = event;
    const zoomFactor = Math.pow(2, Math.sign(deltaY) * -0.5);
    const newZoom =  jake.clamp(zoomFactor * zoom, minZoom, maxZoom);
    const screenPos = new Vector(x, y);

    let uv = screenPos
        .scalar(2)       // * 2
        .sub(screenSize) // - [width, height]
        .div(screenSize) // convert to clip space

    uv.x *= -1;
    center.add(uv.scalar((zoom - newZoom) / (zoom * newZoom)));
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
    iterControl.min = minIterations;
    iterControl.max = maxIterations;
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

    zoomDisplay.innerText = zoom.toFixed(3);

    if (animControl.checked) {
        numIterations += Math.floor(3.5 * dt) * animDirection;

        numIterations = jake.clamp(numIterations, minIterations, maxIterations);
        if (numIterations == minIterations) {
            animDirection = 1;
        } else if (numIterations == maxIterations) {
            animDirection = -1;
        }

        paramUpdate();
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

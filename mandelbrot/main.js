"use strict";

import * as jake from "../lib/jake.module.js";
const Vector = jake.Vector;

/* TODO: mobile, couldn't get pan or zoom to work */
if (jake.mobileCheck()) {
    jake.webgl.notSupported(false);
}

/* starting values */
let zoom = 0.45;
let numIterations = 30;
let animDirection = 1;

/* limits */
const minZoom = 0.2;
const maxZoom = 200000;
const minIterations = 5;
const maxIterations = 995;

/* graphics parameters */
let screenSize = new Vector(0,0);
let click = false;
let center = new Vector(0, 0);

let controls = null
let program = init();
const copyIndicator = document.getElementById("copy");

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
    controls.zoomDisplay.innerText = zoom.toFixed(3);
}

/* handle param update */
function paramUpdate(readValue=true) {
    if (readValue) {
        numIterations = parseInt(controls.iterationsControl.value);
    }
    controls.iterationsControl.value = numIterations;
    controls.iterationsDisplay.innerText = numIterations;
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

/* save position and redirect */
function savePosition() {
    const URI = window.location.toString().slice(0, window.location.toString().indexOf("?"));

    const newURI = encodeURI(URI + "?x=" + center.x + "&y=" + center.y + "&zoom=" + zoom + "&numIterations=" + numIterations);
    navigator.clipboard.writeText(newURI);
    window.history.pushState("", "", newURI);

    copyIndicator.classList.remove("hidden");
    copyIndicator.style.opacity=1.0;
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

    program.arrays(arrays, 2);

    controls = new jake.webgl.ControlPanel([
        { type: "range", name: "iterations", min: minIterations, max: maxIterations, step: 1, value: numIterations },
        { type: "info", name: "zoom", text: zoom },
        { type: "checkbox", name: "animate" },
        { type: "button", name: "save" },
        { type: "divider" },
        { type: "label", name: "user-controls", id: "how", text: "drag to pan, mousewheel to zoom" }
    ]).instantiate();

    controls.form.oninput = paramUpdate;
    controls.form.classList.add("frosted");
    controls.saveButton.onclick = savePosition;
    canvas.onwheel = scroll;
    canvas.onmousemove = pan;
    canvas.onmousedown = () => { click = true; }
    canvas.onmouseleave = canvas.onmouseup = () => { click = false; }

    screenSize = new Vector(gl.canvas.width, gl.canvas.height);

    const queryVars = jake.getQueryVariables();
    if (queryVars.x && queryVars.y && parseFloat(queryVars.x) != NaN && parseFloat(queryVars.y) != NaN) {
        center = new Vector(parseFloat(queryVars.x), parseFloat(queryVars.y));
    }

    if (queryVars.zoom && parseFloat(queryVars.zoom) != NaN) {
        zoom = parseFloat(queryVars.zoom);
        controls.zoomDisplay.innerText = zoom.toFixed(3);
    }

    if (queryVars.numIterations && parseInt(queryVars.numIterations) != NaN) {
        numIterations = parseInt(queryVars.numIterations);
        paramUpdate(false);
    }

    return program;
}

let then = 0;
function draw(now) {
    now *= 0.1;
    const dt = now - then;
    then = now;

    if (controls.animateControl.checked) {
        numIterations += Math.floor(3.5 * dt) * animDirection;

        numIterations = jake.clamp(numIterations, minIterations, maxIterations);
        if (numIterations == minIterations) {
            animDirection = 1;
        } else if (numIterations == maxIterations) {
            animDirection = -1;
        }

        paramUpdate(false);
    }

    /* handle copy indicator fade */
    if (!copyIndicator.classList.contains("hidden")) {
        const currentOpacity = parseFloat(copyIndicator.style.opacity);
        const newOpacity = currentOpacity * Math.pow(0.97, dt);
        copyIndicator.style.opacity = newOpacity;

        if (newOpacity < 0.01) {
            copyIndicator.classList.add("hidden");
        }
    }

    program
        .use()
        .clear({ color: [0,0,0,1] })
        .sizeToScreen(screenSize) /* save TO screenSize, not set FROM screenSize */
        .buffersAndAttributes()
        .uniforms({
            screen: screenSize.serialize(),
            center: center.serialize(),
            zoom: zoom,
            numIterations: numIterations,
            dt: dt
        })
        .draw(program.gl.TRIANGLE_STRIP)
        .glError(err => {
            throw new Error("WebGL2 Rendering Error: " + err);
        });

    requestAnimationFrame(draw);
}

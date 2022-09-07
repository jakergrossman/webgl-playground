"use strict";

import * as jake from "../../lib/jake.module.js";
const Vector = jake.Vector;

const mobile = jake.mobileCheck();

const defaults = {
    zoom: mobile ? 0.2 : 0.45,
    numIterations: 69,
    complex: new Vector(-0.835, -.2321),
    center: new Vector(0, 0),
};

/* starting values */
let zoom = defaults.zoom;
let numIterations = defaults.numIterations;

/* limits */
const minZoom = 0.2;
const maxZoom = 200000;
const minIterations = 50;
const maxIterations = 250;

/* graphics parameters */
let click = false;
let center = defaults.center.copy();
let complex = defaults.complex.copy();

const copyIndicator = document.getElementById("copy");

let controls = null
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
        .sub(program.screenSize) // - [width, height]
        .div(program.screenSize) // convert to clip space

    uv.x *= -1;
    center.add(uv.scalar((zoom - newZoom) / (zoom * newZoom)));
    zoom = newZoom;
    controls.zoomDisplay.innerText = zoom.toFixed(3);
}

/* handle dragging */
function pan(event, force) {
    if (!force && !click) return;
    const { movementX, movementY } = event;
    const screenPos = new Vector(movementX, movementY);
    let clipPos = screenPos.div(program.screenSize).scalar(2 / zoom);
    clipPos.y *= -1;
    center.sub(clipPos);
}

/* save position and redirect */
function save() {
    const URI = encodeURI(jake.createQueryURI({
        x: center.x,
        y: center.y,
        numIterations: numIterations,
        creal: complex.x,
        cimag: complex.y,
        zoom: zoom,
    }));

    if (!mobile) {
        navigator.clipboard.writeText(URI);
    }
    window.history.pushState("", "", URI);

    copyIndicator.classList.remove("hidden");
    copyIndicator.style.opacity=1.0;
}

function loadFromURI(settings) {
    const { x, y, creal, cimag } = settings;
    const xVal = parseFloat(x), yVal = parseFloat(y);
    if (!(Number.isNaN(xVal) || Number.isNaN(yVal))) {
        center = new Vector(xVal, yVal);
    } else {
        center = defaults.center.copy();
    }

    const zoomVal = parseFloat(settings.zoom);
    zoom = !Number.isNaN(zoomVal) ? zoomVal : defaults.zoom;

    const iterVal = parseFloat(settings.numIterations);
    numIterations = !Number.isNaN(iterVal) ? iterVal : defaults.numIterations;

    const realVal = parseFloat(creal);
    complex.x = !Number.isNaN(realVal) ? realVal : defaults.complex.x;

    const imagVal = parseFloat(cimag);
    complex.y = !Number.isNaN(imagVal) ? imagVal : defaults.complex.y;

    controls.values({
        zoom: zoom.toFixed(3),
        iterations: numIterations,
        creal: complex.x.toFixed(4),
        cimag: complex.y.toFixed(4),
    });
}

/* initialize shader program, controls */
function init() {
    const canvas = document.getElementById("screen");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        jake.webgl.notSupported();
    }

    // initialize WebGL2 program
    const shaders = [ "shaders/identity.vert", "shaders/julia.frag" ];
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
        { type: "divider" },
        { type: "range", name: "creal", min: -4, max: 4, step: 0.0001, value: complex.x },
        { type: "range", name: "cimag", min: -4, max: 4, step: 0.0001, value: complex.y },
        { type: "divider" },
        { type: "button", name: "save" },
        { type: "button", name: "reset" },
        { type: "divider" },
        { type: "label", name: "user-controls", id: "how", text: "drag to pan, " + (mobile ? "pinch" : "mousewheel") + " to zoom" }
    ]).instantiate();

    controls.iterationsControl.addEventListener("input", () => numIterations = controls.iterationsControl.value);
    controls.crealControl.addEventListener("input", () => complex.x = controls.crealControl.value);
    controls.cimagControl.addEventListener("input", () => complex.y = controls.cimagControl.value);
    controls.iterationsDisplay.addEventListener("input", () => numIterations = controls.iterationsControl.value);
    controls.crealDisplay.addEventListener("input", () => complex.x = controls.crealControl.value);
    controls.cimagDisplay.addEventListener("input", () => complex.y = controls.cimagControl.value);
    controls.form.classList.add("frosted");
    controls.saveButton.onclick = save;
    controls.resetButton.onclick = () => {
        const qPos = window.location.toString().indexOf("?");
        if (qPos !== -1) {
            window.history.pushState("", "", window.location.toString().slice(0, qPos ));
        }
        loadFromURI(jake.getQueryVariables());
    }

    if (mobile) {
        canvas.onpointerup = pointerup;
        canvas.onpointerdown = pointerdown;
        canvas.onpointermove = pointermove;
    } else {
        canvas.onwheel = scroll;
        canvas.onmousedown = () => { click = true; }
        canvas.onmouseleave = canvas.onmouseup = () => { click = false; }
        canvas.onmousemove = pan;
    }

    if (mobile) {
        copyIndicator.innerText = "Copied to URL";
    }

    loadFromURI(jake.getQueryVariables());

    document.getElementById("warning-button").onclick = () => {
        document.getElementById("warning").remove();
    };

    return program;
}

// handle mobile drag and pinch-zoom
const touchCache = new Array();
let prevDiff = -1;
let mobileDebounce = 0;
function pointerdown(event) {
    touchCache.push(event);
}

function pointerup(event) {
    const touchCachePos = touchCache.findIndex(n=>n.pointerId === event.pointerId);
    touchCache.splice(touchCachePos, 1);
    if (touchCache.length < 2) {
        prevDiff = -1;
        mobileDebounce = 0;
    }
}

function pointermove(event) {
    if (touchCache.length === 1 && event.pointerId === touchCache[0].pointerId) {
        // drag
        const dx = event.x - touchCache[0].x;
        const dy = event.y - touchCache[0].y;

        pan({movementX: dx, movementY: dy}, mobile);
        touchCache[0] = event; // update cache
    } else if (touchCache.length === 2) {
        const touchCachePos = touchCache.findIndex(n=>n.pointerId === event.pointerId);

        touchCache[touchCachePos] = event;

        // zoom
        const point1 = new Vector(touchCache[0].x, touchCache[0].y);
        const point2 = new Vector(touchCache[1].x, touchCache[1].y);

        // finger distance
        const curDiff = Math.abs(point1.x - point2.x);
        const diffDiff = prevDiff - curDiff;

        // midpoint
        const midPoint = point1.add(point2).scalar(0.5);
        if (mobileDebounce === 0 && prevDiff > -1) {
            // bodge scroll event
            scroll({x: midPoint.x, y: midPoint.y, deltaY: diffDiff, preventDefault:()=>{}});
        }
        prevDiff = curDiff;
        mobileDebounce = (++mobileDebounce) % 3;
    }
}

let then = 0;
function draw(now) {
    now *= 0.1;
    const dt = now - then;
    then = now;

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
        .sizeToScreen()
        .buffersAndAttributes()
        .uniforms({
            screen: program.screenSize.serialize(),
            center: center.serialize(),
            c: complex.serialize(),
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

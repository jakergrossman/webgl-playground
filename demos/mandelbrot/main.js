"use strict";

import * as jake from "../../lib/jake.module.js";
const Vector = jake.Vector;

const mobile = jake.mobileCheck();

const defaults = {
    zoom: mobile ? 0.2 : 0.45,
    numIterations: 30,
    order: 2,
    center: new Vector(0, 0),
};

/* starting values */
let { zoom, numIterations, order, center } = defaults;
let animDirection = 1;
let click = false;

/* control limits */
const minZoom = 0.2;
const maxZoom = 200000;
const minIterations = 5;
const maxIterations = 995;
const minOrder = 2;
const maxOrder = 5;

/* global state */
const copyIndicator = document.getElementById("copy");
let controls = null
const gl = document.getElementById("screen").getContext("webgl2");
if (!gl) jake.webgl.notSupported();
let programs = [2,3,4,5].map(n=> {
    const p = new jake.webgl.Program(gl, "shaders/identity.vert", "shaders/mandelbrot" + n + ".frag");
    const arrays = {
        position: [
            1.0,  1.0,
           -1.0,  1.0,
            1.0, -1.0,
           -1.0, -1.0,
        ],
    };

    p.arrays(arrays, 2);
    return p;
});
init();

/* handle mousewheel actions */
function scroll(event) {
    event.preventDefault();
    const {x, y, deltaY} = event;
    const zoomFactor = Math.pow(2, Math.sign(deltaY) * -0.5);
    const newZoom =  jake.clamp(zoomFactor * zoom, minZoom, maxZoom);
    const screenPos = new Vector(x, y);

    let uv = screenPos
        .scalar(2)       // * 2
        .sub(programs[order-2].screenSize) // - [width, height]
        .div(programs[order-2].screenSize) // convert to clip space

    uv.x *= -1;
    center.add(uv.scalar((zoom - newZoom) / (zoom * newZoom)));
    zoom = newZoom;
    controls.zoomDisplay.innerText = zoom.toFixed(3);
    controls.centerDisplay.innerText = formatCenter();
}

/* handle param update */
function paramUpdate(readValue=true) {
    if (readValue) {
        numIterations = parseInt(controls.iterationsControl.value);
        order = parseFloat(controls.orderControl.value);
    }
    controls.iterationsControl.value = numIterations;
    controls.iterationsDisplay.value = numIterations;
}

/* handle dragging */
function pan(event, force) {
    if (!force && !click) return;
    const { movementX, movementY } = event;
    const screenPos = new Vector(movementX, movementY);
    let clipPos = screenPos.div(programs[order-2].screenSize).scalar(2 / zoom);
    clipPos.y *= -1;
    center.sub(clipPos);
    controls.centerDisplay.innerText = formatCenter();
}

/* save position and redirect */
function save() {
    const URI = encodeURI(jake.createQueryURI({
        x: center.x,
        y: center.y,
        order: order,
        zoom: zoom,
        numIterations: numIterations,
    }));

    if (!mobile) {
        navigator.clipboard.writeText(URI);
    }
    window.history.pushState("", "", URI);

    copyIndicator.classList.remove("hidden");
    copyIndicator.style.opacity=1.0;
}

function loadFromURI(settings) {
    const { x, y } = settings;
    const xVal = parseFloat(x), yVal = parseFloat(y);
    if (!(Number.isNaN(xVal) || Number.isNaN(yVal))) {
        center = new Vector(xVal, yVal);
    } else {
        center = defaults.center.copy();
    }

    const orderVal = parseInt(settings.order);
    order = !Number.isNaN(orderVal) ? orderVal : defaults.order;

    const zoomVal = parseFloat(settings.zoom);
    zoom = !Number.isNaN(zoomVal) ? zoomVal : defaults.zoom;

    const iterVal = parseFloat(settings.numIterations);
    numIterations = !Number.isNaN(iterVal) ? iterVal : defaults.numIterations;

    controls.values = {
        order: order,
        zoom: zoom,
        center: formatCenter(),
        iterations: numIterations,
    };
}

/* initialize shader program, controls */
function init() {
    const canvas = document.getElementById("screen");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        jake.webgl.notSupported();
    }

    controls = new jake.webgl.ControlPanel([
        { type: "range", name: "iterations", min: minIterations, max: maxIterations, step: 1, value: numIterations },
        { type: "range", name: "order", min: minOrder, max: maxOrder, step: 1, value: minOrder },
        { type: "info", name: "zoom", text: zoom },
        { type: "info", name: "center", text: formatCenter() },
        { type: "checkbox", name: "animate" },
        { type: "divider" },
        { type: "button", name: "save" },
        { type: "button", name: "reset" },
        { type: "divider" },
        { type: "label", name: "user-controls", id: "how", text: "drag to pan, " + (mobile ? "pinch" : "mousewheel") + " to zoom" }
    ]).instantiate();

    controls.form.oninput = paramUpdate;
    controls.form.classList.add("frosted");
    controls.saveButton.onclick = save;
    controls.resetButton.onclick = () => {
        const qPos = window.location.toString().indexOf("?");
        if (qPos !== -1) {
            window.history.pushState("", "", window.location.toString().slice(0, qPos ));
        }
        loadFromURI({});
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

function formatCenter(digits=8) {
    return "(" + center.serialize().map(n=>n.toFixed(digits)) + ")";
}

let then = 0;
function draw(now) {
    const dt = now - then;
    then = now;

    if (controls.animateControl.checked) {
        numIterations += Math.floor(.35 * dt) * animDirection;

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
        const newOpacity = currentOpacity * Math.pow(0.97, dt/10);
        copyIndicator.style.opacity = newOpacity;

        if (newOpacity < 0.01) {
            copyIndicator.classList.add("hidden");
        }
    }

    programs[order-2]
        .use()
        .clear({ color: [0.0625,0.0625,0.0625,1] })
        .sizeToScreen()
        .buffersAndAttributes()
        .uniforms({
            screen: programs[order-2].screenSize.serialize(),
            center: center.serialize(),
            order: order,
            zoom: zoom,
            numIterations: numIterations,
        })
        .draw(programs[order-2].gl.TRIANGLE_STRIP)
        .glError(err => {
            throw new Error("WebGL2 Rendering Error: " + err);
        });

    requestAnimationFrame(draw);
}

requestAnimationFrame(draw);

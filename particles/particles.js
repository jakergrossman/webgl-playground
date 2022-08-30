function initialParticleData(numParticles, minAge, maxAge) {
    let data = [];
    for (let i = 0; i < numParticles; i++) {
        // position
        data.push(0.0);
        data.push(0.0);

        let lifetime = lerp(minAge, maxAge, Math.random());

        // set age to max+1 for first-cycle initialization
        data.push(lifetime+1);
        data.push(lifetime);

        // velocity
        data.push(0.0);
        data.push(0.0);
    }

    return data;
}

function setupParticleBufferVAO(gl, buffers, vao) {
    gl.bindVertexArray(vao);
    for (let i = 0; i < buffers.length; i++) {
        let buffer = buffers[i];
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.bufferObject);

        let offset = 0;
        for (attribName in buffer.attribs) {
            if (buffer.attribs.hasOwnProperty(attribName)) {
                /* set up vertex attribute pointers for attribs in this buffer */
                let attribDesc = buffer.attribs[attribName];
                gl.enableVertexAttribArray(attribDesc.location);
                gl.vertexAttribPointer(attribDesc.location, attribDesc.comp, attribDesc.type,
                                       false, buffer.stride, offset);

                /* only dealing with 4 byte size in this demo, unhardcode when necessary */
                let typeSize = 4;

                /* cheating kindof. would not work if buffer had irrelevant data between the attributes
                 * we are interested in */
                offset += attribDesc.comp * typeSize;

                if (attribDesc.hasOwnProperty("divisor")) { /* we'll need this later */
                    gl.vertexAttribDivisor(attribDesc.location, attribDesc.divisor);
                }
            }
        }
    }
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

/* Main initialization function
 *
 * @return - An object representing a particle system with given parameters
 *
 * @param gl - A valid WebGL 2 context
 * @param particleBirthRate - # of particles born per millisecond
 * @param numParticles - # total number of particles in the system
 * @param minAge - minimum time before a particle can be considered for rebirth
 * @param maxAge - maximum time before a particle is forced to rebirth
 * @param gravity - a 2-vector representing constant force on all particles
 */
async function createParticleSystem(
    gl,
    numParticles,
    particleBirthRate,
    minAge,
    maxAge,
    theta,
    speed,
    gravity)
{
    let updateProgram = await createGLProgram(
        gl,
        [
            { uri: "shaders/update.vert", type: gl.VERTEX_SHADER },
            { uri: "shaders/update.frag", type: gl.FRAGMENT_SHADER },
        ],
        [
            "v_Position",
            "v_Age",
            "v_Life",
            "v_Velocity",
        ]);

    let renderProgram = await createGLProgram(
        gl,
        [
            { uri: "shaders/render.vert", type: gl.VERTEX_SHADER },
            { uri: "shaders/render.frag", type: gl.FRAGMENT_SHADER },
        ],
        null);

    /* capture attribute locations from program objects */
    const updateAttribLocations =
        generateAttributeLocationsObject(gl, updateProgram,
            [
                { name: "i_Position", comp: 2, type: gl.FLOAT },
                { name: "i_Age", comp: 1, type: gl.FLOAT },
                { name: "i_Life", comp: 1, type: gl.FLOAT },
                { name: "i_Velocity", comp: 2, type: gl.FLOAT },
            ]);

    const renderAttribLocations =
        generateAttributeLocationsObject(gl, renderProgram,
            [
                { name: "i_Position", comp: 2, type: gl.FLOAT },
                { name: "i_Age", comp: 1, type: gl.FLOAT },
                { name: "i_Life", comp: 1, type: gl.FLOAT },
            ]);

    /* particle buffers */
    let buffers = [ gl.createBuffer(), gl.createBuffer() ];

    /* 4 VAO's... */
    let vaos = [
        gl.createVertexArray(), /* for updating buffer 1 */
        gl.createVertexArray(), /* for updating buffer 2 */
        gl.createVertexArray(), /* for rendering buffer 1 */
        gl.createVertexArray(), /* for rendering buffer 2 */
    ];

    let vaoDesc = [
        {
            vao: vaos[0],
            buffers: [{
                bufferObject: buffers[0],
                stride: 4*6,
                attribs: updateAttribLocations
            }]
        },
        {
            vao: vaos[1],
            buffers: [{
                bufferObject: buffers[1],
                stride: 4*6,
                attribs: updateAttribLocations
            }]
        },
        {
            vao: vaos[2],
            buffers: [{
                bufferObject: buffers[0],
                stride: 4*6,
                attribs: renderAttribLocations
            }]
        },
        {
            vao: vaos[3],
            buffers: [{
                bufferObject: buffers[1],
                stride: 4*6,
                attribs: renderAttribLocations
            }]
        },
    ];

    let initialData = new Float32Array(initialParticleData(numParticles, minAge, maxAge));

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[0]);
    gl.bufferData(gl.ARRAY_BUFFER, initialData, gl.STREAM_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[1]);
    gl.bufferData(gl.ARRAY_BUFFER, initialData, gl.STREAM_DRAW);

    for (var i = 0; i < vaoDesc.length; i++) {
        setupParticleBufferVAO(gl, vaoDesc[i].buffers, vaoDesc[i].vao);
    }

    /* black */
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    /* create a texture for random values */
    let rgNoiseTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rgNoiseTexture);
    gl.texImage2D(gl.TEXTURE_2D,
         0,
         gl.RG8,
         512, 512,
         0,
         gl.RG,
         gl.UNSIGNED_BYTE,
         randomData([512, 512, 2], Uint8Array, 0, 255));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    /* setup blending */
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return {
        particleSysBuffers: buffers,
        particleSysVaos: vaos,
        read: 0,
        write: 1,
        particleUpdateProgram: updateProgram,
        particleRenderProgram: renderProgram,
        oldTimestamp: 0.0,
        rgNoise: rgNoiseTexture,
        totalTime: 0.0,
        numParticles: numParticles,
        bornParticles: 0,
        birthRate: particleBirthRate,
        gravity: gravity,
        origin: [0.0, 0.0],
        theta,
        speed: speed,
        click: false,
    };
}

function updateParticles(gl, timeDelta, state) {
    let numParticles = Math.min(state.bornParticles, state.numParticles);

    if (state.bornParticles < state.numParticles && state.click) {
        state.bornParticles = Math.min(state.numParticles,
                                       Math.floor(state.bornParticles + state.birthRate * timeDelta));
    }

    state.oldTimestamp += timeDelta;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(state.particleUpdateProgram);

    /* Most of the following is trivial setting of uniforms */
    gl.uniform1f(
        gl.getUniformLocation(state.particleUpdateProgram, "u_TimeDelta"),
        timeDelta / 1000.0);
    gl.uniform1f(
        gl.getUniformLocation(state.particleUpdateProgram, "u_TotalTime"),
        state.totalTime);
    gl.uniform2f(
        gl.getUniformLocation(state.particleUpdateProgram, "u_Gravity"),
        0, -state.gravity);
    gl.uniform2f(
        gl.getUniformLocation(state.particleUpdateProgram, "u_Origin"),
        state.origin[0],
        state.origin[1]);
    gl.uniform1f(
        gl.getUniformLocation(state.particleUpdateProgram, "u_MinTheta"),
        state.theta - 0.5);
    gl.uniform1f(
        gl.getUniformLocation(state.particleUpdateProgram, "u_MaxTheta"),
        state.theta + 0.5);
    gl.uniform1f(
        gl.getUniformLocation(state.particleUpdateProgram, "u_MinSpeed"),
        state.speed - .05*state.speed);
    gl.uniform1f(
        gl.getUniformLocation(state.particleUpdateProgram, "u_MaxSpeed"),
        state.speed + .05*state.speed);
    gl.uniform1i(
        gl.getUniformLocation(state.particleUpdateProgram, "u_Active"),
        state.click);

    state.totalTime += timeDelta;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state.rgNoise);
    gl.uniform1i(
        gl.getUniformLocation(state.particleUpdateProgram, "u_RgNoise"),
        0);

    /* bind the read buffer, state as of NOW */
    gl.bindVertexArray(state.particleSysVaos[state.read]);

    /* bind the write buffer as transform feedback */
    gl.bindBufferBase(
        gl.TRANSFORM_FEEDBACK_BUFFER, 0, state.particleSysBuffers[state.write]);

    gl.enable(gl.RASTERIZER_DISCARD);

    /* begin transform feedback */
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, numParticles);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);

    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

    gl.bindVertexArray(state.particleSysVaos[state.read+2]);
    gl.useProgram(state.particleRenderProgram);
    gl.drawArrays(gl.POINTS, 0, state.numParticles);

    let tmp = state.read;
    state.read = state.write;
    state.write = tmp;
}

let lastAnimationFrame = null;
async function start() {
    let canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    let context = canvas.getContext("webgl2");
    if (context != null) {
        document.body.appendChild(canvas);
        state =
            await createParticleSystem(
                context,
                10000,
                0.5,
                1.01, 1.15,
                Math.PI/2.0,
                1.00,
                2.8);

        canvas.onmousemove = function (e) {
            let x = 2.0 * (e.pageX - this.offsetLeft)/this.width - 1.0;
            let y = -(2.0 * (e.pageY - this.offsetTop)/this.height - 1.0);
            if (state !== null) {
                state.origin = [x, y];
            }
        };

        canvas.onmousedown = () => { state.click = true; }
        canvas.onmouseup = () => { state.click = false; }
        canvas.onwheel = (e) => { 
            if (e.deltaY > 0) {
                state.theta += Math.PI/12;
            } else {
                state.theta -= Math.PI/12;
            }
            return false;
        }

        canvas.onmouseleave = () => { state.origin = [0, 0]; };
        window.requestAnimationFrame(async newTimestamp => {
            await render(context, updateParticles, [state], 0.0, newTimestamp);
        });
    } else {
        document.write("WebGL2 is not supported by your browser");
    }
}

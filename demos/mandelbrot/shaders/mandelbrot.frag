#version 300 es
precision highp float;

uniform int   numIterations;
uniform float zoom;
uniform vec2  center;
uniform vec2  screen;
uniform bool  smoothcolor;

out vec4 color;

#define PI 3.141592653589793

vec2 z;
int mandelbrot(vec2 pos) {
    float bound = (smoothcolor ? 64. : 2.);
    for (int i = 0; i < numIterations; i++) {
        z = vec2(
            z.x*z.x - z.y*z.y + pos.x,
            2. * z.x*z.y + pos.y);

        if (dot(z,z) > bound*bound) {
            return i;
        }
    }
    
    return -1;
}

/* From http://iquilezles.org/www/articles/palettes/palettes.htm */
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b*cos(2.*PI*(c*t+d));
}

void main() {
    /* screen space in pixels, upper left is [0,0] */
    vec2 co = gl_FragCoord.xy;
 
    /* normalized screen space from [0, 1.0), upper left still [0,0] */
    vec2 norm = co / screen;

    /* clip space from [-1, 1), center of screen is [0, 0] */
    vec2 clip = 2. * norm - 1.;

    /* zoom is inverse of scale */
    clip /= zoom;

    /* aspect ration of screen */
    float aspect = screen.x / screen.y;
 
    /* transform clip space so 1 pixel in x-direction and 1 pixel
     * in y-direction occupy the same screen space */
    vec2 transform = (clip + center) * vec2(aspect, 1.0);

    int iterations = mandelbrot(transform);
    if (iterations == -1) {
        color = vec4(0., 0., 0., 1.);
    } else {
        float t = float(iterations);
        if (smoothcolor) {
            float s = t - log2(log2(dot(z, z))) + 4.0;
            float a = smoothstep(-0.1, 0.0, sin(0.5 * 2.0 * PI));
            t = mix(t, s, a);
        }
        color = vec4(
            palette(t / float(numIterations),
                    vec3(0.5,0.5,0.5),
                    vec3(0.5,0.5,0.5),
                    vec3(1.0,0.7,0.4),
                    vec3(0.0,0.15,0.20)),
                    1.);
    }
}

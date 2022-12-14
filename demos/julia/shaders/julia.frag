#version 300 es
precision highp float;

uniform int   numIterations;
uniform float zoom;
uniform vec2  center;
uniform vec2  screen;
uniform vec2  c;

out vec4 color;

#define PI 3.141592653589793

int bound(vec2 pos) {
    vec2 z = pos;
    for (int i = 0; i < numIterations; i++) {
        z = vec2(
            z.x*z.x - z.y*z.y + c.x,
            2. * z.x*z.y + c.y);

        if (length(z) > 2.) {
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

    int iterations = bound(transform);
    if (iterations == -1) {
        color = vec4(0., 0., 0., 1.);
    } else {
        float t = float(iterations) / float(numIterations);
        color = vec4(
            palette(1. / 0.077426 * exp(2.558427 * t),
                    vec3(0.5,0.5,0.5),
                    vec3(0.5,0.5,0.5),
                    vec3(1.0,0.7,0.4),
                    vec3(0.0,0.15,0.20)),
                    1.);
    }
}

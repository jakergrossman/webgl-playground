#version 300 es
precision highp float;

uniform int   numIterations;
uniform float zoom;
uniform vec2  center;
uniform vec2  screen;

out vec4 color;

int bound(vec2 pos) {
    vec2 z = vec2(0., 0.);
    for (int i = 0; i < numIterations; i++) {
        z = vec2(
            z.x*z.x - z.y*z.y + pos.x,
            2. * z.x*z.y + pos.y);

        if (length(z) > 2.) {
            return i;
        }
    }
    
    return -1;
}

vec3 hsv2rgb(float h, float s, float v) {
    float C = s * v;
    float X = C * (1. - abs(mod(h / 60., 2.) - 1.));
    float M = v - C;

    float r, g, b;

    if (h >= 0. && h < 60.) {
        r = C;
        g = X;
        b = 0.;
    } else if (h >= 60. && h < 120.) {
        r = X;
        g = C;
        b = 0.;
    } else if (h >= 120. && h < 180.) {
        r = 0.;
        g = C;
        b = X;
    } else if (h >= 180. && h < 240.) {
        r = 0.;
        g = X;
        b = C;
    } else if (h >= 240. && h < 300.) {
        r = X;
        g = 0.;
        b = C;
    } else {
        r = C;
        g = 0.;
        b = X;
    }

    float R = (r + M);
    float G = (g + M);
    float B = (b + M);
    return vec3(R, G, B);
}

/* From http://iquilezles.org/www/articles/palettes/palettes.htm */
vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{  return a + b*cos( 6.28318*(c*t+d) ); }

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
        /* color = vec4(hsv2rgb(t*360., 1., 1.), 1.); */
        color = vec4(
            palette(t,
                    vec3(0.5,0.5,0.5),
                    vec3(0.5,0.5,0.5),
                    vec3(1.0,0.7,0.4),
                    vec3(0.0,0.15,0.20)),
                    1. - t);
    }
}

#version 300 es
precision highp float;

uniform int   numIterations;
uniform float zoom;
uniform vec2  center;
uniform vec2  screen;
uniform float order;

out vec4 color;

#define PI 3.141592653589793
vec2 pow3(vec2 c) {
    return vec2(
            c.x*c.x*c.x - 3.0*c.x*c.y*c.y,
            3.0*c.x*c.x*c.y - c.y*c.y*c.y);
}
int mandelbrot(vec2 pos) {
    // skip some computation inside first period component
    // section: internal bound
    // https://iquilezles.org/articles/mset1bulb/
    float l = dot(pos, pos);
    float a = (1.0 / pow(order, 1.0 / (order - 1.0)));
    float b = (1.0 / pow(order, order / (order - 1.0)));
    float r = a - b;
    if (dot(pos, pos) < r*r) discard;

    // section: external bound
    // https://iquilezles.org/articles/mset1bulb/
    float Q = pow(2.0, 1.0 / (order-1.0));

    vec2 z;
    for (int i = 0; i < numIterations; i++) {
        z = pow3(z) + pos;
        if (dot(z,z) > Q*Q) {
            return i;
        }
    }
    
    discard;
}

/* From http://iquilezles.org/www/articles/palettes/palettes.htm */
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b*cos(2.0*PI*(c*t+d));
}

void main() {
    /* screen space in pixels, upper left is [0,0] */
    vec2 co = gl_FragCoord.xy;
 
    /* normalized screen space from [0, 1.0), upper left still [0,0] */
    vec2 norm = co / screen;

    /* clip space from [-1, 1), center of screen is [0, 0] */
    vec2 clip = 2.0 * norm - 1.0;

    /* zoom is inverse of scale */
    clip /= zoom;

    /* aspect ration of screen */
    float aspect = screen.x / screen.y;
 
    /* transform clip space so 1 pixel in x-direction and 1 pixel
     * in y-direction occupy the same screen space */
    vec2 transform = (clip + center) * vec2(aspect, 1.0);

    int iterations = mandelbrot(transform);
    float t = float(iterations) / float(numIterations);
    color = vec4(
        palette(t,
                vec3(0.5,0.5,0.5),
                vec3(0.5,0.5,0.5),
                vec3(1.0,0.7,0.4),
                vec3(0.0,0.15,0.20)),
                1.0);
}

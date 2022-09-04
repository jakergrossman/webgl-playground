#version 300 es
precision mediump float;

uniform float scale;
uniform vec2  center;
uniform vec2  screen;

out vec4 color;

void main() {
    /* screen space in pixels, upper left is [0,0] */
    vec2 co = gl_FragCoord.xy;
 
    /* normalized screen space from [0, 1.0), upper left still [0,0] */
    vec2 norm = co / screen;

    /* clip space from [-1, 1), center of screen is [0, 0] */
    vec2 clip = 2. * norm - 1.;

    if (abs(clip.x) < 0.005 || abs(clip.y) < 0.005) {
        color = vec4(1.,0., 0., 1.0);
        return;
    }

    /* aspect ration of screen */
    float aspect = screen.x / screen.y;


    /* transform clip space so 1 pixel in x-direction and 1 pixel
     * in y-direction occupy the same screen space */
    vec2 transform = (clip + center) * vec2(aspect, 1.0);


    transform *= scale;

    float checksize = 1.;
    float unitx = floor(transform.x / checksize);
    float unity = floor(transform.y / checksize);

    if (mod(unitx, 2.) == mod(unity, 2.)) {
        color = vec4(0., 0., 0., 1.);
    } else {
        color = vec4(1., 1., 1., 1.);
    }
}

#version 300 es

uniform mat4 u_matrix;
uniform vec4 u_offsets;
uniform vec4 u_centers;
uniform vec4 u_mult;

in vec2 i_position;
in vec4 i_color;

out vec4 v_color;

#define PI 3.14159

void main() {
    vec2 offset = mix(u_offsets.xz, u_offsets.yw, i_position.y);
    float a = u_mult.x * i_position.x * PI * 2.0 + offset.x;
    float c = cos(a * u_mult.y);

    vec2 xy
        = vec2(cos(a), sin(a)) * c * offset.y + mix(u_centers.xy, u_centers.zw, i_position.y);

    gl_Position = u_matrix * vec4(xy, 0.0, 1.0);
    v_color = i_color;
}

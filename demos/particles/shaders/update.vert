#version 300 es
precision mediump float;

uniform float u_TimeDelta;
uniform sampler2D u_RgNoise;
uniform vec2 u_Gravity;
uniform vec2 u_Origin;
uniform float u_MinTheta;
uniform float u_MaxTheta;
uniform float u_MinSpeed;
uniform float u_MaxSpeed;
uniform bool u_Active;

in vec2 i_Position;
in float i_Age;
in float i_Life;
in vec2 i_Velocity;

out vec2 v_Position;
out float v_Age;
out float v_Life;
out vec2 v_Velocity;

void main() {
  if (i_Age >= i_Life) {
    ivec2 noise_coord = ivec2(gl_VertexID % 512, gl_VertexID / 512);
    vec2 rand = texelFetch(u_RgNoise, noise_coord, 0).rg;
    float theta = u_MinTheta + rand.r*(u_MaxTheta - u_MinTheta);
    float x = cos(theta);
    float y = sin(theta);
    v_Position = u_Origin;
    v_Age = 0.0;
    v_Life = i_Life;
    v_Velocity =
      vec2(x, y) * (u_MinSpeed + rand.g * (u_MaxSpeed - u_MinSpeed));
  } else {
    v_Position = i_Position + i_Velocity * u_TimeDelta;
    v_Age = i_Age + (u_Active ? u_TimeDelta : 0.0);
    v_Life = i_Life;
    v_Velocity = i_Velocity + u_Gravity * u_TimeDelta;
  }
}

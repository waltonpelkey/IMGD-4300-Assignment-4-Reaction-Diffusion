@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(2) var<storage> A: array<f32>;
@group(0) @binding(4) var<storage> B: array<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let x = u32(pos.x);
  let y = u32(pos.y);
  let width = u32(res.x);
  let idx = y * width + x;
  let a = A[idx];
  let b = B[idx];
  let greyscale = clamp(a - b, 0.0, 1.0);
  let pink = vec4f(0.973, 0.514, 0.475, 1.0);
  let color = vec4f(vec3f(1.0) + (1.0 - greyscale) * (pink.rgb - vec3f(1.0)), 1.0);
  return color;
}

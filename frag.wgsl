@group(0) @binding(0) var<uniform> res:   vec2f;
@group(0) @binding(2) var<storage> A: array<f32>;
@group(0) @binding(4) var<storage> B: array<f32>;

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let idx : u32 = u32( pos.y * res.x + pos.x );
  let a = A[idx];
  let b = B[idx];
  let greyscale = a - b;
  return vec4f( greyscale, greyscale, greyscale, 1.);
}

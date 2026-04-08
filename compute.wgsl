@group(0) @binding(0) var<uniform> res: vec2f;
@group(0) @binding(1) var<storage> Ain: array<f32>;
@group(0) @binding(2) var<storage, read_write> Aout: array<f32>;
@group(0) @binding(3) var<storage> Bin: array<f32>;
@group(0) @binding(4) var<storage, read_write> Bout: array<f32>;
@group(0) @binding(5) var<uniform> DiffusionRateA: f32;
@group(0) @binding(6) var<uniform> DiffusionRateB: f32;
@group(0) @binding(7) var<uniform> feed: f32;
@group(0) @binding(8) var<uniform> kill: f32;
@group(0) @binding(9) var<uniform> feed_given_low: f32;
@group(0) @binding(10) var<uniform> feed_given_high: f32;
@group(0) @binding(11) var<uniform> kill_given_low: f32;
@group(0) @binding(12) var<uniform> kill_given_high: f32;

fn index( x:i32, y:i32 ) -> u32 {
  let _res = vec2i(res);
  return u32( (y % _res.y) * _res.x + ( x % _res.x ) );
}


@compute
@workgroup_size(8,8,1)
fn cs( @builtin(global_invocation_id) _cell:vec3u ) {
  let cell = vec3i(_cell);
  let i = index(cell.x, cell.y);

  // Get normalized coordinates (0 to 1)
  let normalized_x =  f32(cell.x) / (res.x -1.0);
  let normalized_y =  f32(cell.y) / (res.y -1.0);

  // Previous state
  let A = Ain[i];
  let B = Bin[i];

  // Diffusion rates
  let DiffusionRateA_given = DiffusionRateA;
  let DiffusionRateB_given = DiffusionRateB;

  // Laplacian calculations
  let LaplacianAdjacentWeight = 0.2;
  let LaplacianDiagonalWeight = 0.05;
  let LaplacianA =      (LaplacianDiagonalWeight * Ain[ index(cell.x + 1, cell.y + 1) ]) +  // diagonal
                        (LaplacianAdjacentWeight * Ain[ index(cell.x + 1, cell.y)     ]) +  // adjacent
                        (LaplacianDiagonalWeight * Ain[ index(cell.x + 1, cell.y - 1) ]) +  // diagonal
                        (LaplacianAdjacentWeight * Ain[ index(cell.x, cell.y - 1)     ]) +  // adjacent
                        (LaplacianDiagonalWeight * Ain[ index(cell.x - 1, cell.y - 1) ]) +  // diagonal
                        (LaplacianAdjacentWeight * Ain[ index(cell.x - 1, cell.y)     ]) +  // adjacent
                        (LaplacianDiagonalWeight * Ain[ index(cell.x - 1, cell.y + 1) ]) +  // diagonal
                        (LaplacianAdjacentWeight * Ain[ index(cell.x, cell.y + 1)     ]) +  // adjacent
                        (-1.0 * Ain[ index(cell.x, cell.y) ]);                              // center

  let LaplacianB =      (LaplacianDiagonalWeight * Bin[ index(cell.x + 1, cell.y + 1) ]) +  // diagonal
                        (LaplacianAdjacentWeight * Bin[ index(cell.x + 1, cell.y)     ]) +  // adjacent
                        (LaplacianDiagonalWeight * Bin[ index(cell.x + 1, cell.y - 1) ]) +  // diagonal
                        (LaplacianAdjacentWeight * Bin[ index(cell.x, cell.y - 1)     ]) +  // adjacent
                        (LaplacianDiagonalWeight * Bin[ index(cell.x - 1, cell.y - 1) ]) +  // diagonal
                        (LaplacianAdjacentWeight * Bin[ index(cell.x - 1, cell.y)     ]) +  // adjacent
                        (LaplacianDiagonalWeight * Bin[ index(cell.x - 1, cell.y + 1) ]) +  // diagonal
                        (LaplacianAdjacentWeight * Bin[ index(cell.x, cell.y + 1)     ]) +  // adjacent
                        (-1.0 * Bin[ index(cell.x, cell.y) ]);                              // center

  // Feed and kill rates
  let feed_given = feed;
  let kill_given = kill;

  // Style-map feed on y and kill on x, using low/high offsets from the base values.
  let feed_adjusted = mix(feed + feed_given_low, feed + feed_given_high, normalized_y);
  let kill_adjusted = mix(kill + kill_given_low, kill + kill_given_high, normalized_x);

  // Time step
  let dt = 1.0;

  // Reaction diffusion equations
  let newA = A + (DiffusionRateA_given * LaplacianA - (A * B * B) + feed_adjusted * (1.0 - A)) * dt;
  let newB = B + (DiffusionRateB_given * LaplacianB + (A * B * B) - (kill_adjusted + feed_adjusted) * B) * dt;
  
  // Write new state
  Aout[i] = newA;
  Bout[i] = newB;
}

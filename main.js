import { default as seagulls } from '/gulls.js'

// HTML Helpers
const feedRange = document.getElementById('feedRange');
const feedRangeValue = document.getElementById('feedRangeValue');

feedRangeValue.textContent = feedRange.value;

feedRange.addEventListener('input', () => {
  feedRangeValue.textContent = feedRange.value;
  feedUniform.value = Number(feedRange.value);
});

const killRange = document.getElementById('killRange');
const killRangeValue = document.getElementById('killRangeValue');

killRangeValue.textContent = killRange.value;

killRange.addEventListener('input', () => {
  killRangeValue.textContent = killRange.value;
  killUniform.value = Number(killRange.value);
});

const dARange = document.getElementById('diffusionRange');
const dARangeValue = document.getElementById('diffusionRangeValue');

dARangeValue.textContent = dARange.value;

dARange.addEventListener('input', () => {
  dARangeValue.textContent = dARange.value;
  diffusionAUniform.value = Number(dARange.value);
});

const dBRange = document.getElementById('diffusionBRange');
const dBRangeValue = document.getElementById('diffusionBRangeValue');
const feedRangeLow = document.getElementById('feedRangeLow');
const feedRangeLowValue = document.getElementById('feedRangeLowValue');
const feedRangeHigh = document.getElementById('feedRangeHigh');
const feedRangeHighValue = document.getElementById('feedRangeHighValue');
const killRangeLow = document.getElementById('killRangeLow');
const killRangeLowValue = document.getElementById('killRangeLowValue');
const killRangeHigh = document.getElementById('killRangeHigh');
const killRangeHighValue = document.getElementById('killRangeHighValue');

dBRangeValue.textContent = dBRange.value;

dBRange.addEventListener('input', () => {
  dBRangeValue.textContent = dBRange.value;
  diffusionBUniform.value = Number(dBRange.value);
});

feedRangeLowValue.textContent = feedRangeLow.value;
feedRangeHighValue.textContent = feedRangeHigh.value;
killRangeLowValue.textContent = killRangeLow.value;
killRangeHighValue.textContent = killRangeHigh.value;

feedRangeLow.addEventListener('input', () => {
  feedRangeLowValue.textContent = feedRangeLow.value;
  feedRangeLowUniform.value = Number(feedRangeLow.value);
});

feedRangeHigh.addEventListener('input', () => {
  feedRangeHighValue.textContent = feedRangeHigh.value;
  feedRangeHighUniform.value = Number(feedRangeHigh.value);
}); 

killRangeLow.addEventListener('input', () => {
  killRangeLowValue.textContent = killRangeLow.value;
  killRangeLowUniform.value = Number(killRangeLow.value);
});

killRangeHigh.addEventListener('input', () => {
  killRangeHighValue.textContent = killRangeHigh.value;
  killRangeHighUniform.value = Number(killRangeHigh.value);
});

const rerunButton = document.getElementById('rerunButton');
rerunButton.addEventListener('click', () => {
  sg.device.queue.writeBuffer(A1.buffer, 0, allA);
  sg.device.queue.writeBuffer(A2.buffer, 0, allA);
  sg.device.queue.writeBuffer(B1.buffer, 0, allB);
  sg.device.queue.writeBuffer(B2.buffer, 0, allB);

  feedUniform.value = Number(feedRange.value);
  killUniform.value = Number(killRange.value);
  diffusionAUniform.value = Number(dARange.value);
  diffusionBUniform.value = Number(dBRange.value);
  feedRangeLowUniform.value = Number(feedRangeLow.value);
  feedRangeHighUniform.value = Number(feedRangeHigh.value);
  killRangeLowUniform.value = Number(killRangeLow.value);
  killRangeHighUniform.value = Number(killRangeHigh.value);
})

const sg      = await seagulls.init(),
      frag    = await seagulls.import( '/frag.wgsl' ),
      compute = await seagulls.import( '/compute.wgsl' ),
      render  = seagulls.constants.vertex + frag,
      size    = (window.innerWidth * window.innerHeight),
      state   = new Float32Array( size )

// Fill state arrays with initial values
const allA = new Float32Array( size ).fill( 1.0 )
const allB = new Float32Array( size ).fill( 0.0 )

// Use Karl sims method to seed a small section with B
const seedSize = 10
for (let y = Math.floor(window.innerHeight / 2) - seedSize; y < Math.floor(window.innerHeight / 2) + seedSize; y++) {
  for (let x = Math.floor(window.innerWidth / 2) - seedSize; x < Math.floor(window.innerWidth / 2) + seedSize; x++) {
    allB[y * window.innerWidth + x] = 1.0;
  }
}

// buffers for A and B
const A1 = sg.buffer( allA )
const A2 = sg.buffer( allA )
const B1 = sg.buffer( allB )
const B2 = sg.buffer( allB )
const res = sg.uniform([ window.innerWidth, window.innerHeight ])

// constants for compute shader
const feedUniform = sg.uniform(Number(feedRange.value));
const killUniform = sg.uniform(Number(killRange.value));
const diffusionAUniform = sg.uniform(Number(dARange.value));
const diffusionBUniform = sg.uniform(Number(dBRange.value));
const feedRangeLowUniform = sg.uniform(Number(feedRangeLow.value));
const feedRangeHighUniform = sg.uniform(Number(feedRangeHigh.value));
const killRangeLowUniform = sg.uniform(Number(killRangeLow.value));
const killRangeHighUniform = sg.uniform(Number(killRangeHigh.value));

const renderPass = await sg.render({
  shader: render,
  data: [
    res,
    sg.pingpong( A1, A2 ),
    sg.pingpong( B1, B2 )
  ]
})

const computePass = sg.compute({
  shader: compute,
  data: [ 
    res, 
    sg.pingpong( A1, A2 ),
    sg.pingpong( B1, B2 ),
    diffusionAUniform,
    diffusionBUniform,
    feedUniform,
    killUniform,
    feedRangeLowUniform,
    feedRangeHighUniform,
    killRangeLowUniform,
    killRangeHighUniform
  ],
  dispatchCount:  [Math.round(sg.canvas.width/8), Math.round(sg.canvas.height/8), 1],
  times: 10
})

sg.run( computePass, renderPass )

console.log(sg.canvas)
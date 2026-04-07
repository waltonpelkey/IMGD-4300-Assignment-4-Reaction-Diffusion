import { default as seagulls } from '/gulls.js'

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
for (let y = window.innerHeight / 2 - seedSize; y < window.innerHeight / 2 + seedSize; y++) {
  for (let x = window.innerWidth / 2 - seedSize; x < window.innerWidth / 2 + seedSize; x++) {
    allB[y * window.innerWidth + x] = 1.0;
  }
}

// buffers for A and B
const A1 = sg.buffer( allA )
const A2 = sg.buffer( allA )
const B1 = sg.buffer( allB )
const B2 = sg.buffer( allB )
const res = sg.uniform([ window.innerWidth, window.innerHeight ])

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
    sg.pingpong( B1, B2 )
  ],
  dispatchCount:  [Math.round(window.innerWidth / 8), Math.round(window.innerHeight/8), 1],
  times: 10
})

sg.run( computePass, renderPass )

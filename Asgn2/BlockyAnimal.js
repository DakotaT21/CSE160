// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preservedDrawing: true })
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Set the intial value for this matrix idenity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

// Global Variables for UI
let g_globalAngle = 0;
let g_animation = false;

let g_bodyBounce = 0;
let g_bodyTiltAngle = 0;

let g_frontThighAngle = 0, g_frontShinAngle = 0;
let g_backThighAngle = 0, g_backShinAngle = 0;
let g_earAngle = 0;
let g_tailBaseAngle = 0, g_tailMidAngle = 0, g_tailTipAngle = 0;

let g_mouseXRotation = 0;
let g_mouseYRotation = 0;
let isMouseDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;


function addActionsforHtmlUI() {

  document.getElementById('startButton').onclick = function() {
    if (!g_animation){
      requestAnimationFrame(tick);
      g_animation=true;
    }
  };
  document.getElementById('stopButton').onclick = function() {
    g_animation=false;
  };

  document.getElementById('angleSlide').addEventListener('input', function() {g_mouseXRotation = this.value; renderAllShapes();});
  
  document.getElementById('resetCameraButton').onclick = function() {
    g_mouseXRotation = 0;
    g_mouseYRotation = 0;
    renderAllShapes();
  };

  document.getElementById('frontThighSlide').addEventListener('input', function() {
    g_frontThighAngle = parseFloat(this.value);
    renderAllShapes();
  });

  document.getElementById('frontShinSlide').addEventListener('input', function() {
      g_frontShinAngle = parseFloat(this.value);
      renderAllShapes();
  });

  document.getElementById('backThighSlide').addEventListener('input', function() {
      g_backThighAngle = parseFloat(this.value);
      renderAllShapes();
  });

  document.getElementById('backShinSlide').addEventListener('input', function() {
      g_backShinAngle = parseFloat(this.value);
      renderAllShapes();
  });

}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsforHtmlUI();

  document.getElementById('webgl').addEventListener('mousedown', onMouseDown);
  document.getElementById('webgl').addEventListener('mousemove', onMouseMove);
  document.getElementById('webgl').addEventListener('mouseup', onMouseUp);

  // Specify the color for <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Render the scene
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  renderAllShapes(); 
}

//Camera Rotation
function onMouseDown(event) {
  isMouseDragging = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}

function onMouseMove(event) {
  if (isMouseDragging) {
      let dx = event.clientX - lastMouseX;
      let dy = event.clientY - lastMouseY;

      g_mouseXRotation -= dx * 0.5;
      g_mouseYRotation += dy * 0.5;

      document.getElementById('angleSlide').value = g_mouseXRotation;

      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
      renderAllShapes();
  }
}

function onMouseUp(event) {
  isMouseDragging = false;
}


//Animation
function tick() {
  //Save the current time
  g_seconds = performance.now()/1000.0 - g_startTime;
  console.log(g_seconds);
  
  if (g_animation){
    updateAnimation();
    renderAllShapes();
    requestAnimationFrame(tick);
  }
}

function updateAnimation() {
  if (g_animation) {
      let speed = 7;
      let motion = Math.sin(g_seconds * speed);

      // Full body bounce (moves up/down with step)
      g_bodyBounce = 0.05 * motion;
      g_bodyTiltAngle = -5 * motion;

      // Leg animation
      g_frontThighAngle = 20 * motion;
      g_frontShinAngle = 10 * Math.sin(g_seconds * speed + 0.5);

      g_backThighAngle = 20 * Math.sin(g_seconds * speed - Math.PI / 2); // Delayed by 90 degrees
      g_backShinAngle = 10 * Math.sin(g_seconds * speed + 1 - Math.PI / 2); // Delayed by 90 degrees

      // Sync sliders with animation values
      document.getElementById('frontThighSlide').value = g_frontThighAngle;
      document.getElementById('frontShinSlide').value = g_frontShinAngle;
      document.getElementById('backThighSlide').value = g_backThighAngle;
      document.getElementById('backShinSlide').value = g_backShinAngle;

      // Ears wiggle
      g_earAngle = 40 * (-motion - 9);

      // Tail waves back and forth
      g_tailBaseAngle = 10 * Math.sin(g_seconds * 2);
      g_tailMidAngle = 10 * Math.sin(g_seconds * 2 + 1);
      g_tailTipAngle = 10 * Math.sin(g_seconds * 2 + 2);

      renderAllShapes();
  }

  

}


// Scene Rendering
function renderAllShapes() {
  // Check the time at the start of this function
  var startTime = performance.now();

  // Pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4()
    .rotate(g_globalAngle, 0, 1, 0)  // Slider-based global rotation
    .rotate(g_mouseXRotation, 0, 1, 0) // Mouse X controls left-right rotation
    .rotate(g_mouseYRotation, 1, 0, 0); // Mouse Y controls up-down rotation

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Pig Model
  // Body
  var body = new Cube();
  body.color = [1.0, 0.6, 0.7, 1.0]; // Pink color
  body.matrix.rotate(g_bodyTiltAngle, 1, 0, 0); // Apply the rotation to the entire pig
  body.matrix.translate(-0.2, 0 + g_bodyBounce, 0.0);
  body.matrix.scale(0.3, 0.3, 0.5);
  let bodyMatrix = new Matrix4(body.matrix); // Save transformation for legs and tail
  body.render();

  // Head (attached to the body)
  var head = new Cube();
  head.color = [1.0, 0.6, 0.7, 1.0];
  head.matrix = new Matrix4(bodyMatrix);
  head.matrix.rotate(g_bodyTiltAngle, 1, 0, 0); // Apply the rotation to the entire pig
  head.matrix.translate(-0.1, 0.3, -0.3); // Position in front of the body
  head.matrix.scale(1.2, 1, 0.5);
  head.render();

  // Snout (attached to the head)
  var snout = new Cube();
  snout.color = [1.0, 0.5, 0.6, 1.0];
  snout.matrix = new Matrix4(head.matrix);
  snout.matrix.translate(0.35, 0.25, -0.2)
  snout.matrix.scale(0.3, 0.3, 0.2);
  snout.render();

  var nostrilLeft = new Cube();
  nostrilLeft.color = [0.9, 0.4, 0.5, 1.0];
  nostrilLeft.matrix = new Matrix4(snout.matrix);
  nostrilLeft.matrix.translate(0.2, 0.1, -0.2); // Adjust position on the snout
  nostrilLeft.matrix.scale(0.2, 0.7, 0.01); // Small, thin rectangle shape
  nostrilLeft.render();

  var nostrilRight = new Cube();
  nostrilRight.color = [0.9, 0.4, 0.5, 1.0];
  nostrilRight.matrix = new Matrix4(snout.matrix);
  nostrilRight.matrix.translate(0.6, 0.1, -0.2); // Adjust position on the snout
  nostrilRight.matrix.scale(0.2, 0.7, 0.01); // Same size as the left nostril
  nostrilRight.render();

  // Eyes (attached to the head)
  var eye1 = new Cube();
  eye1.color = [0.0, 0.0, 0.0, 1.0]; // Black
  eye1.matrix = new Matrix4(head.matrix);
  eye1.matrix.translate(0.25, 0.55, -0.01); // Position correctly
  eye1.matrix.scale(0.1, 0.2, 0.01); // Thin rectangle shape
  eye1.render();

  var eye2 = new Cube();
  eye2.color = [0.0, 0.0, 0.0, 1.0]; // Black
  eye2.matrix = new Matrix4(head.matrix);
  eye2.matrix.translate(0.65, 0.55, -0.01); // Position correctly
  eye2.matrix.scale(0.1, 0.2, 0.01); // Thin rectangle shape
  eye2.render();

  // Ears (attached to the head)
  for (let i = 0; i < 2; i++) {
    var ear = new Cube();
    ear.color = [1.0, 0.5, 0.6, 1.0];
    let x_offset = (i === 0) ? 0.7 : 0.1;
    ear.matrix = new Matrix4(head.matrix);
    ear.matrix.translate(x_offset, 1, 0.5);
    ear.matrix.rotate(g_earAngle, 1, 0, 0);
    ear.matrix.scale(0.2, 0.2, 0.1);
    ear.render();
  }

  // Legs (Thigh + Shin)
  for (let i = 0; i < 4; i++) {
      var thigh = new Cube();
      var shin = new Cube();
      
      let x_offset = (i % 2 === 0) ? 0.01 : 0.69; 
      let z_offset = (i < 2) ? 0.01 : 0.79;
      
      let thighAngle = (i < 2) ? g_frontThighAngle : g_backThighAngle;
      let shinAngle = (i < 2) ? g_frontShinAngle : g_backShinAngle;

      // Upper Leg (Thigh) - Attached to the body
      thigh.color = [1.0, 0.6, 0.7, 1.0];
      thigh.matrix = new Matrix4(bodyMatrix);
      thigh.matrix.translate(x_offset, -0.2, z_offset);
      thigh.matrix.rotate(thighAngle, 1, 0, 0);
      thigh.matrix.translate(0, -0.15, 0); // Move down after rotating
      let thighMatrix = new Matrix4(thigh.matrix);
      //                X,    Y,    Z
      thigh.matrix.scale(0.32, 0.42, 0.2);
      thigh.render();

      // Lower Leg (Shin) - Attached to the thigh
      shin.color = [0.9, 0.4, 0.5, 1.0];
      shin.matrix = new Matrix4(thighMatrix);
      shin.matrix.rotate(shinAngle, 1, 0, 0);
      shin.matrix.translate(0.01, -0.15, 0.0);
      //                X,    Y,    Z
      shin.matrix.scale(0.3, 0.15, 0.2);
      shin.render();
  }

  // // Tail Base (First segment, attached to the body)
  // var tailBase = new Cube();
  // tailBase.color = [1.0, 0.5, 0.6, 1.0];
  // tailBase.matrix = new Matrix4(bodyMatrix); // Attach to body
  // tailBase.matrix.translate(0.3, 0.7, 1); // Attach to rear
  // tailBase.matrix.rotate(-45, 0, 0, 1); // Base curl
  // tailBase.matrix.rotate(g_tailBaseAngle, 0, 0, 1); // Base curl
  // tailBase.matrix.scale(0.1, 0.2, 0.05);

  // let tailMatrix = new Matrix4(tailBase.matrix); // Save base transformation
  // tailBase.render();

  // // Tail Middle (Second segment, attached to tail base)
  // var tailMid = new Cube();
  // tailMid.color = [1.0, 0.4, 0.5, 1.0];
  // tailMid.matrix = new Matrix4(tailMatrix); // Inherit from tail base
  // tailMid.matrix.translate(0, 2, 0.0); // Move up
  // tailMid.matrix.rotate(g_tailMidAngle, 0, 0, 1); // Mid curl
  // //tailMid.matrix.rotate(45, 0, 0, 1); // Base curl
  // //tailMid.matrix.scale(0.1, 0.2, 0.1);
  // tailMatrix = new Matrix4(tailMid.matrix); // Save middle transformation
  // tailMid.render();

  // // Tail Tip (Third segment, attached to tail mid)
  // var tailTip = new Cube();
  // tailTip.color = [1.0, 0.3, 0.4, 1.0];
  // tailTip.matrix = new Matrix4(tailMatrix); // Inherit from tail middle
  // tailTip.matrix.translate(0, 2, 0.0); // Move up
  // tailTip.matrix.rotate(g_tailTipAngle, 0, 0, 1); // Tip curl
  // //tailTip.matrix.rotate(-45, 0, 0, 1); // Base curl
  // //tailTip.matrix.scale(0.1, 0.2, 0.1);
  // tailTip.render();

  var duration = performance.now() - startTime;
  sendTexttoHTML("  MS: " + Math.floor(duration) + "  FPS: " + Math.floor(1000/duration)/10, "numdot");
}


function convertCoordinatesEventToGL(ev) {
  // Convert coordinates to canvas system
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);
}

function sendTexttoHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("HTML element:" + htmlID + " not found");
    return;
  }
  htmlElm.innerHTML = text;
}

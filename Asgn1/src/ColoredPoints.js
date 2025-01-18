// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform float u_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_Segments;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = canvas.getContext("webgl", { preservedDrawing: true })
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
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

  // Get the storage location of u_Size
  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;


// Global Variables for UI
let g_selectedColor=[1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5.0;
let g_selectedSegments = 10;
let g_selectedType = POINT;
let g_selectedSweepAngle = 360;
var gridOn = false;
var gridStep = 0.1;


function addActionsforHtmlUI() {
  //Button Events
  document.getElementById('green').onclick = function() {g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('red').onclick = function() {g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick = function() {g_shapeList = []; renderAllShapes();};
  document.getElementById('gridOn').onclick = function() {gridOn = true; renderAllShapes();};
  document.getElementById('gridOff').onclick = function() {gridOn = false; renderAllShapes();};

  document.getElementById('pointButton').onclick = function() {g_selectedType = POINT; };
  document.getElementById('triButton').onclick = function() {g_selectedType = TRIANGLE; };
  document.getElementById('circleButton').onclick = function() {g_selectedType = CIRCLE; };

  //Color Slider Events
  document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100;});
  document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100;});
  document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100;});

  //Size Slider Events
  document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value;});
  document.getElementById('segSlide').addEventListener('mouseup', function() {g_selectedSegments = this.value;});

  document.getElementById('recreateDrawing').addEventListener('click', function () {drawPicture();});

  document.getElementById('sweepAngle').addEventListener('mouseup', function () {g_selectedSweepAngle = this.value;});
  
  document.getElementById('gridSlide').addEventListener('input', function () {gridStep = parseFloat(this.value); if (gridOn) renderAllShapes();});

}

function main() {

  setupWebGL();

  connectVariablesToGLSL();

  addActionsforHtmlUI()

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;

  canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev);}}

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_shapeList = [];

function click(ev) {
  //Extract the event coordinates
  let [x, y] = convertCoordinatesEventToGL(ev);

  //Create a point object
  let point = new Triangle();
  if (g_selectedType == POINT) {
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
  }
  
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  point.sweepAngle = g_selectedSweepAngle
  g_shapeList.push(point);

  renderAllShapes();
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


function renderAllShapes() {

  var startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (gridOn) {
    drawGrid(gridStep);
  }

  var len = g_shapeList.length;
  for(var i = 0; i < len; i++) {
    g_shapeList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTexttoHTML("numdot: " + len + "  MS: " + Math.floor(duration) + "  FPS: " + Math.floor(1000/duration)/10, "numdot");
}

//Adding grid vertices to array
function generateGridVertices(step) {
  const vertices = [];
  const aspectRatio = canvas.width / canvas.height;

  // Horizontal lines
  for (let y = -1.0; y <= 1.0; y += step) {
    vertices.push(-1.0 * aspectRatio, y, 1.0 * aspectRatio, y); // Line from left to right
  }

  // Vertical lines
  for (let x = -1.0 * aspectRatio; x <= 1.0 * aspectRatio; x += step) {
    vertices.push(x, -1.0, x, 1.0); // Line from bottom to top
  }

  return new Float32Array(vertices);
}


function drawGrid(gridStep) {
  const gridVertices = generateGridVertices(gridStep);
  const gridBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, gridVertices, gl.DYNAMIC_DRAW);

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.uniform4f(u_FragColor, 0.5, 0.5, 0.5, 1.0); // Gray color for the grid
  gl.drawArrays(gl.LINES, 0, gridVertices.length / 2); // Draw the grid
}


function sendTexttoHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("HTML element:" + htmlID + " not found");
    return;
  }
  htmlElm.innerHTML = text;
}


// Reference Drawing Data

// Raw Triangles
const referenceTriangles = [
  // Tan Stalk/Face (2 Triangles)
  { vertices: [-0.35, -0.2, 0.35, -0.2, -0.35, -0.6], color: [0.96, 0.8, 0.69, 1.0] }, // Triangle 18
  { vertices: [-0.35, -0.6, 0.35, -0.2, 0.35, -0.6], color: [0.96, 0.8, 0.69, 1.0] }, // Triangle 19

  // Eyes (2 Black Rectangles, 2 Triangles Each)
  { vertices: [-0.15, -0.4, -0.1, -0.4, -0.15, -0.5], color: [0.0, 0.0, 0.0, 1.0] }, // Triangle 20
  { vertices: [-0.15, -0.5, -0.1, -0.4, -0.1, -0.5], color: [0.0, 0.0, 0.0, 1.0] }, // Triangle 21
  { vertices: [0.1, -0.4, 0.15, -0.4, 0.1, -0.5], color: [0.0, 0.0, 0.0, 1.0] }, // Triangle 22
  { vertices: [0.1, -0.5, 0.15, -0.4, 0.15, -0.5], color: [0.0, 0.0, 0.0, 1.0] }, // Triangle 23
];

// Draw the triangles
function drawReferenceTriangles() {
  for (const triangle of referenceTriangles) {
    const t = new Triangle();
    t.position = [0.0, 0.0];
    t.color = triangle.color;
    t.vertices = triangle.vertices;
    g_shapeList.push(t);
  }
}

//Draw the cap with circle object
function drawCap() {
  const cap = new Circle();
  cap.position = [0.0, -0.3];
  cap.size = 115;
  cap.color = [1.0, 0.0, 0.0, 1.0];
  cap.segments = 10;
  cap.sweepAngle = 180;
  g_shapeList.push(cap);
}

//Draw the cap dot with circle object
function drawWhiteCircle() {
  const circle = new Circle();
  circle.position = [0.0, -0.05]; 
  circle.size = 40;
  circle.color = [1.0, 1.0, 1.0, 1.0];
  circle.segments = 8;
  g_shapeList.push(circle);
}

// Draw the image
function drawPicture() {
  drawReferenceTriangles();
  drawCap();
  drawWhiteCircle();
  renderAllShapes();
}


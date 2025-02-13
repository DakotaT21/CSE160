// BLOCKY WORLD
// Dakota Tompkins 
// drtompki@ucsc.edu

// Vertex shader program
var VSHADER_SOURCE =
  'precision mediump float;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_UV;\n' +
  'varying vec2 v_UV;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjectionMatrix;\n' +
  'void main() {\n' +
    'gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;' +
    'v_UV = a_UV;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec2 v_UV;\n' +
  'uniform vec4 u_FragColor;\n' +
  'uniform sampler2D u_Sampler0;\n' +
  'uniform sampler2D u_Sampler1;\n' +
  'uniform int u_whichTexture;\n' +

  'void main() {\n' +

  '  if (u_whichTexture == -2) {\n' +
  '    gl_FragColor = u_FragColor;\n' +

  '  } else if (u_whichTexture == -1) {\n' +
  '    gl_FragColor = vec4(v_UV, 1.0, 1.0);\n' +

  '  } else if (u_whichTexture == 0) {\n' +
  '    gl_FragColor = texture2D(u_Sampler0, v_UV);\n' +

 '   } else if (u_whichTexture == 1) {\n' +
 '     gl_FragColor = texture2D(u_Sampler1, v_UV);\n' +

  '  } else {\n' +
  '    gl_FragColor = vec4(1.2, 0.2, 0.2, 1.0);\n' +

  '  }\n' +
  '}\n';

// -2   : Use a solid uniform color
// -1   : Debug: visualize the UV coordinates
//  0   : Use texture sampler0
//  1   : Use texture sampler1
// else : Fallback color - reddish


// Global Variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_whichTexture;

let camera = new Camera();
let g_globalAngle = 0;
let g_animation = false;
let cameraControlEnabled = false;

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


// INITIALIZATION
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
      console.log('Failed to initialize shaders.');
      return;
    }
  
    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }
  
    // Get the storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
      console.log('Failed to get the storage location of a_UV');
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
  
    // Get the storage location of u_ViewMatrix
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
      console.log('Failed to get the storage location of u_ViewMatrix');
      return;
    }
  
    // Get the storage location of u_ProjectionMatrix
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
      console.log('Failed to get the storage location of u_ProjectionMatrix');
      return;
    }

    // Get the storage location of the u_Sampler in the shader program
    var u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
      console.log('Failed to get the storage location of u_Sampler0');
      return false;
    }

    var u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1'); // <-- new
    if (!u_Sampler1) {
      console.log('Failed to get the storage location of u_Sampler1');
      return false;
    }

    // Get the storage location of u_whichTexture
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
      console.log('Failed to get the storage location of u_whichTexture');
      return;
    }
  }

function addActionsforHtmlUI() {

  // document.getElementById('startButton').onclick = function() {
  //   if (!g_animation){
  //     requestAnimationFrame(tick);
  //     g_animation=true;
  //   }
  // };
  // document.getElementById('stopButton').onclick = function() {
  //   g_animation=false;
  // };

  // document.getElementById('angleSlide').addEventListener('input', function() {g_mouseXRotation = this.value; renderAllShapes();});
  
  // document.getElementById('resetCameraButton').onclick = function() {
  //   g_mouseXRotation = 0;
  //   g_mouseYRotation = 0;
  //   renderAllShapes();
  // };

  // document.getElementById('frontThighSlide').addEventListener('input', function() {
  //   g_frontThighAngle = parseFloat(this.value);
  //   renderAllShapes();
  // });

  // document.getElementById('frontShinSlide').addEventListener('input', function() {
  //     g_frontShinAngle = parseFloat(this.value);
  //     renderAllShapes();
  // });

  // document.getElementById('backThighSlide').addEventListener('input', function() {
  //     g_backThighAngle = parseFloat(this.value);
  //     renderAllShapes();
  // });

  // document.getElementById('backShinSlide').addEventListener('input', function() {
  //     g_backShinAngle = parseFloat(this.value);
  //     renderAllShapes();
  // });

}

function sendTexttoHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("HTML element:" + htmlID + " not found");
    return;
  }
  htmlElm.innerHTML = text;
}

function initTexture() {
  // Create an image object
  var image = new Image();
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading the image
  image.onload = function() {
    sendTextureToTEXTURE0(image);
    renderAllShapes();
  };
  // Tell the browser to load an image (adjust the path as needed)
  image.src = './resources/sky.jpg';

  return true;
}

function sendTextureToTEXTURE0(image) {
  // Create a texture object
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  // Flip the image's y-axis
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  
  // Enable the texture unit 0 of 8
  gl.activeTexture(gl.TEXTURE0);
  
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  
  // Set the texture unit 0 to the sampler in the shader
  gl.uniform1i(u_Sampler0, 0);
  
  // Now that the texture is set up, draw the rectangle
  // (Ensure that the vertex buffer is bound and set for a TRIANGLE_STRIP)
  //gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);

  console.log("Texture loaded successfully");
}

function initTexture1() {
  var image1 = new Image();
  if (!image1) {
    console.log('Failed to create the image object for texture1');
    return false;
  }
  image1.onload = function() {
    sendTextureToTEXTURE1(image1);
  };
  image1.src = './resources/dirt.jpg';
  renderAllShapes();
  return true;
}

function sendTextureToTEXTURE1(image) {
  var texture1 = gl.createTexture();
  if (!texture1) {
    console.log('Failed to create the texture object for texture1');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler1, 1);

  console.log("Second texture loaded successfully");
}




//MAIN
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsforHtmlUI();
  Cube.initCubeBuffer();
  initTexture();
  initTexture1();

  document.getElementById('webgl').addEventListener('mousedown', onMouseDown);
  document.getElementById('webgl').addEventListener('mousemove', onMouseMove);
  document.getElementById('webgl').addEventListener('mouseup', onMouseUp);
  
  document.addEventListener('keydown', function(ev) {
    let speed = 0.1;
    switch(ev.key) {
      case 'w': camera.moveForward(speed); break;
      case 's': camera.moveBackwards(speed); break;
      case 'a': camera.moveLeft(speed); break;
      case 'd': camera.moveRight(speed); break;
      case 'q': camera.panLeft(5); break;
      case 'e': camera.panRight(5); break;
      case 'c':
        // Toggle pointer lock for 360° camera control.
        cameraControlEnabled = !cameraControlEnabled;
        console.log("Camera control enabled:", cameraControlEnabled);
        if (cameraControlEnabled) {
          canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
          canvas.requestPointerLock();
        } else {
          document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
          document.exitPointerLock();
        }
        break;
    }
    renderAllShapes();
  });

  document.addEventListener('pointerlockchange', lockChangeAlert, false);
  document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

  // Specify the color for <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Render the scene
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  renderAllShapes(); 
}



//CAMERA
//Camera Rotation with click and drag
function onMouseDown(event) {
  isMouseDragging = true;
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;
}
function onMouseMove(event) {
  if (isMouseDragging || cameraControlEnabled) {
    let dx = event.clientX - lastMouseX;
    let dy = event.clientY - lastMouseY;
    // Rotate the camera using the mouse deltas.
    camera.rotateMouse(dx, dy);
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    renderAllShapes();
  }
}
function onMouseUp(event) {
  isMouseDragging = false;
}

//Camera Rotation with 'c' and mouse movement
function lockChangeAlert() {
  if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
    console.log("Pointer is locked.");
    // When pointer is locked, attach the relative mousemove handler.
    document.addEventListener("mousemove", updateCameraWithMouse, false);
  } else {
    console.log("Pointer lock lost.");
    document.removeEventListener("mousemove", updateCameraWithMouse, false);
  }
}

function updateCameraWithMouse(e) {
  // Use relative mouse movement properties.
  let dx = e.movementX;
  let dy = e.movementY;
  camera.rotateMouse(dx, dy);
  renderAllShapes();
}



//ANIMATION
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


// SCENE RENDERING
function renderAllShapes() {
  // Check the time at the start of this function
  var startTime = performance.now();

  //Create a projection matrix (perspective or orthographic).
  let projMat = camera.updateProjectionMatrix(canvas);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);
  
  //Create a view matrix (positions/rotates the camera).
  let viewMat = camera.updateViewMatrix();
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  // Pass the matrix to u_ModelMatrix attribute
  var globalRotMat = new Matrix4()
    .rotate(g_globalAngle, 0, 1, 0)  // Slider-based global rotation
    .rotate(g_mouseXRotation, 0, 1, 0) // Mouse X controls left-right rotation
    .rotate(g_mouseYRotation, 1, 0, 0); // Mouse Y controls up-down rotation

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  

  // WORLD RENDERING
  // Draw ground plane
  var ground = new Cube();
  ground.color = [0.3, 0.9, 0.3, 1.0]; // Yellow color
  ground.textureNum = -2; // Use solid color
  ground.matrix.rotate(180, 1, 0, 0); // Rotate to face up
  ground.matrix.scale(100, 0.01, 100);
  ground.matrix.translate(-0.5, 0.005, -0.5);
  ground.render();

  // Draw sky
  var sky = new Cube();
  sky.isSky = true;
  sky.color = [0.5, 0.7, 1.0, 1.0]; // Blue color
  sky.textureNum = -2; // Use solid color
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();

  drawRing();
  drawMap();

  drawPig();

  var duration = performance.now() - startTime;
  sendTexttoHTML("  MS: " + Math.floor(duration) + "  FPS: " + Math.floor(1000/duration)/10, "numdot");
}

var g_map = [
  [1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 1, 0, 0, 0, 0, 0, 0],  
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],  
  [0, 0, 0, 0, 0, 0, 0, 0]];

function drawMap() {
  for (x=0; x<8; x++) {
    for (y=0; y<8; y++) {
      if (g_map[x][y] == 1) {
        var cube = new Cube();
        //cube.color = [0.3, 0.9, 0.3, 1.0]; // Yellow color
        cube.textureNum = 1; // Use dirt color
        cube.matrix.translate(x-4, 0.75, y-4);
        cube.render();
      }
    }
  }
}

function drawRing() {
  for (let x = 0; x < 32; x++) {
    for (let y = 0; y < 32; y++) {
      // console.log(x, y); // Uncomment if you want to log coordinates

      // If on the border of the 32x32 grid, draw a cube
      if (x === 0 || x === 31 || y === 0 || y === 31) {
        let body = new Cube();
        body.color = [0.8, 1.0, 1.0, 1.0];      // Light teal color
        body.textureNum = -2;                  // Use solid color
        body.matrix.translate(0, 0.75, 0);    // Shift downward
        body.matrix.scale(0.3, 0.3, 0.3);      // Scale to smaller size
        body.matrix.translate(x - 16, 0, y - 16); // Position in grid
        body.render();
      }
    }
  }
}

function drawPig(){
    // PIG MODEL
  // Body
  var body = new Cube();
  body.color = [1.0, 0.6, 0.7, 1.0]; // Pink color
  body.textureNum = -2; // Use solid color
  body.matrix.rotate(g_bodyTiltAngle, 1, 0, 0); // Apply the rotation to the entire pig
  body.matrix.scale(0.3, 0.3, 0.5);
  body.matrix.translate(-0.2, 1 + g_bodyBounce, 0.0);
  let bodyMatrix = new Matrix4(body.matrix); // Save transformation for legs and tail
  body.render();

  // Head (attached to the body)
  var head = new Cube();
  head.color = [1.0, 0.6, 0.7, 1.0];
  head.textureNum = -2; // Use solid color
  head.matrix = new Matrix4(bodyMatrix);
  head.matrix.rotate(g_bodyTiltAngle, 1, 0, 0); // Apply the rotation to the entire pig
  head.matrix.translate(-0.1, 0.3, -0.3); // Position in front of the body
  head.matrix.scale(1.2, 1, 0.5);
  head.render();

  // Snout (attached to the head)
  var snout = new Cube();
  snout.color = [1.0, 0.5, 0.6, 1.0];
  snout.textureNum = -2; // Use solid color
  snout.matrix = new Matrix4(head.matrix);
  snout.matrix.translate(0.35, 0.25, -0.2)
  snout.matrix.scale(0.3, 0.3, 0.2);
  snout.render();

  var nostrilLeft = new Cube();
  nostrilLeft.color = [0.9, 0.4, 0.5, 1.0];
  nostrilLeft.textureNum = -2; // Use solid color
  nostrilLeft.matrix = new Matrix4(snout.matrix);
  nostrilLeft.matrix.translate(0.2, 0.1, -0.2); // Adjust position on the snout
  nostrilLeft.matrix.scale(0.2, 0.7, 0.01); // Small, thin rectangle shape
  nostrilLeft.render();

  var nostrilRight = new Cube();
  nostrilRight.color = [0.9, 0.4, 0.5, 1.0];
  nostrilRight.textureNum = -2; // Use solid color
  nostrilRight.matrix = new Matrix4(snout.matrix);
  nostrilRight.matrix.translate(0.6, 0.1, -0.2); // Adjust position on the snout
  nostrilRight.matrix.scale(0.2, 0.7, 0.01); // Same size as the left nostril
  nostrilRight.render();

  // Eyes (attached to the head)
  var eye1 = new Cube();
  eye1.color = [0.0, 0.0, 0.0, 1.0]; // Black
  eye1.textureNum = -2; // Use solid color
  eye1.matrix = new Matrix4(head.matrix);
  eye1.matrix.translate(0.25, 0.55, -0.01); // Position correctly
  eye1.matrix.scale(0.1, 0.2, 0.01); // Thin rectangle shape
  eye1.render();

  var eye2 = new Cube();
  eye2.color = [0.0, 0.0, 0.0, 1.0]; // Black
  eye2.textureNum = -2; // Use solid color
  eye2.matrix = new Matrix4(head.matrix);
  eye2.matrix.translate(0.65, 0.55, -0.01); // Position correctly
  eye2.matrix.scale(0.1, 0.2, 0.01); // Thin rectangle shape
  eye2.render();

  // Ears (attached to the head)
  for (let i = 0; i < 2; i++) {
    var ear = new Cube();
    ear.color = [1.0, 0.5, 0.6, 1.0];
    ear.textureNum = -2; // Use solid color
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
      thigh.textureNum = -2; // Use solid color
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
      shin.textureNum = -2; // Use solid color
      shin.matrix = new Matrix4(thighMatrix);
      shin.matrix.rotate(shinAngle, 1, 0, 0);
      shin.matrix.translate(0.01, -0.15, 0.0);
      //                X,    Y,    Z
      shin.matrix.scale(0.3, 0.15, 0.2);
      shin.render();
  }
}
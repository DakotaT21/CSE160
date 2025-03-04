// BLOCKY WORLD
// Dakota Tompkins 
// drtompki@ucsc.edu

// Vertex shader program
var VSHADER_SOURCE =
  'precision mediump float;\n' +

  // Attributes
  'attribute vec4 a_Position;\n' +
  'attribute vec2 a_UV;\n' +
  'attribute vec3 a_Normal;\n' + 

  // Uniforms
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjectionMatrix;\n' +

  // Varyings
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_VertexPos;\n' +
  'varying vec2 v_UV;\n' +

  'void main() {\n' +
    //Compute world position of this vertex
    'vec4 worldPos = u_ModelMatrix * a_Position;\n' +
    'v_VertexPos  = vec3(worldPos);\n' +
    // Transform normal by normal matrix
    'v_Normal = mat3(u_NormalMatrix) * a_Normal;\n' +
    // Pass uv
    'v_UV = a_UV;\n' +
    'gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * worldPos' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +

  // Varyings
  'varying vec2 v_UV;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_VertexPos;\n' +

  // Uniforms
  'uniform vec4 u_FragColor;\n' +
  'uniform int u_whichTexture;\n' +
  'uniform bool u_lightOn;\n' +
  'uniform bool u_spotOn;\n' +   
  'uniform vec3 u_lightPos;\n' +
  'uniform vec3 u_lightColor;\n' +
  'uniform vec3 u_ambientColor;\n' +

  // For the spotlight
  'uniform vec3 u_spotPos;\n' +
  'uniform vec3 u_spotColor;\n' +
  'uniform vec3 u_spotDir;\n' +
  'uniform float u_spotCosine;\n' +

  // Samplers
  'uniform sampler2D u_Sampler0;\n' +
  'uniform sampler2D u_Sampler1;\n' +
  'uniform sampler2D u_Sampler2;\n' +

  'void main() {\n' +
    'vec4 baseColor;\n' +

    // Normal visualization 
    'if (u_whichTexture == -3) {\n' +
        'vec3 dbg = normalize(v_Normal)*0.5 + 0.5;\n' +
        'gl_FragColor = vec4(dbg, 1.0);\n' +
        'return;\n' +
    '}\n' +

    // Base color from texture or from u_FragColor
    'else if (u_whichTexture == 0) baseColor = texture2D(u_Sampler0, v_UV);\n' +
    'else if (u_whichTexture == 1) baseColor = texture2D(u_Sampler1, v_UV);\n' +
    'else if (u_whichTexture == 2) baseColor = texture2D(u_Sampler2, v_UV);\n' +
    'else if (u_whichTexture == -2) baseColor = u_FragColor;\n' +  // solid color
    'else baseColor = vec4(1.0,0.2,0.2,1.0);\n' +

    // If lighting is off, just use the baseColor
    '  if (!u_lightOn && !u_spotOn) {\n' +
    '    gl_FragColor = baseColor;\n' +
    '    return;\n' +
    '  }\n' +

    // 3) Phong for Main (point) Light\n' +
    '  vec3 N = normalize(v_Normal);\n' +
    '  vec3 L_main = normalize(u_lightPos - v_VertexPos);\n' +
    '  float nDotL_main = max(dot(N, L_main), 0.0);\n' +
    '  vec3 R_main = reflect(-L_main, N);\n' +
    '  vec3 V_main = normalize(-v_VertexPos); // assuming camera at (0,0,0)\n' +
    '  float spec_main = pow(max(dot(R_main, V_main), 0.0), 32.0);\n' +
    '  vec3 diffuse_main = (u_lightColor * baseColor.rgb) * nDotL_main;\n' +
    '  vec3 specular_main = u_lightColor * spec_main;\n' +

    // 4) Phong for Spotlight
    '  // For a spotlight, compute direction from surface to spotPos\n' +
    '  vec3 L_spot = normalize(u_spotPos - v_VertexPos);\n' +
    '  float nDotL_spot = max(dot(N, L_spot), 0.0);\n' +
    '  vec3 R_spot = reflect(-L_spot, N);\n' +
    '  vec3 V_spot = normalize(-v_VertexPos);\n' +
    '  float spec_spot = pow(max(dot(R_spot, V_spot), 0.0), 32.0);\n' +
    '  // Check if angle is within the spotlight’s cone:\n' +
    '  float spotFactor = dot(normalize(-u_spotDir), L_spot);\n' +
    '  float inSpot = step(u_spotCosine, spotFactor); // 1.0 if inside, 0.0 if outside\n' +
    '  // Then multiply the normal lighting by that factor\n' +
    '  vec3 diffuse_spot  = (u_spotColor * baseColor.rgb) * nDotL_spot * inSpot;\n' +
    '  vec3 specular_spot = u_spotColor * spec_spot * inSpot;\n' +

    // Combine if each is turned on
    '  vec3 mainLight = (u_lightOn) ? (diffuse_main + specular_main) : vec3(0.0);\n' +
    '  vec3 spotLight = (u_spotOn)  ? (diffuse_spot  + specular_spot ) : vec3(0.0);\n' +

    // 5) Ambient term
    '  vec3 ambientTerm = u_ambientColor * baseColor.rgb;\n' +

    // Final color
    '  vec3 finalColor = ambientTerm + mainLight + spotLight;\n' +
    '  gl_FragColor = vec4(finalColor, baseColor.a);\n' +
'};\n'

// -3   : Visualize the normal
// -2   : Use a solid uniform color
// -1   : Debug: visualize the UV coordinates
//  0   : Use texture sampler0
//  1   : Use texture sampler1
//  2   : Use texture sampler2
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

// Textures - Add
let u_whichTexture;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;

// Global toggles
let g_animation = false;
let g_lightOn = true;    // main light toggle
let g_spotOn  = false;   // spotlight toggle
let g_normalViz = false;

// Light position
let g_lightPosX = 2;
let g_lightPosY = 2;
let g_lightPosZ = 2;

// Spotlight settings
let g_spotPos    = [0, 3, 0];       // spotlight position
let g_spotColor  = [1.0, 1.0, 0.7]; // tinted
let g_spotDir    = [0, -1, 0];      // pointing straight down
let g_spotCosine = 0.95;            // cos(18°) or so

// Pig Animation
let g_bodyBounce = 0;
let g_bodyTiltAngle = 0;

let g_frontThighAngle = 0, g_frontShinAngle = 0;
let g_backThighAngle = 0, g_backShinAngle = 0;
let g_earAngle = 0;
let g_tailBaseAngle = 0, g_tailMidAngle = 0, g_tailTipAngle = 0;

//Camera
let camera = new Camera();
let g_globalAngle = 0;
let cameraControlEnabled = false;
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

    // Get the storage location of a_Normal
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
      console.log('Failed to get the storage location of a_Normal');
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

    // Get the storage location of u_whichTexture
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
      console.log('Failed to get the storage location of u_whichTexture');
      return;
    }

    // Textures - Add
    // Get the storage location of the u_Sampler in the shader program
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
      console.log('Failed to get the storage location of u_Sampler0');
      return false;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
      console.log('Failed to get the storage location of u_Sampler1');
      return false;
    }

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
      console.log('Failed to get the storage location of u_Sampler2');
      return false;
    }

    // Main light
    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
      console.log('Failed to get the storage location of u_lightOn');
      return false;
    }
    u_lightPos     = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
      console.log('Failed to get the storage location of u_lightPos');
      return false;
    }
    u_lightColor   = gl.getUniformLocation(gl.program, 'u_lightColor');
    if (!u_lightColor) {
      console.log('Failed to get the storage location of u_lightColor');
      return false;
    }
    u_ambientColor = gl.getUniformLocation(gl.program, 'u_ambientColor');
    if (!u_ambientColor) {
      console.log('Failed to get the storage location of u_ambientColor');
      return false;
    }

    // Spotlight
    u_spotOn      = gl.getUniformLocation(gl.program, 'u_spotOn');
    if (!u_spotOn) {
      console.log('Failed to get the storage location of u_spotOn');
      return false;
    }
    u_spotPos     = gl.getUniformLocation(gl.program, 'u_spotPos');
    if (!u_spotPos) {
      console.log('Failed to get the storage location of u_spotPos');
      return false;
    }
    u_spotColor   = gl.getUniformLocation(gl.program, 'u_spotColor');
    if (!u_spotColor) {
      console.log('Failed to get the storage location of u_spotColor');
      return false;
    }
    u_spotDir     = gl.getUniformLocation(gl.program, 'u_spotDir');
    if (!u_spotDir) {
      console.log('Failed to get the storage location of u_spotDir');
      return false;
    }
    u_spotCosine  = gl.getUniformLocation(gl.program, 'u_spotCosine');
    if (!u_spotCosine) {
      console.log('Failed to get the storage location of u_spotCosine');
      return false;
    }

  }

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

  document.getElementById('lightToggle').onclick = function(){ 
    g_lightOn=!g_lightOn; renderAllShapes(); 
  };

  document.getElementById('normToggle').onclick = function(){ 
    g_normalViz=!g_normalViz; renderAllShapes(); 
  };

  document.getElementById('spotToggle').onclick = function() {
    g_spotOn = !g_spotOn;
    renderAllShapes();
  };

}

function sendTexttoHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm){
    console.log("HTML element:" + htmlID + " not found");
    return;
  }
  htmlElm.innerHTML = text;
}



// TEXTURES
// Textures - Add
function initTexture() {
  // Create an image object
  var sky = new Image();
  if (!sky) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading the image
  sky.onload = function() {
    sendTextureToTEXTURE0(sky);
    renderAllShapes();
  };
  // Tell the browser to load an image (adjust the path as needed)
  sky.src = './resources/sky.jpg';

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

  console.log("Texture loaded successfully");
}

function initTexture1() {
  var dirt = new Image();
  if (!dirt) {
    console.log('Failed to create the image object for texture1');
    return false;
  }
  dirt.onload = function() {
    sendTextureToTEXTURE1(dirt);
    renderAllShapes();
  };
  dirt.src = './resources/dirt.jpg';
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

function initTexture2() {
  var grass = new Image();
  if (!grass) {
    console.log('Failed to create the image object for texture2');
    return false;
  }
  grass.onload = function() {
    sendTextureToTEXTURE2(grass);
    renderAllShapes();
  };
  grass.src = './resources/grass3.jpg';
  return true;
}

function sendTextureToTEXTURE2(image) {
  var texture2 = gl.createTexture();
  if (!texture2) {
    console.log('Failed to create the texture object for texture2');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture2);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(u_Sampler2, 2);

  console.log("Third texture loaded successfully");
}



//MAIN
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsforHtmlUI();
  Cube.initCubeBuffer();

  // Textures - Add
  initTexture();
  initTexture1();
  initTexture2();

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
  
  randomizeMap();
  initWalls();

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
  if (!cameraControlEnabled && isMouseDragging) {
    let dx = event.clientX - lastMouseX;
    let dy = event.clientY - lastMouseY;
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
  

  // === Send uniform data: main light
  gl.uniform1i(u_lightOn, g_lightOn ? 1 : 0);
  gl.uniform3f(u_lightPos, g_lightPosX, g_lightPosY, g_lightPosZ);
  gl.uniform3f(u_lightColor, g_lightColor[0], g_lightColor[1], g_lightColor[2]);
  gl.uniform3f(u_ambientColor, g_ambientColor[0], g_ambientColor[1], g_ambientColor[2]);

  // === Send uniform data: spotlight
  gl.uniform1i(u_spotOn, g_spotOn ? 1 : 0);
  gl.uniform3f(u_spotPos, g_spotPos[0], g_spotPos[1], g_spotPos[2]);
  gl.uniform3f(u_spotColor, g_spotColor[0], g_spotColor[1], g_spotColor[2]);
  gl.uniform3f(u_spotDir, g_spotDir[0], g_spotDir[1], g_spotDir[2]);
  gl.uniform1f(u_spotCosine, g_spotCosine);

  // Normal Visualization uses u_whichTexture = -3
  if (g_normalViz) {
    gl.uniform1i(u_whichTexture, -3);
  } else {
    // otherwise pick real texture or color
    // e.g. -2 => solid color, or 0 => first texture
    // up to your object code
    gl.uniform1i(u_whichTexture, 0);
  }

  // WORLD RENDERING
  // Draw ground plane
  var ground = new Cube();
  //ground.color = [0.3, 0.9, 0.3, 1.0];
  ground.textureNum = 2;
  ground.matrix.rotate(180, 1, 0, 0); // Rotate to face up
  ground.matrix.scale(32, 0.01, 32);
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


  // Draw all walls from the array
  for (let i = 0; i < walls.length; i++) {
    walls[i].render();
  }

  //size, translation x y z, rotateY
  drawPig(0.5, [0, 0, 0], 180);
  drawPig(0.5, [-0.5, 0, 0], 200);
  drawPig(0.5, [0.5, 0, 0], 160);

  drawPig(1.0, [1, 0, -1], 120);
  drawPig(1.0, [-1, 0, -2], -120);


  // Draw a sphere
  drawSphere(16,16, 1.0, 0,0,0);

  // Light indicator (cube at light pos)
  let l = new Cube();
  l.color = [1,1,0,1];
  l.textureNum = -2;
  l.matrix.translate(g_lightPosX,g_lightPosY,g_lightPosZ);
  l.matrix.scale(0.1,0.1,0.1);
  l.render();


  var duration = performance.now() - startTime;
  sendTexttoHTML("  MS: " + Math.floor(duration) + "  FPS: " + Math.floor(1000/duration)/10, "numdot");
}



function drawSphere(latBands, longBands, radius, cx, cy, cz){
  let positions = [];
  let normals   = [];
  let uvs       = [];
  let indices   = [];

  for(let lat=0; lat<=latBands; lat++){
    let theta = lat * Math.PI/latBands;
    let sinT = Math.sin(theta), cosT = Math.cos(theta);
    for(let lon=0; lon<=longBands; lon++){
      let phi = lon*2.0*Math.PI/longBands;
      let sinP = Math.sin(phi), cosP = Math.cos(phi);
      let x = cosP*sinT, y=cosT, z=sinP*sinT;
      positions.push(radius*x+cx, radius*y+cy, radius*z+cz);
      normals.push(x,y,z);
      uvs.push(lon/longBands, lat/latBands);
    }
  }

  for(let lat=0; lat<latBands; lat++){
    for(let lon=0; lon<longBands; lon++){
      let first = lat*(longBands+1)+lon;
      let second= first+longBands+1;
      indices.push(first, second, first+1, second, second+1, first+1);
    }
  }

  let ipos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, ipos);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  let inorm = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, inorm);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  let iuv = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, iuv);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

  let iidx = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iidx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  let modelMat = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix,false,modelMat.elements);
  let normalMat = new Matrix4(modelMat); normalMat.invert(); normalMat.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix,false,normalMat.elements);

  let FSIZE = Float32Array.BYTES_PER_ELEMENT;

  gl.bindBuffer(gl.ARRAY_BUFFER, ipos);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, inorm);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Normal);

  gl.bindBuffer(gl.ARRAY_BUFFER, iuv);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iidx);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}



// BLOCKS
//32×32 map & walls array
let g_map = new Array(32);
for (let x = 0; x < 32; x++) {
  g_map[x] = new Array(32);
  for (let z = 0; z < 32; z++) {
    // Example: border = 3 high, interior = 0
    if (x === 0 || x === 31 || z === 0 || z === 31) {
      g_map[x][z] = 3; // 3 blocks high
    } else {
      g_map[x][z] = 0; // no blocks
    }
  }
}

let walls = [];

/**
 * Build the walls array based on g_map.
 * For each cell (x, z), if g_map[x][z] > 0,
 * create that many stacked cubes [y=0..height-1].
 */
function initWalls() {
  walls = []; // reset
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      let height = g_map[x][z]; // how many cubes to stack
      for (let y = 0; y < height; y++) {
        let c = new Cube();
        c.textureNum = 1; // dirt
        // Each cube at (x, y, z). 
        c.matrix.translate(x - 16, y, z - 16);
        // Scale
        // c.matrix.scale(1,1,1);
        walls.push(c);
      }
    }
  }
}

function randomizeMap() {
  let spawnChance = 0.1;   // chance to spawn a stack
  let maxHeight   = 2;     // stack height
  let borderHeight = 4;    // edge height

  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      // Keep border at a fixed height
      let isBorder = (x === 0 || x === 31 || z === 0 || z === 31);
      if (isBorder) {
        g_map[x][z] = borderHeight;
        continue;
      }

      // No block zone
      let dx = x - 16;
      let dz = z - 16;
      let distSq = dx*dx + dz*dz;
      // If inside radius=6 no blocks
      if (distSq < 36) {
        g_map[x][z] = 0;
        continue;
      }

      // Otherwise, spawn with low probability
      if (Math.random() < spawnChance) {
        // random height from 1..maxHeight
        let randomH = 1 + Math.floor(Math.random() * maxHeight);
        g_map[x][z] = randomH;
      } else {
        g_map[x][z] = 0;
      }
    }
  }
}



// PIG MODEL
function drawPig(size, translation, rotateY){
  let pigMatrix = new Matrix4();
  pigMatrix.translate(translation[0], translation[1], translation[2]);
  pigMatrix.rotate(rotateY, 0, 1, 0);
  // Body
  var body = new Cube();
  body.color = [1.0, 0.6, 0.7, 1.0]; // Pink color
  body.textureNum = -2; // Use solid color
  body.matrix = new Matrix4(pigMatrix);
  body.matrix.rotate(g_bodyTiltAngle, 1, 0, 0); // Apply the rotation to the entire pig
  body.matrix.scale(0.3 * size, 0.3 * size, 0.5 * size);
  body.matrix.translate(-0.2, 0.5 + g_bodyBounce, 0.0);
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
      // document.getElementById('frontThighSlide').value = g_frontThighAngle;
      // document.getElementById('frontShinSlide').value = g_frontShinAngle;
      // document.getElementById('backThighSlide').value = g_backThighAngle;
      // document.getElementById('backShinSlide').value = g_backShinAngle;

      // Ears wiggle
      g_earAngle = 40 * (-motion - 9);

      // Tail waves back and forth
      g_tailBaseAngle = 10 * Math.sin(g_seconds * 2);
      g_tailMidAngle = 10 * Math.sin(g_seconds * 2 + 1);
      g_tailTipAngle = 10 * Math.sin(g_seconds * 2 + 2);

      renderAllShapes();
  }

}


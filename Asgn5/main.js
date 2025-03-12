//
// main.js
// Entry point for our Three.js project
//

// Global variables
let scene, camera, renderer, controls;
let raycaster, pointer; // for picking
let rotatingBox;        // one object we'll animate

//
// 1. INIT SCENE
//
function initScene() {
  scene = new THREE.Scene();

  // Enable fog (linear fog)
  scene.fog = new THREE.Fog(0xa0a0a0, 50, 200);
  // scene.fog = new THREE.FogExp2(0xa0a0a0, 0.02); // exponential option

  // Perspective camera
  const fov = 60;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 1000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 50);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // enable shadows
  document.body.appendChild(renderer.domElement);

  // OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 5, 0);
  controls.update();

  // Initialize picking tools
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  // Handle resize
  window.addEventListener('resize', onWindowResize, false);

  // Mouse click for picking
  window.addEventListener('click', onMouseClick, false);
}

//
// 2. SETUP LIGHTS
//
function setupLights() {
  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);

  // Directional Light
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(50, 50, 25);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

  // Spot Light
  const spotLight = new THREE.SpotLight(0xfff0e5, 1);
  spotLight.position.set(-30, 50, 30);
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  scene.add(spotLight);
}

//
// 3. ADD SKYBOX
//
function addSkybox() {
  const loader = new THREE.CubeTextureLoader();
  loader.setPath('textures/skybox/');
  const skyboxTex = loader.load([
    'px.jpg', // +x
    'nx.jpg', // -x
    'py.jpg', // +y
    'ny.jpg', // -y
    'pz.jpg', // +z
    'nz.jpg'  // -z
  ]);
  scene.background = skyboxTex;
}

//
// 4. ADD OBJECTS & GROUND
//    - At least 20 primary shapes, at least 3 kinds, one must be animated, and one must be textured
//
function addObjects() {
  // Ground plane to receive shadows
  const groundGeo = new THREE.PlaneGeometry(500, 500);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 1) Rotating Box (animated)
  const boxGeo = new THREE.BoxGeometry(5, 5, 5);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  rotatingBox = new THREE.Mesh(boxGeo, boxMat);
  rotatingBox.position.set(-10, 2.5, 0);
  rotatingBox.castShadow = true;
  rotatingBox.receiveShadow = true;
  scene.add(rotatingBox);

  // 2) Sphere
  const sphereGeo = new THREE.SphereGeometry(3, 32, 16);
  const sphereMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.position.set(10, 3, 0);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);

  // 3) Cylinder
  const cylGeo = new THREE.CylinderGeometry(2, 2, 6, 16);
  const cylMat = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const cylinder = new THREE.Mesh(cylGeo, cylMat);
  cylinder.position.set(0, 3, -15);
  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  scene.add(cylinder);

  // We have 3 different kinds so far (box, sphere, cylinder).
  // Add more shapes (at least 17 more to reach 20).
  const shapesCount = 17; // to reach 20 total
  for (let i = 0; i < shapesCount; i++) {
    const geo = new THREE.SphereGeometry(1.5, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 60,
      1.5,
      (Math.random() - 0.5) * 60
    );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Textured shape
  addTexturedBox();
}

//
// 5. ADD A TEXTURED BOX
//
function addTexturedBox() {
  const textureLoader = new THREE.TextureLoader();
  const brickTex = textureLoader.load('textures/brick_diffuse.jpg');

  const tBoxGeo = new THREE.BoxGeometry(5, 5, 5);
  const tBoxMat = new THREE.MeshStandardMaterial({ map: brickTex });
  const texturedBox = new THREE.Mesh(tBoxGeo, tBoxMat);
  texturedBox.position.set(0, 2.5, 15);
  texturedBox.castShadow = true;
  texturedBox.receiveShadow = true;
  scene.add(texturedBox);
}

//
// 6. LOAD CUSTOM .OBJ MODEL (textured if desired)
//
function loadCustomModel() {
  const objLoader = new THREE.OBJLoader();
  objLoader.load(
    'models/myModel.obj', 
    (obj) => {
      // Optional: apply a texture to each mesh
      const textureLoader = new THREE.TextureLoader();
      const modelTex = textureLoader.load('textures/modelTexture.jpg');
      obj.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material = new THREE.MeshStandardMaterial({ map: modelTex });
        }
      });
      obj.position.set(15, 0, 5);
      scene.add(obj);
    },
    undefined,
    (err) => {
      console.error('Error loading .obj:', err);
    }
  );
}

//
// 7. ANIMATION LOOP
//
function animate() {
  requestAnimationFrame(animate);

  // Rotate our rotatingBox
  if (rotatingBox) {
    rotatingBox.rotation.x += 0.01;
    rotatingBox.rotation.y += 0.01;
  }

  controls.update();
  renderer.render(scene, camera);
}

//
// EVENT: ON WINDOW RESIZE
//
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

//
// EVENT: ON MOUSE CLICK (Picking)
//
function onMouseClick(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  // 'true' to check descendants if model is group
  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const picked = intersects[0].object;
    console.log('Picked object:', picked);
    // Example: highlight the object
    if (picked.material && picked.material.emissive) {
      picked.material.emissive.setHex(0x333333);
    }
  }
}

//
// RUN PROJECT
//
initScene();
setupLights();
addSkybox();
addObjects();
loadCustomModel();
animate();

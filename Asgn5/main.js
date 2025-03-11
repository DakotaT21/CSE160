const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
// Position the camera (e.g., at z = 50 to view the scene)
camera.position.set(0, 5, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true });  // enable antialiasing for smoother edges&#8203;:contentReference[oaicite:1]{index=1}
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

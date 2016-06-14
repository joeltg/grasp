function getWidth() {
    return 2.0 * window.innerWidth / 3.0 - 10;
}

function getHeight() {
    return window.innerHeight - 10;
}

let width = getWidth(), height = getHeight();

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000 );
camera.position.z = 500;

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0.2, 0.2, 1);
light.castShadow = true;
scene.add( light );

const fog = new THREE.FogExp2(0xcccccc, 0.001);
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(fog.color);
renderer.setSize(width, height);
renderer.setPixelRatio(width / height);
document.getElementById('content').appendChild( renderer.domElement );

const controls = new THREE.TrackballControls(camera);

function render() {
    requestAnimationFrame( render );
    controls.update();
    renderer.render(scene, camera);
}

render();

import * as THREE from "../lib/three.module.js"
import {GLTFLoader} from "../lib/GLTFLoader.module.js"
import { OrbitControls } from "../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js"

//variables estandar
let renderer, scene, camera, top_camera, controls;
//Otras globales
let robot, brazo, antebrazo, mano, pinza1, pinza2;
let angulo = 0;

//Acciones
init();
loadScene();
render();

// Ajustar la distancia máxima de renderizado de la cámara
// Rotar las distintas partes del robot


function init() {
    var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
    var minDim = Math.min(WIDTH, HEIGHT);

    renderer = new THREE.WebGLRenderer( {antialias: true} )
    // renderer.autoClear = false;
    renderer.setSize(window.innerWidth, window.innerHeight)

    document.getElementById('container').appendChild(renderer.domElement)

    //Instanciar el nodo raíz
    scene = new THREE.Scene()
    scene.background = new THREE.Color( 0x220044 )
    // scene.background = new THREE.Color( 0xaaaaaa )

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 500)
    camera.position.set(20, 200, 100);
    camera.lookAt(0, 60, 0);
    // scene.add(camera);

    top_camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 1000)
    top_camera.position.set(0, 300, 0)
    top_camera.lookAt(0, 0, 0)
    // scene.add(top_camera)

    controls = new OrbitControls( camera, renderer.domElement );
}

function loadScene() {
    const material = new THREE.MeshBasicMaterial({color:'yellow', wireframe:false})
    // const material = new THREE.MeshNormalMaterial({wireframe:false, flatShading:true})

    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 500, 500), material)
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = 0.2;

    scene.add(suelo)

    robot = new THREE.Object3D()
    // const robot_material = new THREE.MeshBasicMaterial({color:'red', wireframe:true})
    const robot_material = new THREE.MeshNormalMaterial({wireframe:false, flatShading:true})

    const base_geometry = new THREE.CylinderGeometry(50, 50, 15, 30)
    const base_mesh = new THREE.Mesh(base_geometry, robot_material)
    base_mesh.position.y = 10;
    
    brazo = new THREE.Object3D()
    const eje_geometry = new THREE.CylinderGeometry(20, 20, 18, 30)
    const eje_mesh = new THREE.Mesh(eje_geometry, robot_material)
    eje_mesh.rotation.x = Math.PI/2;

    const esparrago_geometry = new THREE.BoxGeometry(12, 120, 18)
    const esparrago_mesh = new THREE.Mesh(esparrago_geometry, robot_material)
    esparrago_mesh.position.y = 60;

    const rotula_geometry = new THREE.SphereGeometry(20, 20, 20)
    const rotula_mesh = new THREE.Mesh(rotula_geometry, robot_material)
    rotula_mesh.position.y = 120

    antebrazo = new THREE.Object3D()
    const disco_geometry = new THREE.CylinderGeometry(22, 22, 6, 30)
    const disco_mesh = new THREE.Mesh(disco_geometry, robot_material)
    disco_mesh.position.y = 0

    const nervios_geometry = new THREE.BoxGeometry(4, 80, 4)
    const nervio1 = new THREE.Mesh(nervios_geometry, robot_material)
    const nervio2 = new THREE.Mesh(nervios_geometry, robot_material)
    const nervio3 = new THREE.Mesh(nervios_geometry, robot_material)
    const nervio4 = new THREE.Mesh(nervios_geometry, robot_material)

    nervio1.position.x += 10
    nervio1.position.y = 46
    nervio1.position.z += 10

    nervio2.position.x -= 10
    nervio2.position.y = 46
    nervio2.position.z += 10

    nervio3.position.x += 10
    nervio3.position.y = 46
    nervio3.position.z -= 10

    nervio4.position.x -= 10
    nervio4.position.y = 46
    nervio4.position.z -= 10

    mano = new THREE.Object3D()
    const mano_geometry = new THREE.CylinderGeometry(15, 15, 40, 30);
    const mano_mesh = new THREE.Mesh(mano_geometry, robot_material)
    mano_mesh.position.y = 0;
    mano_mesh.rotation.x = Math.PI/2;

    const pinza_geometry = new THREE.BufferGeometry()
    const vertices = [ //12 vertices x 3 coord = 36
    0, 0, 4,  19, 0, 4, // 0 y 1 (base exterior abajo)
    0, 0, 0,  19, 0, 0, // 2 y 3 (base interior abajo)
    0, 20, 4, 19, 20, 4, // 4, 5 (base exterior arriba)
    0, 20, 0, 19, 20, 0, // 6, 7 (base interior arriba)
    38, 5, 2, 38, 15, 2, // 8 y 9 (base exterior pinza)
    38, 5, 0, 38, 15, 0, // 10 y 11 (base interior pinza)
    ]

    const indices = [
        1, 5, 0, 5, 4, 0,
        3, 2, 6, 3, 6, 7,
        2, 0, 4, 2, 4, 6,
        1, 3, 7, 1, 7, 5,
        5, 7, 6, 5, 6, 4,
        0, 1, 3, 0, 3, 2,
        9, 11, 7, 9, 7, 5,
        8, 10, 3, 8, 3, 1,
        1, 8, 9, 1, 9, 5,
        10, 3, 7, 10, 7, 11,
        8, 10, 11, 8, 11, 9,
        1, 0, 2, 1, 2, 3,
        8, 1, 3, 8, 3, 10, 
    ]

    pinza_geometry.setIndex(indices)
    pinza_geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    pinza_geometry.computeVertexNormals()

    pinza1 = new THREE.Object3D()
    pinza2 = new THREE.Object3D()

    
    const pinza_mesh1 = new THREE.Mesh(pinza_geometry, robot_material)
    const pinza_mesh2 = new THREE.Mesh(pinza_geometry, robot_material)
    
    pinza_mesh1.position.set(0, -10, 10)
    
    pinza_mesh2.rotation.x = Math.PI
    pinza_mesh2.position.set(0, 10, -10)
    
    
    // compose the hierarchy
    mano.position.y = 86

    pinza1.add(pinza_mesh1)
    pinza2.add(pinza_mesh2)
    
    mano.add(pinza1)
    mano.add(pinza2)
    mano.add(mano_mesh)
    
    antebrazo.position.y = 120
    antebrazo.add(mano)
    antebrazo.add(nervio1)
    antebrazo.add(nervio2)
    antebrazo.add(nervio3)
    antebrazo.add(nervio4)
    antebrazo.add(disco_mesh)
    
    brazo.position.y = 10
    
    brazo.add(antebrazo)
    brazo.add(rotula_mesh)
    brazo.add(esparrago_mesh)
    brazo.add(eje_mesh)
    
    base_mesh.add(brazo)
    
    robot.add(base_mesh)
    
    scene.add(robot)
    
    
    
    controls.target.set(robot.position.x, robot.position.y + 160, robot.position.z);
    controls.listenToKeyEvents( window );
    controls.minDistance = 50;
	controls.maxDistance = 500;
    controls.update()
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    }

    brazo.rotation.z = Math.PI/8
    antebrazo.rotation.z = -Math.PI/2

}

function update() {
    angulo += 0.01;
    // scene.rotation.y = angulo;
    // mano.rotation.z = angulo;
    // pinza1.rotation.z = angulo;
    // pinza2.rotation.z = -angulo;
    // brazo.rotation.z = angulo;
    // antebrazo.rotation.z = -angulo;
}

function render() {
    var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
    var minDim = Math.min(WIDTH, HEIGHT);
    
    requestAnimationFrame(render)
    update();

    // renderer.setViewport(0, 0, WIDTH, HEIGHT)
    renderer.autoClear = false
    
    renderer.setSize(WIDTH, HEIGHT)
    renderer.setViewport(0, 0, WIDTH, HEIGHT)
    renderer.render(scene, camera)
    
    
    renderer.setScissorTest(true)
    renderer.setScissor(0, HEIGHT-minDim/4,  minDim/4, minDim/4)
    renderer.setViewport(0, HEIGHT-minDim/4, minDim/4, minDim/4)
    renderer.render(scene, top_camera)
    renderer.setScissorTest(false)
}



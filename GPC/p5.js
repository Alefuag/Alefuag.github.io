
import * as THREE from "./lib/three.module.js"
import {GLTFLoader} from "./lib/GLTFLoader.module.js"
import { OrbitControls } from "./lib/OrbitControls.module.js";
import { TWEEN } from "./lib/tween.module.min.js"
import { GUI } from "./lib/lil-gui.module.min.js";
// import { stats } from "../lib/stats.module.js";



//variables estandar
let renderer, scene, camera, top_camera, controls;
//Otras globales
let robot, brazo, antebrazo, mano, pinza1, pinza2;
let material, robot_material, angulo = 0;
let clock = new THREE.Clock();
let robot_speed = 100;
let right_arrow = false, left_arrow = false, up_arrow = false, down_arrow = false;
let AmbientLight, directionalLight, pointLight, spotLight;

//Acciones
init();
loadScene();
initLighting();
initGUI();
render();

// Rotar las distintas partes del robot

function checkDown(e) {
    if (e.keyCode == '38') { up_arrow = true; }
    else if (e.keyCode == '40') { down_arrow = true; }
    else if (e.keyCode == '37') { left_arrow = true; }
    else if (e.keyCode == '39') { right_arrow = true; }
}

function checkUp(e) {
    if (e.keyCode == '38') { up_arrow = false; }
    else if (e.keyCode == '40') { down_arrow = false; }
    else if (e.keyCode == '37') { left_arrow = false; }
    else if (e.keyCode == '39') { right_arrow = false; }
}

function robotAnimation() {
    // use TWEEN library for joint animation
    var anim_base = { y: rad_to_deg(robot.rotation.y)}
    var anim_brazo = { z: rad_to_deg(brazo.rotation.z)}
    var anim_antebrazo = { z: rad_to_deg(antebrazo.rotation.z) }
    var anim_pinza = { z: rad_to_deg(pinza1.rotation.z) }
    var anim_separacion = { separacion: rad_to_deg(pinza2.position.z) }
    var original_sep = rad_to_deg(pinza2.position.z)
    
    var baseTween = new TWEEN.Tween(anim_base).to({ y:-30 }, 1000).easing(TWEEN.Easing.Quadratic.InOut)
    var brazoTween = new TWEEN.Tween(anim_brazo).to({z:30}, 1000).easing(TWEEN.Easing.Quadratic.InOut)
    var antebrazoTween = new TWEEN.Tween(anim_antebrazo).to({ z:-120 }, 1000).easing(TWEEN.Easing.Quadratic.InOut)
    var pinzaTween = new TWEEN.Tween(anim_pinza).to({ z:90 }, 1000).easing(TWEEN.Easing.Quadratic.InOut)
    var separacionTween = new TWEEN.Tween(anim_separacion).to({separacion:15}, 1000).easing(TWEEN.Easing.Quadratic.InOut)
    var separacionTweenBack = new TWEEN.Tween(anim_separacion).to({separacion: original_sep}, 1000).easing(TWEEN.Easing.Quadratic.InOut)

    baseTween.onUpdate(function() {
        robot.rotation.y = deg_to_rad(anim_base.y);
    })
    brazoTween.onUpdate(function() {
        brazo.rotation.z = deg_to_rad(anim_brazo.z);
    })
    antebrazoTween.onUpdate(function() {
        antebrazo.rotation.z = deg_to_rad(anim_antebrazo.z);
    })
    pinzaTween.onUpdate(function() {
        pinza1.rotation.z = deg_to_rad(anim_pinza.z);
        pinza2.rotation.z = deg_to_rad(anim_pinza.z);
    })
    separacionTween.onUpdate(function() {
        pinza1.position.z = -anim_separacion.separacion;
        pinza2.position.z = anim_separacion.separacion;
    })
    separacionTweenBack.onUpdate(function() {
        pinza1.position.z = -anim_separacion.separacion;
        pinza2.position.z = anim_separacion.separacion;
    })

    // start animations

    baseTween.chain(brazoTween)
    brazoTween.chain(antebrazoTween)
    antebrazoTween.chain(pinzaTween)
    pinzaTween.chain(separacionTween)
    separacionTween.chain(separacionTweenBack)
    
    baseTween.start()
}

function init() {
    var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
    var minDim = Math.min(WIDTH, HEIGHT);

    renderer = new THREE.WebGLRenderer( {antialias: true} )
    // Enable shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;   

    renderer.setSize(window.innerWidth, window.innerHeight)

    document.getElementById('container').appendChild(renderer.domElement)
    document.onkeydown = checkDown;
    document.onkeyup = checkUp;
    
    //Instanciar el nodo raíz
    scene = new THREE.Scene()
    scene.background = new THREE.Color( 0x220044 )
    // scene.background = new THREE.Color( 0xaaaaaa )

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 1000)
    camera.position.set(20, 200, 200);
    camera.lookAt(0, 60, 0);
    // scene.add(camera);

    top_camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 1000)
    top_camera.position.set(0, 300, 0)
    top_camera.lookAt(0, 0, 0)
    // scene.add(top_camera)

    controls = new OrbitControls( camera, renderer.domElement );

}

function deg_to_rad(degrees) {
    return degrees * (Math.PI/180);
}

function rad_to_deg(radians) {
    return radians * (180/Math.PI);
}

function initLighting() {
    var ambient = new THREE.AmbientLight(0xffffff, 0.3)
    // ambient.castShadow = true;
    scene.add(ambient)

    directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(500, 1000, -200)
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 5000;
    // directionalLight.shadow.camera.visible = true;
    directionalLight.shadow.camera.left = -1000;
    directionalLight.shadow.camera.right = 1000;
    directionalLight.shadow.camera.top = 1000;
    directionalLight.shadow.camera.bottom = -1000;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight)

    // pointLight = new THREE.PointLight(0x0000ff, 5, 1000)
    // pointLight.position.set(50, 100, 0)
    // pointLight.castShadow = true;
    // pointLight.shadow.camera.near = 0.1;
    // pointLight.shadow.camera.far = 1000;
    // pointLight.shadow.mapSize.width = 2048;
    // pointLight.shadow.mapSize.height = 2048;
    // // pointLight.shadow.camera.visible = true;
    // scene.add(pointLight)

    spotLight = new THREE.SpotLight( 0x0000ff, 1 );
    spotLight.position.set( -50, 400, 50 );
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 1000;
    spotLight.shadow.camera.fov = 15;

    scene.add( spotLight );

    // const helper = new THREE.CameraHelper( directionalLight.shadow.camera );
    // scene.add( helper );

    // const helper2 = new THREE.CameraHelper( pointLight.shadow.camera );
    // scene.add( helper2 );
}

function initGUI() {
    const gui = new GUI()
    // create degrees variable for each joint
    var base_degrees = {x:0, y:0, z:0}
    var brazo_degrees = {x:0, y:0, z:0}
    var antebrazo_degrees = {x:0, y:0, z:0}
    var pìnza_degrees = {x:0, y:0, z:0}
    var pinza_separacion = {separacion:0}
    var tipo_material = {alambrico:false}

    gui.add(base_degrees, 'y', -180, 180).name('Giro Base').onChange(function(degrees) {robot.rotation.y = deg_to_rad(degrees)})
    gui.add(brazo_degrees, 'z', -45, 45).name('Giro Brazo').onChange(function(degrees) {brazo.rotation.z = deg_to_rad(degrees)})
    gui.add(antebrazo_degrees, 'y', -180, 180).name('Giro Antebrazo Y').onChange(function(degrees) {antebrazo.rotation.y = deg_to_rad(degrees)})
    gui.add(antebrazo_degrees, 'z', -90, 90).name('Giro Antebrazo Z').onChange(function(degrees) {antebrazo.rotation.z = deg_to_rad(degrees)})
    gui.add(pìnza_degrees, 'y', -40, 220).name('Giro Pinza').onChange(function(degrees) {pinza1.rotation.z = deg_to_rad(degrees); pinza2.rotation.z = deg_to_rad(degrees)})
    gui.add(pinza_separacion, 'separacion', 0, 15).name('Separación Pinza').onChange(function(separacion) {pinza1.position.z = -separacion; pinza2.position.z = separacion})
    gui.add(tipo_material, 'alambrico').name('Modo Alámbrico').onChange(function(alambrico) {robot_material.wireframe = alambrico;})
    gui.add({animation:robotAnimation}, 'animation').name('Animación')
}

function loadScene() {
    // material = new THREE.MeshBasicMaterial({color:'yellow', wireframe:false})
    // material = new THREE.MeshNormalMaterial({wireframe:false, flatShading:true})
    material = new THREE.MeshPhongMaterial({color:'white', wireframe:false})
    
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000, 500, 500), material)
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = 0.2;
    suelo.receiveShadow = true;
    
    scene.add(suelo)
    
    // add image texture to the ground
    var loader = new THREE.TextureLoader();
    var basepath = './practs/interstellar_skybox/';
    loader.setPath( basepath );
    var texture = loader.load('floor.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );
    suelo.material.map = texture;

    // añadir skybox
    var loader = new THREE.CubeTextureLoader();
    var basepath = './practs/interstellar_skybox/';
    loader.setPath( basepath );
    var textureCube = loader.load([
        'xpos.png', 'xneg.png',
        'ypos.png', 'yneg.png',
        'zpos.png', 'zneg.png'
    ]);
    textureCube.format = THREE.RGBAFormat;
    
    
    //add background texture
    scene.background = textureCube;
    

    // añadir textura del robot
    var loader = new THREE.TextureLoader();
    var basepath = './practs/interstellar_skybox/';
    loader.setPath( basepath );
    var robot_texture = loader.load('metal_oclussion.jpg');
    robot_texture.wrapS = THREE.RepeatWrapping;
    robot_texture.wrapT = THREE.RepeatWrapping;

    

    robot = new THREE.Object3D()
    robot.castShadow = true;
    robot.receiveShadow = true;

    //  robot_material = new THREE.MeshBasicMaterial({color:'red', wireframe:false})
    // robot_material = new THREE.MeshNormalMaterial({wireframe:false, flatShading:true})
    robot_material = new THREE.MeshPhongMaterial({color:'gray', wireframe:false, map:robot_texture})
    var reflective_material = new THREE.MeshPhongMaterial({color:'white', wireframe:false, envMap:textureCube, reflectivity:0.9})
    var lamb_material = new THREE.MeshLambertMaterial({color:'red', wireframe:false})
    
    const base_geometry = new THREE.CylinderGeometry(50, 50, 15, 30)
    const base_mesh = new THREE.Mesh(base_geometry, robot_material)
    base_mesh.position.y = 10;
    base_mesh.castShadow = true;
    base_mesh.receiveShadow = true;
    
    brazo = new THREE.Object3D()
    const eje_geometry = new THREE.CylinderGeometry(20, 20, 18, 30)
    const eje_mesh = new THREE.Mesh(eje_geometry, robot_material)
    eje_mesh.rotation.x = Math.PI/2;
    eje_mesh.castShadow = true;
    eje_mesh.receiveShadow = true;

    const esparrago_geometry = new THREE.BoxGeometry(12, 120, 18)
    const esparrago_mesh = new THREE.Mesh(esparrago_geometry, robot_material)
    esparrago_mesh.position.y = 60;
    esparrago_mesh.castShadow = true;
    esparrago_mesh.receiveShadow = true;

    const rotula_geometry = new THREE.SphereGeometry(20, 20, 20)
    const rotula_mesh = new THREE.Mesh(rotula_geometry, reflective_material)
    rotula_mesh.position.y = 120
    rotula_mesh.castShadow = true;
    rotula_mesh.receiveShadow = true;

    antebrazo = new THREE.Object3D()
    const disco_geometry = new THREE.CylinderGeometry(22, 22, 6, 30)
    const disco_mesh = new THREE.Mesh(disco_geometry, robot_material)
    disco_mesh.position.y = 0
    disco_mesh.castShadow = true;
    disco_mesh.receiveShadow = true;

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

    nervio1.castShadow = true;
    nervio1.receiveShadow = true;
    nervio2.castShadow = true;
    nervio2.receiveShadow = true;
    nervio3.castShadow = true;
    nervio3.receiveShadow = true;
    nervio4.castShadow = true;
    nervio4.receiveShadow = true;

    mano = new THREE.Object3D()
    const mano_geometry = new THREE.CylinderGeometry(15, 15, 40, 30);
    const mano_mesh = new THREE.Mesh(mano_geometry, robot_material)
    mano_mesh.position.y = 0;
    mano_mesh.rotation.x = Math.PI/2;
    mano_mesh.castShadow = true;
    mano_mesh.receiveShadow = true;

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
    
    pinza_mesh1.position.set(0, -10, 15)
    pinza_mesh1.castShadow = true;
    pinza_mesh1.receiveShadow = true;
    
    pinza_mesh2.rotation.x = Math.PI
    pinza_mesh2.position.set(0, 10, -15)
    pinza_mesh2.castShadow = true;
    pinza_mesh2.receiveShadow = true;
    
    mano.position.y = 86

    // compose the hierarchy
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
    // controls.listenToKeyEvents( window ); // remove to disable keyboard controls

    controls.minDistance = 100;
	controls.maxDistance = 500;
    controls.update()
    
    /*
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    }
    */
    
    // brazo.rotation.z = Math.PI/8
    // antebrazo.rotation.z = -Math.PI/2
}

function update() {
    let delta  = clock.getDelta();
    if (right_arrow) {
        robot.position.x += robot_speed * delta;
    }
    if (left_arrow) {
        robot.position.x -= robot_speed * delta;
    }
    if (up_arrow) {
        robot.position.z -= robot_speed * delta;
    }
    if (down_arrow) {
        robot.position.z += robot_speed * delta;
    }

}

function render(time) {
    var WIDTH = window.innerWidth, HEIGHT = window.innerHeight;
    var minDim = Math.min(WIDTH, HEIGHT);

    requestAnimationFrame(render)
    TWEEN.update(time)
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



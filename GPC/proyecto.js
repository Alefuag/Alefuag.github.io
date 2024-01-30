
import * as THREE from "./lib/three.module.js"
import * as CANNON from "./lib/cannon-es.module.js";
import {GLTFLoader} from "./lib/GLTFLoader.module.js"
import { OrbitControls } from "./lib/OrbitControls.module.js";
import { TWEEN } from "./lib/tween.module.min.js"
import { GUI } from "./lib/lil-gui.module.min.js";
// import { stats } from "../lib/stats.module.js";


//variables estandar
let renderer, scene, camera, top_camera, controls;


let floor_material, material;
let clock = new THREE.Clock();
let speed = 200, num_obstaculos = 20;
let right_arrow = false, left_arrow = false, up_arrow = false, down_arrow = false;
let AmbientLight, directionalLight, pointLight, spotLight;
let player, playerBody, obstacles = [], obstacleBodies = [], world;

//Acciones
init();
loadScene();
initCannon();
initLighting();
initGUI();
render();
clock.stop();


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

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 10000)
    camera.position.set(0, 200, -200);
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

function loadScene() {
    material = new THREE.MeshPhongMaterial({color:'white', wireframe:false})
    
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000, 100000, 500, 500), material)
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = -0.2;
    suelo.receiveShadow = true;
    
    scene.add(suelo)
    
    // add image texture to the ground
    var loader = new THREE.TextureLoader();
    var basepath = './images/';
    loader.setPath( basepath );
    var texture = loader.load('brick_wall.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 5, 100 );
    suelo.material.map = texture;

    // añadir skybox
    var loader = new THREE.CubeTextureLoader();
    var basepath = './interstellar_skybox/';
    loader.setPath( basepath );
    var textureCube = loader.load([
        'xpos.png', 'xneg.png',
        'ypos.png', 'yneg.png',
        'zpos.png', 'zneg.png'
    ]);
    textureCube.format = THREE.RGBAFormat;
    
    //add background texture
    scene.background = textureCube;

    // add player
    player = new THREE.Object3D();
    var player_loader = new GLTFLoader();
    var basepath = './models/robota/';
    player_loader.setPath(basepath);
    player_loader.load('scene.gltf', function (gltf) {
        player.add(gltf.scene);
        player.scale.set(0.5, 0.5, 0.5);
        player.position.set(0, 50, 0);
        player.rotation.y = Math.PI;
        player.name = "player";
        player.castShadow = true;
        player.receiveShadow = true;
        scene.add(player);
        console.log('robot loaded');
    });
}

function initLighting() {
    var ambient = new THREE.AmbientLight(0xffffff, 0.1)
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

    spotLight = new THREE.SpotLight( 0x0000ff, 1, 5000, 0.1);
    spotLight.position.set( -50, 400, 50 );
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    spotLight.shadow.camera.near = 10;
    spotLight.shadow.camera.far = 1000;
    spotLight.shadow.camera.fov = 30;

    scene.add( spotLight );

    // const helper = new THREE.CameraHelper( directionalLight.shadow.camera );
    // scene.add( helper );

    // const helper2 = new THREE.CameraHelper( pointLight.shadow.camera );
    // scene.add( helper2 );
}

function initGUI() {
    const gui = new GUI()
    // create degrees variable for each joint
    var playpause = {play: function() {clock.start()}, pause: function() {clock.stop()}}

    gui.add(playpause, 'play').name('Play')
    gui.add(playpause, 'pause').name('Pause')
    gui.add({restart: function() {restartGame()}}, 'restart').name('Restart')
}


function initCannon() {
    world = new CANNON.World();
    world.gravity.set(0, 0, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;

    // Create ground
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);

    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Create player collider
    var playerShape = new CANNON.Box(new CANNON.Vec3(50, 50, 10));
    playerBody = new CANNON.Body({ mass: 1 });
    playerBody.addShape(playerShape);
    playerBody.position.set(0, 50, 0);  
    playerBody.velocity.set(0, 0, 1000);
    world.addBody(playerBody);

    // Create obstacles colliders
    for (let i = 0; i < obstacles.length; i++) {
        var obstacleShape = new CANNON.Box(new CANNON.Vec3(50, 50, 10));
        var obstacleBody = new CANNON.Body({ mass: 0 });
        obstacleBody.addShape(obstacleShape);

        // Randomly position obstacles in front of the player
        var randomX = Math.random() * 200 - 100; // Random X position between -100 and 100
        var randomZ = -Math.random() * 200; // Random Z position behind the player
        obstacleBody.position.set(randomX, 50, randomZ);

        world.addBody(obstacleBody);
    }
}


function checkCollision() {
    for (let i = 0; i < obstacleBodies.length; i++) {
        let distance = playerBody.position.distanceTo(obstacleBodies[i].position);
        if (distance < player.geometry.boundingSphere.radius + obstacles[i].geometry.boundingSphere.radius) {
            restartGame();
            break;
        }
    }
}

function restartGame() {
    // Reset player position and velocity
    playerBody.position.set(0, 0, 0);
    playerBody.velocity.set(0, 0, 0);

    // Reset obstacle positions
    for (let i = 0; i < obstacleBodies.length; i++) {
        obstacleBodies[i].position.set(0, 0, 0);
        obstacleBodies[i].velocity.set(0, 0, 0);
    }
}

function update() {
    let delta = clock.getDelta();
    if (right_arrow) {
        move_right(delta);
    }
    if (left_arrow) {
        move_left(delta);
    }
    if (up_arrow) {
        // jump(delta);
    }
    if (down_arrow) {

    }

    // update physics
    if (delta > 0) {
        world.step(delta);
    }
    player.position.copy(playerBody.position);
    player.quaternion.copy(playerBody.quaternion);

    // update camera
    camera.position.x = player.position.x;
    camera.position.z = player.position.z - 200;
    camera.position.y = player.position.y + 200;

    camera.lookAt(new THREE.Vector3(player.position.x, player.position.y + 50, player.position.z));

    // update obstacles
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].position.copy(obstacles[i].body.position);
        obstacles[i].quaternion.copy(obstacles[i].body.quaternion);
    }

    // check collision
    checkCollision();
}



function move_right(delta) {
    playerBody.velocity.x = -speed;
}

function jump(delta) {
    playerBody.velocity.y = 100;
}

function move_left(delta) {
    playerBody.velocity.x = speed;
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
    // renderer.render(scene, top_camera)
    renderer.setScissorTest(false)
}



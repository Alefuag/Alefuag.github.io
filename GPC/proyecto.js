
import * as THREE from "./lib/three.module.js"
import * as CANNON from "./lib/cannon-es.module.js";
import {GLTFLoader} from "./lib/GLTFLoader.module.js"
import { OrbitControls } from "./lib/OrbitControls.module.js";
import { TWEEN } from "./lib/tween.module.min.js"
import { GUI } from "./lib/lil-gui.module.min.js";
// import { stats } from "../lib/stats.module.js";

const sleep = ms => new Promise(r => setTimeout(r, ms));

//variables estandar
let renderer, scene, camera, top_camera, controls;

let playerMaterial, floor_material, brick_material, material;
let clock = new THREE.Clock();
let speed = 500, num_obstaculos = 200, distancia_entre_obstaculos = 500;
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
// clock.stop();


function checkDown(e) {
    if (e.keyCode == '38') { up_arrow = true; }
    else if (e.keyCode == '40') { down_arrow = true;}
    else if (e.keyCode == '37') { left_arrow = true; playerBody.velocity.x = speed;}
    else if (e.keyCode == '39') { right_arrow = true; playerBody.velocity.x = -speed;}
    else if (e.keyCode == '80') { clock.stop(); }
    else if (e.keyCode == '32') { clock.start(); }
    else if (e.keyCode == '83') { startGame(); }
    // console.log(e.keyCode);
}

function checkUp(e) {
    if (e.keyCode == '38') { up_arrow = false; }
    else if (e.keyCode == '40') { down_arrow = false; }
    else if (e.keyCode == '37') { left_arrow = false; playerBody.velocity.x = 0;}
    else if (e.keyCode == '39') { right_arrow = false; playerBody.velocity.x = 0;}
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

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 1, 100000)
    camera.position.set(0, 20, -20);
    camera.lookAt(0, 6, 0);
    // scene.add(camera);

    top_camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000)
    top_camera.position.set(0, 30, 0)
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
    floor_material = new THREE.MeshPhongMaterial({color:'white', wireframe:false})
    playerMaterial = new THREE.MeshPhongMaterial({color:'white', wireframe:false})
    brick_material = new THREE.MeshPhongMaterial({color:'white', wireframe:false})
    
    // add floor
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(1000, 100000, 500, 500), material)
    suelo.rotation.x = -Math.PI/2;
    suelo.position.y = -0.2;
    suelo.receiveShadow = true; 

    scene.add(suelo)
    
    // add walls
    const boundaryGeometry = new THREE.BoxGeometry(10, 50, 100000);
    const boundaryMaterial = new THREE.MeshBasicMaterial({color: 'brown', wireframe: false});
    const boundary1 = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
    const boundary2 = new THREE.Mesh(boundaryGeometry, boundaryMaterial);

    boundary1.position.set(-500, 25, 0);
    boundary2.position.set(500, 25, 0);

    scene.add(boundary1);
    scene.add(boundary2);
    
    
    var loader = new THREE.TextureLoader();
    var basepath = './images/';
    loader.setPath( basepath );
    var playertexture = loader.load('ball.jpg');
    playertexture.wrapS = THREE.RepeatWrapping;
    playertexture.wrapT = THREE.RepeatWrapping;
    playertexture.repeat.set( 1, 1 );
    playerMaterial.map = playertexture;

    // add image texture to the ground
    var loader = new THREE.TextureLoader();
    loader.setPath( basepath );
    var texture = loader.load('brick_wall.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 5, 100 );
    suelo.material.map = texture;

    // add image texture to the walls
    var loader = new THREE.TextureLoader();
    loader.setPath( basepath );
    var brick_texture = loader.load('brick.jpg');
    brick_texture.wrapS = THREE.RepeatWrapping;
    brick_texture.wrapT = THREE.RepeatWrapping;
    brick_texture.repeat.set( 5, 1 );
    brick_material.map = brick_texture;

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

    // add player as sphere
    player = new THREE.Mesh(new THREE.SphereGeometry(25, 32, 32), playerMaterial)
    player.position.set(0, 50, 0);
    player.castShadow = true;
    player.receiveShadow = true;
    scene.add(player)

    // Generate random obstacles
    for (let i = 0; i < num_obstaculos; i++) {
        const obstacle = new THREE.Mesh(new THREE.BoxGeometry(100 + 250*Math.random(), 50, 50), brick_material);
        const x = Math.random() * 800 - 400; // Random x position between -450 and 450
        const y = 25; // Fixed y position
        const z = distancia_entre_obstaculos*(i+1);
        obstacle.position.set(x, y, z);
        obstacle.castShadow = true;
        obstacle.receiveShadow = true;
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
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
    var playpause = {play: function() {clock.start(); }, pause: function() {clock.stop()}}

    gui.add({start: startGame}, 'start').name('Start Game (S)')
    gui.add(playpause, 'play').name('Play (Space)')
    gui.add(playpause, 'pause').name('Pause (P)')
}

function startGame() {
    clock.start();
    playerBody.velocity.set(0, 0, 1000);
}

function initCannon() {
    world = new CANNON.World();
    world.gravity.set(0, -9.81, 0);
    const groundCannonMaterial = new CANNON.Material("groundMaterial");
    const playerCannonMaterial = new CANNON.Material("playerMaterial");

    const ground_player_cm = new CANNON.ContactMaterial(groundCannonMaterial, playerCannonMaterial, {
        friction: 0.0,
        restitution: 0.0,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e8,
        frictionEquationRegularizationTime: 3,
    });
    world.addContactMaterial(ground_player_cm);

    // Create ground
    var groundBody = new CANNON.Body({
        shape: new CANNON.Plane(),
        type: CANNON.Body.STATIC,
        material: groundCannonMaterial,
    });

    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Create player collider
    // shape: new CANNON.Sphere(25), // new CANNON.Box(new CANNON.Vec3(10, 50, 10) ), // new CANNON.Sphere(30),
    playerBody = new CANNON.Body({
        position: new CANNON.Vec3(0, 50, 0),
        mass: 1,
        material: playerCannonMaterial,
    });
    playerBody.addShape(new CANNON.Sphere(25));
    playerBody.linearDamping = 0;
    playerBody.velocity.set(0, 0, 0);
    world.addBody(playerBody);

    // add wall colliders
    var boundaryBody1 = new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(10, 10, 100000)),
        type: CANNON.Body.STATIC,
        material: groundCannonMaterial,
    });
    boundaryBody1.position.set(-500, 50, 0);
    world.addBody(boundaryBody1);

    var boundaryBody2 = new CANNON.Body({
        shape: new CANNON.Box(new CANNON.Vec3(10, 10, 100000)),
        type: CANNON.Body.STATIC,
        material: groundCannonMaterial,
    });
    boundaryBody2.position.set(500, 50, 0);
    world.addBody(boundaryBody2);

    // add obstacle colliders
    for (let i = 0; i < obstacles.length; i++) {
        const x = obstacles[i].position.x;
        const y = obstacles[i].position.y;
        const z = obstacles[i].position.z;
        
        const height = obstacles[i].geometry.parameters.height;
        const width = obstacles[i].geometry.parameters.width;
        const depth = obstacles[i].geometry.parameters.depth;

        const obstacleBody = new CANNON.Body({
            shape: new CANNON.Box( new CANNON.Vec3(width/2, height/2, depth/2) ),
            position: new CANNON.Vec3(x, y, z),
            type: CANNON.Body.STATIC,
            material: groundCannonMaterial,
            isTrigger: true,
        });
        
        obstacleBody.addEventListener("collide", function (e) {
            if (e.body === playerBody) {
                console.log("Player collided with obstacle");
                playerBody.velocity.z = 0;
                playerBody.velocity.x = 0;
                playerBody.velocity.y = 0;
                playerBody.position.set(0, 50, 0);
                playerBody.quaternion.set(0, 0, 0, 1);
            }
        });
        world.addBody(obstacleBody);
        obstacleBodies.push(obstacleBody);
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
        dont_move(delta);
    }

    // update physics
    if (delta > 0) {
        world.step(delta);
    }

    // update player (sphere)
    player.position.copy(playerBody.position);
    player.quaternion.copy(playerBody.quaternion);

    // update camera
    camera.position.x = player.position.x;
    camera.position.z = player.position.z - 200;
    camera.position.y = player.position.y + 200;

    camera.lookAt(new THREE.Vector3(player.position.x, player.position.y + 50, player.position.z));

    // update obstacles
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].position.copy(obstacleBodies[i].position);
        obstacles[i].quaternion.copy(obstacleBodies[i].quaternion);
    }

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

function dont_move(delta) {
    playerBody.velocity.x = 0;
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



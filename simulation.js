// Global script parameters
var scene, camera, world, tot_time = 7, step_time = 1/60, time = 0, run = false, coins = 100, init_done = false;

//Global Array of coins
var bodies = []
var meshes = []

// Global coin parameters
var radius, height, segments;

// Default initialization
radius = 1;
height =  1;
segments = 100;


// Collision groups
var GROUP1 = 1; // Ground
var GROUP2 = 2; // Coin



function setupWorld(demo){
    var world = new CANNON.World(); // Create a world
    world.gravity.set(0,-9.81,0); // With earth gravity
    world.broadphase = new CANNON.NaiveBroadphase();
    
    // More precise physics solver
    world.solver.iterations = 20;

    // More precise friction solver
    world.defaultContactMaterial.contactEquationStiffness = 5e6;
    world.defaultContactMaterial.contactEquationRelaxation = 3;

    // Ground Plane
    var n = new CANNON.Vec3(0,0,1);
    n.normalize();
    var groundShape = new CANNON.Plane(n);
    groundBody = new CANNON.Body({
        mass: 0,
        material: new CANNON.Material(),
        collisionFilterGroup: GROUP1, // Ground group
        collisionFilterMask: GROUP2, // It can only collide with  coins
    });
    groundBody.addShape(groundShape);
    groundBody.position.set(0,0,0);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), - Math.PI / 2)
    world.addBody(groundBody);

    // Get the mesh 
    mesh = shape2mesh(groundBody)
    
    mesh.castShadow = true;
    mesh.quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
    mesh.receiveShadow = true;
    

    return [world, mesh]
}

function setupCoin(world){
    // Create the coin
    var coinBody = new CANNON.Body({
        mass: 1,
        material: new CANNON.Material(),
        collisionFilterGroup: GROUP2, // Coins Group
        collisionFilterMask: GROUP1, // It can only collide with the ground
    });
    var coinShape = new CANNON.Cylinder(radius, radius, height, segments);
    coinBody.addShape(coinShape);
    coinBody.position.set(getRandomNumber(-10,10), getRandomNumber(0,10), getRandomNumber(-10,10));
    coinBody.velocity.set(getRandomNumber(-10,10), getRandomNumber(-10,10), getRandomNumber(-10,10));
    coinBody.angularVelocity.set(getRandomNumber(-10,10), getRandomNumber(-10,10), getRandomNumber(-10,10));


    // Add it to the world
    world.add(coinBody);

    // Coin-ground interaction parameters
    var coin_ground = new CANNON.ContactMaterial(coinBody.material, groundBody.material, {
        friction: 0.6, // https://physics.ucf.edu/~saul/01-Spr_2048C/04-Forces/FrictionCoeffs.html
        restitution: 0.3, // https://en.wikipedia.org/wiki/Coefficient_of_restitution
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3,
        frictionEquationStiffness: 1e8,
        frictionEquationRegularizationTime: 3,
    });
    world.addContactMaterial(coin_ground);

    // Get the mesh
    mesh = shape2mesh(coinBody)
    return [coinBody, mesh]
}

function addCoin(){
    [coinBody, coinMesh] = setupCoin(world);
    bodies.push(coinBody);
    meshes.push(coinMesh);
    scene.add(coinMesh)
}

function setupScene(){
    // Create the scene
    scene = new THREE.Scene();

    // Container element
    var container = document.getElementById("simulation")

    // Always look at the scene center
    camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 1, 3000);
    camera.position.set(20,20,20);
    camera.lookAt(new THREE.Vector3());
    scene.add(camera);

    // Add some lights
    scene.add( new THREE.AmbientLight( 0x666666 ) );

    light = new THREE.DirectionalLight( 0xffffff, 1.75 );
    var d = 20;
    light.position.set( d, d, d );
    light.castShadow = true;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;
    light.shadowCameraLeft = -d;
    light.shadowCameraRight = d;
    light.shadowCameraTop = d;
    light.shadowCameraBottom = -d;
    light.shadowCameraFar = 3*d;
    light.shadowCameraNear = d;
    light.shadowDarkness = 0.5;
    scene.add( light );

    var grid = new THREE.GridHelper( 200, 100 );
    scene.add( grid );

    
    return scene
}

function init(){
    // Rendering object
    renderer = new THREE.WebGLRenderer();
    // Container element
    var container = document.getElementById("simulation")
    // Fill it
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    // Append canvas
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    var groundMesh;
    [world, groundMesh] = setupWorld();
    scene = setupScene();
    scene.add(groundMesh);
    
    for(var i = 0; i < coins; i++) addCoin();
    init_done = true
}

function animate(){
    if(time <= tot_time){
        requestAnimationFrame(animate)

        world.step(1/60)

        for(var i = 0; i < meshes.length;i++){
            meshes[i].position.copy(bodies[i].position)
            meshes[i].quaternion.copy(bodies[i].quaternion)
        }

        renderer.render(scene, camera)

        time += step_time
        events.emit("progress", time/tot_time)
    }
    else {
        finish()
    }
}

function finish(){
    up = 0
    down = 0
    side = 0
    for(var i = 0; i < bodies.length;i++){
        var res = getResult(toEuler(bodies[i].quaternion)[2])
        if(res == "UP")
            up += 1
        if(res == "DOWN")
            down += 1
        if(res == "SIDE")
            side += 1
    }
    console.log("UP:",up," DOWN:",down," SIDE:",side)
    events.emit("finish")
}


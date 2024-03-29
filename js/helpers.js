import * as THREE from 'three';


/**
 * Linearly interpolates between two vectors.
 * @param {THREE.Vector2} start - The starting vector.
 * @param {THREE.Vector2} target - The target vector.
 * @param {number} [t=0] - The interpolation factor.
 * @returns {THREE.Vector2} - The interpolated vector.
 */
export function lerp(start, target, t=0){
    const newStart = new THREE.Vector2();
    newStart.x = start.x * (1 - t) + target.x * t;
    newStart.y = start.y * (1 - t) + target.y * t;
    return newStart;
}

/**
 * Generates a random number between a minimum and maximum value.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} - The random number.
 */
export let randomMinMax = (min, max) => Math.random() * (max - min) + min;

/**
 * Calculates the interpolation time between two vectors.
 * @param {THREE.Vector2} From - The starting vector.
 * @param {THREE.Vector2} To - The target vector.
 * @param {THREE.Vector2} int - The intermediate vector.
 * @returns {number} - The interpolation time.
 */
export let interTime = (From, To, int) => 1 - (To.x - int.x)/(To.x - From.x);

/**
 * Calculates the distance between two 2D vectors.
 * @param {THREE.Vector2} a - The first vector.
 * @param {THREE.Vector2} b - The second vector.
 * @returns {number} - The distance between the vectors.
 */
export let distance2D = (a, b) => Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);

/**
 * Determines the quadrant of a position vector.
 * @param {THREE.Vector2} pos - The position vector.
 * @returns {number} - The quadrant number (0, 1, 2, 3) or -1 if not in any quadrant.
 */
export function quadrant(pos){
	const upperY = -pos.x*1;
	const bottomY = pos.x*1;
	if (pos.x < 0 && pos.y < upperY && pos.y > bottomY) 
		return 2;
	if (pos.x >= 0 && pos.y > upperY && pos.y < bottomY)
		return 3;
	if (pos.x < 0 && pos.y < bottomY)
		return 1;
	if (pos.x > 0 && pos.y < upperY)
		return 1;
	if (pos.x < 0 && pos.y > upperY)
		return 0;
	if (pos.x > 0 && pos.y > bottomY)
		return 0;
	return -1;
}

const wallMat = new THREE.TextureLoader().load( 'assets/StoneFloorTexture.png' );
wallMat.wrapS = THREE.RepeatWrapping;
wallMat.wrapT = THREE.RepeatWrapping;
wallMat.repeat.set( 6, 1 );

/**
 * Creates a cube mesh with the specified sizes and base color.
 * @param {number[]} sizes - The sizes of the cube [width, height, depth].
 * @param {number} [baseColor=0x00] - The base color of the cube.
 * @returns {THREE.Mesh} - The cube mesh.
 */
export function makeCube(sizes, baseColor=0x00) {
    const geometry = new THREE.BoxGeometry( sizes[0], sizes[1], sizes[2] );
    const material = new THREE.MeshBasicMaterial( { color: baseColor } );
    const cube = new THREE.Mesh( geometry, material );
    cube.name = "simpleCube";
    return cube;
}

/**
 * Creates a circle mesh with the specified radius and color.
 * @param {number} radius - The radius of the circle.
 * @param {number} color - The color of the circle.
 * @returns {THREE.Mesh} - The circle mesh.
 */
export function makeCircle(radius, color){
    const geometry = new THREE.CircleGeometry( radius, 32 );
    const material = new THREE.MeshBasicMaterial( { color: color } );
    const circle = new THREE.Mesh( geometry, material );
    circle.name = "circle";
    return circle;
}

/**
 * Creates a square mesh with the specified size and color.
 * @param {number} radius - The size of the square.
 * @param {number} [color=0xFF0000] - The color of the square.
 * @returns {THREE.Mesh} - The square mesh.
 */
export function makeSquare(radius, color=0xFF0000){
    const geometry = new THREE.PlaneGeometry( radius,radius );
    const material = new THREE.MeshBasicMaterial( { color: color } );
    const circle = new THREE.Mesh( geometry, material );
    circle.name = "square";
    return circle;
}

/**
 * Creates a horizontal wall mesh with the specified position and size.
 * @param {number[]} where - The position of the wall [x, y, z].
 * @param {number[]} size - The size of the wall [width, height, depth].
 * @returns {THREE.Mesh} - The horizontal wall mesh.
 */
export function horiWall(where, size){
    let geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    let rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationZ(Math.PI / 2);
    geometry.applyMatrix4(rotationMatrix);
    let material = new THREE.MeshBasicMaterial( { map: wallMat } );
    let wall = new THREE.Mesh( geometry, material );
    wall.position.set(where[0], where[1], where[2]);
    wall.name = "horiWall";
    return wall;
}

/**
 * Creates a vertical wall mesh with the specified position and size.
 * @param {number[]} where - The position of the wall [x, y, z].
 * @param {number[]} size - The size of the wall [width, height, depth].
 * @returns {THREE.Mesh} - The vertical wall mesh.
 */
export function vertWall(where, size){
    let geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    geometry.translate(where[0], where[1], where[2]);
    let material = new THREE.MeshBasicMaterial( { map: wallMat } );
    let wall = new THREE.Mesh( geometry, material );
    wall.name = "vertWall";
    return wall;
}

/**
 * Creates a branch mesh with the specified size and position.
 * @param {number[]} size - The size of the branch [width, height, depth].
 * @param {number[]} where - The position of the branch [x, y, z].
 * @returns {THREE.Mesh} - The branch mesh.
 */
export function makeBranch(size, where){
    let geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const wallMat = new THREE.TextureLoader().load( 'assets/wood.png' );
    let material = new THREE.MeshBasicMaterial( { map: wallMat } );
    let wall = new THREE.Mesh( geometry, material );
    wall.position.x = where[0];
    wall.position.y = where[1];
    wall.position.z = where[2];
    wall.rotation.z = Math.PI/3;
    wall.name = "branch";
    return wall;
}

/**
 * Adds random branches to the scene.
 * @param {THREE.Scene} scene - The scene to add the branches to.
 * @param {number} size - The size of the branches.
 * @returns {THREE.Mesh[]} - An array of the added branch meshes.
 */
export function puttingBranches(scene,size){
    let branches = []
    const nBranches = Math.random()*(3*size);
    for (let i = 0; i < nBranches; i++) {
        let randomWood = makeBranch([1.2, 0.5, 0.5], 
            [-size*2 + 5*Math.round(Math.random()*size) - Math.random(), -size*2 + 5*Math.round(Math.random()*size) - Math.random(), 0]);
        branches.push(randomWood);
        scene.add( randomWood );
    }
    return branches;
}

/**
 * Creates a portal mesh with the specified size and color.
 * @param {number} size - The size of the portal.
 * @param {number} color - The color of the portal.
 * @returns {THREE.Mesh} - The portal mesh.
 */
export function makePortal(size, color){
    const vertexShaderT = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    const fragmentShaderT = `
        varying vec2 vUv;
        uniform float time;
        void main(){
            float dist = distance(vUv, vec2(0.5)); 
            vec3 interp = mix(vec3(0., 0., 1.), vec3(0., 1., 0.), dist);
            gl_FragColor = vec4(interp, 1.);
        }
    `;
    const geometry = new THREE.CircleGeometry( size, 32 );
    const material = new THREE.ShaderMaterial( {
        uniforms: {"time" : {value: 0}},
        vertexShader: vertexShaderT,
        fragmentShader: fragmentShaderT
    });
    const circle = new THREE.Mesh( geometry, material );
    circle.name = "portal";
    return circle;
}
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const loader = new THREE.TextureLoader();

// load a resource
const mat = loader.load(
	// resource URL
	'assets/uv.png',

	// onLoad callback
	function ( texture ) {
		// in this example we create the material when the texture is loaded
		const material = new THREE.MeshBasicMaterial( {
			map: texture
		 } );
	},

	// onProgress callback currently not supported
	undefined,

	// onError callback
	function ( err ) {
		console.error( 'An error happened.' );
	}
);

const material = new THREE.MeshBasicMaterial( { map: mat } );

const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

cube.position.x = 0;
camera.position.z = 5;


function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}
animate();


/**
 * The main script for the WebGL application.
 * Imports necessary modules and initializes variables.
 * Handles user input and updates the scene accordingly.
 * @module main
 */

import * as THREE from 'three';

import { makeCube, makeCircle, makeSquare, makeBranch, puttingBranches, quadrant, interTime} from './helpers';
import { BallotHandler } from './ballotSystem';
import { PortalHandler } from './portalSystem';
import { EnemyHandler} from './EnemySystem';
import { renderMaze, renderMazeWithHole } from './maze';
import { PlayerHandler } from './playerHandler';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

// Initializing variables
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector3();

let nBranches = 1;
let nBombs = 0;
let maxBranches = 20;
let maxBombs = 1;
const maxPortals = 7;
const vel = 0.05;

let mouseDown = false;
let actionTaken = 0;
let distanceT = 1;
let directionX = 0;
let directionY = 0;

let onSprint = 100;
let restSprint = 0;
const maxSprint = 50;

let portalButtom = document.getElementById('portalButt');
let swordButtom = document.getElementById('swordButt');
let weightButtom = document.getElementById('weightButt');
let remainingBranches = document.getElementById('remaining');

let tool = "portals";
let buttomClicked = false;

let from = new THREE.Vector2();
let target = new THREE.Vector2();
let difference = new THREE.Vector2(0, 0);
let mouse = new THREE.Vector2();
let mappedMouse = new THREE.Vector3();

const backMat = new THREE.TextureLoader().load( 'assets/ground0004.jpg' );
let circle = makeCircle(0.2, 0x0000ff);
let bigCircle = makeSquare(0.5, 0xffffff);

let size = 6;
const initialSize = size;
let totalSize = size;
const scene = new THREE.Scene();
const sizeFactor = 140;
const camera = new THREE.OrthographicCamera( window.innerWidth / - sizeFactor, window.innerWidth / sizeFactor, window.innerHeight / sizeFactor, window.innerHeight / - sizeFactor, 0.1, 1000 );

let initialEnemies = 5;

const renderer = new THREE.WebGLRenderer({alpha: true});

let ballot = new BallotHandler(scene, maxBranches, [0.50, 0.50, 0.50], 0.01, (size) => makeCube(size, 0x0000ff));
let bombHandler = new BallotHandler(scene, maxBombs, [0.75, 0.75, 0.75], 0.005, (size) => makeCube(size, 0xffffff));
let portalHandl = new PortalHandler(scene, maxPortals, 0.4, 0.06);
let enemyHandler = new EnemyHandler(camera, renderer, scene, size, 20, "assets/enemyBasic.png");
let playerHandler = new PlayerHandler("assets/player.png", 10, 6, 19, enemyHandler);

let composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

bombHandler.amplitude = 2;
renderer.setPixelRatio( window.devicePixelRatio );
raycaster.params.Line.threshold = 0.1
raycaster.params.Points.threshold = 0.1

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

backMat.wrapS = THREE.RepeatWrapping;
backMat.wrapT = THREE.RepeatWrapping;
backMat.repeat.set( 8, 8 );
backMat.emissive = 0x00000;
backMat.emissiveIntensity = 10;

scene.background = new THREE.Color(0x4E4E4E);

enemyHandler.setPlayerHandler(playerHandler);
scene.add( playerHandler.plane );
enemyHandler.spawn(-size*2, -size*2+5);
for (let i = 0; i < initialEnemies; i++) enemyHandler.spawn();

const geometry = new THREE.PlaneGeometry( size*5, size*5 );
const material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide} );
material.map = backMat;

let plane = new THREE.Mesh( geometry, material );
plane.position.set(size/2-2.5, size/2-2.5, -5);

scene.add( plane );
scene.add( circle );
scene.add( bigCircle );

circle.position.set(-1000, -1000, -1);
bigCircle.position.set(-1000, -1000, -1);
camera.position.z = 10;

camera.position.x = -size*2;
camera.position.y = -size*2;

playerHandler.plane.position.set(-size*2, -size*2, -1);

pointer.z = camera.position.z-10;
mappedMouse.z = camera.position.z-10;

let tempRay = new THREE.Raycaster();
tempRay.far = 20;

/**
 * Creates a cube with the given size and adds it to the scene at the specified position.
 * @param {Object} pos - An object containing the x and y coordinates where the cube will be placed.
 * @param {Array} size - An array containing the width, height, and depth of the cube. Defaults to [0.2, 0.2, 0.2].
 * @returns {Object} The cube that was created and added to the scene.
 */
function debugCube(pos, size = [0.2, 0.2, 0.2]){
	let cube = makeCube(size);
	cube.position.x = pos.x;
	cube.position.y = pos.y;
	cube.position.z = 5//pos.z;
	scene.add( cube );
	return cube;
}

/**
 * Returns an array of objects that intersect with the mouse position in the scene.
 * @returns {Array} An array of intersected objects.
 */
function mouseIntersections(){
	let imdumb = new THREE.Vector3();
	imdumb.x = mouse.x;
	imdumb.y = mouse.y;
	imdumb.z = camera.position.z-10;
	raycaster.setFromCamera( imdumb, camera );
	const intersects = raycaster.intersectObjects( scene.children );
	return intersects;
}

/**
 * Checks if the player can move in the specified direction.
 * @param {number} dirX - The direction in the x-axis. Defaults to 0.
 * @param {number} dirY - The direction in the y-axis. Defaults to 0.
 * @returns {boolean} True if the player can move in the specified direction, false otherwise.
 */
function canMove(dirX = 0, dirY = 0){
	pointer.x = 0;
	pointer.y = 0;
	pointer.x += dirX;
	pointer.y += dirY;
	raycaster.setFromCamera( pointer, camera );
	const intersects = raycaster.intersectObjects( scene.children );
	pointer.x -= dirX;
	pointer.y -= dirY;
	
	if (intersects.length > 0 && intersects[0].object.name == "branch"){
		nBranches += 1;
		scene.remove(intersects[0].object);
		return true;
	}
	return !(intersects.length > 0 && intersects[0].object != playerHandler.plane && intersects[0].object.name != "enemy");
}

/**
 * Initiates a fight between the player and enemies.
 */
function fight(){
	playerHandler.fight = true;
	playerHandler.fightState = 0;
	difference.set(-playerHandler.plane.position.x + mappedMouse.x, -playerHandler.plane.position.y + mappedMouse.y)
	playerHandler.quadrant = quadrant(difference);
}

/**
 * Loads a new level by generating a new maze and updating the scene.
 */
function loadNewLevel(){
	for (let i = scene.children.length - 1; i >= 0; i--) {
		let object = scene.children[i];
		if (object.name === 'horiWall' || object.name === 'vertWall' || object.name === 'branch')
			scene.remove(object);
	}
	size += 2;
	renderMazeWithHole(scene, size, [[size-1, Math.round(size/2)]], [2, 2]);
	playerHandler.plane.position.x = -size*2;
	branches = puttingBranches(scene, size);

	scene.remove(plane);
	plane = new THREE.Mesh( new THREE.PlaneGeometry( size*5, size*5 ), material );
	plane.position.x = size/2-2.5;
	plane.position.y = size/2-2.5;
	plane.position.z = -5;
	scene.add( plane );

	totalSize = size;
	enemyHandler.setNewSize(totalSize);
	initialEnemies += 5;
	for (let i = 0; i < initialEnemies; i++) enemyHandler.spawn();
}

/**
 * Converts a position in world coordinates to maze coordinates.
 * @param {Object} position - The position in world coordinates.
 * @returns {Array} The position in maze coordinates.
 */
let toMazeCoord = (position) => [Math.floor((position.x+initialSize*2+2.5)/5), Math.floor((position.y+initialSize*2+2.5)/5)];

/**
 * Converts a position in world coordinates to maze coordinates.
 * @param {Array} position - The position in world coordinates.
 * @returns {Array} The position in maze coordinates.
 */
let toMazeCoordArray = (position) => [Math.floor((position[0]+initialSize*2+2.5)/5), Math.floor((position[1]+initialSize*2+2.5)/5)];

/**
 * Converts a position in maze coordinates to world coordinates.
 * @param {Array} position - The position in maze coordinates.
 * @returns {Array} The position in world coordinates.
 */
let toWorldCoord = (position) => [position[0]*5-initialSize*2-2.5, position[1]*5-initialSize*2-2.5];

// Rendering the maze
renderMazeWithHole(scene, size, [[size-1, Math.round(size/2)]], [2, 2]);

let branches = puttingBranches(scene, size);

/**
 * Animates the game and updates the game state.
 */
function animate() {

	requestAnimationFrame( animate );
	if (tool == "portals") remainingBranches.innerHTML = nBranches +" portals remaining";
	else if (tool == "weight" )remainingBranches.innerHTML = nBombs + " bombs remaining";
	else remainingBranches.innerHTML = "";

	raycaster.setFromCamera( pointer, camera );
	document.getElementById('health-bar').style.width = playerHandler.health + '%';

	// Checking if the player is dead
	if (!playerHandler.alive){
		console.log("Game Over");
		return;
	}

	if (onSprint <= 0 && !canMove(directionX/2, directionY)){
		directionX = 0;
		directionY = 0;
	}else if (onSprint > 0 && !canMove(directionX/2, directionY)){
		directionX = 0;
		directionY = 0;
	}
	if (mouseDown && !buttomClicked){
		if (tool == "portals"){
			circle.position.set(mappedMouse.x, mappedMouse.y, -1);
			actionTaken = 1;
			if (nBranches == 0){
				actionTaken = 0;
				circle.position.z = -1000;
			}
		}else if (tool == "sword") fight();
		else if (tool == "weight"){
			bigCircle.position.set(mappedMouse.x, mappedMouse.y, -1);
			if (nBombs > 0) actionTaken = 2;
			else bigCircle.position.set(-1000, -1000, -1);
		}
	}else if (actionTaken > 0 && !buttomClicked){
		from.set(playerHandler.plane.position.x, playerHandler.plane.position.y);
		if (actionTaken == 1){
			target.set(circle.position.x, circle.position.y);
			ballot.addBallot(from, target);
			actionTaken = 0;
			circle.position.x = -1000;
			circle.position.y = -1000
			circle.position.z = -1;	
			nBranches -= 1;
		}else if (actionTaken == 2){
			target.set(bigCircle.position.x, bigCircle.position.y);
			bombHandler.addBallot(from, target);
			actionTaken = 0;
			bigCircle.position.x = -1000;
			bigCircle.position.y = -1000
			bigCircle.position.z = -1;	
			nBombs -= 1;
		}
	}
	const deleted = ballot.goTo();
	let dead = enemyHandler.goTo(playerHandler.plane.position);
	nBombs += dead;
	deleted.forEach(element => {    portalHandl.addPortal(playerHandler.plane.position, element);   });

	const deletedBombs = bombHandler.goTo();
	deletedBombs.forEach(element => {  enemyHandler.nearEnemies(element, 3, (enemy) => {enemy.takeHit(50)}); });
	const portalDirection = portalHandl.goTo();
	if (portalDirection != null){
		if (portalHandl.activeOne != -1 && portalHandl.portals[portalHandl.activeOne].t >= distanceT){
			portalHandl.stopIt();
			distanceT = 1;
		}else{
			playerHandler.onSprint = true;
			playerHandler.plane.position.x = portalDirection.x;
			playerHandler.plane.position.y = portalDirection.y;
		}
	}else playerHandler.onSprint = false;

	//portalHandl.updateShaderTime();
	playerHandler.moveText(directionX, directionY, onSprint > 0 ? 0.1 : 0.05);
	playerHandler.plane.position.x += directionX*(onSprint > 0 ? 1.5 : 1);
	playerHandler.plane.position.y += directionY*(onSprint > 0 ? 1.5 : 1);
	camera.position.x = playerHandler.plane.position.x;
	camera.position.y = playerHandler.plane.position.y;

	const map = toMazeCoord(playerHandler.plane.position);
	if (map[0] >= totalSize)
		loadNewLevel();

	onSprint -= 1;
	if (onSprint < 0) restSprint += (restSprint < maxSprint ? 0.5 : 0);
	else restSprint -= 1;

	if (!mouseDown && buttomClicked){
		actionTaken = 0;
		buttomClicked = false;
	}
	//renderer.render( scene, camera );
	composer.render();
}
animate();




document.addEventListener("mousemove", function(event) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	mappedMouse.x = camera.position.x+mouse.x*13.5;
	mappedMouse.y = camera.position.y+mouse.y*6.75;
});
document.addEventListener("mousedown", function(event) {
	if (event.button == 0)
		mouseDown = true;
});

document.addEventListener("mouseup", function(event) {
	mouseDown = false;
	//console.log("buttom: ", buttomClicked);
});

const directionRay = new THREE.Vector3();
document.addEventListener("contextmenu", function(event) {
	event.preventDefault();
	const intersects = mouseIntersections();
	intersects.forEach(element => {
		if (element.object.name == "portal"){
			//console.log("Setting portal", element.object.position, mouse);
			portalHandl.setPortal(playerHandler.plane.position, element.object.position);
			element.object.position.z = 0;
			tempRay.set(playerHandler.plane.position, directionRay.subVectors(element.object.position, playerHandler.plane.position).normalize());
			const intersections = tempRay.intersectObjects( scene.children );
			for (let i = 0; i < intersections.length; i++) {
				if (intersections[i].object.name == "player") continue;
				distanceT = interTime(playerHandler.plane.position, element.object.position, intersections[i].point);
				break;
			}
			return;
		}
	});
});

document.addEventListener("keydown", function(event) {
	if (event.keyCode == 68)
		directionX = vel;
	if (event.keyCode == 65)
		directionX = -vel;
	if (event.keyCode == 87)
		directionY = vel;
	if (event.keyCode == 83)
		directionY = -vel;
	if (event.keyCode == 32)
		event.preventDefault();
	if (event.keyCode == 49) portalButtom.click();
	if (event.keyCode == 50) swordButtom.click();
	if (event.keyCode == 51) weightButtom.click();
	
	if (event.key == 'Shift' && onSprint <= 0)
		onSprint = restSprint;
	
});
document.addEventListener("keyup", function(event) {
	if (event.keyCode == 68)
		directionX = 0;
	if (event.keyCode == 65)
		directionX = 0;
	if (event.keyCode == 87)
		directionY = 0;
	if (event.keyCode == 83)
		directionY = 0;
	if (event.key == 'Shift'){
		onSprint = 0;
	}
});

portalButtom.addEventListener('click', function(){
	buttomClicked = true;
	portalButtom.style.backgroundColor = "#bbb";
	weightButtom.style.backgroundColor = "transparent";
	swordButtom.style.backgroundColor = "transparent";
	tool = "portals";
});
swordButtom.addEventListener('click', function(){
	buttomClicked = true;
	portalButtom.style.backgroundColor = "transparent";
	weightButtom.style.backgroundColor = "transparent";
	swordButtom.style.backgroundColor = "#bbb";
	tool = "sword";
});
weightButtom.addEventListener('click', function(){
	buttomClicked = true;
	portalButtom.style.backgroundColor = "transparent";
	swordButtom.style.backgroundColor = "transparent";
	weightButtom.style.backgroundColor = "#bbb";
	tool = "weight";
});
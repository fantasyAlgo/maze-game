import * as THREE from 'three';
import { lerp, interTime, quadrant} from './helpers.js';

/**
 * Represents a throwable object in a 3D scene.
 */
export class ThrowObject {
    /**
     * Constructs a new ThrowObject instance.
     * @param {EnemyHandler} enemyHandler - The enemy handler object.
     * @param {THREE.Object3D} object - The object to be thrown.
     * @param {boolean} [stopIfIntersect=false] - Whether to stop throwing if the object intersects with other objects.
     * @param {boolean} [parabola=false] - Whether to throw the object in a parabolic trajectory.
     */
    constructor(enemyHandler, object, stopIfIntersect = false, parabola = false){
        this.object = object;
        this.speed = 0.01;

        this.time = 0;
        this.active = false;
        this.from = new THREE.Vector3();
        this.target = new THREE.Vector3();

        this.stopIfIntersect = stopIfIntersect;
        this.intersectionTime = 0;
        this.intersectionPosition = new THREE.Vector3();

        this.directionRay = new THREE.Vector3();
    }

    /**
     * Throws the object from a specified position to a target position.
     * @param {THREE.Scene} scene - The scene object.
     * @param {THREE.Vector3} from - The starting position of the throw.
     * @param {THREE.Vector3} target - The target position of the throw.
     * @param {number[]} [adder=[0,0]] - The additional values to add to the target position.
     */
    throw(scene, from, target, adder = [0,0]){
        this.from.set(from.x, from.y, from.z);
        this.target.set(target.x+adder[0], target.y+adder[1], target.z);
        this.direction = this.target.clone().sub(this.from).normalize();
        this.direction.multiplyScalar(1/20);
        this.active = true;

        this.object.position.set(from.x, from.y, from.z);

        if (!this.stopIfIntersect){
            this.intersectionTime = 1;
            this.intersectionPosition.set(target.x, target.y, target.z);
            return;
        }
        this.intersectionPosition.set(target.x, target.y, target.z);
        this.intersectionTime = 1;
        const tempRay = new THREE.Raycaster(from, this.directionRay.subVectors(target, from).normalize());
        tempRay.far = 40;
        const intersections = tempRay.intersectObjects( scene.children );
        for (let i = 0; i < intersections.length; i++) {
            if (intersections[i].object.name == "player" || intersections[i].object.name == "enemy") continue;
            this.intersectionTime = interTime(this.from, this.target, intersections[i].point);
            this.intersectionPosition.set(intersections[i].point.x, intersections[i].point.y, intersections[i].point.z);
            break;
        }
        console.log("###############", this.intersectionTime)
    }

    /**
     * Resets the throw object to its initial state.
     */
    reset(){
        this.object.position.set(-1000, -1000, -1);
        this.active = false;
        this.time = 0;
    }

    /**
     * Updates the throw object's position and checks for collisions.
     * @param {THREE.Vector3} [playerPosition=undefined] - The position of the player object.
     * @returns {boolean} Returns true if the object collides with the player, false otherwise.
     */
    update(playerPosition=undefined){
        if (!this.active) return;
        if (this.object.position.distanceTo(this.intersectionPosition) < 0.1){
            this.reset();
            return false;
        }
        if (playerPosition != undefined && this.object.position.distanceTo(playerPosition) < 0.7){
            this.reset();
            return true;
        }
        this.object.position.add(this.direction);
        this.time += this.speed;
        return false;
    }
}
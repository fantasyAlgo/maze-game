import * as THREE from 'three';

import { lerp, makeCircle, makePortal} from './helpers.js';

/**
 * Represents a handler for managing portals in a scene.
 */
export class PortalHandler {
    /**
     * Constructs a new PortalHandler object.
     * @param {THREE.Scene} scene - The scene in which the portals will be added.
     * @param {number} nPortals - The number of portals to create.
     * @param {number} [size=0.1] - The size of the portals.
     * @param {number} [speedT=0.01] - The speed at which the portals will animate.
     */
    constructor(scene, nPortals, size = 0.1, speedT = 0.01){
        this.scene = scene;
        this.portals = [];
        this.speedT = speedT;

        for (let i = 0; i < nPortals; i++) {
            this.portals.push({
                "portal": makePortal(size, 0x00FFFF), 
                "t": speedT, 
                "from": new THREE.Vector2(), 
                "target": new THREE.Vector2(), 
                "from" : new THREE.Vector3(),
                "active":false,
                "time":0
            });

            this.portals[i].portal.position.x = -1000;
            this.portals[i].portal.position.y = -1000;
            this.portals[i].portal.position.z = -1;
            this.portals[i].portal.name = "portal";
            scene.add(this.portals[i].portal);
        }

        this.firstIn = 0;
        this.lastIn = nPortals
        this.used = 0;
        this.existingPortals = [];
        this.activeOne = -1;
        this.time = 0;
    }

    /**
     * Finds the index of the oldest portal in the existing portals array.
     * @returns {number} The index of the oldest portal.
     */
    olderPortal(){
        let oldest = 0;
        for (let i = 0; i < this.existingPortals.length; i++) {
            if (this.portals[this.existingPortals[i]].time < this.portals[oldest].time)
                oldest = this.existingPortals[i];
        }
        return oldest;
    }

    /**
     * Adds a new portal to the scene.
     * @param {THREE.Vector2} from - The starting position of the portal.
     * @param {THREE.Vector2} target - The target position of the portal.
     * @returns {number} The index of the added portal.
     */
    addPortal(from, target){
        this.time += 1;

        if (this.existingPortals.length >= this.lastIn){
            //console.log("Removing portal", this.lastIn, this.existingPortals.length);
            const oldest = this.olderPortal();
            this.removePortal(oldest);
            this.used = oldest;
        };

        this.used = 0;
        while (this.portals[this.used].active) this.used += 1;

        if (this.existingPortals.length == 0) this.used = 0;
        if (this.used >= this.lastIn && this.lastIn > 0) this.used = 0;

        this.portals[this.used].portal.position.x = target.x;
        this.portals[this.used].portal.position.y = target.y;

        this.portals[this.used].from.copy(from);
        this.portals[this.used].target.copy(target);

        this.portals[this.used].t = this.speedT;
        this.portals[this.used].active = true;
        this.portals[this.used].time = this.time;

        this.existingPortals.push(this.used);

        do{ this.used += 1;
        }while(this.used < this.lastIn && this.portals[this.used].active);

        return this.used;
    }

    /**
     * Sets the active portal based on the target position.
     * @param {THREE.Vector2} from - The starting position of the portal.
     * @param {THREE.Vector2} where - The target position of the portal.
     */
    setPortal(from, where){
        const lgth = this.existingPortals.length;
        for (let i = 0; i < lgth; i++) {
            if (this.portals[this.existingPortals[i]].portal.position.x == where.x 
                && this.portals[this.existingPortals[i]].portal.position.y == where.y){
                this.activeOne = this.existingPortals[i];
                //.log("Setting portal: ", where, this.portals[this.existingPortals[i]].portal.position);
                this.portals[this.activeOne].from.set(from.x, from.y, from.z);
                return;
            }
        }
    }

    /**
     * Updates the shader time for all portals.
     */
    updateShaderTime(){
        this.portals.forEach(element => {
            element.portal.material.uniforms.time.value += 0.1;
        });
    }

    /**
     * Calculates the direction vector from the current position to the target position of the active portal.
     * @param {THREE.Vector3} pos - The current position.
     * @returns {THREE.Vector3} The direction vector.
     */
    nudge(pos){
        const direction = lerp(this.portals[this.activeOne].from, this.portals[this.activeOne].target, this.portals[this.activeOne].t);
        return new THREE.Vector3(direction.x- pos.x, direction.y - pos.y, 0);
    }

    /**
     * Moves the object towards the target position of the active portal.
     * @returns {THREE.Vector2|null} The new position of the object, or null if there is no active portal.
     */
    goTo(){
        if (this.activeOne == -1) return null;
        const direction = lerp(this.portals[this.activeOne].from, this.portals[this.activeOne].target, this.portals[this.activeOne].t);
        this.portals[this.activeOne].t += this.speedT;
        if (this.portals[this.activeOne].t >= 1){
            this.removePortal(this.activeOne);
            this.activeOne = -1;
        }
        return direction;
    }

    /**
     * Stops the object from moving towards the target position of the active portal.
     */
    stopIt(){
        this.removePortal(this.activeOne);
        this.activeOne = -1;
    }

    /**
     * Removes a portal from the scene.
     * @param {number} index - The index of the portal to remove.
     */
    removePortal(index){
        if (this.existingPortals.length == 0) return;
        this.portals[index].portal.position.x = -1000;
        this.portals[index].portal.position.y = -1000;
        this.portals[index].portal.position.z = -1;
        this.portals[index].t = this.speedT;
        this.portals[index].active = false;

        this.existingPortals = this.existingPortals.filter(item => item !== index);
        this.used = 0;
    }
}
import * as THREE from 'three';

import { makeCube, lerp, makeCircle, makePortal} from './helpers.js';


const a = 10;

/**
 * Represents a BallotHandler object.
 * @class
 */
export class BallotHandler {
    /**
     * Creates a new BallotHandler.
     * @constructor
     * @param {THREE.Scene} scene - The scene to add the ballots to.
     * @param {number} nBallots - The number of ballots to create.
     * @param {number[]} size - The size of each ballot.
     * @param {number} speedT - The speed of the ballots.
     * @param {Function} makeFunction - The function to create the ballots.
     */
    constructor(scene, nBallots, size = [0.1, 0.1, 0.1], speedT = 0.01, makeFunction = makeCube){
        this.scene = scene;
        this.ballots = [];
        this.speedT = speedT;
        for (let i = 0; i < nBallots; i++) {
            this.ballots.push({"ballot": makeFunction(size), "t": speedT, "from": new THREE.Vector2(), "target": new THREE.Vector2()});
            this.ballots[i].ballot.position.x = -1000;
            this.ballots[i].ballot.position.y = -1000;
            this.ballots[i].ballot.position.z = -1;
            this.ballots[i].ballot.name = "ballot";
            scene.add(this.ballots[i].ballot);
        }
        this.firstIn = 0;
        this.lastIn = nBallots
        this.used = 0;
        this.activeBallots = [];
        this.amplitude = 1;
    }

    /**
     * Adds a new ballot to the active ballots list.
     * @param {THREE.Vector2} from - The starting position of the ballot.
     * @param {THREE.Vector2} target - The target position of the ballot.
     * @returns {number} - The index of the added ballot.
     */
    addBallot(from, target){
        if (this.activeBallots.length == this.lastIn) return;
        if (this.activeBallots.length == 0) this.used = 0;
        if (this.used == this.lastIn && this.lastIn > 0) this.used = 0;
        this.ballots[this.used].from.set(from.x, from.y);
        this.ballots[this.used].target.set(target.x, target.y);
        this.ballots[this.used].t = this.speedT;
        this.activeBallots.push(this.used);
        this.used += 1;
        return this.used;
    }

    /**
     * Moves the active ballots towards their target positions.
     * @returns {THREE.Vector2[]} - An array of target positions that have been reached.
     */
    goTo(){
        this.activeBallots.forEach(element => {
            const direction = lerp(this.ballots[element].from, this.ballots[element].target, this.ballots[element].t);
            this.ballots[element].ballot.position.x = direction.x;
            this.ballots[element].ballot.position.y = direction.y;
            this.ballots[element].ballot.position.z = -this.amplitude*this.ballots[element].t*this.ballots[element].t*a + this.amplitude*this.ballots[element].t*a;
            if (this.ballots[element].from.y < this.ballots[element].target.y)
                this.ballots[element].ballot.position.y += this.ballots[element].ballot.position.z;
            else this.ballots[element].ballot.position.y -= this.ballots[element].ballot.position.z;
            this.ballots[element].t += this.speedT;
        });
        const removedPositions = [];
        this.activeBallots.forEach(element => {
            if (this.ballots[element].t >= 1){
                this.removeBallot();
                removedPositions.push(this.ballots[element].target);
            }
        });
        return removedPositions;
    }

    /**
     * Removes the first ballot from the active ballots list.
     */
    removeBallot(){
        if (this.activeBallots.length == 0) return;
        this.ballots[this.activeBallots[0]].ballot.position.x = -1000;
        this.ballots[this.activeBallots[0]].ballot.position.y = -1000;
        this.ballots[this.activeBallots[0]].ballot.position.z = -1;
        this.ballots[this.activeBallots[0]].t = this.speedT;
        this.activeBallots.shift();
        
        if (this.firstIn != this.lastIn) this.firstIn++;
        else this.firstIn = 0;
    }
}
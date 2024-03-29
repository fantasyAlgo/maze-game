import * as THREE from 'three';
import { quadrant } from './helpers';

/**
 * Class representing a player handler.
 */
export class PlayerHandler {
    /**
     * Create a player handler.
     * @param {string} path - The path to the player texture.
     * @param {number} maxVert - The maximum vertical tiles.
     * @param {number} maxHor - The maximum horizontal tiles.
     * @param {number} initial - The initial tile index.
     * @param {object} enemyHandler - The enemy handler object.
     */
    constructor (path, maxVert, maxHor, initial, enemyHandler){
        this.health = 100;
        this.maxHor = maxHor;
        this.maxVert = maxVert;
        this.path = path;
        const geometry = new THREE.PlaneGeometry( 3, 3 );
        this.mat = new THREE.TextureLoader().load( path );
        this.mat.magFilter = THREE.NearestFilter;
        this.mat.repeat.set(1/maxHor, 1/maxVert);
        this.mat.offset.x = (initial % maxHor) / maxHor;
        this.mat.offset.y = (maxVert - Math.floor(initial / maxHor) -1)/ maxVert;

        this.material = new THREE.MeshBasicMaterial( { map: this.mat, transparent: true } );
        this.plane = new THREE.Mesh( geometry, this.material );
        this.plane.name = "player";

        this.state = 0;
        this.fight = false;
        this.fightState = 0;
        this.quadrant = 0;
        this.moveState = 0;

        this.enemyHandler = enemyHandler;
        this.maxDist = 3;

        this.onSprint = false;
        this.alive = true;

    }

    /**
     * Change the player's state.
     * @param {number} initial - The initial tile index.
     * @param {boolean} [flip=false] - Whether to flip the texture horizontally.
     * @returns {number} - The state change result.
     */
    changeState(initial, flip = false){
        if (!flip)
            this.mat.repeat.set(1/this.maxHor, 1/this.maxVert);
        else this.mat.repeat.set(-1/this.maxHor, 1/this.maxVert);
        this.mat.offset.x = (initial % this.maxHor) / this.maxHor;
        this.mat.offset.y = (this.maxVert - Math.floor(initial / this.maxHor) -1)/ this.maxVert;
        this.plane.material.map = this.mat;
        return 0;
    }

    /**
     * Take a hit and reduce the player's health.
     * @param {number} damage - The amount of damage to take.
     */
    takeHit(damage){
        this.health -= damage;
        if (this.health <= 0){
            this.health = 0;
            this.alive = false;
        }
    }

    /**
     * Hit nearby enemies.
     */
    hit(){
        const nEnemies = this.enemyHandler.enemies.length;
        for (let i = 0; i < nEnemies; i++) {
            const distance = this.enemyHandler.enemies[i].enemy.position.distanceTo(this.plane.position);
            const enemyQuadrant = quadrant(this.enemyHandler.enemies[i].enemy.position.clone().sub(this.plane.position));
            if (enemyQuadrant == this.quadrant && distance < this.maxDist){
                this.enemyHandler.enemies[i].takeHit(10);
            }
            if (this.onSprint && enemyQuadrant == this.quadrant && distance < this.maxDist+20)
                this.enemyHandler.enemies[i].takeHit(100);

        }
    }

    /**
     * Perform a fighting move or a non-fighting move.
     * @param {number} fightMove - The tile index for the fighting move.
     * @param {number} notFight - The tile index for the non-fighting move.
     * @param {boolean} [flip=false] - Whether to flip the texture horizontally.
     */
    fightMove(fightMove, notFight, flip = false){
        if (this.fight){
            this.changeState(fightMove+Math.floor(this.fightState)%4, flip);
            this.fightState += 0.05;
            if (this.fightState > 2 && this.fightState < 2.10){
                this.hit();
            }
            if (this.fightState > 4) this.fight = false;
        }else this.changeState(notFight, flip);
    }

    /**
     * Move the player in a specific direction.
     * @param {number} dirX - The direction in the x-axis (-1, 0, or 1).
     * @param {number} dirY - The direction in the y-axis (-1, 0, or 1).
     * @param {number} [speed=0.05] - The movement speed.
     */
    moveText(dirX, dirY, speed = 0.05){
        // 0: down, 1: up, 2: right, 3: left
        if (this.fight){
            switch (this.quadrant) {
                case 0:
                    this.fightMove(48, 20);
                    break;
                case 1:
                    this.fightMove(36, 20);
                    break;
                case 3:
                    this.fightMove(42, 9);
                    break;
                default:
                    this.fightMove(43, 9, true);
                    break;
            }
            return;
        }
        if (dirY == 0 && dirX == 0){
            switch (this.moveState) {
                case 0:
                    this.changeState(12);
                    break;
                case 1:
                    this.changeState(20);
                    break;
                case 2:
                    this.changeState(9);
                    break;
                default:
                    this.changeState(9, true);
                    break;
            }
        }
        if (dirY > 0){
            this.changeState(30+Math.floor(this.state)%6);
            this.state += speed;
            this.moveState = 0;
        }else if (dirY < 0){
            this.changeState(18+Math.floor(this.state)%6);
            this.state += speed;
            this.moveState = 1;
        }else if (dirX > 0){
            this.changeState(24+Math.floor(this.state)%6);
            this.state += speed;
            this.moveState = 2;
        }else if(dirX < 0){
            if (Math.floor(this.state)%6 == 0) this.state += 1;
            this.changeState(24+Math.floor(this.state)%6, true);
            this.mat.flipY = 1;
            this.state += speed;
            this.moveState = 3;
        }
    }
}
/**
 * EnemySystem.js
 * 
 * This file contains the implementation of the Enemy class and its subclass Bunny.
 * The Enemy class represents an enemy object in a 2D game using the Three.js library.
 * The Bunny class extends the Enemy class and adds additional functionality specific to a bunny enemy.
 * 
 * @fileoverview
 * @module EnemySystem
 * @requires THREE
 * @requires helpers
 * @requires trowObject
 */

import * as THREE from 'three';

import { makeCube, quadrant, distance2D, randomMinMax} from './helpers.js';
import {ThrowObject} from './trowObject.js';


class Enemy{
    constructor(scene, where, texturePath, health, size=[3,4,1], maxViewingDistance=8, fightArea = 2,vel = 0.01){
        this.maxHor = 4;
        this.maxVert = 4;
        this.initial = 0;

        this.scene = scene;
        this.maxHealth = health;
        this.health = 100;
        this.geometry = new THREE.PlaneGeometry(size[0], size[1]);
        this.mat = new THREE.TextureLoader().load( texturePath );
        this.mat.magFilter = THREE.NearestFilter;

        this.mat.repeat.set(1/this.maxHor, 1/this.maxVert);
        this.mat.offset.x = (this.initial % this.maxHor) / this.maxHor;
        this.mat.offset.y = (this.maxVert - Math.floor(this.initial / this.maxHor) -1)/ this.maxVert;

        // Material
        this.material = new THREE.MeshBasicMaterial( { map: this.mat, transparent: true } );
        this.enemy = new THREE.Mesh(this.geometry , this.material);
        this.enemy.position.x = where[0];
        this.enemy.position.y = where[1];
        this.enemy.position.z = where[2];
        this.enemy.name = "enemy";

        this.playerFound = false;

        this.velocity = vel;
        this.maxViewingDistance = maxViewingDistance;


        this.fightArea = fightArea;
        this.playerFightArea = this.fightArea;

        this.delay = 2;
        this.hitInc = false;
        this.time = 0;

        // Creating the health bar
        this.healthBar = document.createElement('div');
        this.healthBar.style.position = 'absolute';
        this.healthBar.style.width = '50px';
        this.healthBar.style.height = '5px';
        this.healthBar.style.backgroundColor = 'red';
        document.body.appendChild(this.healthBar);


        this.prevIntersect = null;
        this.direction = null;
        this.distancePlayer = 0;
        this.cameraVector = new THREE.Vector3();
        this.quadrant = -1;
        this.state = 0;
        this.animationPositions = [4, 0, 8, 12];

        this.clockCycle = 1;
    }

    updateHealthBar(camera, renderer) {
        // Update the position of the health bar to match the enemy
        let widthHalf = 0.5*renderer.domElement.width;
        let heightHalf = 0.5*renderer.domElement.height;

        this.enemy.updateMatrixWorld();
        this.cameraVector.setFromMatrixPosition(this.enemy.matrixWorld);
        this.cameraVector.project(camera);

        this.cameraVector.x = ( this.cameraVector.x * widthHalf ) + widthHalf-30;
        this.cameraVector.y = - ( this.cameraVector.y * heightHalf ) + heightHalf-60;

        this.healthBar.style.left = `${this.cameraVector.x}px`;
        this.healthBar.style.top = `${this.cameraVector.y}px`;
        this.healthBar.style.width = `${50*(this.health/100)}px`;
    }
    changeState(initial, flip = false){
        if (!flip) this.mat.repeat.set(1/this.maxHor, 1/this.maxVert);
        else this.mat.repeat.set(-1/this.maxHor, 1/this.maxVert);

        this.mat.offset.x = (initial % this.maxHor) / this.maxHor;
        this.mat.offset.y = (this.maxVert - Math.floor(initial / this.maxHor) -1)/ this.maxVert;
        this.enemy.material.map = this.mat;
        return 0;
    }
    moveState(){
        if (this.direction == null) return;
        this.quadrant = quadrant(this.direction);
        if (this.quadrant == -1) return;
        switch (this.quadrant){
            case 0:
                this.changeState(this.animationPositions[0]+Math.floor(this.state)%this.maxHor);
                this.state += 0.05;
                break;
            case 1:
                this.changeState(this.animationPositions[1]+Math.floor(this.state)%this.maxHor);
                this.state += 0.05;
                break;
            case 2:
                this.changeState(this.animationPositions[2]+Math.floor(this.state)%this.maxHor);
                this.state += 0.05;
                break;
            default:
                this.changeState(this.animationPositions[3]+Math.floor(this.state)%this.maxHor);
                this.state += 0.05;
        }
    }

    canGoDir(direction, distancePlayer){
        const tempRay = new THREE.Raycaster(this.enemy.position, direction);
        const intersects = tempRay.intersectObjects(this.scene.children);
        for (let i = 0; i < intersects.length; i++) 
            if (intersects.length > 0 && intersects[i].object.name != "player" 
                                      && intersects[i].object.position != this.enemy.position 
                                      && intersects[i].distance < distancePlayer
                                      && intersects[i].object.name != "enemy" && intersects[i].object.name != "ball"){
                return false;
            }
        return true;
    }

    canGo(dirPos, distancePlayer, opposite = false){
        if (distancePlayer > this.maxViewingDistance) return false;
        let direction = dirPos.clone().sub(this.enemy.position);
        direction.normalize();
        if (opposite) direction.multiplyScalar(-1);
        return this.canGoDir(direction, distancePlayer);
    }


    takeHit(hit){
        this.health -= (100/this.maxHealth)*hit;
        return this.health < 0;
    }
    quickCheck(playerPosition){;}
    checkPlayer(playerPosition, onSprint){;}
    goTo(playerPosition, playerQuadrant){;}
}

class Bunny extends Enemy{
    constructor(scene, where, texturePath, health, size=[3,4,1], maxViewingDistance=8, fightArea = 5,vel = 0.01){
        super(scene, where, texturePath, health, size, maxViewingDistance, fightArea, vel);
        this.ball = makeCube([0.3,0.3,0.3]);
        this.ball.position.set(-100000, -100000, this.enemy.position.z);
        this.ball.name = "ball";
        this.scene.add(this.ball);

        this.prevDirection = new THREE.Vector3(0,0,0);
        this.prevPositionPlayer = new THREE.Vector3(0,0,0);
        this.nani = 0;
        this.slope = [0,0];

        this.catchCube = new ThrowObject(this, this.ball, false);
    }
    quickCheck(playerPosition){
        return Math.abs(this.enemy.position.x - playerPosition.x) > this.maxViewingDistance+1 && Math.abs(this.enemy.position.y - playerPosition.y) > this.maxViewingDistance+1;
    }
    checkPlayer(playerPosition, isPlayerSprinting = false){
        this.distancePlayer = distance2D(this.enemy.position,playerPosition);

        this.hitInc = this.nani <= 0 && this.distancePlayer < this.fightArea && this.playerFound && this.time > this.delay && !isPlayerSprinting;
        this.playerFound = this.canGo(playerPosition, this.distancePlayer);
        return this.playerFound;
    }
    hit(playerHandler){
        if (this.catchCube.active)
            return;
        this.catchCube.throw(this.scene, this.enemy.position, playerHandler.plane.position, [this.slope[0]/100, this.slope[1]/100]);
        this.hitInc = false;
        this.time = 0;
    }
    circleDirection(playerPosition, quadrant, multiplyMagnitude = false){
        let direction = playerPosition.clone().sub(this.enemy.position);
        const magnitude = direction.length();
        direction.normalize();
        let angle = Math.atan2(direction.y, direction.x);
        let newAngle = angle + Math.PI/2;
        const quickFactor = 1.0;
        switch (quadrant){
            case 0:
                newAngle = angle + (angle > Math.PI/2 ? quickFactor : -quickFactor);
                break;
            case 1:
                newAngle = angle + (angle > (Math.PI*3)/2 ? quickFactor : -quickFactor);
                break;
            case 2:
                newAngle = angle + (angle > Math.PI ? quickFactor : -quickFactor);
                break;
            default:
                newAngle = angle + (angle > 0 ? quickFactor : -quickFactor);
        }
        if (multiplyMagnitude) return new THREE.Vector3(magnitude*Math.cos(newAngle), magnitude*Math.sin(newAngle), 0);
        return new THREE.Vector3(Math.cos(newAngle), Math.sin(newAngle), 0);
    }
    // Ai for the bunny
    goTo(playerPosition, playerQuadrant){
        this.time += 0.01;
        if (this.nani > 0){
            this.nani -= 0.005;
            return;
        }
        
        const canGoOpposite = this.canGo(playerPosition, this.distancePlayer, true);
        let direction = playerPosition.clone().sub(this.enemy.position);
        direction.normalize();

        const dotProduct = direction.x*this.prevDirection.x + this.prevDirection.y*direction.y;
        if (dotProduct < 0.2)
            this.nani = 1;

        this.prevDirection.copy(direction);

        direction.multiplyScalar(1/30);
        this.direction = new THREE.Vector3(direction.x, direction.y, 0);
        if (canGoOpposite && distance2D(this.enemy.position, playerPosition) < this.fightArea-0.2)
            this.enemy.position.add(new THREE.Vector3(-direction.x, -direction.y, 0));
        
        const circleDirection = this.circleDirection(playerPosition, playerQuadrant, false);
        circleDirection.multiplyScalar(1/100);
        const canGoCircle = this.canGoDir(circleDirection, this.distancePlayer, false);
        if (this.distancePlayer < this.fightArea+1){
            if (canGoCircle || this.clockCycle > 0.01){
                this.clockCycle = canGoCircle ? 1 : this.clockCycle-0.05;
                this.enemy.position.add(circleDirection);
            }else{
                this.clockCycle = -1;
                this.enemy.position.add(new THREE.Vector3(-circleDirection.x, -circleDirection.y, 0));
            }
        }
        this.prevPositionPlayer.copy(playerPosition);
    }
}







export class EnemyHandler {
    constructor(camera, renderer, scene, size, nEnemy, path){
        this.camera = camera;
        this.renderer = renderer;
        this.scene = scene;
        this.prevSize = 0;
        this.size = size;
        this.enemyNumber = nEnemy;
        this.enemies = [];
        this.path = path;
        this.playerHandler = null;
    }
    spawn(...args){
        const displacement = 5.0;
        let newEnemy;
        if (args.length > 1){
            newEnemy = new Bunny(this.scene, [args[0], args[1], 0], this.path, 100);
        }else{
            const xPos = -this.size*2 + displacement*Math.round(randomMinMax(this.prevSize, this.size));//Math.round(Math.random() * this.size);
            const yPos = -this.size*2 + displacement*Math.round(randomMinMax(this.prevSize, this.size));
            newEnemy = new Bunny(this.scene, [xPos, yPos, 0], this.path, 100);
        }
        newEnemy.playerFightArea = this.playerHandler.fightArea;
        this.enemies.push(newEnemy);
        this.scene.add(newEnemy.enemy);
    }
    setNewSize(size){
        this.size = size;
    }

    setPlayerHandler(playerHandler){
        this.playerHandler = playerHandler;
    }

    goTo(playerPosition){
        let enemyLength = this.enemies.length;
        let dead = 0;
        for (let i = 0; i < enemyLength; i++){
            if (this.enemies[i].quickCheck(playerPosition)) continue;
            this.enemies[i].updateHealthBar(this.camera, this.renderer);
            this.enemies[i].checkPlayer(playerPosition, this.playerHandler.onSprint);
            this.enemies[i].goTo(playerPosition, this.playerHandler.quadrant);

            const el = this.enemies[i].catchCube.update(this.playerHandler.plane.position);
            if (el) this.playerHandler.takeHit(10);

            this.enemies[i].time += 0.01;

            this.enemies[i].moveState();
            if (this.enemies[i].hitInc){
                this.enemies[i].hit(this.playerHandler);
            }

            if (this.enemies[i].health < 0) {
                this.scene.remove(this.enemies[i].enemy);
                this.enemies.splice(i, 1);
                enemyLength -= 1;
                i--;
                dead += 1;
            }
        }
        return dead;
    }
    nearEnemies(position, radius, action = (enemy) => {}){
        let enemyLength = this.enemies.length;
        for (let i = 0; i < enemyLength; i++){
            if (distance2D(this.enemies[i].enemy.position, position) < radius){
                action(this.enemies[i]);
            }
        }
    }
}
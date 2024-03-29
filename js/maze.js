
/**
 * @fileoverview This file contains functions for creating and rendering a maze using Three.js.
 * The maze is represented as a matrix of walls, and a random BFS algorithm is used to generate the maze.
 * The maze can be rendered with or without holes.
 * @module maze
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

import { horiWall, vertWall } from './helpers';

/**
 * Creates a cube object representing a cell in the maze.
 * @param {number} x - The x-coordinate of the cube.
 * @param {number} y - The y-coordinate of the cube.
 * @param {number[]} openDoors - An array representing the open doors of the cube. Each element represents a direction (0: top, 1: right, 2: bottom, 3: left).
 * @param {number[]} [possibleDirections=[1,1,1,1]] - An array representing the possible directions the cube can move to. Each element represents a direction (0: top, 1: right, 2: bottom, 3: left).
 * @returns {Object} The cube object.
 */
function createCube(x, y, openDoors, possibleDirections = [1, 1, 1, 1]) {
    var cube = {
        x: x,
        y: y,
        base: [5, 1, 3],
        possibleDirections: possibleDirections,
        openDoors: openDoors
    }
    return cube;
}

/**
 * Creates a matrix of the specified size.
 * @param {number} m - The number of rows in the matrix.
 * @param {number} n - The number of columns in the matrix.
 * @returns {Array[]} The matrix.
 */
function matrix(m, n) {
    return Array.from({ length: m }, () => new Array(n).fill(0));
}

/**
 * Generates a random direction for a given cube.
 * @param {Object} cube - The cube object.
 * @returns {number} The random direction (0: top, 1: right, 2: bottom, 3: left).
 */
function randomDirection(cube) {
    let possibleDirections = cube.possibleDirections;
    let direction;
    do {
        direction = Math.floor(Math.random() * 4);
    } while (possibleDirections[direction] == 0);
    return direction;
}

/**
 * Determines the possible directions for a given index in the maze.
 * @param {number[]} index - The index of the cube in the maze.
 * @param {number} size - The size of the maze.
 * @returns {number[]} An array representing the possible directions (0: top, 1: right, 2: bottom, 3: left).
 */
function possibleDirections(index, size) {
    let x = index[0];
    let y = index[1];
    let openDoors = [0, 0, 0, 0];
    if (x - 1 >= 0 && y >= 0 && x - 1 < size && y < size && visited[x - 1][y] == 0) openDoors[3] = 1;
    if (x + 1 >= 0 && y >= 0 && x + 1 < size && y < size && visited[x + 1][y] == 0) openDoors[1] = 1;
    if (x >= 0 && y + 1 >= 0 && x < size && y + 1 < size && visited[x][y + 1] == 0) openDoors[0] = 1;
    if (x >= 0 && y - 1 >= 0 && x < size && y - 1 < size && visited[x][y - 1] == 0) openDoors[2] = 1;
    return openDoors;
}

/**
 * Checks if all elements in an array are zero.
 * @param {number[]} array - The array to check.
 * @returns {boolean} True if all elements are zero, false otherwise.
 */
let noDirection = (array) => array.every((element) => element == 0);

/**
 * Finds the first available cube in the maze that has at least one possible direction to move.
 * @param {number} size - The size of the maze.
 * @returns {Array} An array containing the index of the cube and its possible directions, or [-1, -1] if no available cube is found.
 */
function firstAvailableCube(size) {
    let possibleDirection;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            possibleDirection = possibleDirections([i, j], size);
            if (!noDirection(possibleDirection)) {
                return [[i, j], possibleDirection];
            }
        }
    }
    return [-1, -1], [];
}

/**
 * Displays the open doors of each cube in the maze.
 * @param {Array[]} maze - The maze.
 */
function displayOpenDoors(maze) {
    for (let i = 0; i < maze.length; i++) {
        for (let j = 0; j < maze[i].length; j++) {
            if (maze[i][j] == 0) console.log("None");
            else console.log(maze[i][j].openDoors);
        }
    }
}

/**
 * Checks if a given index is within the bounds of the maze.
 * @param {number[]} index - The index to check.
 * @param {number} size - The size of the maze.
 * @returns {boolean} True if the index is within the bounds, false otherwise.
 */
function isPossible(index, size) {
    return index[0] >= 0 && index[1] >= 0 && index[0] < size && index[1] < size;
}
// global variable to store visited cubes
let visited = matrix(500, 500);
/**
 * Creates a maze of the specified size using a random BFS algorithm.
 * @param {number} size - The size of the maze.
 * @returns {Array[]} The maze.
 */
function createMaze(size) {
    let maze = matrix(size, size);
    let currentNode;
    let nVisited = 1;
    let direction;
    let newIndex = [0, 0];
    let container;
    let possibleDirectionCopy;
    maze[0][0] = createCube(0, 0, [1, 1, 1, 1], [1, 1, 0, 0]);
    currentNode = maze[0][0];
    visited = matrix(500, 500);
    while (nVisited < size * size) {
        visited[currentNode.x][currentNode.y] = 1;
        if (noDirection(currentNode.possibleDirections)) {
            container = firstAvailableCube(size);
            newIndex = container[0];
            possibleDirectionCopy = container[1];
            maze[newIndex[0]][newIndex[1]].possibleDirections = possibleDirectionCopy;
            currentNode = maze[newIndex[0]][newIndex[1]];
        }
        direction = randomDirection(currentNode);
        currentNode.openDoors[direction] = 0;
        maze[currentNode.x][currentNode.y].openDoors[direction] = 0;
        newIndex = [direction == 1 ? currentNode.x + 1 : (direction == 3 ? currentNode.x - 1 : currentNode.x),
            direction == 0 ? currentNode.y + 1 : (direction == 2 ? currentNode.y - 1 : currentNode.y)
        ];
        if (maze[newIndex[0]][newIndex[1]] == 0 || maze[newIndex[0]][newIndex[1]] == undefined) {
            maze[newIndex[0]][newIndex[1]] = createCube(newIndex[0], newIndex[1], [1, 1, 1, 1], possibleDirections(newIndex, size));
            nVisited++;
        }
        maze[newIndex[0]][newIndex[1]].openDoors[(direction + 2) % 4] = 0;
        currentNode = maze[newIndex[0]][newIndex[1]];
    }
    return maze;
}

/**
 * Renders the maze without holes.
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {number} size - The size of the maze.
 */
export function renderMaze(scene, size) {
    let maze = createMaze(size);
    let basePoint = [-size * 2, -size * 2, 0];
    let offset = 2;
    maze[size - 1][size - 1].openDoors[1] = 0;
    let mergedGeometry = [];
    let wall;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (maze[i][j] == 0) continue;
            if (maze[i][j].openDoors[0] == 1) {
                wall = vertWall([basePoint[0] + i * maze[i][j].base[0], basePoint[1] + j * maze[i][j].base[0] + offset, 0], maze[i][j].base);
                mergedGeometry.push(wall.geometry);
            }
            if (maze[i][j].openDoors[1] == 1) {
                wall = horiWall([basePoint[0] + i * maze[i][j].base[0] + offset, basePoint[1] + j * maze[i][j].base[0], -1], maze[i][j].base);
                mergedGeometry.push(wall.geometry);
            }
            if (maze[i][j].openDoors[2] == 1) {
                wall = vertWall([basePoint[0] + i * maze[i][j].base[0], basePoint[1] + j * maze[i][j].base[0] - offset, -1], maze[i][j].base);
                mergedGeometry.push(wall.geometry);
            }
            if (maze[i][j].openDoors[3] == 1) {
                wall = horiWall([basePoint[0] + i * maze[i][j].base[0] - offset, basePoint[1] + j * maze[i][j].base[0], -1], maze[i][j].base);
                mergedGeometry.push(wall.geometry);
            }
        }
    }
    mergedGeometry = BufferGeometryUtils.mergeGeometries(mergedGeometry);
    let mesh = new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    scene.add(mesh);
}

/**
 * Renders the maze with holes.
 * @param {THREE.Scene} scene - The Three.js scene.
 * @param {number} size - The size of the maze.
 * @param {number[][]} holesCenter - An array of hole centers.
 * @param {number[]} holeSize - The size of the holes.
 * @param {number} [horShift=0] - The horizontal shift of the maze.
 */
export function renderMazeWithHole(scene, size, holesCenter, holeSize, horShift = 0) {
    let maze = createMaze(size);
    let basePoint = [-size * 2 + horShift, -size * 2, 0];
    let offset = 2;
    let continueFlag = false;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (maze[i][j] == 0) continue;
            holesCenter.forEach(holeCenter => {
                if (i > holeCenter[0] - holeSize[0] && i < holeCenter[0] + holeSize[0] && j > holeCenter[1] - holeSize[1] && j < holeCenter[1] + holeSize[1])
                    continueFlag = true;
            });
            if (continueFlag) {
                continueFlag = false;
                continue;
            }
            if (maze[i][j].openDoors[0] == 1)
                scene.add(vertWall([basePoint[0] + i * maze[i][j].base[0], basePoint[1] + j * maze[i][j].base[0] + offset, 0], maze[i][j].base));
            if (maze[i][j].openDoors[1] == 1)
                scene.add(horiWall([basePoint[0] + i * maze[i][j].base[0] + offset, basePoint[1] + j * maze[i][j].base[0], 0], maze[i][j].base));
            if (maze[i][j].openDoors[2] == 1)
                scene.add(vertWall([basePoint[0] + i * maze[i][j].base[0], basePoint[1] + j * maze[i][j].base[0] - offset, 0], maze[i][j].base));
            if (maze[i][j].openDoors[3] == 1)
                scene.add(horiWall([basePoint[0] + i * maze[i][j].base[0] - offset, basePoint[1] + j * maze[i][j].base[0], 0], maze[i][j].base));
        }
    }
}
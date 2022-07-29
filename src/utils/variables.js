const FPS = 60;
let lastTimestamp = 0;

GOD_MODE = true; // Free upgrades and unit spawns
const MAP_SIZE = 30;
const MAX_RESOURCE_ON_MAP = 80;
var BASE_COLLECT_SPEED = 5;
var BASE_VILLAGER_COLLECT_SPEED = 2;
var PLAYER;

let players = {};
let playerId;
let playerRef;
let playerElements = {};

let unitCells = {};
let unitCellElements = {};

let resources = {};
let resourcesElements = {};

let units = {};
let unitElements = {};

var unitMoveTimer = 0.4;
var unitMoverTimerCD = 0.4;

let knights = {};
let knightElements = {};

var knightMoveTimer = 0.4;
var knightMoverTimerCD = 0.4;

let mages = {};
let mageElements = {};

var mageMoveTimer = 0.4;
var mageMoverTimerCD = 0.4;

var healthRegenTimer = 1.6;
var healthRegenTimerCD = 1.6;

var resetTargetsTimer = 8;
var resetTargetsTimerCD = 8;

var minimapUpdateTimer = 0.2;
var minimapUpdateTimerCD = 0.2;

let buildings = {};
let buildingElements = {};

let test = "xyz"

//

const gameContainer = document.querySelector(".game-container");
const unitCellHolderElement = document.createElement("div");
const resourcesHolderElement = document.createElement("div");
const cameraElement = document.querySelector(".camera");

// PLAYER MOVEMENT//start in the middle of the map
var pixel_size;

// Hard-coding this for now, at smaller map sizes we move less? since thats what it depends on
// pixel_size = 4;

var x = pixel_size * 80;
var y = pixel_size * 72;
x = 64;
y = 64;
speed = 1;
var held_directions = []; //State of which arrow keys we are holding down
var moveTimer = 0.2;
var moveTimerCD = 0.2;

var resourceSpawnTimer = 5;
var resourceSpawnTimerCD = 10;

/* Direction key state */
const directions = {
    up: "up",
    down: "down",
    left: "left",
    right: "right",
}
const keys = {
    //ARROW KEYS
    38: directions.up,
    37: directions.left,
    39: directions.right,
    40: directions.down,
    //WASD
    87: directions.up,
    65: directions.left,
    68: directions.right,
    83: directions.down,
}
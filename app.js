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

var unitMoveTimer = 1;
var unitMoverTimerCD = 1;

let knights = {};
let knightElements = {};

var knightMoveTimer = 1;
var knightMoverTimerCD = 1;

let mages = {};
let mageElements = {};

var mageMoveTimer = 1;
var mageMoverTimerCD = 1;

// Purpose: Generate a square shaped map of desired size
function generateMap(mapSize) {
    // Clear out old unit cells
    // const allUnitCellsRef = firebase.database().ref(`unitCells`);
    // const gameContainer = document.querySelector(".game-container");

    for (let x = 0; x < mapSize; x++) {
        for (let y = 0; y < mapSize; y++) {

            const unitCellRef = firebase.database().ref(`unitCells/${getKeyString(x, y)}`);
			unitCellRef.set({
				x,
				y,
			})

            
        }
    }
}

(function () {
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
    var moveTimer = 0.5;
    var moveTimerCD = 0.5;

    var resourceSpawnTimer = 6;
    var resourceSpawnTimerCD = 16;

    /* Direction key state */
    const directions = {
        up: "up",
        down: "down",
        left: "left",
        right: "right",
    }
    const keys = {
        38: directions.up,
        37: directions.left,
        39: directions.right,
        40: directions.down,
    }
    document.addEventListener("keydown", (e) => {
        var dir = keys[e.which];
        if (dir && held_directions.indexOf(dir) === -1) {
            held_directions.unshift(dir)
        }
    })
    
    document.addEventListener("keyup", (e) => {
        var dir = keys[e.which];
        var index = held_directions.indexOf(dir);
        if (index > -1) {
            held_directions.splice(index, 1)
        }
    });

    // Purpose: Networking/Managing all ground cells on the DB
    function manageUnitCells() {

        const allUnitCellsRef = firebase.database().ref(`unitCells`);
    
        //This block will remove coins from local state when Firebase `coins` value updates
        allUnitCellsRef.on("value", (snapshot) => {
            unitCells = snapshot.val() || {};
        });
    
        // Holds all unit cells
        unitCellHolderElement.classList.add("unit-cell-holder")
        gameContainer.appendChild(unitCellHolderElement);
    
        // Upon addition of new unit cell
        allUnitCellsRef.on("child_added", (snapshot) => {
            const unitCell = snapshot.val();
            const key = getKeyString(unitCell.x, unitCell.y);
            unitCells[key] = true;
        
            // Create the DOM Element
            const unitCellElement = document.createElement("div");
            unitCellElement.classList.add("unit-cell", "grid-cell");
            unitCellElement.setAttribute("data-position", `${getKeyString(unitCell.x, unitCell.y)}`);
            unitCellElement.innerHTML = `
                <div class="Unit-cell-sprite grid-cell"></div>
            `;
    
            // Position the Element
            const left = 64 * unitCell.x + "px";
            const top = 64 * unitCell.y + "px";
            unitCellElement.style.transform = `translate3d(${left}, ${top}, 0)`;
    
            // Keep a reference for removal later and add to DOM
            unitCellElements[key] = unitCellElement;
            unitCellHolderElement.appendChild(unitCellElement);
        })
    }

    // Purpose: Networking/Managing all players on the DB
    function managePlayers() {
        const allPlayersRef = firebase.database().ref(`players`);
        allPlayersRef.on("value", (snapshot) => {
            //Fires whenever a change occurs
            players = snapshot.val() || {};
        
            // ASSIGN ADMIN PLAYER
            if(Object.keys(players).includes(playerId)) {
                // If nobody is the admin player, assign it to him
                let nobodyIsAdminPlayer = true;
                for (let p in players) {
                    if(players[p].adminPlayer) {
                        nobodyIsAdminPlayer = false;
                    }
                }

                if (nobodyIsAdminPlayer) {
                    let newAdminPlayer = players[Object.keys(players)[0]];

                    if(typeof newAdminPlayer.id !== 'undefined') {
                        console.log("New Admin Player: " + newAdminPlayer.name + " (ID: " + newAdminPlayer.id + ")");

                        let ref = firebase.database().ref(`players/${newAdminPlayer.id}`);
                        ref.transaction((obj) => {
                            obj["adminPlayer"] = true;
                            return obj
                        })
                    }
                }
            }

            Object.keys(players).forEach((key) => { // For each player...
                const characterState = players[key];
                let el = playerElements[key];

                if(typeof el === 'undefined' || typeof characterState === 'undefined') {
                    console.log("ERROR HERE!")
                    return;
                }

                // Now update the DOM
                el.querySelector(".Character_name").innerText = characterState.name;
                el.querySelector(".Character_health").innerText = characterState.health;
                el.setAttribute("data-color", characterState.color);
                el.setAttribute("data-body-type", characterState.bodyType);
                el.setAttribute("data-direction", characterState.direction);
                const left = 64 * characterState.x + "px";
                const top = (64 * characterState.y) + "px";
  
                el.style.transform = `translate3d(${left}, ${top}, 0)`;

                // Lower characters should appear at the front!
                el.style.zIndex = Math.round(characterState.y / 16);

                if (characterState.adminPlayer) {
                    el.setAttribute("admin-player", true);
                } else {
                    el.setAttribute("admin-player", false);
                }

                let effectsContainer = "";

                if(characterState.adminPlayer) {
                    effectsContainer = effectsContainer + `<span class="Character_name-admin-player-container">&#128217;</span>`;
                }

                // Remove your player if health is less than 0
                if(characterState.health <= 0) {
                    firebase.database().ref(`players/${characterState.id}`).remove();
                }

                if(el.getAttribute("you") === "true") {
                    effectsContainer = effectsContainer + `<span class="Character_you-container">&#128994;</span>`;
                    el.style.zIndex += 1; // If YOU are the player, be even more above

                    // Update your stats on UI
                    document.querySelector(".player-health").innerText = characterState.health;
                    document.querySelector(".player-gold").innerText = characterState.resources.gold;
                    document.querySelector(".player-wood").innerText = characterState.resources.wood;
                    document.querySelector(".player-meat").innerText = characterState.resources.meat;

                    // Update your upgrades table
                    updateAllUpgrades(characterState);

                    // COUNT AI UNITS
                    var currVillCount = 0
                    var currKnightCount = 0

                    Object.keys(units).forEach((key) => {
                        if(units[key].ownerId === playerId) { currVillCount += 1; }
                    })
     
                    Object.keys(knights).forEach((key) => {
                        if(knights[key].ownerId === playerId) { currKnightCount += 1; }
                    })

                    playerRef.transaction((obj) => {
                        obj["villagerUnitCount"] = currVillCount;
                        obj["knightUnitCount"] = currKnightCount;
                        return obj
                    })

                    // UPDATE UI
                    document.querySelector(".curr-villager-count").innerText = characterState.villagerUnitCount;
                    document.querySelector(".max-villager-count").innerText = characterState.maxVillagerUnitCount;
                    document.querySelector(".curr-knight-count").innerText = characterState.knightUnitCount;
                    document.querySelector(".max-knight-count").innerText = characterState.maxKnightUnitCount;
                } 

                el.querySelector(".Character_effects-container").innerHTML = effectsContainer;
            })

            // Go over each villager, if their owner isn't in the game remove them:
            Object.keys(units).forEach((key) => {
                const characterState = units[key];

                if(!Object.keys(players).includes(characterState.ownerId)) {
                    firebase.database().ref(`units/${key}`).remove()
                }
            })

            Object.keys(knights).forEach((key) => {
                const characterState = knights[key];

                if(!Object.keys(players).includes(characterState.ownerId)) {
                    firebase.database().ref(`knights/${key}`).remove()
                }
            })

            Object.keys(mages).forEach((key) => {
                const characterState = mages[key];

                if(!Object.keys(players).includes(characterState.ownerId)) {
                    firebase.database().ref(`mages/${key}`).remove()
                }
            })
        })
    
        allPlayersRef.on("child_added", (snapshot) => {
            //Fires whenever a new node is added the tree
            const addedPlayer = snapshot.val();
    
            console.log("New Added Player: ", addedPlayer);
    
            const characterElement = document.createElement("div");
            characterElement.classList.add("Character", "grid-cell");
            if (addedPlayer.id === playerId) {
                characterElement.setAttribute("you", true);
            } else {
                characterElement.setAttribute("you", false);
            }
    
            characterElement.innerHTML = (`
                <div class="Character_shadow grid-cell"></div>
                <div class="Character_sprite grid-cell"></div>
                <div class="Character_effects-container">
                </div>
                <div class="Character_name-container">
                    <span class="Character_name"></span>
                    <span class="Character_health">0</span>
                </div>
            `);
            console.log("added player id: ", addedPlayer.id)
            playerElements[addedPlayer.id] = characterElement;
    
            //Fill in some initial state
            characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
            characterElement.querySelector(".Character_health").innerText = addedPlayer.health;
            characterElement.setAttribute("data-color", addedPlayer.color);
            characterElement.setAttribute("data-body-type", addedPlayer.bodyType);
            characterElement.setAttribute("data-direction", addedPlayer.direction);
            const left = 64 * addedPlayer.x + "px";
            const top = 64 * addedPlayer.y + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            gameContainer.appendChild(characterElement);
        })
    
    
        //Remove character DOM element after they leave
        allPlayersRef.on("child_removed", (snapshot) => {
            const removedKey = snapshot.val().id;
            gameContainer.removeChild(playerElements[removedKey]);
            delete playerElements[removedKey];
        })
    }

    // Purpose: Networking/Managing all resources on the DB
    function manageResources() {
        const allResourcesRef = firebase.database().ref(`resources`);

        // Holds all unit cells
        resourcesHolderElement.classList.add("resources-holder")
        gameContainer.appendChild(resourcesHolderElement);

        allResourcesRef.on("value", (snapshot) => {
    
            //Fires whenever a change occurs
            resources = snapshot.val() || {};

            Object.keys(resources).forEach((key) => {

                const resourceState = resources[key];
                let el = resourcesElements[key];
     
                // Now update the DOM
                el.querySelector(".Resource_amount_left").innerText = resourceState.amountLeft;
                el.querySelector(".Resource_amount_max").innerText = resourceState.amountMax;

                // Show the amounts more faded when they are at max.
                if (resourceState.amountLeft === resourceState.amountMax) {
                    el.querySelector(".Resource_amount-container").style.opacity = 0.5;
                } else {
                    el.querySelector(".Resource_amount-container").style.opacity = 1;
                }

                // Lower characters should appear at the front!
                el.style.zIndex = Math.round(resourceState.y / 16);

                if(resourceState.amountLeft <= 0) {
                    resourceRef = firebase.database().ref(`resources/${getKeyString(resourceState.x, resourceState.y)}`);
                    resourceRef.remove();
                }
            })
        })
    
        allResourcesRef.on("child_added", (snapshot) => {
            //Fires whenever a new node is added the tree
            const addedResource = snapshot.val();
            const key = getKeyString(addedResource.x, addedResource.y);
    
            const resourceElement = document.createElement("div");
            resourceElement.classList.add("Resource", "grid-cell");
    
            resourceElement.innerHTML = (`
                <div class="Resource_shadow grid-cell"></div>
                <div class="Resource_sprite grid-cell"></div>
                <div class="Resource_amount-container">
                    <span class="Resource_amount_left">0</span>/<span class="Resource_amount_max">0</span>
                </div>
            `);
    
            //Fill in some initial state
            resourceElement.setAttribute("data-position", `${getKeyString(addedResource.x, addedResource.y)}`);
            resourceElement.querySelector(".Resource_sprite").setAttribute("data-resource-type", addedResource.type);
            resourceElement.querySelector(".Resource_amount_left").innerText = addedResource.amountLeft;
            resourceElement.querySelector(".Resource_amount_max").innerText = addedResource.amountMax;

            // Position the Element
            const left = 64 * addedResource.x + "px";
            const top = 64 * addedResource.y + "px";
            resourceElement.style.transform = `translate3d(${left}, ${top}, 0)`;

            // Show the amounts more faded when they are at max.
            resourceElement.querySelector(".Resource_amount-container").style.opacity = 0.5;

            resourcesElements[key] = resourceElement;
            resourcesHolderElement.appendChild(resourceElement);
        })
    
    
        //Remove character DOM element after they leave
        allResourcesRef.on("child_removed", (snapshot) => {
            const removedKey = getKeyString(snapshot.val().x, snapshot.val().y);
            resourcesHolderElement.removeChild(resourcesElements[removedKey]);
            delete resourcesElements[removedKey];
        })
    }

    // Purpose: Networking/Managing all units on the DB
    function manageUnits() {
        const allUnitsRef = firebase.database().ref(`units`);
        
        allUnitsRef.on("value", (snapshot) => {
            //Fires whenever a change occurs
            units = snapshot.val() || {};
        
            Object.keys(units).forEach((key) => {
                const characterState = units[key];
                let el = unitElements[key];

                // If villager has no health, remove them
                if(characterState.health <= 0) {
                    firebase.database().ref(`units/${key}`).remove();
                    return;
                }

                // Now update the DOM
                el.querySelector(".Character_health").innerText = characterState.health;
                el.setAttribute("data-direction", characterState.direction);
                const left = 64 * characterState.x + "px";
                const top = (64 * characterState.y) + "px";
  
                el.style.transform = `translate3d(${left}, ${top}, 0)`;

                // Lower characters should appear at the front!
                el.style.zIndex = Math.round(characterState.y / 16);

                let effectsContainer = "";

                // YOUR villager...
                if(characterState.ownerId === playerId) {
                    effectsContainer = effectsContainer + `<span class="Character_you-container">&#128994;</span>`;
                } else {
                    // Can put owner's name, I don't want to for now...

                    // if(Object.keys(players)[0]) {
                    //     let ownerName = players[characterState.ownerId].name;
                    //     effectsContainer = effectsContainer + `<span class="Villager_owner_name" style="color: white;"> ${ownerName} </span>`;
                    // }
                }

                el.querySelector(".Character_effects-container").innerHTML = effectsContainer;
            })
        })
    
        allUnitsRef.on("child_added", (snapshot) => {
            //Fires whenever a new node is added the tree
            const addedPlayer = snapshot.val();
    
            const characterElement = document.createElement("div");
            characterElement.classList.add("Character", "grid-cell");
    
            characterElement.innerHTML = (`
                <div class="Character_shadow grid-cell"></div>
                <div class="Character_sprite grid-cell"></div>
                <div class="Character_effects-container">
                </div>
                <div class="Character_name-container">
                    <span class="Character_name"></span>
                    <span class="Character_health">0</span>
                </div>
            `);
    
            unitElements[addedPlayer.id] = characterElement;
    
            //Fill in some initial state
            characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
            characterElement.querySelector(".Character_health").innerText = addedPlayer.health;
            characterElement.setAttribute("data-color", addedPlayer.color);
            characterElement.setAttribute("data-body-type", addedPlayer.bodyType);
            characterElement.setAttribute("data-direction", addedPlayer.direction);
            const left = 64 * addedPlayer.x + "px";
            const top = 64 * addedPlayer.y + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            gameContainer.appendChild(characterElement);
        })
    
    
        //Remove character DOM element after they leave
        allUnitsRef.on("child_removed", (snapshot) => {
            const removedKey = snapshot.val().id;
            gameContainer.removeChild(unitElements[removedKey]);
            delete unitElements[removedKey];
        })
    }

    // Purpose: Networking/Managing all knights on the DB
    function manageKnights() {
        const allKnightsRef = firebase.database().ref(`knights`);

        allKnightsRef.on("value", (snapshot) => {
            //Fires whenever a change occurs
            knights = snapshot.val() || {};
        
            Object.keys(knights).forEach((key) => {
                const characterState = knights[key];
                let el = knightElements[key];

                // If knight has no health, remove them
                if(characterState.health <= 0) {
                    firebase.database().ref(`knights/${key}`).remove()
                    return
                }

                // Now update the DOM
                el.querySelector(".Character_health").innerText = characterState.health;
                el.setAttribute("data-direction", characterState.direction);
                const left = 64 * characterState.x + "px";
                const top = (64 * characterState.y) + "px";
  
                el.style.transform = `translate3d(${left}, ${top}, 0)`;

                // Lower characters should appear at the front!
                el.style.zIndex = Math.round(characterState.y / 16);

                let effectsContainer = "";

                // YOUR knight...
                if(characterState.ownerId === playerId) {
                    effectsContainer = effectsContainer + `<span class="Character_you-container">&#128994;</span>`;
                } else {
                    // Can put owner's name, I don't want to for now...

                    // if(Object.keys(players)[0]) {
                    //     let ownerName = players[characterState.ownerId].name;
                    //     effectsContainer = effectsContainer + `<span class="Villager_owner_name" style="color: white;"> ${ownerName} </span>`;
                    // }
                }

                el.querySelector(".Character_effects-container").innerHTML = effectsContainer;
            })
        })
    
        allKnightsRef.on("child_added", (snapshot) => {
            //Fires whenever a new node is added the tree
            const addedPlayer = snapshot.val();
    
            const characterElement = document.createElement("div");
            characterElement.classList.add("Character", "grid-cell");
    
            characterElement.innerHTML = (`
                <div class="Character_shadow grid-cell"></div>
                <div class="Character_sprite grid-cell"></div>
                <div class="Character_effects-container">
                </div>
                <div class="Character_name-container">
                    <span class="Character_name"></span>
                    <span class="Character_health">0</span>
                </div>
            `);
    
            knightElements[addedPlayer.id] = characterElement;
    
            //Fill in some initial state
            characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
            characterElement.querySelector(".Character_health").innerText = addedPlayer.health;
            characterElement.setAttribute("data-color", addedPlayer.color);
            characterElement.setAttribute("data-body-type", addedPlayer.bodyType);
            characterElement.setAttribute("data-direction", addedPlayer.direction);
            const left = 64 * addedPlayer.x + "px";
            const top = 64 * addedPlayer.y + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            gameContainer.appendChild(characterElement);
        })
    
    
        //Remove character DOM element after they leave
        allKnightsRef.on("child_removed", (snapshot) => {
            const removedKey = snapshot.val().id;
            gameContainer.removeChild(knightElements[removedKey]);
            delete knightElements[removedKey];
        })
    }

    // Purpose: Networking/Managing all mages on the DB
    function manageMages() {
        const allMagesRef = firebase.database().ref(`mages`);

        allMagesRef.on("value", (snapshot) => {
            //Fires whenever a change occurs
            mages = snapshot.val() || {};
        
            Object.keys(mages).forEach((key) => {
                const characterState = mages[key];
                let el = mageElements[key];

                // If mage has no health, remove them
                if(characterState.health <= 0) {
                    firebase.database().ref(`mages/${key}`).remove()
                    return
                }

                // Now update the DOM
                el.querySelector(".Character_health").innerText = characterState.health;
                el.setAttribute("data-direction", characterState.direction);
                const left = 64 * characterState.x + "px";
                const top = (64 * characterState.y) + "px";
  
                el.style.transform = `translate3d(${left}, ${top}, 0)`;

                // Lower characters should appear at the front!
                el.style.zIndex = Math.round(characterState.y / 16);

                let effectsContainer = "";

                // YOUR mage...
                if(characterState.ownerId === playerId) {
                    effectsContainer = effectsContainer + `<span class="Character_you-container">&#128994;</span>`;
                } else {
                    // Can put owner's name, I don't want to for now...
                }

                el.querySelector(".Character_effects-container").innerHTML = effectsContainer;
            })
        })
    
        allMagesRef.on("child_added", (snapshot) => {
            //Fires whenever a new node is added the tree
            const addedPlayer = snapshot.val();
    
            const characterElement = document.createElement("div");
            characterElement.classList.add("Character", "grid-cell");
    
            characterElement.innerHTML = (`
                <div class="Character_shadow grid-cell"></div>
                <div class="Character_sprite grid-cell"></div>
                <div class="Character_effects-container">
                </div>
                <div class="Character_name-container">
                    <span class="Character_name"></span>
                    <span class="Character_health">0</span>
                </div>
            `);
    
            mageElements[addedPlayer.id] = characterElement;
    
            //Fill in some initial state
            characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
            characterElement.querySelector(".Character_health").innerText = addedPlayer.health;
            characterElement.setAttribute("data-color", addedPlayer.color);
            characterElement.setAttribute("data-body-type", addedPlayer.bodyType);
            characterElement.setAttribute("data-direction", addedPlayer.direction);
            const left = 64 * addedPlayer.x + "px";
            const top = 64 * addedPlayer.y + "px";
            characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
            gameContainer.appendChild(characterElement);
        })
    
    
        //Remove character DOM element after they leave
        allMagesRef.on("child_removed", (snapshot) => {
            const removedKey = snapshot.val().id;
            gameContainer.removeChild(mageElements[removedKey]);
            delete mageElements[removedKey];
        })
    }

    function manageEffects() {
        const allEffectsRef = firebase.database().ref(`effects`);

        allEffectsRef.on("child_added", (snapshot) => {
            const eff = snapshot.val();
            const slashElement = document.createElement("div");

            if(eff.type === "sword-slash") {
                slashElement.classList.add("sword-slash");

                slashElement.innerHTML = (`
                    <div class="sword-animation-sprite" data-dir=${eff.dir}></div>
                `);
                
                slashElement.style.transform = `translate3d(${eff.left}, ${eff.top}, 0)`;
                gameContainer.appendChild(slashElement);

                setTimeout(function(){
                    gameContainer.removeChild(slashElement);

                    //Remove from DB
                    firebase.database().ref(`effects/${eff.id}`).remove()
                }, 325); 
            } else if (eff.type === "fireball") {
                slashElement.classList.add("fireball");

                slashElement.innerHTML = (`
                    <div class="fireball-animation-sprite" data-target-left=${eff.targetLeft} data-target-top=${eff.targetTop}></div>
                `);
                
                slashElement.style.transform = `translate3d(${eff.left}, ${eff.top}, 0)`;
                slashElement.style.setProperty('--target-left', eff.targetLeft)
                slashElement.style.setProperty('--target-top', eff.targetTop)

                gameContainer.appendChild(slashElement);

                setTimeout(function(){
                    gameContainer.removeChild(slashElement);

                    //Remove from DB
                    firebase.database().ref(`effects/${eff.id}`).remove()
                }, 325);
            }
            
        })
    }

    // Purpose: Handles the spawning of all resources (only ran by the "admin player")
    function resourceHandler() {
        var mapResourceAmount = Object.keys(resources).length;

        if(resourceSpawnTimer >= resourceSpawnTimerCD) {
             
            // console.log("There are ", mapResourceAmount, " resources on this map.");
            if(mapResourceAmount < MAX_RESOURCE_ON_MAP) {
                spawnResources("wood");
                spawnResources("gold");+
                spawnResources("meat");
            }

            resourceSpawnTimer = 0;
        } else {
            // Spawn faster, the less resources there are
            let multi = 1 + 2.5 * ((MAX_RESOURCE_ON_MAP - mapResourceAmount) / MAX_RESOURCE_ON_MAP);
            // console.log("MULTI: ", multi);
            resourceSpawnTimer += (1 * multi)/60;
        }
    }

    // Purpose: Instructs all the villager units of the client to take their next move (see moveUnit())
    function unitHandler() {
        if(unitMoveTimer >= unitMoverTimerCD) {
            if(resources.length === 0) { 
                unitMoveTimer = 0;
                return;
            }

            // Get all unit positions: (If there is a unit near a resource, don't go to it)
            const allUnitPos = [];
            Object.keys(units).forEach((key) => {
                allUnitPos.push( { id: key, x: units[key].x, y: units[key].y } );
            })

            // Move your units
            Object.keys(units).forEach((key) => {
                const characterState = units[key];

                // If this is YOUR villager, tell them their next move
                if(characterState.ownerId === playerId) {
                    // console.log("Controlling your villager");
                    // Get the closest resource's position and walk towards it
                    var closestResourcesPos = {};
                    var closestDistance = Number.MAX_SAFE_INTEGER;

                    Object.keys(resources).forEach((key) => {
                        var skip = false;
                        // If there is a unit near it, skip it
                        for (let i = 0; i < allUnitPos.length; i++) {
                            let dist = Math.abs(allUnitPos[i].x - resources[key].x) + Math.abs(allUnitPos[i].y - resources[key].y);
     
                            if (dist <= 3 && characterState.id !== allUnitPos[i].id) { // Shouldn't be the same villager...
                                skip = true;
                            }
                        }

                        if(skip) { return; }

                        let dist = Math.abs(characterState.x - resources[key].x) + Math.abs(characterState.y - resources[key].y);
                        if (dist < closestDistance) {
                            closestDistance = dist;
                            closestResourcesPos = { x: resources[key].x, y: resources[key].y }
                        }
                    });

                    // Move
                    if (characterState.x !== closestResourcesPos.x) {
                        var dir = characterState.x > closestResourcesPos.x ? -1 : 1;
                        moveUnit(characterState, {axis: "x", dir})
                        
                    } else {
                        var dir = characterState.y > closestResourcesPos.y ? -1 : 1;
                        moveUnit(characterState, {axis: "y", dir})
                    }
                }
            })

            unitMoveTimer = 0;
        } else {
            unitMoveTimer += 1/60;
        }
    }

    // Purpose: Instructs all the knights of the client to take their next move (see moveKnight())
    function knightHandler() {
        if(knightMoveTimer >= knightMoverTimerCD) {

            // Get all positions: (If there is a unit near a resource, don't go to it)
            const allPotentialTargetPos = [];

            Object.keys(units).forEach((key) => {
                if( units[key].ownerId === playerId) { return; }

                allPotentialTargetPos.push( { x: units[key].x, y: units[key].y } );
            })

            Object.keys(players).forEach((key) => {
                if( players[key].id === playerId) { return; }

                allPotentialTargetPos.push( { x: players[key].x, y: players[key].y } );
            })

            Object.keys(knights).forEach((key) => {
                if( knights[key].ownerId === playerId) { return; }

                allPotentialTargetPos.push( { x: knights[key].x, y: knights[key].y } );
            })
            
            Object.keys(mages).forEach((key) => {
                if( mages[key].ownerId === playerId) { return; }

                allPotentialTargetPos.push( { x: mages[key].x, y: mages[key].y } );
            })

            if(allPotentialTargetPos.length === 0) { // No target
                knightMoveTimer = 0;
                return;
            }

            // Move your knights
            Object.keys(knights).forEach((key) => {
                const characterState = knights[key];

                // If this is YOUR knight, tell them their next move
                if(characterState.ownerId === playerId) {
                    // Get the closest resource's position and walk towards it
                    var closestTargetPos = {};
                    var closestDistance = Number.MAX_SAFE_INTEGER;

                    for (let i = 0; i < allPotentialTargetPos.length; i++) {
                        let dist = Math.abs(characterState.x - allPotentialTargetPos[i].x) + Math.abs(characterState.y - allPotentialTargetPos[i].y);
                        if (dist < closestDistance) {
                            closestDistance = dist;
                            closestTargetPos = { x: allPotentialTargetPos[i].x, y: allPotentialTargetPos[i].y }
                        }
                    }

                    // Move
                    if (characterState.x !== closestTargetPos.x && characterState.y !== closestTargetPos.y) {
                        if(Math.random() < 0.5) {
                            var dir = characterState.x > closestTargetPos.x ? -1 : 1;
                            moveKnight(characterState, {axis: "x", dir})
                        } else {
                            var dir = characterState.y > closestTargetPos.y ? -1 : 1;
                            moveKnight(characterState, {axis: "y", dir})
                        }
                    } else if (characterState.x !== closestTargetPos.x) {
                        var dir = characterState.x > closestTargetPos.x ? -1 : 1;
                        moveKnight(characterState, {axis: "x", dir})
                    } else {
                        var dir = characterState.y > closestTargetPos.y ? -1 : 1;
                        moveKnight(characterState, {axis: "y", dir})
                    }
                }
            })

            knightMoveTimer = 0;
        } else {
            knightMoveTimer += 1/60;
        }
    }

    // Purpose: Instructs all the mages of the client to take their next move (see moveMage())
    function mageHandler() {
        if(mageMoveTimer >= mageMoverTimerCD) {

            // Get all positions: (If there is a unit near a resource, don't go to it)
            const allPotentialTargetPos = [];

            Object.keys(units).forEach((key) => {
                if( units[key].ownerId === playerId) { return; }
                var result = units[key];
                result["tribe"] = "units";
                allPotentialTargetPos.push(result)
            })

            Object.keys(players).forEach((key) => {
                if( players[key].id === playerId) { return; }
                var result = players[key];
                result["tribe"] = "players";
                allPotentialTargetPos.push(result);
            })

            Object.keys(knights).forEach((key) => {
                if( knights[key].ownerId === playerId) { return; }
                var result = knights[key];
                result["tribe"] = "knights";
                allPotentialTargetPos.push(result);
            })
            
            Object.keys(mages).forEach((key) => {
                if( mages[key].ownerId === playerId) { return; }
                var result = mages[key];
                result["tribe"] = "mages";
                allPotentialTargetPos.push(result);
            })

            if(allPotentialTargetPos.length === 0) { // No target
                mageMoveTimer = 0;
                return;
            }

            // Move your mage
            Object.keys(mages).forEach((key) => {
                const characterState = mages[key];

                // If this is YOUR mage, tell them their next move
                if(characterState.ownerId === playerId) {
                    // Try to attack from range
                    var attackRange = 4;
                    var inRangeTargets = [];

                    // Get the closest resource's position and walk towards it
                    var closestTargetPos = {};
                    var closestDistance = Number.MAX_SAFE_INTEGER;

                    for (let i = 0; i < allPotentialTargetPos.length; i++) {
                        let dist = Math.abs(characterState.x - allPotentialTargetPos[i].x) + Math.abs(characterState.y - allPotentialTargetPos[i].y);
                        if (dist <= attackRange) {
                            inRangeTargets.push(allPotentialTargetPos[i])
                        }

                        if (dist < closestDistance) {
                            closestDistance = dist;
                            closestTargetPos = { x: allPotentialTargetPos[i].x, y: allPotentialTargetPos[i].y }
                        }
                    }

                    if(inRangeTargets.length > 0) { // Attack target in range
                        let lowestHealth = Number.MAX_SAFE_INTEGER;
                        let lowestHealthTarget = {};

                        // Target the lowest health target!
                        for (let i = 0; i < inRangeTargets.length; i++) {
                            if (inRangeTargets[i].health < lowestHealth) {
                                lowestHealth = inRangeTargets[i].health;
                                lowestHealthTarget = inRangeTargets[i];
                            }
                        }

                        mageAttack(characterState, lowestHealthTarget);
                    } else { 
                        // Move
                        if (characterState.x !== closestTargetPos.x && characterState.y !== closestTargetPos.y) {
                            if(Math.random() < 0.5) {
                                var dir = characterState.x > closestTargetPos.x ? -1 : 1;
                                moveMage(characterState, {axis: "x", dir})
                            } else {
                                var dir = characterState.y > closestTargetPos.y ? -1 : 1;
                                moveMage(characterState, {axis: "y", dir})
                            }
                        } else if (characterState.x !== closestTargetPos.x) {
                            var dir = characterState.x > closestTargetPos.x ? -1 : 1;
                            moveMage(characterState, {axis: "x", dir})
                        } else {
                            var dir = characterState.y > closestTargetPos.y ? -1 : 1;
                            moveMage(characterState, {axis: "y", dir})
                        }
                    }
                }
            })

            mageMoveTimer = 0;
        } else {
            mageMoveTimer += 1/60;
        }
    }

    // Purpose: Spawn a specific resource somewhere random on the map
    function spawnResources(type) {
        
        // Type has to be "wood", "gold" or "meat"
        if (type !== "wood" && type !== "gold" && type !== "meat") {
            console.log("ERROR: INCORRECT INPUT FOR SPAWN RESOURCE")
            return;
        }
        
        var lastPos = { x: -1, y: -1 }
        var n = 0;

        while(true) {
            lastPos = {
                x: Math.floor(0 + Math.random() * (MAP_SIZE - 0)),
                y: Math.floor(0 + Math.random() * (MAP_SIZE - 0))
            }

            if(!isOccupiedByPlayer(lastPos.x, lastPos.y, players) && !isOccupiedByPlayer(lastPos.x, lastPos.y, resources)) {
                break;
            } else {
                n += 1;
                if (n >= 100) {
                    console.log("ERROR: NO EMPTY SPOT FOUND!");
                    break;
                }
            }
        }

        let chosenAmount = randomFromArray([120, 180, 360]);
        const resourceRef = firebase.database().ref(`resources/${getKeyString(lastPos.x, lastPos.y)}`);
        resourceRef.set({
            type: type,
            x: lastPos.x,
            y: lastPos.y,
            amountLeft: chosenAmount,
            amountMax: chosenAmount,
        })
    }

    // Purpose: Moving the main character (what to do if walking into a resource, or an enemy)
    function moveCharacter() {
        // Progress can move timer
        if(moveTimer < moveTimerCD) {
            moveTimer += 1/60;
        }

        // Old player positions
        let newX = players[playerId].x;
		let newY = players[playerId].y;

        const held_direction = held_directions[0];
        if (held_direction && moveTimer >= moveTimerCD) {
            moveTimer = 0;

            if (held_direction === directions.right) {newX += speed;}
            if (held_direction === directions.left) {newX -= speed;}
            if (held_direction === directions.down) {newY += speed;}
            if (held_direction === directions.up) {newY -= speed;}

            // Check if position is out of bounds
            if (newX < 0 || newX >= MAP_SIZE || newY < 0 || newY >= MAP_SIZE) { 
                return
            };

            // Check if new position is occupied
            var hitTarget = isOccupiedByPlayer(newX, newY, players)
            
            if(hitTarget) {
    
                let ref = firebase.database().ref(`players/${hitTarget.id}`);
                ref.transaction((obj) => {
                    obj["health"] = hitTarget.health - PLAYER.damage;
                    return obj
                })

                swordSlash( { x: PLAYER.x, y: PLAYER.y }, {x: hitTarget.x, y: hitTarget.y } );
                return;
            }

            var hitUnit = isOccupiedByPlayer(newX, newY, units)

            if (hitUnit) {
                if (hitUnit.ownerId !== playerId) { // If not your unit, damage it
                    firebase.database().ref(`units/${hitUnit.id}`).transaction((obj) => {
                        obj["health"] = obj["health"] - PLAYER.damage;
                        return obj
                    })
                } 
                swordSlash( { x: PLAYER.x, y: PLAYER.y }, {x: hitUnit.x, y: hitUnit.y } );
                return;
            }

            var hitKnight = isOccupiedByPlayer(newX, newY, knights)

            if (hitKnight) {
                if (hitKnight.ownerId !== playerId) { // If not your unit, damage it
                    firebase.database().ref(`knights/${hitKnight.id}`).transaction((obj) => {
                        obj["health"] = obj["health"] - PLAYER.damage;
                        return obj
                    })
                } 
                swordSlash( { x: PLAYER.x, y: PLAYER.y }, {x: hitKnight.x, y: hitKnight.y } );
                return;
            }

            var hitMage = isOccupiedByPlayer(newX, newY, mages)

            if (hitMage) {
                if (hitMage.ownerId !== playerId) { // If not your unit, damage it
                    firebase.database().ref(`mages/${hitMage.id}`).transaction((obj) => {
                        obj["health"] = obj["health"] - PLAYER.damage;
                        return obj
                    })
                } 
                swordSlash( { x: PLAYER.x, y: PLAYER.y }, {x: hitMage.x, y: hitMage.y } );
                return;
            }

            var hitResource = isOccupiedByPlayer(newX, newY, resources)

            if(hitResource) {
                var remove_amount = BASE_COLLECT_SPEED;
                var plyr = players[playerId];
                var targetEle = resourcesElements[getKeyString(hitResource.x, hitResource.y)];

                // Shake the hit resource
                if (typeof targetEle !== 'undefined') {
                    targetEle.querySelector(".Resource_sprite").classList.add("shake");
                    setTimeout(() => {
                        targetEle.querySelector(".Resource_sprite").classList.remove("shake");
                    }, 350)
                }
                
                // Give yourself the resource
                if(hitResource.type === "wood") {
                    remove_amount += 2 * plyr.stats.chopLevel;

                    playerRef.transaction((obj) => {
                        obj["resources"] = { 
                            gold: plyr.resources.gold,
                            wood: plyr.resources.wood + Math.min(remove_amount, hitResource.amountLeft),
                            meat: plyr.resources.meat
                        } 
                        return obj
                    })

                } else if(hitResource.type === "gold") {
                    remove_amount += 2 * plyr.stats.mineLevel;

                    playerRef.transaction((obj) => {
                        obj["resources"] = { 
                            gold: plyr.resources.gold + Math.min(remove_amount, hitResource.amountLeft),
                            wood: plyr.resources.wood,
                            meat: plyr.resources.meat
                        } 
                        return obj
                    })

                } else if(hitResource.type === "meat") {
                    remove_amount += 2 * plyr.stats.huntLevel;

                    playerRef.transaction((obj) => {
                        obj["resources"] = { 
                            gold: plyr.resources.gold,
                            wood: plyr.resources.wood,
                            meat: plyr.resources.meat + Math.min(remove_amount, hitResource.amountLeft)
                        } 
                        return obj
                    })

                }

                firebase.database().ref(`resources/${getKeyString(hitResource.x, hitResource.y)}`).transaction((obj) => {
                    obj["amountLeft"] = obj["amountLeft"] - Math.min(remove_amount, obj["amountLeft"])
                    return obj
                });

                return;
            }

            // TO DO: Put map limits here
            if (newX >= 0 && newX < MAP_SIZE * 16 && newY >= 0 && newY < MAP_SIZE * 16) {

                playerRef.transaction((obj) => {
                    obj["x"] = newX;
                    obj["y"] = newY;

                    return obj
                })
            }
        }
    }

    // Purpose: Moving a single unit (villager), moving towards resources and moving out of blockages etc.
    function moveUnit(characterState, way, reTry = true) {

        const unitRef = firebase.database().ref(`units/${characterState.id}`);

        // Move toward the resource
        var newPos = {};
        if (way.axis === "x") {
            newPos = { 
                x: characterState.x + way.dir, 
                y: characterState.y };
        } else if (way.axis === "y") {
            newPos = { 
                x: characterState.x, 
                y: characterState.y + way.dir 
            };
        }

        // If you are hitting a player OR unit OR out of bounds return
        if(isOccupiedByPlayer(newPos.x, newPos.y, players) || 
           isOccupiedByPlayer(newPos.x, newPos.y, units) ||
           isOccupiedByPlayer(newPos.x, newPos.y, knights) ||
           isOccupiedByPlayer(newPos.x, newPos.y, mages)) {
            if(reTry) {
                let newWay = { 
                    axis: (way.axis === "x") ? "y" : "x", 
                    dir: (Math.random()>=0.5)? 1 : -1
                }
                moveUnit(characterState, newWay, false); // Attempt to move in a different direction
            }
            
            return;
        }

        if (newPos.x < 0 || newPos.x >= MAP_SIZE || newPos.y < 0 || newPos.y >= MAP_SIZE) { 
            return
        };

        // Check if we are hitting a new resource
        var hitResource = isOccupiedByPlayer(newPos.x, newPos.y, resources)

        if(hitResource) {
            var remove_amount = BASE_VILLAGER_COLLECT_SPEED;
            var plyr = players[characterState.ownerId];
            var targetEle = resourcesElements[getKeyString(hitResource.x, hitResource.y)];

            // Shake the hit resource
            if (typeof targetEle !== 'undefined') {
                targetEle.querySelector(".Resource_sprite").classList.add("shake");
                setTimeout(() => {
                    targetEle.querySelector(".Resource_sprite").classList.remove("shake");
                }, 350)
            }
            
            // Give yourself the resource
            if(hitResource.type === "wood") {
                remove_amount += plyr.stats.chopLevel;

                playerRef.transaction((obj) => {
                    obj["resources"] = { 
                        gold: plyr.resources.gold,
                        wood: plyr.resources.wood + Math.min(remove_amount, hitResource.amountLeft),
                        meat: plyr.resources.meat 
                    } 
                    return obj
                })

            } else if(hitResource.type === "gold") {
                remove_amount += plyr.stats.mineLevel;

                playerRef.transaction((obj) => {
                    obj["resources"] = { 
                        gold: plyr.resources.gold + Math.min(remove_amount, hitResource.amountLeft),
                        wood: plyr.resources.wood,
                        meat: plyr.resources.meat 
                    } 
                    return obj
                })

            } else if(hitResource.type === "meat") {
                remove_amount += plyr.stats.huntLevel;

                playerRef.transaction((obj) => {
                    obj["resources"] = { 
                        gold: plyr.resources.gold,
                        wood: plyr.resources.wood,
                        meat: plyr.resources.meat + Math.min(remove_amount, hitResource.amountLeft)
                    } 
                    return obj
                })
            }

            firebase.database().ref(`resources/${getKeyString(hitResource.x, hitResource.y)}`).transaction((obj) => {
                obj["amountLeft"] = obj["amountLeft"] - Math.min(remove_amount, obj["amountLeft"])
                return obj
            });

        } else {
            // Not hitting a resource... move
            unitRef.transaction((obj) => {
                obj["x"] = newPos.x;
                obj["y"] = newPos.y;

                return obj
            })
        }
    }

    // Purpose: Moving a single knight (what happens when a target is found etc.)
    function moveKnight(characterState, way, reTry = true) {
        const knightRef = firebase.database().ref(`knights/${characterState.id}`);

        function reTryMove () {
            if(reTry) {
                let newWay = { 
                    axis: (way.axis === "x") ? "y" : "x", 
                    dir: (Math.random()>=0.5)? 1 : -1
                }

                moveKnight(characterState, newWay, false); // Attempt to move in a different direction
            } 
        }

        // Move toward the target
        var newPos = {};
        if (way.axis === "x") {
            newPos = { 
                x: characterState.x + way.dir, 
                y: characterState.y };
        } else if (way.axis === "y") {
            newPos = { 
                x: characterState.x, 
                y: characterState.y + way.dir 
            };
        }

        if (newPos.x < 0 || newPos.x >= MAP_SIZE || newPos.y < 0 || newPos.y >= MAP_SIZE) { 
            return
        };

        var plyr = players[characterState.ownerId];
        var dmg = characterState.damage + plyr.stats.attackLevel;

        // Check if new position is occupied
        var hitTarget = isOccupiedByPlayer(newPos.x, newPos.y, players)
            
        if(hitTarget) {
            if(hitTarget.id === characterState.ownerId) { 
                reTryMove();  
            } else {
                firebase.database().ref(`players/${hitTarget.id}`).transaction((obj) => {
                    obj["health"] = obj["health"] - dmg;
                    return obj
                });
                
                swordSlash( { x: characterState.x, y: characterState.y }, {x: hitTarget.x, y: hitTarget.y } );
            }

            return;
        }

        var hitUnit = isOccupiedByPlayer(newPos.x, newPos.y, units)

        if (hitUnit) {
            if (hitUnit.ownerId === characterState.ownerId) { 
                reTryMove();
            } else { // If not your unit, damage it
                firebase.database().ref(`units/${hitUnit.id}`).transaction((obj) => {
                    obj["health"] = obj["health"] - dmg;
                    return obj
                });

                swordSlash( { x: characterState.x, y: characterState.y }, {x: hitUnit.x, y: hitUnit.y } );
            }
    
            return;
        }

        var hitKnight = isOccupiedByPlayer(newPos.x, newPos.y, knights)

        if (hitKnight) {
            if (hitKnight.ownerId === characterState.ownerId) { 
                reTryMove();
            } else {
                firebase.database().ref(`knights/${hitKnight.id}`).transaction((obj) => {
                    obj["health"] = obj["health"] - dmg;
                    return obj
                });

                swordSlash( { x: characterState.x, y: characterState.y }, {x: hitKnight.x, y: hitKnight.y } );
            }
    
            return;
        }

        var hitMage = isOccupiedByPlayer(newPos.x, newPos.y, mages)

        if (hitMage) {
            if (hitMage.ownerId === playerId) { // If not your unit, damage it
                reTryMove();
            } else {
                firebase.database().ref(`mages/${hitMage.id}`).transaction((obj) => {
                    obj["health"] = obj["health"] - dmg;
                    return obj
                });

                swordSlash( { x: characterState.x, y: characterState.y }, {x: hitMage.x, y: hitMage.y } );
            }
    
            return;
        }
            
        // Not hitting anything... move
        knightRef.transaction((obj) => {
            obj["x"] = newPos.x;
            obj["y"] = newPos.y;

            return obj
        });
    }

    // Purpose: Moving a single mage (what happens when a target is found etc.)
    function moveMage(characterState, way, reTry = true) {
        const mageRef = firebase.database().ref(`mages/${characterState.id}`);

        function reTryMove () {
            if(reTry) {
                let newWay = { 
                    axis: (way.axis === "x") ? "y" : "x", 
                    dir: (Math.random()>=0.5)? 1 : -1
                }

                moveMage(characterState, newWay, false); // Attempt to move in a different direction
            } 
        }

        // Move toward the target
        var newPos = {};
        if (way.axis === "x") {
            newPos = { 
                x: characterState.x + way.dir, 
                y: characterState.y };
        } else if (way.axis === "y") {
            newPos = { 
                x: characterState.x, 
                y: characterState.y + way.dir 
            };
        }

        if (newPos.x < 0 || newPos.x >= MAP_SIZE || newPos.y < 0 || newPos.y >= MAP_SIZE) { 
            return
        };

        var plyr = players[characterState.ownerId];
        var dmg = characterState.damage + plyr.stats.attackLevel * 2;

        // MELEE Attack if you come in contact
        // Check if new position is occupied
        var hitTarget = isOccupiedByPlayer(newPos.x, newPos.y, players)
            
        if(hitTarget) {
            if(hitTarget.id === characterState.ownerId) { 
                reTryMove();  
            } else {
                firebase.database().ref(`players/${hitTarget.id}`).transaction((obj) => {
                    obj["health"] = obj["health"] - dmg;
                    return obj
                });
                
                swordSlash( { x: characterState.x, y: characterState.y }, {x: hitTarget.x, y: hitTarget.y } );
            }

            return;
        }

        var hitUnit = isOccupiedByPlayer(newPos.x, newPos.y, units)

        if (hitUnit) {
            if (hitUnit.ownerId === characterState.ownerId) { 
                reTryMove();
            } else { // If not your unit, damage it
                firebase.database().ref(`units/${hitUnit.id}`).transaction((obj) => {
                    obj["health"] = obj["health"] - dmg;
                    return obj
                });

                swordSlash( { x: characterState.x, y: characterState.y }, {x: hitUnit.x, y: hitUnit.y } );
            }
    
            return;
        }

        var hitKnight = isOccupiedByPlayer(newPos.x, newPos.y, knights)

        if (hitKnight) {
            if (hitKnight.ownerId === characterState.ownerId) { 
                reTryMove();
            } else {
                firebase.database().ref(`knights/${hitKnight.id}`).transaction((obj) => {
                    obj["health"] = obj["health"] - dmg;
                    return obj
                });

                swordSlash( { x: characterState.x, y: characterState.y }, {x: hitKnight.x, y: hitKnight.y } );
            }
    
            return;
        }

        var hitMage = isOccupiedByPlayer(newPos.x, newPos.y, mages)

        if (hitMage) {
            if (hitMage.ownerId === playerId) { // If not your unit, damage it
                reTryMove();
            } else {
                firebase.database().ref(`mages/${hitMage.id}`).transaction((obj) => {
                    obj["health"] = obj["health"] - dmg;
                    return obj
                });

                swordSlash( { x: characterState.x, y: characterState.y }, {x: hitMage.x, y: hitMage.y } );
            }
    
            return;
        }
            
        // Not hitting anything... move
        mageRef.transaction((obj) => {
            obj["x"] = newPos.x;
            obj["y"] = newPos.y;

            return obj
        });
    }

    // Purpose: Attack from range from a mage
    function mageAttack(characterState, target) {
        var plyr = players[characterState.ownerId];
        var dmg = characterState.damage + 2 * plyr.stats.attackLevel;

        firebase.database().ref(`${target.tribe}/${target.id}`).transaction((obj) => {
            obj["health"] = obj["health"] - dmg;
            return obj
        });

        fireBall( { x: characterState.x, y: characterState.y }, {x: target.x, y: target.y } );        
    }

    // Purpose: Moving the map in accordance to where the player is moving to have a "camera effect"
    function setCamera() {
        var cameraWidth = cameraElement.offsetWidth;
        var cameraHeight = cameraElement.offsetHeight;
        // Note, (0, -128) places the 64x64 character block right at the bottom left corner.
        // To place the character block's center at the corner itself, we need to move 32 down, 32 left --> at (-32, -96)
        // Camera is 640x576 sized. Therefore middle would be: ( -32 + 640 / 2, -96 - 576 / 2 ) = (288, -384)

        // Base size is 160x144

        // Calculated center:
        var camera_left = -32 + cameraWidth / 2; // More (+), more right
        var camera_top = -32 + cameraHeight / 2; // More (-), higher up

        gameContainer.style.transform = `translate3d( 
            ${ -players[playerId].x * pixel_size * 16 + camera_left }px, ${ -players[playerId].y * pixel_size * 16 + camera_top }px, 0 
        )`;
        
        // NOW SETTING PLAYER POSITION IN MANAGE PLAYER
        // playerElements[playerId].style.transform = `translate3d( 
        //     ${ players[playerId].x * pixel_size }px, ${ players[playerId].y * pixel_size }px, 0 
        // )`;
    }

    const step = () => {

        pixel_size = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
        );

        if (Object.keys(players).includes(playerId)) { // Player must be loaded in
            moveCharacter();
            setCamera();

            if(players[playerId].adminPlayer) {
                resourceHandler();
            }
            
            unitHandler();
            knightHandler();
            mageHandler();
        };

        PLAYER = players[playerId];

        requestAnimationFrame(() => { // Web browser calls this function every time a new frame begins
            step();
        })
    }

    function initGame() {

        generateMap(MAP_SIZE);

        manageUnitCells();
        managePlayers(); // Returns the list of players
        manageResources();
        manageUnits();
        manageKnights();
        manageMages();
        manageEffects();

        setupUpgradeButtons();
        setupSpawnButtons();

        step();
    }
    

    firebase.auth().onAuthStateChanged((user) => {
        var checkPlayers = setInterval(function(){
            if(Object.keys(players).includes(playerId)) {

                Object.keys(units).forEach((key) => {
                    const characterState = units[key];
                    if(characterState.ownerId === user.uid) {
                        firebase.database().ref(`units/${key}`).remove()
                    }
                })

                Object.keys(knights).forEach((key) => {
                    const characterState = knights[key];
                    if(characterState.ownerId === user.uid) {
                        firebase.database().ref(`knights/${key}`).remove()
                    }
                })

                Object.keys(mages).forEach((key) => {
                    const characterState = mages[key];
                    if(characterState.ownerId === user.uid) {
                        firebase.database().ref(`mages/${key}`).remove()
                    }
                })

                clearInterval(checkPlayers);
            }
        }, 10);

		if (user) {
			//You're logged in!
			playerId = user.uid;
            
            // Initial player name
            const bodyType = 3; // The king body type
            const name = createName(bodyType);

            // The name inputting area, not used yet
			// playerNameInput.value = name;

            // Spawn position
            // Wait 500ms for the resources from server to load (we need to check positions to stop overlap!)
            setTimeout(() => {
                playerRef = firebase.database().ref(`players/${playerId}`);
                const { x, y } = getRandomSafeSpot();

                playerRef.set({
                    id: playerId,
                    name,
                    health: 100,
                    damage: 10,
                    resources: {
                        gold: 0,
                        wood: 0,
                        meat: 0,
                    },
                    stats: {
                        healthLevel: 0,
                        attackLevel: 0,
                        mineLevel: 0,
                        chopLevel: 0,
                        huntLevel: 0,
                    },
                    villagerUnitCount: 0,
                    maxVillagerUnitCount: 3,
                    knightUnitCount: 0,
                    maxKnightUnitCount: 3,
                    mageUnitCount: 0,
                    maxMageUnitCount: 3,
                    color: randomFromArray(["blue", "orange", "green", "gray"]),
                    bodyType,
                    x,
                    y,
                })

                // Set player name on UI
                document.querySelector(".player-name").innerText = name;

                //Remove me from Firebase when I diconnect
                playerRef.onDisconnect().remove();

            }, 500);

            //Begin the game now that we are signed in
            initGame();

		} else {
			//You're logged out.
		}
	})

	firebase.auth().signInAnonymously().catch((error) => {
		var errorCode = error.code;
		var errorMessage = error.message;
		// ...
		console.log(errorCode, errorMessage);
	});
})();

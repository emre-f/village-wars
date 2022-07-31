VILLAGER_BASE_HEALTH = 20;
VILLAGER_HEALTH_SCALE = 3;

KNIGHT_BASE_HEALTH = 50;
KNIGHT_HEALTH_SCALE = 5;

MAGE_BASE_HEALTH = 20;
MAGE_HEALTH_SCALE = 2;

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

            // Update minimap pos
            updateMinimapCellElement(key, {x: characterState.x, y: characterState.y});
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

        let effectsContainer = "";

        // YOUR unit...
        if(addedPlayer.ownerId === playerId) {
            effectsContainer = effectsContainer + `<span class="Character_you-container">&#128994;</span>`;
            getMinimapCellElement(addedPlayer.id, {x: addedPlayer.x, y: addedPlayer.y }, "ally");
        } else {
            getMinimapCellElement(addedPlayer.id, {x: addedPlayer.x, y: addedPlayer.y }, "enemy-unit");
        }

        characterElement.querySelector(".Character_effects-container").innerHTML = effectsContainer;

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
        removeMinimapCellElement(removedKey);
    })
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
            if ( units[key] == null ) { return; }
            allUnitPos.push( { id: key, x: units[key].x, y: units[key].y } );
        })

        // Move your units
        Object.keys(units).forEach((key) => {
            const characterState = units[key];

            // If this is YOUR villager, tell them their next move
            if(characterState != null && characterState.ownerId === playerId) {
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
        if (typeof targetEle !== 'undefined' && !targetEle.querySelector(".Resource_sprite").classList.contains("shake")) {
            targetEle.querySelector(".Resource_sprite").classList.add("shake");
            setTimeout(() => {
                targetEle.querySelector(".Resource_sprite").classList.remove("shake");
            }, 350)
        }
        
        // Give yourself the resource
        if(hitResource.type === "wood") {
            remove_amount += plyr.stats.chopLevel;

            playerRef.transaction((obj) => { if (obj == null) { return }
                obj.resources = { 
                    gold: plyr.resources.gold,
                    wood: plyr.resources.wood + Math.min(remove_amount, hitResource.amountLeft),
                    meat: plyr.resources.meat 
                } 
                return obj
            })

        } else if(hitResource.type === "gold") {
            remove_amount += plyr.stats.mineLevel;

            playerRef.transaction((obj) => { if (obj == null) { return }
                obj.resources = { 
                    gold: plyr.resources.gold + Math.min(remove_amount, hitResource.amountLeft),
                    wood: plyr.resources.wood,
                    meat: plyr.resources.meat 
                } 
                return obj
            })

        } else if(hitResource.type === "meat") {
            remove_amount += plyr.stats.huntLevel;

            playerRef.transaction((obj) => { if (obj == null) { return }
                obj.resources = { 
                    gold: plyr.resources.gold,
                    wood: plyr.resources.wood,
                    meat: plyr.resources.meat + Math.min(remove_amount, hitResource.amountLeft)
                } 
                return obj
            })
        }

        firebase.database().ref(`resources/${getKeyString(hitResource.x, hitResource.y)}`).transaction((obj) => { if (obj == null) { return }
            obj.amountLeft = obj.amountLeft - Math.min(remove_amount, obj.amountLeft)
            return obj
        });

    } else {
        // Not hitting a resource... move
        unitRef.transaction((obj) => { if (obj == null) { return }
            obj.x = newPos.x;
            obj.y = newPos.y;

            return obj
        })
    }
}
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

            // Update minimap pos
            updateMinimapCellElement(key, {x: characterState.x, y: characterState.y});
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

        let effectsContainer = "";

        // YOUR knight...
        if(addedPlayer.ownerId === playerId) {
            effectsContainer = effectsContainer + `<span class="Character_you-container">&#128994;</span>`;
            getMinimapCellElement(addedPlayer.id, {x: addedPlayer.x, y: addedPlayer.y }, "ally");
        } else {
            getMinimapCellElement(addedPlayer.id, {x: addedPlayer.x, y: addedPlayer.y }, "enemy-unit");
        }

        characterElement.querySelector(".Character_effects-container").innerHTML = effectsContainer;

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
        removeMinimapCellElement(removedKey);
    })
}

// Purpose: Instructs all the knights of the client to take their next move (see moveKnight())
function knightHandler() {
    if(knightMoveTimer >= knightMoverTimerCD) {

        // Get all positions: (If there is a unit near a resource, don't go to it)
        let { allPotentialTargetPos, ownerTargets } = getTargets();

        if(allPotentialTargetPos.length === 0) { // No target
            knightMoveTimer = 0;
            return;
        }

        // If you have ANY priority targets, now thats all you care about
        if(ownerTargets.length > 0) {
            allPotentialTargetPos = ownerTargets;
        }
        
        // Move your knights
        Object.keys(knights).forEach((key) => {
            const characterState = knights[key];

            // If this is YOUR knight, tell them their next move
            if(characterState != null && characterState.ownerId === playerId) {
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
            firebase.database().ref(`players/${hitTarget.id}`).transaction((obj) => { if (obj == null) { return }
                obj.health = obj.health - dmg;
                obj.lastDamagedById = characterState.ownerId;
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
            firebase.database().ref(`units/${hitUnit.id}`).transaction((obj) => { if (obj == null) { return }
                obj.health = obj.health - dmg;
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
            firebase.database().ref(`knights/${hitKnight.id}`).transaction((obj) => { if (obj == null) { return }
                obj.health = obj.health - dmg;
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
            firebase.database().ref(`mages/${hitMage.id}`).transaction((obj) => { if (obj == null) { return }
                obj.health = obj.health - dmg;
                return obj
            });

            swordSlash( { x: characterState.x, y: characterState.y }, {x: hitMage.x, y: hitMage.y } );
        }

        return;
    }

    var hitBuilding = isOccupiedByPlayer(newPos.x, newPos.y, buildings)

    if (hitBuilding) {
        if (hitBuilding.ownerId !== playerId) { // If not your unit, damage it
            firebase.database().ref(`buildings/${hitBuilding.id}`).transaction((obj) => { if (obj == null) { return }
                obj.health = obj.health - dmg;
                return obj
            })

            swordSlash( { x: characterState.x, y: characterState.y }, {x: hitBuilding.x, y: hitBuilding.y } );
        } 
        
        return;
    }
        
    // Not hitting anything... move
    knightRef.transaction((obj) => { if (obj == null) { return }
        obj.x = newPos.x;
        obj.y = newPos.y;

        return obj
    });
}
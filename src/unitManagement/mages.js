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

            // Update minimap pos
            updateMinimapCellElement(key, {x: characterState.x, y: characterState.y});
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

        let effectsContainer = "";

        // YOUR mage...
        if(addedPlayer.ownerId === playerId) {
            effectsContainer = effectsContainer + `<span class="Character_you-container">&#128994;</span>`;
            getMinimapCellElement(addedPlayer.id, {x: addedPlayer.x, y: addedPlayer.y }, "ally");
        } else {
            getMinimapCellElement(addedPlayer.id, {x: addedPlayer.x, y: addedPlayer.y }, "enemy-unit");
        }

        characterElement.querySelector(".Character_effects-container").innerHTML = effectsContainer;

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
        removeMinimapCellElement(removedKey);
    })
}

// Purpose: Instructs all the mages of the client to take their next move (see moveMage())
function mageHandler() {
    if(mageMoveTimer >= mageMoverTimerCD) {

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

        // Move your mage
        Object.keys(mages).forEach((key) => {
            const characterState = mages[key];

            // If this is YOUR mage, tell them their next move
            if(characterState != null && characterState.ownerId === playerId) {
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
            firebase.database().ref(`knights/${hitKnight.id}`).transaction((obj) => { if (obj == null) { return }
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
            firebase.database().ref(`mages/${hitMage.id}`).transaction((obj) => { if (obj == null) { return }
                obj.health = obj.health - dmg;
                return obj
            });

            swordSlash( { x: characterState.x, y: characterState.y }, {x: hitMage.x, y: hitMage.y } );
        }

        return;
    }
        
    // Not hitting anything... move
    mageRef.transaction((obj) => { if (obj == null) { return } 
        obj.x = newPos.x;
        obj.y = newPos.y;

        return obj
    });
}

// Purpose: Attack from range from a mage
function mageAttack(characterState, target) {
    var plyr = players[characterState.ownerId];
    var dmg = characterState.damage + 2 * plyr.stats.attackLevel;

    firebase.database().ref(`${target.tribe}/${target.id}`).transaction((obj) => { if (obj == null) { return }
        obj.health = obj.health - dmg;
        if(target.tribe === "players") { obj.lastDamagedById = characterState.ownerId; }
        return obj
    });

    fireBall( { x: characterState.x, y: characterState.y }, {x: target.x, y: target.y } );        
}
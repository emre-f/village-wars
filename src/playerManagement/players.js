// Purpose: Networking/Managing all players on the DB
function managePlayers() {
    const allPlayersRef = firebase.database().ref(`players`);
    allPlayersRef.on("value", (snapshot) => {
        //Fires whenever a change occurs
        players = snapshot.val() || {};

        // ASSIGN ADMIN PLAYER
        if(playerId in players) {
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
                    ref.transaction((obj) => { if (obj == null) { return }
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
                // Give your resources to your killer
                if (characterState.lastDamagedById !== "none") {
                    console.log(characterState.name + " was killed by " + players[characterState.lastDamagedById].name)
                    addMessageToQueue(characterState.name + " &#9876;&#65039; " + players[characterState.lastDamagedById].name);
                    stealResources(characterState.lastDamagedById, characterState)
                }
                
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
                var currMagesCount = 0

                Object.keys(units).forEach((key) => {
                    if(units[key] != null && units[key].ownerId === playerId) { currVillCount += 1; }
                })
 
                Object.keys(knights).forEach((key) => {
                    if(knights[key] != null && knights[key].ownerId === playerId) { currKnightCount += 1; }
                })

                Object.keys(mages).forEach((key) => {
                    if(mages[key] != null && mages[key].ownerId === playerId) { currMagesCount += 1; }
                })

                playerRef.transaction((obj) => { if (obj == null) { return }
                    obj.villagerUnitCount = currVillCount;
                    obj.knightUnitCount = currKnightCount;
                    obj.mageUnitCount = currMagesCount;
                    return obj
                })

                // UPDATE UI
                document.querySelector(".curr-villager-count").innerText = characterState.villagerUnitCount;
                document.querySelector(".max-villager-count").innerText = characterState.maxVillagerUnitCount;

                document.querySelector(".curr-knight-count").innerText = characterState.knightUnitCount;
                document.querySelector(".max-knight-count").innerText = characterState.maxKnightUnitCount;

                document.querySelector(".curr-mage-count").innerText = characterState.mageUnitCount;
                document.querySelector(".max-mage-count").innerText = characterState.maxMageUnitCount;
            } 

            el.querySelector(".Character_effects-container").innerHTML = effectsContainer;

            // Update minimap pos
            updateMinimapCellElement(key, {x: characterState.x, y: characterState.y});
        })

        // Go over each villager, if their owner isn't in the game remove them:
        Object.keys(units).forEach((key) => {
            const characterState = units[key];

            if(!characterState.ownerId in players) {
                firebase.database().ref(`units/${key}`).remove()
            }
        })

        Object.keys(knights).forEach((key) => {
            const characterState = knights[key];

            if(!characterState.ownerId in players) {
                firebase.database().ref(`knights/${key}`).remove()
            }
        })

        Object.keys(mages).forEach((key) => {
            const characterState = mages[key];

            if(!characterState.ownerId in players) {
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
            getMinimapCellElement(addedPlayer.id, {x: addedPlayer.x, y: addedPlayer.y }, "you");
        } else {
            characterElement.setAttribute("you", false);
            getMinimapCellElement(addedPlayer.id, {x: addedPlayer.x, y: addedPlayer.y }, "enemy-player");
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
        removeMinimapCellElement(removedKey);
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
            ref.transaction((obj) => { if (obj == null) { return }
                obj.health = obj.health  - PLAYER.damage;
                obj.lastDamagedById = playerId;
                return obj
            })

            playerRef.transaction((obj) => { if (obj == null) { return }
                obj.lastDamagedId = hitTarget.id;
                return obj
            })

            swordSlash( { x: PLAYER.x, y: PLAYER.y }, {x: hitTarget.x, y: hitTarget.y } );
            return;
        }

        var hitUnit = isOccupiedByPlayer(newX, newY, units)

        if (hitUnit) {
            if (hitUnit.ownerId !== playerId) { // If not your unit, damage it
                firebase.database().ref(`units/${hitUnit.id}`).transaction((obj) => { if (obj == null) { return }
                    obj.health = obj.health - PLAYER.damage;
                    return obj
                })
            } 
            swordSlash( { x: PLAYER.x, y: PLAYER.y }, {x: hitUnit.x, y: hitUnit.y } );
            return;
        }

        var hitKnight = isOccupiedByPlayer(newX, newY, knights)

        if (hitKnight) {
            if (hitKnight.ownerId !== playerId) { // If not your unit, damage it
                firebase.database().ref(`knights/${hitKnight.id}`).transaction((obj) => { if (obj == null) { return }
                    obj.health = obj.health - PLAYER.damage;
                    return obj
                })
            } 
            swordSlash( { x: PLAYER.x, y: PLAYER.y }, {x: hitKnight.x, y: hitKnight.y } );
            return;
        }

        var hitMage = isOccupiedByPlayer(newX, newY, mages)

        if (hitMage) {
            if (hitMage.ownerId !== playerId) { // If not your unit, damage it
                firebase.database().ref(`mages/${hitMage.id}`).transaction((obj) => { if (obj == null) { return }
                    obj.health = obj.health - PLAYER.damage;
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
            if (typeof targetEle !== 'undefined' && !targetEle.querySelector(".Resource_sprite").classList.contains("shake")) {
                targetEle.querySelector(".Resource_sprite").classList.add("shake");
                setTimeout(() => {
                    targetEle.querySelector(".Resource_sprite").classList.remove("shake");
                }, 350)
            }
            
            // Give yourself the resource
            if(hitResource.type === "wood") {
                remove_amount += 2 * plyr.stats.chopLevel;

                playerRef.transaction((obj) => { if (obj == null) { return }
                    obj.resources = { 
                        gold: plyr.resources.gold,
                        wood: plyr.resources.wood + Math.min(remove_amount, hitResource.amountLeft),
                        meat: plyr.resources.meat
                    } 
                    return obj
                })

            } else if(hitResource.type === "gold") {
                remove_amount += 2 * plyr.stats.mineLevel;

                playerRef.transaction((obj) => { if (obj == null) { return }
                    obj.resources = { 
                        gold: plyr.resources.gold + Math.min(remove_amount, hitResource.amountLeft),
                        wood: plyr.resources.wood,
                        meat: plyr.resources.meat
                    } 
                    return obj
                })

            } else if(hitResource.type === "meat") {
                remove_amount += 2 * plyr.stats.huntLevel;

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

            return;
        }

        // TO DO: Put map limits here
        if (newX >= 0 && newX < MAP_SIZE * 16 && newY >= 0 && newY < MAP_SIZE * 16) {
            
            playerRef.transaction((obj) => { if (obj == null) { return }
                obj.x = newX;
                obj.y = newY;

                return obj
            })
        }
    }
}

function resetTargets() {
    if(resetTargetsTimer < resetTargetsTimerCD) {
        resetTargetsTimer += 1/60;
    } else {

        Object.keys(players).forEach((key) => {
            if(players[key].lastDamagedById === "none" && players[key].lastDamagedId === "none") { return }

            firebase.database().ref(`players/${key}`).transaction((obj) => { if (obj == null) { return }
                obj.lastDamagedById = "none";
                obj.lastDamagedId = "none";
                return obj
            });
        })

        resetTargetsTimer = 0;
    }
}
const MAP_SIZE = 30;

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

    let players = {};
    let playerId;
    let playerRef;
    let playerElements = {};

    let unitCells = {};
    let unitCellElements = {};

    let resources = {};
    let resourcesElements = {};

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

    function managePlayers() {
        const allPlayersRef = firebase.database().ref(`players`);
        allPlayersRef.on("value", (snapshot) => {
    
            //Fires whenever a change occurs
            players = snapshot.val() || {};
        
            // ASSIGN ADMIN PLAYER

            // If nobody is the admin player, assign it to him
            let nobodyIsAdminPlayer = true;
            for (let p in players) {
                if(players[p].adminPlayer) {
                    nobodyIsAdminPlayer = false;
                }
            }

            if (nobodyIsAdminPlayer) {
                let newAdminPlayer = players[Object.keys(players)[0]];
                console.log("New Admin Player: " + newAdminPlayer.name + " (ID: " + newAdminPlayer.id + ")");

                var adminPlayerRef = firebase.database().ref(`players/${newAdminPlayer.id}`);
                adminPlayerRef.update({
                    adminPlayer : true,
                })
            }

            Object.keys(players).forEach((key) => { // For each player...
                const characterState = players[key];
                let el = playerElements[key];
                
                // Now update the DOM
                el.querySelector(".Character_name").innerText = characterState.name;
                el.querySelector(".Character_health").innerText = characterState.health;
                // el.setAttribute("data-color", characterState.color);
                el.setAttribute("data-direction", characterState.direction);
                const left = 64 * characterState.x + "px";
                const top = (64 * characterState.y - 16) + "px";
  
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
                    effectsContainer = effectsContainer + `<span class="Character_name-admin-player-container">&#128187;</span>`;
                }

                if(el.getAttribute("you") === "true") {
                    effectsContainer = effectsContainer + `<span class="Character_you-container">&#128994;</span>`;
                    el.style.zIndex += 1; // If YOU are the player, be even more above

                    // Remove your player if health is less than 0
                    if(characterState.health <= 0) {
                        playerRef.remove();
                    }

                    // Update your stats on UI
                    document.querySelector(".player-health").innerText = characterState.health;
                    document.querySelector(".player-gold").innerText = characterState.gold;
                    document.querySelector(".player-wood").innerText = characterState.wood;
                    document.querySelector(".player-meat").innerText = characterState.meat;
                } 

                el.querySelector(".Character_effects-container").innerHTML = effectsContainer;
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
    
            playerElements[addedPlayer.id] = characterElement;
    
            //Fill in some initial state
            characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
            characterElement.querySelector(".Character_health").innerText = addedPlayer.health;
            // characterElement.setAttribute("data-color", addedPlayer.color);
            characterElement.setAttribute("data-direction", addedPlayer.direction);
            const left = 64 * addedPlayer.x + "px";
            const top = 64 * addedPlayer.y - 16 + "px";
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

    function manageResources() {
        const allResourcesRef = firebase.database().ref(`resources`);
        allResourcesRef.on("value", (snapshot) => {
    
            //Fires whenever a change occurs
            resources = snapshot.val() || {};

            Object.keys(resources).forEach((key) => {

                const resourceState = resources[key];
                let el = resourcesElements[key];
     
                // Now update the DOM
                el.querySelector(".Resource_amount_left").innerText = resourceState.amountLeft;
                el.querySelector(".Resource_amount_max").innerText = resourceState.amountMax;

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

            resourcesElements[key] = resourceElement;
            gameContainer.appendChild(resourceElement);
        })
    
    
        //Remove character DOM element after they leave
        allResourcesRef.on("child_removed", (snapshot) => {
            const removedKey = getKeyString(snapshot.val().x, snapshot.val().y);
            gameContainer.removeChild(resourcesElements[removedKey]);
            delete resourcesElements[removedKey];
        })
    }

    function resourceHandler() {

        if(resourceSpawnTimer >= resourceSpawnTimerCD) {
            spawnResources("wood");
            spawnResources("gold");
            spawnResources("meat");

            resourceSpawnTimer = 0;
        } else {
            resourceSpawnTimer += 1/60;
        }
    }

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

        const resourceRef = firebase.database().ref(`resources/${getKeyString(lastPos.x, lastPos.y)}`);
        resourceRef.set({
            type: type,
            x: lastPos.x,
            y: lastPos.y,
            amountLeft: 100,
            amountMax: 100,
        })
    }

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

            // Check if new position is occupied
            var hitTarget = isOccupiedByPlayer(newX, newY, players)
            
            if(hitTarget) {
                firebase.database().ref(`players/${hitTarget.id}`).update({ health: hitTarget.health - 1 });
                return;
            }

            var hitResource = isOccupiedByPlayer(newX, newY, resources)

            if(hitResource) {
                firebase.database().ref(`resources/${getKeyString(hitResource.x, hitResource.y)}`).update( { amountLeft: hitResource.amountLeft - 10 } );
                var plyr = players[playerId];
   
                // Give yourself the resource
                if(hitResource.type === "wood") {
                    playerRef.update( { wood: plyr.wood + 10 } )
                } else if(hitResource.type === "gold") {
                    playerRef.update( { gold: plyr.gold + 10 } )
                } else if(hitResource.type === "meat") {
                    playerRef.update( { meat: plyr.meat + 10 } )
                }

                return;
            }
        }

        // TO DO: Put map limits here
        if (newX >= 0 && newX < MAP_SIZE * 16 && newY >= 0 && newY < MAP_SIZE * 16) {
            players[playerId].x = newX;
            players[playerId].y = newY;
            playerRef.set(players[playerId]);
        }
    }

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

        // playerElements[playerId].style.transform = `translate3d( 
        //     ${ players[playerId].x * pixel_size }px, ${ players[playerId].y * pixel_size }px, 0 
        // )`;
    }

    const step = () => {
        pixel_size = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
        );

        if (Object.keys(players)[0]) { // Player must be loaded in
            moveCharacter();
            setCamera();

            if(players[playerId].adminPlayer) {
                resourceHandler();
            }
        };

        requestAnimationFrame(() => { // Web browser calls this function every time a new frame begins
            step();
        })
    }

    function initGame() {

        generateMap(MAP_SIZE);

        manageUnitCells();
        managePlayers(); // Returns the list of players
        manageResources();

        step();
    }
    

    firebase.auth().onAuthStateChanged((user) => {
		console.log(user)
		if (user) {
			//You're logged in!
			playerId = user.uid;
			playerRef = firebase.database().ref(`players/${playerId}`);
            
            // Initial player name
			const name = createName();

            // The name inputting area, not used yet
			// playerNameInput.value = name;

            // Spawn position
			const { x, y } = { x: 0, y: 0 };

			playerRef.set({
				id: playerId,
				name,
                health: 10,
                gold: 0,
                wood: 0,
                meat: 0,
				direction: "right",
				x,
				y,
			})

            // Set player name on UI
            document.querySelector(".player-name").innerText = name;

			//Remove me from Firebase when I diconnect
			playerRef.onDisconnect().remove();

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

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
    const cameraElement = document.querySelector(".camera");

    let players = {};
    let playerId;
    let playerRef;
    let playerElements = {};

    let unitCells = {};
    let unitCellElements = {};

    // PLAYER MOVEMENT//start in the middle of the map
    var pixel_size;
    
    // Hard-coding this for now, at smaller map sizes we move less? since thats what it depends on
    // pixel_size = 4;
    
    var x = pixel_size * 80;
    var y = pixel_size * 72;
    x = 64;
    y = 64;
    speed = 16;
    var held_directions = []; //State of which arrow keys we are holding down
    var moveTimer = 0.5;
    var moveTimerCD = 0.5;

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

                playerRef = firebase.database().ref(`players/${newAdminPlayer.id}`);
                playerRef.update({
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
                const top = 64 * characterState.y - 16 + "px";
                // el.style.transform = `translate3d(${left}, ${top}, 0)`;
                el.style.transform = `translate3d( ${ characterState.x * pixel_size }px, ${ characterState.y * pixel_size }px, 0 )`;

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
        console.log("PLAYERS AFTER", players)
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
        }

        // TO DO: Put map limits here
        
        players[playerId].x = newX;
        players[playerId].y = newY;
        playerRef.set(players[playerId]);
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
            ${ -players[playerId].x * pixel_size + camera_left }px, ${ -players[playerId].y * pixel_size + camera_top }px, 0 
        )`;

        playerElements[playerId].style.transform = `translate3d( 
            ${ players[playerId].x * pixel_size }px, ${ players[playerId].y * pixel_size }px, 0 
        )`;
    }

    const step = () => {
        pixel_size = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
        );

        if (Object.keys(players)[0]) { // Player must be loaded in
            moveCharacter();
            setCamera();
        };
        
        requestAnimationFrame(() => { // Web browser calls this function every time a new frame begins
            step();
        })
    }

    function initGame() {

        generateMap(30);

        manageUnitCells();
        managePlayers(); // Returns the list of players

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
				direction: "right",
				x,
				y,
			})

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

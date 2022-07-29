(function () {
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

    const step = (timestamp) => {
        if(timestamp - lastTimestamp > 100) {console.log("lag")};
        requestAnimationFrame(step);
        if (timestamp - lastTimestamp < 1000 / FPS) return;

        pixel_size = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--pixel-size')
        );

        if (playerId in players) { // Player must be loaded in
            moveCharacter();
            setCamera();

            if(players[playerId].adminPlayer) {
                resourceHandler();
                healthRegenUnits();
                resetTargets();
            }
            
            unitHandler();
            knightHandler();
            mageHandler();
        };

        renderMessages();

        PLAYER = players[playerId];

        // requestAnimationFrame(() => { // Web browser calls this function every time a new frame begins
        //     step();
        // })
        lastTimestamp = timestamp;
    }

    function initGame() {

        generateMap(MAP_SIZE); 

        // var setMinimapInterval = setInterval(() => {
        //     if(Object.keys(unitCells).length === 0 || unitCells[Object.keys(unitCells)[0]].x == null) { return; }

        //     setMinimap();
        //     clearInterval(setMinimapInterval);
        // }, 10);

        manageUnitCells();
        managePlayers(); // Returns the list of players
        manageResources();
        manageUnits();
        manageKnights();
        manageMages();
        manageEffects();
        manageBuildings();

        setupUpgradeButtons();
        setupSpawnButtons();   
        setupBuildingSpawnButtons();
        setMinimap();

        step(); 
    }
    

    firebase.auth().onAuthStateChanged((user) => {
        var checkPlayers = setInterval(function(){
            if(playerId in players) {

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

                Object.keys(buildings).forEach((key) => {
                    const characterState = buildings[key];
                    if(characterState.ownerId === user.uid) {
                        firebase.database().ref(`buildings/${key}`).remove()
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
                    maxHealth: 100,
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
                    units: {
                        villager: {
                            current: 0,
                            max: 3,
                        },
                        knight: {
                            current: 0,
                            max: 3,
                        },
                        mage: {
                            current: 0,
                            max: 3
                        }
                    },
                    buildings: {
                        house: 0,
                        barracks: 0,
                        mageTower: 0,
                        townCenterId: "none"
                    },
                    color: randomFromArray(["blue", "orange", "green", "gray"]),
                    bodyType,
                    x,
                    y,
                    lastDamagedId: "none",
                    lastDamagedById: "none",
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

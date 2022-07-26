// Purpose: Generate a square shaped map of desired size
function generateMap(mapSize) {

	perlinNoiseSeed(Math.random());

    // Clear out old unit cells
    // const allUnitCellsRef = firebase.database().ref(`unitCells`);
    // const gameContainer = document.querySelector(".game-container");

    for (let x = 0; x < mapSize; x++) {
        for (let y = 0; y < mapSize; y++) {

			// PERLIN NOISE VALUE
			var value = perlinNoiseSimplex2(x / 50, y / 50);
			value = Math.round((value + 1) * 2);
			value = Math.min(Math.max(value, 1), 4) // clamp between 1 to 3.

            const unitCellRef = firebase.database().ref(`unitCells/${getKeyString(x, y)}`);
			unitCellRef.set({
				x,
				y,
				heightValue: value
			})
        }
    }
}

function isOccupiedByPlayer(x, y, playersArray) {
	for (let p in playersArray) {
		if (x === playersArray[p].x && y === playersArray[p].y) {
			return playersArray[p];
		}
	}

	return false;
}

function getRandomSafeSpot(withinCameraGap = false) {
	let counter = 0;

	// For player we only spawn within camera bounds (because camera is supposed to stop moving near the edges)
	bounds = {
		x: {
			lower: 0 + (withinCameraGap? cameraGap.x : 0),
			higher: MAP_SIZE - (withinCameraGap? cameraGap.x : 0)
		},
		y: {
			lower: 0 + (withinCameraGap? cameraGap.y : 0),
			higher: MAP_SIZE - (withinCameraGap? cameraGap.y : 0)
		}
	}

	while (true) {
		let chosenPos = { 
			x: Math.floor( bounds.x.lower + Math.random() * (bounds.x.higher - bounds.x.lower)),
			y: Math.floor( bounds.y.lower + Math.random() * (bounds.y.higher - bounds.y.lower))
		}

		if (counter >= 100) {
			console.log("ERROR: NO EMPTY SPOT FOUND!")
			return { x:0, y:0 };
		}

		if(clearArea(chosenPos, players, resources, units, knights)) {
			return chosenPos;
		} else {
			counter += 1;
		}
	}
}

function clearArea(pos, playersArray, resourcesArray, unitsArray, knightsArray, magesArray, buildingsArray) {

	if (pos.x < 0 || pos.x >= MAP_SIZE || pos.y < 0 || pos.y >= MAP_SIZE) { 
		return false 
	};

	return (!isOccupiedByPlayer(pos.x, pos.y, playersArray) && 
			!isOccupiedByPlayer(pos.x, pos.y, resourcesArray) &&
			!isOccupiedByPlayer(pos.x, pos.y, unitsArray) &&
			!isOccupiedByPlayer(pos.x, pos.y, knightsArray) &&
            !isOccupiedByPlayer(pos.x, pos.y, magesArray) &&
			!isOccupiedByPlayer(pos.x, pos.y, buildingsArray));
}
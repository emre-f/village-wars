// UTILS
function getKeyString(x, y) {
	return `${x}x${y}`;
}

function randomFromArray(array) {
	return array[Math.floor(Math.random() * array.length)];
}

function createName(gender) {
	const prefix = randomFromArray([
		"BLACKSMITH", 
		"STONE MASON",
		"MINER",
		"ARMORER",
		"TAILOR",
		"MILLER",
		"CARPENTER",
		"MINSTREL",
		"PRIEST",
		"WEAVER",
		"WINEMAKER",
		"FARMER",
		"COOK",
		"WATCHMAN",
		"GUARD",
		"SHOEMAKER",
		"ROOFER",
		"FISHERMAN",
		"LUMBERJACK",
		"ALCHEMIST",
		"BARD",
		"BUTCHER"
	]);
	var nameArray = [];
	if (gender === 1) {
		nameArray = ["JOHN", "PAUL", "BOB", "ED", "CARL", "TOM", "WALT", "RUDD", "HUGH"];
	} else {
		nameArray = ["TANA", "LILY", "NYX", "ELLA", "JOAN", "FAYE", "EMMA", "IVY", "MYLA", "CADE"];
	}

	const name = randomFromArray(nameArray);
	return `${prefix} ${name}`;
}

function isOccupiedByPlayer(x, y, playersArray) {
	for (let p in playersArray) {
		if (x === playersArray[p].x && y === playersArray[p].y) {
			return playersArray[p];
		}
	}

	return false;
}

function getRandomSafeSpot() {
	var mapSize = MAP_SIZE;
	let counter = 0;

	while (true) {
		let chosenPos = { 
			x: Math.floor( 0 + Math.random() * (mapSize - 0)),
			y: Math.floor( 0 + Math.random() * (mapSize - 0))
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

function clearArea(pos, playersArray, resourcesArray, unitsArray, knightsArray) {

	if (pos.x < 0 || pos.x >= MAP_SIZE || pos.y < 0 || pos.y >= MAP_SIZE) { 
		return false 
	};

	return (!isOccupiedByPlayer(pos.x, pos.y, playersArray) && 
			!isOccupiedByPlayer(pos.x, pos.y, resourcesArray) &&
			!isOccupiedByPlayer(pos.x, pos.y, unitsArray) &&
			!isOccupiedByPlayer(pos.x, pos.y, knightsArray));
}
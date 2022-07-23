// UTILS
function getKeyString(x, y) {
	return `${x}x${y}`;
}

function randomFromArray(array) {
	return array[Math.floor(Math.random() * array.length)];
}

function createName() {
	const prefix = randomFromArray([
		"COOL",
		"SUPER",
		"HIP",
		"SMUG",
		"COOL",
		"SILKY",
		"GOOD",
		"SAFE",
		"DEAR",
		"DAMP",
		"WARM",
		"RICH",
		"LONG",
		"DARK",
		"SOFT",
		"BUFF",
		"DOPE",
	]);
	const animal = randomFromArray([
		"BEAR",
		"DOG",
		"CAT",
		"FOX",
		"LAMB",
		"LION",
		"BOAR",
		"GOAT",
		"VOLE",
		"SEAL",
		"PUMA",
		"MULE",
		"BULL",
		"BIRD",
		"BUG",
	]);
	return `${prefix} ${animal}`;
}

function isOccupiedByPlayer(x, y, playersArray) {
	for (let p in playersArray) {
		if (x === playersArray[p].x && y === playersArray[p].y) {
			return playersArray[p];
		}
	}

	return false;
}
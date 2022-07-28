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

// Purpose: Moving the map in accordance to where the player is moving to have a "camera effect"
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
	
	// NOW SETTING PLAYER POSITION IN MANAGE PLAYER
	// playerElements[playerId].style.transform = `translate3d( 
	//     ${ players[playerId].x * pixel_size }px, ${ players[playerId].y * pixel_size }px, 0 
	// )`;
}

// UTILS
function getKeyString(x, y) {
	return `${x}x${y}`;
}

function generateMap(mapSize) {
    // Clear out old unit cells
    const allUnitCellsRef = firebase.database().ref(`unitCells`);

    const gameContainer = document.querySelector(".game-container");

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

function manageUnitCells(gameContainer) {

    let unitCells = {};
    let unitCellElements = {};

    const allUnitCellsRef = firebase.database().ref(`unitCells`);

    //This block will remove coins from local state when Firebase `coins` value updates
    allUnitCellsRef.on("value", (snapshot) => {
        unitCells = snapshot.val() || {};
    });

    // Holds all unit cells
    const unitCellHolder = document.createElement("div");
    unitCellHolder.classList.add("unit-cell-holder")
    gameContainer.appendChild(unitCellHolder);

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
        unitCellHolder.appendChild(unitCellElement);
    })
}

(function () {
    const gameContainer = document.querySelector(".game-container");

    function initGame() {

        generateMap(10);

        manageUnitCells(gameContainer);
    }
    

    firebase.auth().onAuthStateChanged((user) => {
		console.log(user)
		if (user) {
			//You're logged in!
			playerId = user.uid;
			playerRef = firebase.database().ref(`players/${playerId}`);

			// const name = createName();
			// playerNameInput.value = name;

			// const { x, y } = getRandomSafeSpot(players);


			// playerRef.set({
			// 	id: playerId,
			// 	name,
			// 	direction: "right",
			// 	color: randomFromArray(playerColors),
			// 	x,
			// 	y,
			// 	coins: 0,
			// 	mainPlayer : false,
			// })

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

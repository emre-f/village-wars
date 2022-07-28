// Purpose: Generate a square shaped map of desired size
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

// Purpose: Networking/Managing all ground cells on the DB
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
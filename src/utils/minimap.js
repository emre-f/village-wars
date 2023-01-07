const minimapCellHolderElement = document.createElement("div");
var minimapElement = document.querySelector(".minimap-frame");
minimapElement.appendChild(minimapCellHolderElement);
var minimapCellElements = {};

function getMinimapCellElement(key, pos, dataType) {
    // Create the DOM Element
    const unitCellElement = document.createElement("div");
    unitCellElement.classList.add("minimap-unit-cell");
    unitCellElement.setAttribute("data-position", `${getKeyString(pos.x, pos.y)}`);
    unitCellElement.setAttribute("data-type", dataType);

    // Position the Element
    const left = 6 * pos.x + "px";
    const top = 6 * pos.y + "px";
    unitCellElement.style.transform = `translate3d(${left}, ${top}, 0)`;

    // Keep a reference for removal later and add to DOM
    minimapCellHolderElement.appendChild(unitCellElement);

    minimapCellElements[key] = unitCellElement;
}

function updateMinimapCellElement(key, pos) {
    if(key in minimapCellElements) {
        const cellEle = minimapCellElements[key];
        cellEle.setAttribute("data-position", `${getKeyString(pos.x, pos.y)}`);
        const left = 6 * pos.x + "px";
        const top = 6 * pos.y + "px";
        cellEle.style.transform = `translate3d(${left}, ${top}, 0)`;
    }
}

function removeMinimapCellElement(key) {
    if(key in minimapCellElements) { 
        const cellEle = minimapCellElements[key];
        minimapCellHolderElement.removeChild(cellEle);

        delete minimapCellElements[key];
    }
}

function setMinimap() {
    // Holds all unit cells
    minimapCellHolderElement.classList.add("minimap-cell-holder")

    // Object.keys(unitCells).forEach((key) => {
    //     const unitCell = unitCells[key];
    //     // Create the DOM Element
    //     const unitCellElement = document.createElement("div");
    //     unitCellElement.classList.add("minimap-unit-cell");
    //     unitCellElement.setAttribute("data-position", `${getKeyString(unitCell.x, unitCell.y)}`);
    //     unitCellElement.setAttribute("data-type", "empty");

    //     // Position the Element
    //     const left = 4 * unitCell.x + "px";
    //     const top = 4 * unitCell.y + "px";
    //     unitCellElement.style.transform = `translate3d(${left}, ${top}, 0)`;

    //     // Keep a reference for removal later and add to DOM
    //     minimapCellElements[`${getKeyString(unitCell.x, unitCell.y)}`] = unitCellElement;
   
    //     minimapCellHolderElement.appendChild(unitCellElement);
    // })

    console.log("Minimap Set")
}

// NOT USED ANYMORE
function updateMinimap() {
    if (minimapUpdateTimer < minimapUpdateTimerCD) {
        minimapUpdateTimer += 1/60;
    } else {
        let allies = {};
        let enemies = {};
        let yourPosition = "";

        Object.keys(units).forEach((key) => {
            if( units[key] == null ) { return; }

            if(units[key].ownerId === playerId) { allies[`${getKeyString(units[key].x, units[key].y)}`] = true; }
            else { enemies[`${getKeyString(units[key].x, units[key].y)}`] = true; }
        })
    
        Object.keys(players).forEach((key) => {
            if( players[key] == null ) { return; }

            if(key === playerId) { yourPosition = `${getKeyString(players[key].x, players[key].y)}` }
            else { enemies[`${getKeyString(players[key].x, players[key].y)}`] = true; }
        })
    
        Object.keys(knights).forEach((key) => {
            if( knights[key] == null ) { return; }

            if(knights[key].ownerId === playerId) { allies[`${getKeyString(knights[key].x, knights[key].y)}`] = true; }
            else { enemies[`${getKeyString(knights[key].x, knights[key].y)}`] = true; }
        })
        
        Object.keys(mages).forEach((key) => {
            if( mages[key] == null ) { return; }

            if(mages[key].ownerId === playerId) { allies[`${getKeyString(mages[key].x, mages[key].y)}`] = true; }
            else { enemies[`${getKeyString(mages[key].x, mages[key].y)}`] = true; }
        })

        Object.keys(minimapCellElements).forEach((key) => {
            let ele = minimapCellElements[key];

            if(yourPosition === key) {
                ele.setAttribute("data-type", "you");
            } else if(key in allies) {
                ele.setAttribute("data-type", "ally");
            } else if(key in enemies) {
                ele.setAttribute("data-type", "enemy");
            } else if(key in resources) {
                ele.setAttribute("data-type", "resource");
            } else {
                ele.setAttribute("data-type", "ground");
            }
            
        });

        minimapUpdateTimer = 0;
    }
}

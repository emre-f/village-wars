// Purpose: Setup the buttons related to spawning units
function setupBuildingSpawnButtons () {
    const houseCostTable = document.querySelector(".spawn-house-cost-table");

    houseCostTable.querySelector(".wood-cost").innerText = houseCost.woodCost;
    houseCostTable.querySelector(".meat-cost").innerText = houseCost.meatCost;

    // Setup the function
    const spawnHouseButton = document.querySelector(".spawn-house-button");
    spawnHouseButton.addEventListener("click", () => {
        spawnHouseAt({ x: PLAYER.x, y: PLAYER.y + 1 });
    })

    // KNIGHT
    const barracksCostTable = document.querySelector(".spawn-barracks-cost-table");

    barracksCostTable.querySelector(".gold-cost").innerText = barracksCost.goldCost;
    barracksCostTable.querySelector(".wood-cost").innerText = barracksCost.woodCost;

    // Setup the function
    const spawnBarracksButton = document.querySelector(".spawn-barracks-button");
    spawnBarracksButton.addEventListener("click", () => {
        spawnBarracksAt({ x: PLAYER.x, y: PLAYER.y + 1 });
    })

    // MAGE
    const mageTowerCostTable = document.querySelector(".spawn-mage-tower-cost-table");

    mageTowerCostTable.querySelector(".gold-cost").innerText = mageTowerCost.goldCost;
    mageTowerCostTable.querySelector(".meat-cost").innerText = mageTowerCost.meatCost;

    // Setup the function
    const spawnMageTowerButton = document.querySelector(".spawn-mage-tower-button");
    spawnMageTowerButton.addEventListener("click", () => {
        spawnMageTowerAt({ x: PLAYER.x, y: PLAYER.y + 1 });
    })

    // TOWN CENTER
    const castleCostTable = document.querySelector(".spawn-castle-cost-table");

    castleCostTable.querySelector(".gold-cost").innerText = castleCost.goldCost;
    castleCostTable.querySelector(".wood-cost").innerText = castleCost.woodCost;
    castleCostTable.querySelector(".meat-cost").innerText = castleCost.meatCost;

    // Setup the function
    const spawnCastleButton = document.querySelector(".spawn-castle-button");
    spawnCastleButton.addEventListener("click", () => {
        spawnCastleAt({ x: PLAYER.x, y: PLAYER.y + 1 });
    })
};

// ATTEMPT = 0 is down, 1 is left, 2 is right, 3 is top, 4 is just return (fail)
// Purpose: The function that spawns a villager at a given position
function spawnHouseAt(spawnPos, attempt = 0) {
    if((PLAYER.resources.wood >= houseCost.woodCost &&
        PLAYER.resources.meat >= houseCost.meatCost) ||
        GOD_MODE) 
        {

        // Attempt other angles if down is full
        if(!clearArea(spawnPos, players, resources, units, knights, mages, buildings)) { 
            if (attempt === 0) { spawnPos.y -= 1; spawnPos.x -= 1 } // go to left
            else if (attempt === 1) { spawnPos.x += 2; } // go to right
            else if (attempt === 2) { spawnPos.x -= 1; spawnPos.y -= 1} // go to top

            if (attempt < 3) { spawnHouseAt(spawnPos, attempt + 1) };

            return 
        }

        var uuid = guidGenerator();

        houseRef = firebase.database().ref(`buildings/${PLAYER.id}:house:${uuid}`);

        houseRef.set({
            id: `${PLAYER.id}:house:${uuid}`,
            number: PLAYER.buildings.house,
            ownerId: PLAYER.id,
            name: "House",
            buildingType: "house",
            health: 150,
            maxHealth: 150,
            x: spawnPos.x,
            y: spawnPos.y,
        })

        // Subtract the resources
        firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
            obj.resources.wood = obj.resources.wood - houseCost.woodCost;
            obj.resources.meat = obj.resources.meat - houseCost.meatCost;

            return obj
        });
    }
}

// Purpose: The function that spawns a knight at a given position
function spawnBarracksAt(spawnPos, attempt = 0) {
    if((PLAYER.resources.gold >= barracksCost.goldCost &&
        PLAYER.resources.wood >= barracksCost.woodCost) ||
        GOD_MODE) 
        {

        // Attempt other angles if down is full
        if(!clearArea(spawnPos, players, resources, units, knights, mages, buildings)) { 
            if (attempt === 0) { spawnPos.y -= 1; spawnPos.x -= 1 } // go to left
            else if (attempt === 1) { spawnPos.x += 2; } // go to right
            else if (attempt === 2) { spawnPos.x -= 1; spawnPos.y -= 1} // go to top

            if (attempt < 3) { spawnBarracksAt(spawnPos, attempt + 1) };

            return 
        }

        var uuid = guidGenerator();

        barracksRef = firebase.database().ref(`buildings/${PLAYER.id}:barracks:${uuid}`);

        barracksRef.set({
            id: `${PLAYER.id}:barracks:${uuid}`,
            number: PLAYER.buildings.barracks,
            ownerId: PLAYER.id,
            name: "Barracks",
            buildingType: "barracks",
            health: 200,
            maxHealth: 200,
            x: spawnPos.x,
            y: spawnPos.y,
        })

        // Subtract the resources
        firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
            obj.resources.gold = obj.resources.gold - barracksCost.goldCost;    
            obj.resources.wood = obj.resources.wood - barracksCost.woodCost;

            return obj
        });
    }
}

// Purpose: The function that spawns an mage at a given position
function spawnMageTowerAt(spawnPos, attempt = 0) {
    if((PLAYER.resources.gold >= mageTowerCost.goldCost &&
        PLAYER.resources.meat >= mageTowerCost.meatCost) ||
        GOD_MODE) 
        {
  
        // Attempt other angles if down is full
        if(!clearArea(spawnPos, players, resources, units, knights, mages, buildings)) { 
            if (attempt === 0) { spawnPos.y -= 1; spawnPos.x -= 1 } // go to left
            else if (attempt === 1) { spawnPos.x += 2; } // go to right
            else if (attempt === 2) { spawnPos.x -= 1; spawnPos.y -= 1} // go to top

            if (attempt < 3) { spawnMageTowerAt(spawnPos, attempt + 1) };

            return 
        }

        var uuid = guidGenerator();

        mageTowerRef = firebase.database().ref(`buildings/${PLAYER.id}:mage-tower:${uuid}`);

        mageTowerRef.set({
            id: `${PLAYER.id}:mage-tower:${uuid}`,
            number: PLAYER.buildings.mageTower,
            ownerId: PLAYER.id,
            name: "Mage Tower",
            buildingType: "mage-tower",
            health: 180,
            maxHealth: 180,
            x: spawnPos.x,
            y: spawnPos.y,
        })

        firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
            obj.resources.gold = obj.resources.gold - mageTowerCost.goldCost;
            obj.resources.meat = obj.resources.meat - mageTowerCost.meatCost;

            return obj
        });
    }
}

function spawnCastleAt(spawnPos, attempt =0) {
    if((PLAYER.resources.gold >= castleCost.goldCost &&
        PLAYER.resources.wood >= castleCost.woodCost &&
        PLAYER.resources.meat >= castleCost.meatCost) ||
        GOD_MODE) 
        {

        if(PLAYER.buildings.castleId !== "none") { return; }
  
        // Attempt other angles if down is full
        if(!clearArea(spawnPos, players, resources, units, knights, mages, buildings)) { 
            if (attempt === 0) { spawnPos.y -= 1; spawnPos.x -= 1 } // go to left
            else if (attempt === 1) { spawnPos.x += 2; } // go to right
            else if (attempt === 2) { spawnPos.x -= 1; spawnPos.y -= 1} // go to top

            if (attempt < 3) { spawnCastleAt(spawnPos, attempt + 1) };

            return 
        }

        var uuid = guidGenerator();

        castleRef = firebase.database().ref(`buildings/${PLAYER.id}:castle:${uuid}`);

        castleRef.set({
            id: `${PLAYER.id}:castle:${uuid}`,
            ownerId: PLAYER.id,
            name: "Castle",
            buildingType: "castle",
            health: 400,
            maxHealth: 400,
            x: spawnPos.x,
            y: spawnPos.y,
        })

        firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
            obj.resources.gold = obj.resources.gold - castleCost.goldCost;
            obj.resources.wood = obj.resources.wood - castleCost.woodCost;
            obj.resources.meat = obj.resources.meat - castleCost.meatCost;

            return obj
        });
    }
}

// SPAWN COSTS
const houseCost = {
	woodCost: 200,
	meatCost: 100,
}

const barracksCost = {
    goldCost: 150,
    woodCost: 150,
}

const mageTowerCost = {
    goldCost: 200,
    meatCost: 100,
}

const castleCost = {
    goldCost: 400,
    woodCost: 400,
    meatCost: 400,
}
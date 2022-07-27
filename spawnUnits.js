// Purpose: Setup the buttons related to spawning units
function setupSpawnButtons () {
    const villagerCosts = villagerSpawnCost;
    const villagerCostTable = document.querySelector(".spawn-villager-cost-table");

    villagerCostTable.querySelector(".gold-cost").innerText = villagerCosts.goldCost;
    villagerCostTable.querySelector(".wood-cost").innerText = villagerCosts.woodCost;
    villagerCostTable.querySelector(".meat-cost").innerText = villagerCosts.meatCost;

    // Setup the function
    const spawnVillagerButton = document.querySelector(".spawn-villager-button");
    spawnVillagerButton.addEventListener("click", () => {

        spawnVillagerAt({ x: PLAYER.x, y: PLAYER.y + 1 });
    })

    // KNIGHT
    const knightCosts = knightSpawnCost;
    const knightCostTable = document.querySelector(".spawn-knight-cost-table");

    knightCostTable.querySelector(".gold-cost").innerText = knightCosts.goldCost;
    knightCostTable.querySelector(".wood-cost").innerText = knightCosts.woodCost;
    knightCostTable.querySelector(".meat-cost").innerText = knightCosts.meatCost;

    // Setup the function
    const spawnKnightButton = document.querySelector(".spawn-knight-button");
    spawnKnightButton.addEventListener("click", () => {
            
        spawnKnightAt({ x: PLAYER.x, y: PLAYER.y + 1 });
    })

    // MAGE
    const mageCosts = mageSpawnCost;
    const mageCostTable = document.querySelector(".spawn-mage-cost-table");

    mageCostTable.querySelector(".gold-cost").innerText = mageCosts.goldCost;
    mageCostTable.querySelector(".wood-cost").innerText = mageCosts.woodCost;
    mageCostTable.querySelector(".meat-cost").innerText = mageCosts.meatCost;

    // Setup the function
    const spawnMageButton = document.querySelector(".spawn-mage-button");
    spawnMageButton.addEventListener("click", () => {
            
        spawnMageAt({ x: PLAYER.x, y: PLAYER.y + 1 });
    })
};

// Purpose: The function that spawns a villager at a given position
function spawnVillagerAt(spawnPos) {
    const villagerCosts = villagerSpawnCost;

    if((PLAYER.resources.gold >= villagerCosts.goldCost &&
        PLAYER.resources.wood >= villagerCosts.woodCost &&
        PLAYER.resources.meat >= villagerCosts.meatCost) ||
        GOD_MODE) 
        {

        // Can control max 3 villagers
        if(PLAYER.villagerUnitCount >= PLAYER.maxVillagerUnitCount) { return; }

        if(!clearArea(spawnPos, players, resources, units, knights, mages)) { return; }

        var uuid = Math.random().toString(36).slice(-6);

        unitRef = firebase.database().ref(`units/${PLAYER.id}:${PLAYER.villagerUnitCount}:${uuid}`);

        unitRef.set({
            id: `${PLAYER.id}:${PLAYER.villagerUnitCount}:${uuid}`,
            number: PLAYER.villagerUnitCount,
            ownerId: PLAYER.id,
            name: "Villager",
            health: 20,
            color: PLAYER.color,
            bodyType: (Math.random()>=0.5)? 1 : 2,
            x: spawnPos.x,
            y: spawnPos.y,
        })

        // Subtract the resources
        firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => {
            obj.resources.gold = obj.resources.gold - villagerCosts.goldCost;
            obj.resources.wood = obj.resources.wood - villagerCosts.woodCost;
            obj.resources.meat = obj.resources.meat - villagerCosts.meatCost;

            return obj
        });
    }
}

// Purpose: The function that spawns a knight at a given position
function spawnKnightAt(spawnPos) {
    const knightCosts = knightSpawnCost;

    if((PLAYER.resources.gold >= knightCosts.goldCost &&
        PLAYER.resources.wood >= knightCosts.woodCost &&
        PLAYER.resources.meat >= knightCosts.meatCost) ||
        GOD_MODE) 
        {

        // MAYBE: MAX CONTROL LIMIT?
        if(PLAYER.knightUnitCount >= PLAYER.maxKnightUnitCount) { return; }

        if(!clearArea(spawnPos, players, resources, units, knights, mages)) { return; }

        var uuid = Math.random().toString(36).slice(-6);

        knightRef = firebase.database().ref(`knights/${PLAYER.id}:${uuid}`);

        knightRef.set({
            id: `${PLAYER.id}:${uuid}`,
            ownerId: PLAYER.id,
            name: "Knight",
            health: 50,
            damage: 2,
            color: PLAYER.color,
            bodyType: 4,
            x: spawnPos.x,
            y: spawnPos.y,
        })

        firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => {
            obj.resources.gold = obj.resources.gold - knightCosts.goldCost;
            obj.resources.wood = obj.resources.wood - knightCosts.woodCost;
            obj.resources.meat = obj.resources.meat - knightCosts.meatCost;

            return obj
        });
    }
}

// Purpose: The function that spawns an mage at a given position
function spawnMageAt(spawnPos) {
    const mageCosts = mageSpawnCost;

    if((PLAYER.resources.gold >= mageCosts.goldCost &&
        PLAYER.resources.wood >= mageCosts.woodCost &&
        PLAYER.resources.meat >= mageCosts.meatCost) ||
        GOD_MODE) 
        {

        // MAYBE: MAX CONTROL LIMIT?
        if(PLAYER.mageUnitCount >= PLAYER.maxMageUnitCount) { return; }

        if(!clearArea(spawnPos, players, resources, units, knights, mages)) { return; }

        var uuid = Math.random().toString(36).slice(-6);

        mageRef = firebase.database().ref(`mages/${PLAYER.id}:${uuid}`);

        mageRef.set({
            id: `${PLAYER.id}:${uuid}`,
            ownerId: PLAYER.id,
            name: "Mage",
            health: 20,
            damage: 4,
            color: PLAYER.color,
            bodyType: 5,
            x: spawnPos.x,
            y: spawnPos.y,
        })

        firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => {
            obj.resources.gold = obj.resources.gold - mageCosts.goldCost;
            obj.resources.wood = obj.resources.wood - mageCosts.woodCost;
            obj.resources.meat = obj.resources.meat - mageCosts.meatCost;

            return obj
        });
    }
}

// SPAWN COSTS
const villagerSpawnCost = {
	goldCost: 30,
	woodCost: 30,
	meatCost: 80,
}

const knightSpawnCost = {
    goldCost: 45,
    woodCost: 80,
    meatCost: 45
}

const mageSpawnCost = {
    goldCost: 80,
    woodCost: 45,
    meatCost: 45
}
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

        if(!clearArea(spawnPos, players, resources, units, knights, archers)) { return; }

        var uuid = Math.random().toString(36).slice(-6);

        unitRef = firebase.database().ref(`units/${PLAYER.id}:${PLAYER.villagerUnitCount}:${uuid}`);

            unitRef.set({
                id: `${PLAYER.id}:${PLAYER.villagerUnitCount}:${uuid}`,
                number: PLAYER.villagerUnitCount,
                ownerId: PLAYER.id,
                name: "Villager",
                health: 5 + PLAYER.stats.healthLevel,
                color: PLAYER.color,
                bodyType: (Math.random()>=0.5)? 1 : 2,
                x: spawnPos.x,
                y: spawnPos.y,
            })

            // Subtract the resources
            firebase.database().ref(`players/${PLAYER.id}`).update({ 
                resources: {
                    gold: PLAYER.resources.gold - villagerCosts.goldCost,
                    wood: PLAYER.resources.wood - villagerCosts.woodCost,
                    meat: PLAYER.resources.meat - villagerCosts.meatCost,
            },
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

        if(!clearArea(spawnPos, players, resources, units, knights, archers)) { return; }

        var uuid = Math.random().toString(36).slice(-6);

        knightRef = firebase.database().ref(`knights/${PLAYER.id}:${uuid}`);

            knightRef.set({
                id: `${PLAYER.id}:${uuid}`,
                ownerId: PLAYER.id,
                name: "Knight",
                health: 20,
                damage: 2,
                color: PLAYER.color,
                bodyType: 4,
                x: spawnPos.x,
                y: spawnPos.y,
            })

            // Subtract the resources
            firebase.database().ref(`players/${PLAYER.id}`).update({ 
                resources: {
                    gold: PLAYER.resources.gold - knightCosts.goldCost,
                    wood: PLAYER.resources.wood - knightCosts.woodCost,
                    meat: PLAYER.resources.meat - knightCosts.meatCost,
            },
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
    goldCost: 80,
    woodCost: 80,
    meatCost: 80
}
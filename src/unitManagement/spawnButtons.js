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

// ATTEMPT = 0 is down, 1 is left, 2 is right, 3 is top, 4 is just return (fail)
// Purpose: The function that spawns a villager at a given position
function spawnVillagerAt(spawnPos, attempt = 0) {
    const villagerCosts = villagerSpawnCost;

    if((PLAYER.resources.gold >= villagerCosts.goldCost &&
        PLAYER.resources.wood >= villagerCosts.woodCost &&
        PLAYER.resources.meat >= villagerCosts.meatCost) ||
        GOD_MODE) 
        {

        // Can control max 3 villagers
        if(PLAYER.units.villager.current >= PLAYER.units.villager.max) { return; }

        // Attempt other angles if down is full
        if(!clearArea(spawnPos, players, resources, units, knights, mages, buildings)) { 
            if (attempt === 0) { spawnPos.y -= 1; spawnPos.x -= 1 } // go to left
            else if (attempt === 1) { spawnPos.x += 2; } // go to right
            else if (attempt === 2) { spawnPos.x -= 1; spawnPos.y -= 1} // go to top

            if (attempt < 3) { spawnVillagerAt(spawnPos, attempt + 1) };

            return 
        }

        var uuid = guidGenerator();

        unitRef = firebase.database().ref(`units/${PLAYER.id}:${PLAYER.units.villager.current}:${uuid}`);

        unitRef.set({
            id: `${PLAYER.id}:${PLAYER.units.villager.current}:${uuid}`,
            number: PLAYER.units.villager.current,
            ownerId: PLAYER.id,
            name: "Villager",
            health: VILLAGER_BASE_HEALTH + VILLAGER_HEALTH_SCALE * PLAYER.stats.healthLevel,
            maxHealth: VILLAGER_BASE_HEALTH + VILLAGER_HEALTH_SCALE * PLAYER.stats.healthLevel,
            color: PLAYER.color,
            bodyType: (Math.random()>=0.5)? 1 : 2,
            x: spawnPos.x,
            y: spawnPos.y,
        })

        // Subtract the resources
        firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
            obj.resources.gold = obj.resources.gold - villagerCosts.goldCost;
            obj.resources.wood = obj.resources.wood - villagerCosts.woodCost;
            obj.resources.meat = obj.resources.meat - villagerCosts.meatCost;

            return obj
        });
    }
}

// Purpose: The function that spawns a knight at a given position
function spawnKnightAt(spawnPos, attempt = 0) {
    const knightCosts = knightSpawnCost;

    if((PLAYER.resources.gold >= knightCosts.goldCost &&
        PLAYER.resources.wood >= knightCosts.woodCost &&
        PLAYER.resources.meat >= knightCosts.meatCost) ||
        GOD_MODE) 
        {

        if(PLAYER.units.knight.current >= PLAYER.units.knight.max) { return; }

        // Attempt other angles if down is full
        if(!clearArea(spawnPos, players, resources, units, knights, mages, buildings)) { 
            if (attempt === 0) { spawnPos.y -= 1; spawnPos.x -= 1 } // go to left
            else if (attempt === 1) { spawnPos.x += 2; } // go to right
            else if (attempt === 2) { spawnPos.x -= 1; spawnPos.y -= 1} // go to top

            if (attempt < 3) { spawnKnightAt(spawnPos, attempt + 1) };

            return 
        }

        var uuid = guidGenerator();

        knightRef = firebase.database().ref(`knights/${PLAYER.id}:${uuid}`);

        knightRef.set({
            id: `${PLAYER.id}:${uuid}`,
            ownerId: PLAYER.id,
            name: "Knight",
            health: KNIGHT_BASE_HEALTH + KNIGHT_HEALTH_SCALE * PLAYER.stats.healthLevel,
            maxHealth: KNIGHT_BASE_HEALTH + KNIGHT_HEALTH_SCALE * PLAYER.stats.healthLevel,
            damage: 2,
            color: PLAYER.color,
            bodyType: 4,
            x: spawnPos.x,
            y: spawnPos.y,
        })

        firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
            obj.resources.gold = obj.resources.gold - knightCosts.goldCost;
            obj.resources.wood = obj.resources.wood - knightCosts.woodCost;
            obj.resources.meat = obj.resources.meat - knightCosts.meatCost;

            return obj
        });
    }
}

// Purpose: The function that spawns an mage at a given position
function spawnMageAt(spawnPos, attempt = 0) {
    const mageCosts = mageSpawnCost;

    if((PLAYER.resources.gold >= mageCosts.goldCost &&
        PLAYER.resources.wood >= mageCosts.woodCost &&
        PLAYER.resources.meat >= mageCosts.meatCost) ||
        GOD_MODE) 
        {

        // MAYBE: MAX CONTROL LIMIT?
        if(PLAYER.units.mage.current >= PLAYER.units.mage.max) { return; }
  
        // Attempt other angles if down is full
        if(!clearArea(spawnPos, players, resources, units, knights, mages, buildings)) { 
            if (attempt === 0) { spawnPos.y -= 1; spawnPos.x -= 1 } // go to left
            else if (attempt === 1) { spawnPos.x += 2; } // go to right
            else if (attempt === 2) { spawnPos.x -= 1; spawnPos.y -= 1} // go to top

            if (attempt < 3) { spawnMageAt(spawnPos, attempt + 1) };

            return 
        }

        var uuid = guidGenerator();

        mageRef = firebase.database().ref(`mages/${PLAYER.id}:${uuid}`);

        mageRef.set({
            id: `${PLAYER.id}:${uuid}`,
            ownerId: PLAYER.id,
            name: "Mage",
            health: MAGE_BASE_HEALTH + MAGE_HEALTH_SCALE * PLAYER.stats.healthLevel,
            maxHealth: MAGE_BASE_HEALTH + MAGE_HEALTH_SCALE * PLAYER.stats.healthLevel,
            damage: 4,
            color: PLAYER.color,
            bodyType: 5,
            x: spawnPos.x,
            y: spawnPos.y,
        })

        firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
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
function updateAllUpgrades (characterState) {
    if (typeof characterState === 'undefined') {
        console.log("Character state is undefined.");
        updateUpgrades(); // 0 as default
        return;
    }

    updateUpgrades(
        characterState.stats.healthLevel,
        characterState.stats.attackLevel,
        characterState.stats.mineLevel,
        characterState.stats.chopLevel,
        characterState.stats.huntLevel
    );
}

// The upgrade buttons
function setupUpgradeButtons () {
    const upgradeHealthLevelButton = document.querySelector(".player-stat-health-upg-button");
    upgradeHealthLevelButton.addEventListener("click", () => {
        const costs = getHealthUpgradeCosts(PLAYER.stats.healthLevel);

        if((PLAYER.resources.gold >= costs.goldCost &&
           PLAYER.resources.wood >= costs.woodCost &&
           PLAYER.resources.meat >= costs.meatCost) ||
           GOD_MODE) 
           {
            if(PLAYER.stats.healthLevel === 10) { return; }

            firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
                obj.health = obj.health + 20,
                obj.resources = {
                    gold: obj.resources.gold - costs.goldCost,
                    wood: obj.resources.wood - costs.woodCost,
                    meat: obj.resources.meat - costs.meatCost,
                }
                obj.stats = {
                    healthLevel: obj.stats.healthLevel + 1,
                    attackLevel: obj.stats.attackLevel,
                    mineLevel: obj.stats.mineLevel,
                    chopLevel: obj.stats.chopLevel,
                    huntLevel: obj.stats.huntLevel,
                }

                return obj
            });
        }

        // Buff health of all villagers and other units as well
        Object.keys(units).forEach((key) => {
            firebase.database().ref(`units/${key}`).transaction((obj) => { if (obj == null) { return }
                if (obj.ownerId !== playerId) { return; } // Only buff health of ur units
                obj.health = obj.health + 3
                obj.maxHealth = obj.maxHealth + 3
                return obj
            });
        })

        Object.keys(knights).forEach((key) => {
            firebase.database().ref(`knights/${key}`).transaction((obj) => { if (obj == null) { return }
                if (obj.ownerId !== playerId) { return; } // Only buff health of ur units     
                obj.health = obj.health + 7
                obj.maxHealth = obj.maxHealth + 7
                return obj
            });
        })

        Object.keys(mages).forEach((key) => {
            firebase.database().ref(`mages/${key}`).transaction((obj) => { if (obj == null) { return }
                if (obj.ownerId !== playerId) { return; } // Only buff health of ur units
                obj.health = obj.health + 3
                obj.maxHealth = obj.maxHealth + 3
                return obj
            });
        })
    })

    const upgradeAttackLevelButton = document.querySelector(".player-stat-attack-upg-button");
    upgradeAttackLevelButton.addEventListener("click", () => {
        const costs = getAttackUpgradeCosts(PLAYER.stats.attackLevel);

        if((PLAYER.resources.gold >= costs.goldCost &&
           PLAYER.resources.wood >= costs.woodCost &&
           PLAYER.resources.meat >= costs.meatCost) ||
           GOD_MODE) 
           {
            if(PLAYER.stats.attackLevel === 10) { return; }

            firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
                obj.damage = obj.damage + 2,
                obj.resources = {
                    gold: obj.resources.gold - costs.goldCost,
                    wood: obj.resources.wood - costs.woodCost,
                    meat: obj.resources.meat - costs.meatCost,
                }
                obj.stats = {
                    healthLevel: obj.stats.healthLevel,
                    attackLevel: obj.stats.attackLevel + 1,
                    mineLevel: obj.stats.mineLevel,
                    chopLevel: obj.stats.chopLevel,
                    huntLevel: obj.stats.huntLevel,
                }

                return obj
            });
        }
    })

    const upgradeMineLevelButton = document.querySelector(".player-stat-mine-upg-button");
    upgradeMineLevelButton.addEventListener("click", () => {
        const costs = getMineUpgradeCosts(PLAYER.stats.mineLevel);

        if((PLAYER.resources.wood >= costs.woodCost &&
           PLAYER.resources.meat >= costs.meatCost) ||
           GOD_MODE) 
           {
            if(PLAYER.stats.mineLevel === 10) { return; }

            firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
                obj.resources = {
                    gold: obj.resources.gold,
                    wood: obj.resources.wood - costs.woodCost,
                    meat: obj.resources.meat - costs.meatCost,
                }
                obj.stats = {
                    healthLevel: obj.stats.healthLevel,
                    attackLevel: obj.stats.attackLevel,
                    mineLevel: obj.stats.mineLevel + 1,
                    chopLevel: obj.stats.chopLevel,
                    huntLevel: obj.stats.huntLevel,
                }

                return obj
            });
        }
    })

    const upgradeChopLevelButton = document.querySelector(".player-stat-chop-upg-button");
    upgradeChopLevelButton.addEventListener("click", () => {
        const costs = getChopUpgradeCosts(PLAYER.stats.chopLevel);

        if((PLAYER.resources.gold >= costs.goldCost &&
           PLAYER.resources.meat >= costs.meatCost) ||
           GOD_MODE) 
           {
            if(PLAYER.stats.chopLevel === 10) { return; }

            firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
                obj.resources = {
                    gold: obj.resources.gold - costs.goldCost,
                    wood: obj.resources.wood,
                    meat: obj.resources.meat - costs.meatCost,
                }
                obj.stats = {
                    healthLevel: obj.stats.healthLevel,
                    attackLevel: obj.stats.attackLevel,
                    mineLevel: obj.stats.mineLevel,
                    chopLevel: obj.stats.chopLevel + 1,
                    huntLevel: obj.stats.huntLevel,
                }

                return obj
            });
        }
    })

    const upgradeHuntLevelButton = document.querySelector(".player-stat-hunt-upg-button");
    upgradeHuntLevelButton.addEventListener("click", () => {
        const costs = getHuntUpgradeCosts(PLAYER.stats.huntLevel);

        if((PLAYER.resources.gold >= costs.goldCost &&
           PLAYER.resources.wood >= costs.woodCost) ||
           GOD_MODE) 
           {
            if(PLAYER.stats.huntLevel === 10) { return; }

            firebase.database().ref(`players/${PLAYER.id}`).transaction((obj) => { if (obj == null) { return }
                obj.resources = {
                    gold: obj.resources.gold - costs.goldCost,
                    wood: obj.resources.wood - costs.woodCost,
                    meat: obj.resources.meat,
                }
                obj.stats = {
                    healthLevel: obj.stats.healthLevel,
                    attackLevel: obj.stats.attackLevel,
                    mineLevel: obj.stats.mineLevel,
                    chopLevel: obj.stats.chopLevel,
                    huntLevel: obj.stats.huntLevel + 1,
                }

                return obj
            });
        }
    })
}

function updateUpgrades(healthLevel = 0, attackLevel = 0, mineLevel = 0, chopLevel = 0, huntLevel = 0) {
    const healthTable = document.querySelector(".player-stat-health-upg-cost");
    const healthCosts = getHealthUpgradeCosts(healthLevel);

    var healthDisplayer = document.querySelector(".player-stat-health"); 
    healthDisplayer.innerText = healthLevel;
    if(healthLevel === 10) { healthDisplayer.style.color = "#00ff15"; }

    healthTable.querySelector(".gold-cost").innerText = healthCosts.goldCost;
    healthTable.querySelector(".wood-cost").innerText = healthCosts.woodCost;
    healthTable.querySelector(".meat-cost").innerText = healthCosts.meatCost;

    //

    const attackTable = document.querySelector(".player-stat-attack-upg-cost");
    const attackCosts = getAttackUpgradeCosts(attackLevel);

    var attackDisplayer = document.querySelector(".player-stat-attack"); 
    attackDisplayer.innerText = attackLevel;
    if(attackLevel === 10) { attackDisplayer.style.color = "#00ff15"; }

    attackTable.querySelector(".gold-cost").innerText = attackCosts.goldCost;
    attackTable.querySelector(".wood-cost").innerText = attackCosts.woodCost;
    attackTable.querySelector(".meat-cost").innerText = attackCosts.meatCost;

    //

    const mineTable = document.querySelector(".player-stat-mine-upg-cost");
    const mineCosts = getMineUpgradeCosts(mineLevel);

    var mineDisplayer = document.querySelector(".player-stat-mine"); 
    mineDisplayer.innerText = mineLevel;
    if(mineLevel === 10) { mineDisplayer.style.color = "#00ff15"; }

    // mineTable.querySelector(".gold-cost").innerText = mineCosts.goldCost;
    mineTable.querySelector(".wood-cost").innerText = mineCosts.woodCost;
    mineTable.querySelector(".meat-cost").innerText = mineCosts.meatCost;

    //

    const chopTable = document.querySelector(".player-stat-chop-upg-cost");
    const chopCosts = getChopUpgradeCosts(chopLevel);

    var chopDisplayer = document.querySelector(".player-stat-chop"); 
    chopDisplayer.innerText = chopLevel;
    if(chopLevel === 10) { chopDisplayer.style.color = "#00ff15"; }

    chopTable.querySelector(".gold-cost").innerText = chopCosts.goldCost;
    // chopTable.querySelector(".wood-cost").innerText = chopCosts.woodCost;
    chopTable.querySelector(".meat-cost").innerText = chopCosts.meatCost;

    //

    const huntTable = document.querySelector(".player-stat-hunt-upg-cost");
    const huntCosts = getHuntUpgradeCosts(huntLevel);

    var huntDisplayer = document.querySelector(".player-stat-hunt"); 
    huntDisplayer.innerText = huntLevel;
    if(huntLevel === 10) { huntDisplayer.style.color = "#00ff15"; }

    huntTable.querySelector(".gold-cost").innerText = huntCosts.goldCost;
    huntTable.querySelector(".wood-cost").innerText = huntCosts.woodCost;
    // huntTable.querySelector(".meat-cost").innerText = huntCosts.meatCost;
}

// With each level costs go up +25%, after level 5 they go up +35%
var SMALL_SCALE = 0.25;
var LARGE_BONUS_SCALE = 0.1;

function getHealthUpgradeCosts (currLevel = 0) {
    var mod = 1 + (SMALL_SCALE * currLevel) + (LARGE_BONUS_SCALE * Math.max(currLevel - 5, 0));

    return {
        goldCost: Math.round(20 * mod),
        woodCost: Math.round(15 * mod),
        meatCost: Math.round(40 * mod),
    }
}

function getAttackUpgradeCosts (currLevel = 0) {
    var mod = 1 + (SMALL_SCALE * currLevel) + (LARGE_BONUS_SCALE * Math.max(currLevel - 5, 0));

    return {
        goldCost: Math.round(10 * mod),
        woodCost: Math.round(40 * mod),
        meatCost: Math.round(15 * mod),
    }
}

function getMineUpgradeCosts (currLevel = 0) {
    var mod = 1 + (SMALL_SCALE * currLevel) + (LARGE_BONUS_SCALE * Math.max(currLevel - 5, 0));

    return {
        // goldCost: Math.round(0 * mod),
        woodCost: Math.round(20 * mod),
        meatCost: Math.round(20 * mod),
    }
}

function getChopUpgradeCosts (currLevel = 0) {
    var mod = 1 + (SMALL_SCALE * currLevel) + (LARGE_BONUS_SCALE * Math.max(currLevel - 5, 0));

    return {
        goldCost: Math.round(20 * mod),
        // woodCost: Math.round(0 * mod),
        meatCost: Math.round(20 * mod),
    }
}

function getHuntUpgradeCosts (currLevel = 0) {
    var mod = 1 + (SMALL_SCALE * currLevel) + (LARGE_BONUS_SCALE * Math.max(currLevel - 5, 0));

    return {
        goldCost: Math.round(20 * mod),
        woodCost: Math.round(20 * mod),
        // meatCost: Math.round(0 * mod),
    }
}
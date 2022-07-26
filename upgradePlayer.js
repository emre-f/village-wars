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

            firebase.database().ref(`players/${PLAYER.id}`).update({ 
                health: PLAYER.health + 20,
                resources: {
                    gold: PLAYER.resources.gold - costs.goldCost,
                    wood: PLAYER.resources.wood - costs.woodCost,
                    meat: PLAYER.resources.meat - costs.meatCost,
                },
                stats: {
                    healthLevel: PLAYER.stats.healthLevel + 1,
                    attackLevel: PLAYER.stats.attackLevel,
                    mineLevel: PLAYER.stats.mineLevel,
                    chopLevel: PLAYER.stats.chopLevel,
                    huntLevel: PLAYER.stats.huntLevel,
                } 
            });
        }

        // Buff health of all villagers and other units as well
        Object.keys(units).forEach((key) => {
            firebase.database().ref(`units/${key}`).update({ 
                health: units[key].health + 2,
            })
        })

        Object.keys(knights).forEach((key) => {
            firebase.database().ref(`knights/${key}`).update({ 
                health: knights[key].health + 5,
            })
        })

        Object.keys(archers).forEach((key) => {
            firebase.database().ref(`archers/${key}`).update({ 
                health: archers[key].health + 3,
            })
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

            firebase.database().ref(`players/${PLAYER.id}`).update({ 
                damage: PLAYER.damage + 2,
                resources: {
                    gold: PLAYER.resources.gold - costs.goldCost,
                    wood: PLAYER.resources.wood - costs.woodCost,
                    meat: PLAYER.resources.meat - costs.meatCost,
                },
                stats: {
                    healthLevel: PLAYER.stats.healthLevel,
                    attackLevel: PLAYER.stats.attackLevel + 1,
                    mineLevel: PLAYER.stats.mineLevel,
                    chopLevel: PLAYER.stats.chopLevel,
                    huntLevel: PLAYER.stats.huntLevel,
                } 
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

            firebase.database().ref(`players/${PLAYER.id}`).update({ 
                resources: {
                    gold: PLAYER.resources.gold,
                    wood: PLAYER.resources.wood - costs.woodCost,
                    meat: PLAYER.resources.meat - costs.meatCost,
                },
                stats: {
                    healthLevel: PLAYER.stats.healthLevel,
                    attackLevel: PLAYER.stats.attackLevel,
                    mineLevel: PLAYER.stats.mineLevel + 1,
                    chopLevel: PLAYER.stats.chopLevel,
                    huntLevel: PLAYER.stats.huntLevel,
                } 
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

            firebase.database().ref(`players/${PLAYER.id}`).update({ 
                resources: {
                    gold: PLAYER.resources.gold - costs.goldCost,
                    wood: PLAYER.resources.wood,
                    meat: PLAYER.resources.meat - costs.meatCost,
                },
                stats: {
                    healthLevel: PLAYER.stats.healthLevel,
                    attackLevel: PLAYER.stats.attackLevel,
                    mineLevel: PLAYER.stats.mineLevel,
                    chopLevel: PLAYER.stats.chopLevel + 1,
                    huntLevel: PLAYER.stats.huntLevel,
                } 
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

            firebase.database().ref(`players/${PLAYER.id}`).update({ 
                resources: {
                    gold: PLAYER.resources.gold - costs.goldCost,
                    wood: PLAYER.resources.wood - costs.woodCost,
                    meat: PLAYER.resources.meat,
                },
                stats: {
                    healthLevel: PLAYER.stats.healthLevel,
                    attackLevel: PLAYER.stats.attackLevel,
                    mineLevel: PLAYER.stats.mineLevel,
                    chopLevel: PLAYER.stats.chopLevel,
                    huntLevel: PLAYER.stats.huntLevel + 1,
                } 
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
// Purpose: Networking/Managing all resources on the DB
function manageResources() {
    const allResourcesRef = firebase.database().ref(`resources`);

    // Holds all unit cells
    resourcesHolderElement.classList.add("resources-holder")
    gameContainer.appendChild(resourcesHolderElement);

    allResourcesRef.on("value", (snapshot) => {

        //Fires whenever a change occurs
        resources = snapshot.val() || {};

        Object.keys(resources).forEach((key) => {

            const resourceState = resources[key];
            let el = resourcesElements[key];
 
            // Now update the DOM
            el.querySelector(".Resource_amount_left").innerText = resourceState.amountLeft;
            el.querySelector(".Resource_amount_max").innerText = resourceState.amountMax;

            // Show the amounts more faded when they are at max.
            if (resourceState.amountLeft === resourceState.amountMax) {
                el.querySelector(".Resource_amount-container").style.opacity = 0.5;
            } else {
                el.querySelector(".Resource_amount-container").style.opacity = 1;
            }

            // Lower characters should appear at the front!
            el.style.zIndex = Math.round(resourceState.y / 16);

            if(resourceState.amountLeft <= 0) {
                resourceRef = firebase.database().ref(`resources/${getKeyString(resourceState.x, resourceState.y)}`);
                resourceRef.remove();
            }
        })
    })

    allResourcesRef.on("child_added", (snapshot) => {
        //Fires whenever a new node is added the tree
        const addedResource = snapshot.val();
        const key = getKeyString(addedResource.x, addedResource.y);

        const resourceElement = document.createElement("div");
        resourceElement.classList.add("Resource", "grid-cell");

        resourceElement.innerHTML = (`
            <div class="Resource_shadow grid-cell"></div>
            <div class="Resource_sprite grid-cell"></div>
            <div class="Resource_amount-container">
                <span class="Resource_amount_left">0</span>/<span class="Resource_amount_max">0</span>
            </div>
        `);

        //Fill in some initial state
        resourceElement.setAttribute("data-position", `${getKeyString(addedResource.x, addedResource.y)}`);
        resourceElement.querySelector(".Resource_sprite").setAttribute("data-resource-type", addedResource.type);
        resourceElement.querySelector(".Resource_amount_left").innerText = addedResource.amountLeft;
        resourceElement.querySelector(".Resource_amount_max").innerText = addedResource.amountMax;

        // Position the Element
        const left = 64 * addedResource.x + "px";
        const top = 64 * addedResource.y + "px";
        resourceElement.style.transform = `translate3d(${left}, ${top}, 0)`;

        // Show the amounts more faded when they are at max.
        resourceElement.querySelector(".Resource_amount-container").style.opacity = 0.5;

        resourcesElements[key] = resourceElement;
        resourcesHolderElement.appendChild(resourceElement);
        getMinimapCellElement(`${getKeyString(addedResource.x, addedResource.y)}`, {x: addedResource.x, y: addedResource.y }, "resource");
    })


    //Remove character DOM element after they leave
    allResourcesRef.on("child_removed", (snapshot) => {
        const removedKey = getKeyString(snapshot.val().x, snapshot.val().y);
        resourcesHolderElement.removeChild(resourcesElements[removedKey]);
        delete resourcesElements[removedKey];
        removeMinimapCellElement(removedKey);
    })
}

// Purpose: Handles the spawning of all resources (only ran by the "admin player")
function resourceHandler() {
    var mapResourceAmount = Object.keys(resources).length;

    if(resourceSpawnTimer >= resourceSpawnTimerCD) {
         
        // console.log("There are ", mapResourceAmount, " resources on this map.");
        if(mapResourceAmount < MAX_RESOURCE_ON_MAP) {
            spawnResources("wood");
            spawnResources("gold");+
            spawnResources("meat");
        }

        resourceSpawnTimer = 0;
    } else {
        // Spawn faster, the less resources there are
        let multi = 1 + 2.5 * ((MAX_RESOURCE_ON_MAP - mapResourceAmount) / MAX_RESOURCE_ON_MAP);
        // console.log("MULTI: ", multi);
        resourceSpawnTimer += (1 * multi)/60;
    }
}

// Purpose: Spawn a specific resource somewhere random on the map
function spawnResources(type) {
        
    // Type has to be "wood", "gold" or "meat"
    if (type !== "wood" && type !== "gold" && type !== "meat") {
        console.log("ERROR: INCORRECT INPUT FOR SPAWN RESOURCE")
        return;
    }
    
    var lastPos = { x: -1, y: -1 }
    var n = 0;

    while(true) {
        lastPos = {
            x: Math.floor(0 + Math.random() * (MAP_SIZE - 0)),
            y: Math.floor(0 + Math.random() * (MAP_SIZE - 0))
        }

        if(!isOccupiedByPlayer(lastPos.x, lastPos.y, players) && !isOccupiedByPlayer(lastPos.x, lastPos.y, resources)) {
            break;
        } else {
            n += 1;
            if (n >= 100) {
                console.log("ERROR: NO EMPTY SPOT FOUND!");
                break;
            }
        }
    }

    let chosenAmount = randomFromArray([120, 180, 360]);
    const resourceRef = firebase.database().ref(`resources/${getKeyString(lastPos.x, lastPos.y)}`);
    resourceRef.set({
        type: type,
        x: lastPos.x,
        y: lastPos.y,
        amountLeft: chosenAmount,
        amountMax: chosenAmount,
    })
}
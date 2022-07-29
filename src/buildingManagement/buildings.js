// Purpose: Networking/Managing all buildings on the DB
function manageBuildings() {
    const allBuildingsRef = firebase.database().ref(`buildings`);

    allBuildingsRef.on("value", (snapshot) => {
        //Fires whenever a change occurs
        buildings = snapshot.val() || {};
    
        Object.keys(buildings).forEach((key) => {
            const state = buildings[key];
            let el = buildingElements[key];

            if(state.health <= 0) {
                firebase.database().ref(`buildings/${key}`).remove();
                return;
            }

            // Now update the DOM
            el.querySelector(".Building_health").innerText = state.health;
            const left = 64 * state.x + "px";
            const top = (64 * state.y) + "px";

            el.style.transform = `translate3d(${left}, ${top}, 0)`;

            // Lower characters should appear at the front!
            el.style.zIndex = Math.round(state.y / 16);

            // Update minimap pos
            updateMinimapCellElement(key, {x: state.x, y: state.y});
        });
    })

    allBuildingsRef.on("child_added", (snapshot) => {
        //Fires whenever a new node is added the tree
        const state = snapshot.val();

        const ele = document.createElement("div");
        ele.classList.add("Building", "grid-cell");

        ele.innerHTML = (`
            <div class="Building_shadow grid-cell"></div>
            <div class="Building_sprite grid-cell"></div>
            <div class="Building_effects-container">
            </div>
            <div class="Building_name-container">
                <span class="Building_name"></span>
                <span class="Building_health">0</span>
            </div>
        `);

        let effectsContainer = "";

        // YOUR building...
        if(state.ownerId === playerId) {
            effectsContainer = effectsContainer + `<span class="Character_you-container">&#128994;</span>`;
            getMinimapCellElement(state.id, {x: state.x, y: state.y }, "ally-building");
        } else {
            getMinimapCellElement(state.id, {x: state.x, y: state.y }, "enemy-building");
        }

        ele.querySelector(".Building_effects-container").innerHTML = effectsContainer;

        buildingElements[state.id] = ele;

        //Fill in some initial state
        // ele.querySelector(".Building_name").innerText = state.name;
        ele.querySelector(".Building_health").innerText = state.health;
        ele.setAttribute("data-building-type", state.buildingType);
        const left = 64 * state.x + "px";
        const top = 64 * state.y + "px";
        ele.style.transform = `translate3d(${left}, ${top}, 0)`;
        gameContainer.appendChild(ele);
    })

    allBuildingsRef.on("child_removed", (snapshot) => {
        const removedKey = snapshot.val().id;
        gameContainer.removeChild(buildingElements[removedKey]);
        delete buildingElements[removedKey];
        removeMinimapCellElement(removedKey);
    })
}
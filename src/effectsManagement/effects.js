function manageEffects() {
    const allEffectsRef = firebase.database().ref(`effects`);

    allEffectsRef.on("child_added", (snapshot) => {
        const eff = snapshot.val();
        const slashElement = document.createElement("div");

        if(eff.type === "sword-slash") {
            slashElement.classList.add("sword-slash");

            slashElement.innerHTML = (`
                <div class="sword-animation-sprite" data-dir=${eff.dir}></div>
            `);
            
            slashElement.style.transform = `translate3d(${eff.left}, ${eff.top}, 0)`;
            gameContainer.appendChild(slashElement);

            setTimeout(function(){
                gameContainer.removeChild(slashElement);

                //Remove from DB
                firebase.database().ref(`effects/${eff.id}`).remove()
            }, 325); 
        } else if (eff.type === "fireball") {
            slashElement.classList.add("fireball");

            slashElement.innerHTML = (`
                <div class="fireball-animation-sprite" data-target-left=${eff.targetLeft} data-target-top=${eff.targetTop}></div>
            `);
            
            slashElement.style.transform = `translate3d(${eff.left}, ${eff.top}, 0)`;
            slashElement.style.setProperty('--target-left', eff.targetLeft)
            slashElement.style.setProperty('--target-top', eff.targetTop)

            gameContainer.appendChild(slashElement);

            setTimeout(function(){
                gameContainer.removeChild(slashElement);

                //Remove from DB
                firebase.database().ref(`effects/${eff.id}`).remove()
            }, 325);
        }
        
    })
}

function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function swordSlash(pos = { x: 0, y:0 }, targetPos = { x: 0, y:0 }) {

    var dir = "";
    if (pos.x > targetPos.x) { dir = "left" }
    else if (pos.x < targetPos.x) { dir = "right" }
    else if (pos.y > targetPos.y) { dir = "up" }
    else { dir = "down" }
    
    var leftMod = 0;
    var topMod = 0;

    if(dir === "right") {
        leftMod = 48;
        topMod = 16;
    } else if (dir === "up") {
        leftMod = 16;
        topMod = -32;
    } else if (dir === "down") {
        leftMod = 16;
        topMod = 32;
    } else if (dir === "left") {
        leftMod = -32;
        topMod = 16;
    }

    const left = 64 * pos.x + leftMod +  "px";
    const top = 64 * pos.y + topMod + "px";

    var uuid = guidGenerator();
    const effectRef = firebase.database().ref(`effects/${uuid}`);
    effectRef.set({
        id: uuid,
        type: "sword-slash",
        left,
        top,
        dir
    })
}

function fireBall(pos, targetPos) {
    var leftMod = 32;
    var topMod = 0;

    var leftRaw = 64 * pos.x + leftMod;
    const left =  leftRaw +  "px";
    
    var topRaw = 64 * pos.y + topMod;
    const top = topRaw + "px";

    var targetLeftMod = 16;
    var targetTopMod = 12;

    const targetLeft = 64 * targetPos.x - leftRaw + targetLeftMod +  "px";
    const targetTop = 64 * targetPos.y - topRaw + targetTopMod + "px";

    var uuid = guidGenerator();
    const effectRef = firebase.database().ref(`effects/${uuid}`);
    effectRef.set({
        id: uuid,
        type: "fireball",
        left,
        top,
        targetLeft,
        targetTop,
    })
}
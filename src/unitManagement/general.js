function healthRegenUnits() {
    if(healthRegenTimer < healthRegenTimerCD) {
        healthRegenTimer += 1/60;
    } else {

        Object.keys(players).forEach((key) => {
            firebase.database().ref(`players/${key}`).transaction((obj) => { if (obj == null) { return }
                let regen = Math.max(1, Math.round(obj.health / 20));
                obj.health = Math.min(obj.maxHealth, obj.health + regen);
                return obj
            });
        })
        
        Object.keys(units).forEach((key) => {
            firebase.database().ref(`units/${key}`).transaction((obj) => { if (obj == null) { return }
                let regen = Math.max(1, Math.round(obj.health / 20));
                obj.health = Math.min(obj.maxHealth, obj.health + regen);
                return obj
            });
        })

        Object.keys(knights).forEach((key) => {
            firebase.database().ref(`knights/${key}`).transaction((obj) => { if (obj == null) { return }
                let regen = Math.max(1, Math.round(obj.health / 20));
                obj.health = Math.min(obj.maxHealth, obj.health + regen);
                return obj
            });
        })

        Object.keys(mages).forEach((key) => {
            firebase.database().ref(`mages/${key}`).transaction((obj) => { if (obj == null) { return }
                let regen = Math.max(1, Math.round(obj.health / 20));
                obj.health = Math.min(obj.maxHealth, obj.health + regen);
                return obj
            });
        })

        Object.keys(buildings).forEach((key) => {
            firebase.database().ref(`buildings/${key}`).transaction((obj) => { if (obj == null) { return }
                let regen = Math.max(1, Math.round(obj.health / 60)); // Slower regen for buildings
                obj.health = Math.min(obj.maxHealth, obj.health + regen);
                return obj
            });
        })

        healthRegenTimer = 0;
    }
}
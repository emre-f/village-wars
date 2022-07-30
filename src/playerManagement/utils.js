function stealResources(killerPlayerId, killedPlayer) {
	firebase.database().ref(`players/${killerPlayerId}`).transaction((obj) => { if (obj == null) { return }
		obj.resources = { 
			gold: obj.resources.gold + Math.max(0, Math.round(killedPlayer.resources.gold * 0.7)),
			wood: obj.resources.wood + Math.max(0, Math.round(killedPlayer.resources.wood * 0.7)),
			meat: obj.resources.meat + Math.max(0, Math.round(killedPlayer.resources.meat * 0.7))
		} 
		return obj
	})
}

var resetLastDamagedByTimer = 8;
var resetLastDamagedByTimerCD = 8;

var resetLastDamagedTimer = 8;
var resetLastDamagedTimerCD = 8;

function resetLastDamaged() {
	if (resetLastDamagedTimer < resetLastDamagedTimerCD) {
		resetLastDamagedTimer += 1/60;
	} else {

		if(players[playerId] == null) { resetLastDamagedTimer = 0; return; }
		if(players[playerId].lastDamagedId === "none") { resetLastDamagedTimer = 0; return }

		firebase.database().ref(`players/${playerId}`).transaction((obj) => { if (obj == null) { return }
			obj.lastDamagedId = "none";
			return obj
		});

		resetLastDamagedTimer = 0;
	}
}

function resetLastDamagedBy() {
	checkIfYouGotHit();

	if (resetLastDamagedByTimer < resetLastDamagedByTimerCD) {
		resetLastDamagedByTimer += 1/60;
	} else {

		if(players[playerId] == null) { resetLastDamagedByTimer = 0; return; }
		if(players[playerId].lastDamagedById === "none") { resetLastDamagedByTimer = 0; return }

		firebase.database().ref(`players/${playerId}`).transaction((obj) => { if (obj == null) { return }
			obj.lastDamagedById = "none";
			return obj
		});

		resetLastDamagedByTimer = 0;
	}
}

// If you have been recently damaged, reset your last damaged by timer
function checkIfYouGotHit() {
	if(!players[playerId].recentlyDamaged) { return; }

	resetLastDamagedByTimer = 0;

	firebase.database().ref(`players/${playerId}`).transaction((obj) => { if (obj == null) { return }
		obj.recentlyDamaged = false;
		return obj
	});
}
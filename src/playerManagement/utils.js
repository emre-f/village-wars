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
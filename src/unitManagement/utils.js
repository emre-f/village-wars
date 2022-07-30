function getTargets() {
    var allPotentialTargetPos = [];
    var ownerTargets = [];

    //

    Object.keys(units).forEach((key) => {
        if( units[key] == null || units[key].ownerId === playerId) { return; }
        var result = units[key];
        result["tribe"] = "units";
        allPotentialTargetPos.push(result)

        if( PLAYER && units[key].ownerId === PLAYER.lastDamagedId ) { ownerTargets.push(result) };
    })

    Object.keys(players).forEach((key) => {
        if( players[key] == null || players[key].id === playerId) { return; }
        var result = players[key];
        result["tribe"] = "players";
        allPotentialTargetPos.push(result);

        if( PLAYER && players[key].id === PLAYER.lastDamagedId ) { ownerTargets.push(result) };
    })

    Object.keys(knights).forEach((key) => {
        if( knights[key] == null || knights[key].ownerId === playerId) { return; }
        var result = knights[key];
        result["tribe"] = "knights";
        allPotentialTargetPos.push(result);

        if( PLAYER && knights[key].ownerId === PLAYER.lastDamagedId ) { ownerTargets.push(result) };
    })
    
    Object.keys(mages).forEach((key) => {
        if( mages[key] == null || mages[key].ownerId === playerId) { return; }
        var result = mages[key];
        result["tribe"] = "mages";
        allPotentialTargetPos.push(result);

        if( PLAYER && mages[key].ownerId === PLAYER.lastDamagedId ) { ownerTargets.push(result) };
    })

    Object.keys(buildings).forEach((key) => {
        if( buildings[key] == null || buildings[key].ownerId === playerId) { return; }
        var result = buildings[key];
        result["tribe"] = "buildings";
        allPotentialTargetPos.push(result);

        if( PLAYER && buildings[key].ownerId === PLAYER.lastDamagedId ) { ownerTargets.push(result) };
    })

    return {
        allPotentialTargetPos,
        ownerTargets
    }
}
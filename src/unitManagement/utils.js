function getTargets() {
    var allPotentialTargetPos = [];
    var ownerTargets = [];

    //

    Object.keys(units).forEach((key) => {
        if( units[key] == null || units[key].ownerId === playerId) { return; }
        var result = units[key];
        result["tribe"] = "units";
        allPotentialTargetPos.push(result)

        if( PLAYER && units[key].ownerId === PLAYER.lastDamagedId ) { ownerTargets.push( { x: units[key].x, y: units[key].y } ) };
    })

    Object.keys(players).forEach((key) => {
        if( players[key] == null || players[key].id === playerId) { return; }
        var result = players[key];
        result["tribe"] = "players";
        allPotentialTargetPos.push(result);

        if( PLAYER && players[key].id === PLAYER.lastDamagedId ) { ownerTargets.push( { x: players[key].x, y: players[key].y } ) };
    })

    Object.keys(knights).forEach((key) => {
        if( knights[key] == null || knights[key].ownerId === playerId) { return; }
        var result = knights[key];
        result["tribe"] = "knights";
        allPotentialTargetPos.push(result);

        if( PLAYER && knights[key].ownerId === PLAYER.lastDamagedId ) { ownerTargets.push( { x: knights[key].x, y: knights[key].y } ) };
    })
    
    Object.keys(mages).forEach((key) => {
        if( mages[key] == null || mages[key].ownerId === playerId) { return; }
        var result = mages[key];
        result["tribe"] = "mages";
        allPotentialTargetPos.push(result);

        if( PLAYER && mages[key].ownerId === PLAYER.lastDamagedId ) { ownerTargets.push( { x: mages[key].x, y: mages[key].y } ) };
    })

    return {
        allPotentialTargetPos,
        ownerTargets
    }
}
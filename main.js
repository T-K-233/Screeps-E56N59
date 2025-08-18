module.exports.loop = function() {

    let spawn = Game.spawns["Nowhere"];
    let room = Game.rooms["E56N59"];
    let controller = Game.getObjectById("5bbcb0619099fc012e63c10d");
    let resource = Game.getObjectById("5bbcb0619099fc012e63c10c");
    let tower = Game.getObjectById("68a1838e123fb8126063a46d");

    // creep.signController(creep.room.controller, "A cornered hamster.")

    //
    // ======== Mining Unit ========
    //
    let miners = ["miner_0", "miner_1"];

    miners.forEach(function(name) {
        let creep = room.find(FIND_CREEPS, {filter: {name: name}})[0];

        if (!creep) {
            let direction = [BOTTOM_LEFT, BOTTOM_RIGHT][miners.indexOf(name)];

            // [WORK, WORK, WORK] cost is 300
            let status_code = spawn.spawnCreep([WORK, WORK, WORK], name, {directions: [direction]});
            console.log("trying to spawn " + name + ", return code: " + status_code);

            return;
        }

        creep.harvest(resource);

        spawn.renewCreep(creep);
    });

    //
    // ======== Router Unit ========
    //
    let router = ["router_0", "router_1"];

    router.forEach(function(name) {
        let creep = room.find(FIND_CREEPS, {filter: {name: name}})[0];
        if (!creep) {
            let direction = [BOTTOM, RIGHT][router.indexOf(name)];

            // [WORK, CARRY] cost is 150
            let status_code = spawn.spawnCreep([WORK, WORK, CARRY], name, {directions: [direction]});
            console.log("trying to spawn " + name + ", return code: " + status_code);

            return;
        }

        creep.pickup(creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES));
        creep.withdraw(creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}}), RESOURCE_ENERGY);

        creep.transfer(spawn, RESOURCE_ENERGY);
        creep.transfer(tower, RESOURCE_ENERGY);

        creep.build(creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES));

        creep.transfer(controller, RESOURCE_ENERGY);

        spawn.renewCreep(creep);
    });

    //
    // ======== Tower ========
    //
    room.find(FIND_STRUCTURES, {filter: {structureType: "tower"}}).forEach(function(structure) {

        let hostiles = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
            var username = hostiles[0].owner.username;
            Game.notify(`User ${username} spotted in room ${roomName}`);
            structure.attack(hostiles[0]);
        }

        let repairables = room.find(FIND_STRUCTURES, {
            filter: object => object.hits < Math.min(object.hitsMax, 100000)  // renew to at least 100k or full health
        });
        repairables.sort((a,b) => a.hits - b.hits);
        if (repairables.length > 0) {
            structure.repair(repairables[0]);
        }
    });

    //
    // ======== Logging ========
    //
    if ((Game.time - 50) % 300 == 0) {
        console.log("================================================================");
        console.log(`Remaining energy: ${resource.energy}`);
        let rooms_stat = " ";
        for (var name in Game.rooms) { rooms_stat += name+": "+Game.rooms[name].energyAvailable+" energy\t"; }
        console.log(rooms_stat);
        console.log("================================================================");
        console.log();
    }
}

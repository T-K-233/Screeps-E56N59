module.exports.loop = function() {

    let spawn = Game.spawns["Nowhere"];
    let room = Game.rooms["E56N59"];
    let controller = Game.getObjectById("5bbcb0619099fc012e63c10d");
    let source = Game.getObjectById("5bbcb0619099fc012e63c10c");
    let tower = Game.getObjectById("68a1838e123fb8126063a46d");
    
    const REPAIR_HIT_THRESHOLD = 200000;  // tower will repair structures' hit to this threshold (200 k)

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

        creep.harvest(source);

        spawn.renewCreep(creep);
    });

    //
    // ======== Router Unit ========
    //
    let router = ["router_0", "router_1", "router_2"];

    router.forEach(function(name) {
        let creep = room.find(FIND_CREEPS, {filter: {name: name}})[0];
        if (!creep) {
            let direction = [LEFT, BOTTOM, RIGHT][router.indexOf(name)];

            // [WORK, CARRY] cost is 150
            let status_code = spawn.spawnCreep([WORK, WORK, WORK, CARRY], name, {directions: [direction]});
            console.log("trying to spawn " + name + ", return code: " + status_code);

            return;
        }

        creep.pickup(creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES));
        let containers = creep.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_CONTAINER}});
        containers.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
        creep.withdraw(containers[0], RESOURCE_ENERGY);

        creep.transfer(spawn, RESOURCE_ENERGY);
        creep.transfer(creep.pos.findClosestByRange(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}}), RESOURCE_ENERGY);
        creep.transfer(tower, RESOURCE_ENERGY);

        creep.build(creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES));

        creep.transfer(controller, RESOURCE_ENERGY);

        spawn.renewCreep(creep);
    });

    //
    // ======== Tower ========
    //
    room.find(FIND_STRUCTURES, {filter: {structureType: "tower"}}).forEach(function(structure) {

        // defence logic
        let hostiles = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
            var username = hostiles[0].owner.username;
            Game.notify(`User ${username} spotted in room ${roomName}`);
            structure.attack(hostiles[0]);
        }

        // repair logic
        let repairables = room.find(FIND_STRUCTURES, {
            filter: object => object.hits < Math.min(object.hitsMax, REPAIR_HIT_THRESHOLD)  // repair to at least threshold or full health
        });
        repairables.sort((a, b) => a.hits - b.hits);
        if (repairables.length > 0) {
            structure.repair(repairables[0]);
        }
    });

    //
    // ======== Logging ========
    //
    if (source.ticksToRegeneration == 1) {
        console.log("================================================================");
        let energy_harvested = source.energyCapacity - source.energy;
        let controller_progress = controller.progress - Memory.stats.controllerProgress;
        let progress_percentage = controller.progress / controller.progressTotal;
        let utilization = controller_progress / energy_harvested;
        console.log(`Energy harvested: ${energy_harvested}`);
        console.log(`Controller progress: ${controller_progress} (${progress_percentage * 100}) %`);
        console.log(`Utilization: ${utilization * 100} %`);

        let rooms_stat = "";
        for (var name in Game.rooms) { rooms_stat += `  ${name}: ${Game.rooms[name].energyAvailable}\n`; }
        console.log("Room energy storage:");
        console.log(rooms_stat);
        console.log("================================================================");
        console.log();

        Memory.stats.controllerProgress = controller.progress;
        Memory.stats.energy_harvested = energy_harvested;
        Memory.stats.controller_progress = controller_progress;
        Memory.stats.energy_utilization = utilization;
        Memory.stats.controller_progress_percentage = progress_percentage;
    }
}

import RoomManager from "./RoomManager";


for(var i in Memory.creeps) {
    if(!Game.creeps[i]) {
        delete Memory.creeps[i];
    }
}

for(var id in Game.spawns){
    var spawn = Game.spawns[id];
    var roomManager = new RoomManager(spawn.room,spawn);
    roomManager.Run();
}
    
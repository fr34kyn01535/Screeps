import { IRoomMemory  } from "./Room"
import { ROLE, ICreepMemory, STAGE } from "./Creep"
import RoomManager from "./RoomManager"

import * as _ from "lodash"


export default class SpawnManager{
    public Spawn : StructureSpawn;
    private room :RoomManager;

    constructor(room: RoomManager,spawn: StructureSpawn){
        this.room = room;
        this.Spawn = spawn;       
    }
    public Run(){
        this.room.Room.memory.RoleMemberships.forEach((amount: number,role : ROLE) =>{
            if(this.room.Creeps.Creeps.filter(c => c.memory.Role == role).length < amount)
            switch(role){
                case ROLE.ACOLYTE:
                    this.Spawn.spawnCreep([MOVE,WORK,CARRY,CARRY],"Acolythe " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.ACOLYTE, Stage: STAGE.IDLE }});
                    break;
                case ROLE.PROBE:
                    this.Spawn.spawnCreep([MOVE,WORK,WORK,CARRY],"Probe " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.PROBE, Stage: STAGE.IDLE }});
                    break;
            }
        });
    }
}  
import { ROLE, ICreepMemory, STAGE } from "./Creep"
import RoomManager from "./RoomManager"
import { RoleMembership } from "./Room"

import * as _ from "lodash"

 
export default class SpawnManager{
    public Spawn : StructureSpawn;
    private room :RoomManager;

    constructor(room: RoomManager,spawn: StructureSpawn){
        this.room = room;
        this.Spawn = spawn;       
    } 
    public Run(){
        this.room.Room.memory.RoleMemberships.sort((a,b) => a.Priority - b.Priority).some((membership: RoleMembership,role : ROLE) :boolean => {
            if(this.room.Creeps.Creeps.filter(c => c.memory.Role == role).length < membership.Amount){
                switch(role){
                    case ROLE.PROBE:
                        this.Spawn.spawnCreep([MOVE,MOVE,WORK,WORK,WORK,CARRY,CARRY,CARRY],"Probe " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.PROBE, Stage: STAGE.IDLE }});
                        return true;
                    case ROLE.ACOLYTE:
                        this.Spawn.spawnCreep([MOVE,MOVE,WORK,CARRY,CARRY,CARRY],"Acolyte " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.ACOLYTE, Stage: STAGE.IDLE }});
                        return true;
                    case ROLE.ADEPT:
                        this.Spawn.spawnCreep([MOVE,MOVE,WORK,CARRY,CARRY],"Adept " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.ADEPT, Stage: STAGE.IDLE }});
                        return true;
                }
            }
            return false;
        });
    }
}  
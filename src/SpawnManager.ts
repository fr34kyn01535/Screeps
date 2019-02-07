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
        if(this.room.Creeps.Creeps.filter(c => c.memory.Role == ROLE.PROBE).length < 2 && this.room.Creeps.Creeps.filter(c => c.memory.Role == ROLE.EPROBE).length < 8 && !this.room.InDanger){
            this.Spawn.spawnCreep([MOVE,WORK,CARRY],"Emergency Probe " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.EPROBE, Stage: STAGE.IDLE }});
            return;
        } 
        this.room.Room.memory.RoleMemberships.sort((a,b) => a.Priority - b.Priority).some((membership : RoleMembership) :boolean => {
            console.log(ROLE[membership.Role]);
            if(this.room.Creeps.Creeps.filter(c => c.memory.Role == membership.Role).length < membership.Amount){
       
                switch(membership.Role){
                    case ROLE.PROBE:
                        this.Spawn.spawnCreep([MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY],"Probe " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.PROBE, Stage: STAGE.IDLE }});
                        return true;
                    case ROLE.ACOLYTE:
                        this.Spawn.spawnCreep([MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY],"Acolyte " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.ACOLYTE, Stage: STAGE.IDLE }});
                        return true;
                    case ROLE.ADEPT: 
                        this.Spawn.spawnCreep([MOVE,WORK,CARRY,MOVE,CARRY,WORK,MOVE],"Adept " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.ADEPT, Stage: STAGE.IDLE }});
                        return true;
                    case ROLE.BERSERK:
                        this.Spawn.spawnCreep([MOVE,MOVE,MOVE,ATTACK, ATTACK, ATTACK , ATTACK ,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH],"Berserk " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.BERSERK, Stage: STAGE.IDLE }});
                        return true;
                    case ROLE.STALKER:
                        this.Spawn.spawnCreep([MOVE,MOVE,MOVE,RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK , RANGED_ATTACK ,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH],"Stalker " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.STALKER, Stage: STAGE.IDLE }});
                        return true;
                    case ROLE.SENTRY:
                        this.Spawn.spawnCreep([MOVE,MOVE,MOVE,CARRY,CARRY,CARRY],"Sentry " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.SENTRY, Stage: STAGE.IDLE }});
                        return true;
                    case ROLE.ORACLE:
                        this.Spawn.spawnCreep([MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,TOUGH,TOUGH,TOUGH],"Oracle " + Game.time.toString(), {memory:<ICreepMemory>{ Role: ROLE.ORACLE, Stage: STAGE.IDLE }});
                        return true;
                }
            }
            return false;
        });
    }
}  
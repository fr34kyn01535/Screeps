import {IRoom, RoleMembership} from "./Room";
import { ROLE, ICreepMemory, STAGE, ICreep } from "./Creep"
import { ProbeBehavior, SentryBehavior, AcolyteBehavior, AdeptBehavior, BerserkBehavior, StalkerBehavior, OracleBehavior, ArchonBehavior }  from "./Behaviors"

import * as _ from "lodash"

export default class RoomManager {
    public Room: IRoom;  
    public Spawns : Array<StructureSpawn>;
    public Creeps : Array<ICreep>;  
    public Enemies : Array<Creep>;
    public InDanger: boolean = false;
    public Owned: boolean = false;
    public IdleFlag : Flag | undefined

    constructor(room: Room){
        this.Room = <IRoom> room;
        this.Spawns = _(Game.spawns).filter(s => s.room.name == room.name).value();
        this.Creeps = <Array<ICreep>> _(Game.creeps).filter((creep) => (<ICreep>creep).memory.Room == room.name).value();
        this.Enemies = this.Room.find(FIND_HOSTILE_CREEPS);
        this.InDanger = this.Enemies.length != 0;
        this.Owned = this.Spawns.length != 0;
        this.IdleFlag = this.Room.find(FIND_FLAGS,{filter: f => f.name.startsWith("Idle")}).pop();
        if(this.Owned) this.configure();
    }

    private configure(){ 
        if(this.Room.memory.RoleMemberships == null){
            this.Room.memory.RoleMemberships = [];
            this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.PROBE,1,4));
            this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.ACOLYTE,15,3)); 
            this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.ADEPT,20,5));
            this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.BERSERK,50,0)); 
            this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.STALKER,50,0)); 
            this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.ORACLE,49,0)); 
            this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.SENTRY,33,1)); 
            this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.ARCHON,99,0)); 
        }
    }

    public Run(){    
        
        this.Creeps.forEach(creep => {
            switch((<ICreepMemory>creep.memory).Role){
                case ROLE.EPROBE: case ROLE.PROBE: return new ProbeBehavior(this, creep).Execute();
                case ROLE.ACOLYTE: return new AcolyteBehavior(this, creep).Execute();
                case ROLE.ADEPT: return new AdeptBehavior(this, creep).Execute();
                case ROLE.BERSERK: return new BerserkBehavior(this, creep).Execute();
                case ROLE.STALKER: return new StalkerBehavior(this, creep).Execute();
                case ROLE.SENTRY: return new SentryBehavior(this, creep).Execute();
                case ROLE.ORACLE: return new OracleBehavior(this, creep).Execute(); 
                case ROLE.ARCHON: return new ArchonBehavior(this, creep).Execute(); 
            } 
        });
        if(this.Owned){
            this.runRoomDefense();
            this.spawn();
        }
    }

    private getMemoryTemplate(role: ROLE) : ICreepMemory{
        return { Role: role, Stage: STAGE.IDLE, Room: this.Room.name, Target: null };
    }

    private spawn(){
        this.Spawns.forEach(spawn => {
            var lowEnergyMode = spawn.room.find(FIND_MY_STRUCTURES,{filter:f => f.structureType == STRUCTURE_EXTENSION }).length <= 5;
            
            if(this.Creeps.filter(c => c.memory.Role == ROLE.PROBE).length == 0 && this.Creeps.filter(c => c.memory.Role == ROLE.EPROBE).length < 4 && ! this.InDanger){
                spawn.spawnCreep([MOVE,WORK,CARRY],"Emergency Probe " + Game.time.toString(), {memory:this.getMemoryTemplate(ROLE.EPROBE)});
                return;
            } 
            this.Room.memory.RoleMemberships.sort((a,b) => a.Priority - b.Priority).some((membership : RoleMembership) :boolean => {
                if(this.Creeps.filter(c => c.memory.Role == membership.Role).length < membership.Amount && membership.Amount != 0){
                    //console.log(this.Room.name,"Spawning: ",ROLE[membership.Role], membership.Amount);
                    switch(membership.Role){
                        case ROLE.PROBE:
                            spawn.spawnCreep(lowEnergyMode ? [MOVE,WORK,CARRY] : [MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY],"Probe " + Game.time.toString(), 
                            {memory: this.getMemoryTemplate(ROLE.PROBE)});
                            return true;
                        case ROLE.ACOLYTE:
                            spawn.spawnCreep(lowEnergyMode ? [MOVE,WORK,CARRY] :[MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY],"Acolyte " + Game.time.toString(), 
                            {memory: this.getMemoryTemplate(ROLE.ACOLYTE)});
                            return true;
                        case ROLE.ADEPT: 
                            spawn.spawnCreep(lowEnergyMode ? [MOVE,WORK,CARRY] :[MOVE,WORK,CARRY,MOVE,CARRY,WORK,MOVE],"Adept " + Game.time.toString(), 
                            {memory: this.getMemoryTemplate(ROLE.ADEPT)});
                            return true;
                        case ROLE.BERSERK:
                            if(lowEnergyMode) return false;
                            spawn.spawnCreep([MOVE,MOVE,MOVE,ATTACK, ATTACK, ATTACK , ATTACK ,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH],"Berserk " + Game.time.toString(), 
                            {memory: this.getMemoryTemplate(ROLE.BERSERK)});
                            return true; 
                        case ROLE.STALKER:
                            if(lowEnergyMode) return false;
                            spawn.spawnCreep([MOVE,MOVE,MOVE,RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK , RANGED_ATTACK ,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH],"Stalker " + Game.time.toString(), 
                            {memory: this.getMemoryTemplate(ROLE.STALKER)});
                            return true;
                        case ROLE.SENTRY:
                            if(lowEnergyMode) return false;
                            spawn.spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY],"Sentry " + Game.time.toString(),
                            {memory: this.getMemoryTemplate(ROLE.SENTRY)});
                            return true;
                        case ROLE.ORACLE:
                            if(lowEnergyMode) return false;
                            spawn.spawnCreep([MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,TOUGH,TOUGH,TOUGH],"Oracle " + Game.time.toString(), 
                            {memory: this.getMemoryTemplate(ROLE.ORACLE)});
                            return true;
                        case ROLE.ARCHON:
                            if(lowEnergyMode) return false;
                            spawn.spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CLAIM],"Archon " + Game.time.toString(), 
                            {memory: this.getMemoryTemplate(ROLE.ARCHON)});
                            return true;
                    }
                }
                return false;
            });
        });
    }

    private runRoomDefense(){
        var tower = <StructureTower[]>this.Room.find(FIND_STRUCTURES,{filter: s => s.structureType == STRUCTURE_TOWER});
        if(this.Enemies.length != 0){
            tower.forEach(t => t.attack(this.Enemies[0]));
        }
    }

} 
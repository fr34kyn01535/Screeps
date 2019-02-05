import RoomManager from "./RoomManager";
import * as _ from "lodash"

export enum ROLE{
    PROBE = 0,
    ACOLYTE = 1,
    ADEPT = 2,
    BERSERK = 3
}

export enum STAGE{
    IDLE = 0,
    WORKING = 1,
    EMPTYING = 2,
    UPGRADING = 3,
    FETCHING = 4,
    BUILDING = 5,
    REPAIRING = 6,
    GATHERING = 7
}

export interface ICreep extends Creep{
    memory : ICreepMemory 
}

export interface ICreepMemory extends CreepMemory {
    Role : ROLE
    Stage: STAGE
    Target : string | null
}

export abstract  class RoleBehavior {
    protected room : RoomManager;
    protected creep : ICreep;
    protected target : Structure | ConstructionSite | Source | Resource | null = null;

    constructor(room: RoomManager, creep : Creep){
        this.room = room;
        this.creep = <ICreep>creep;
        if(this.creep.memory.Target != null){
            this.target = Game.getObjectById(this.creep.memory.Target);
        }

    }
    abstract Execute() : void;
}

export class AcolyteBehavior extends RoleBehavior {

    private findNewTarget(){
        this.creep.memory.Stage = STAGE.EMPTYING;
        this.target = (<StructureController>this.room.Room.controller);
        this.creep.memory.Target = this.target.id;
    }

    private refill(){
        var container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => structure.structureType == STRUCTURE_CONTAINER && (<StructureContainer>(structure)).store[RESOURCE_ENERGY] > 0 });
        if(container == null){
            this.creep.memory.Stage = STAGE.IDLE;
        }else{
            this.target = container;
            this.creep.memory.Target = this.target.id;
            this.creep.memory.Stage = STAGE.FETCHING;
        }
    }

    public Execute(){
        if(this.creep.memory.Stage == STAGE.FETCHING && this.creep.carry.energy == this.creep.carryCapacity || 
            this.creep.memory.Stage == STAGE.IDLE && this.creep.carry.energy != 0) { 
            this.findNewTarget();
        }

        if(this.creep.memory.Stage != STAGE.FETCHING && this.creep.carry.energy == 0 || STAGE.IDLE) {
            this.refill();
        }

        if(this.target != null){
            switch(this.creep.memory.Stage){
                case STAGE.IDLE:
                    this.creep.moveTo(Game.flags["Idle"]);
                break;
                case STAGE.FETCHING:
                    var harvestResult = this.creep.withdraw(<Structure>this.target,RESOURCE_ENERGY);
                    switch(harvestResult){
                        case ERR_NOT_IN_RANGE:
                            this.creep.moveTo(this.target);
                            break;
                        case ERR_NOT_ENOUGH_RESOURCES:
                            this.refill();
                            break;
                        case OK:
                            if(this.creep.carry.energy == this.creep.carry.energy)
                                this.findNewTarget();
                        break;
                    }
                case STAGE.EMPTYING:
                    var transferResult = this.creep.transfer(<Structure>this.target,RESOURCE_ENERGY);
                    switch(transferResult){
                        case ERR_NOT_IN_RANGE:
                            this.creep.moveTo(this.target);
                            break; 
                    }
                break;
            }
        }

    }
} 
 
export class BerserkBehavior extends RoleBehavior{
    public Execute(){
        var enemy = this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS)
        if(enemy == null){
            this.creep.moveTo(Game.flags["Gate"]);
        }else{
            if(this.creep.attack(enemy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(enemy);
        }
    }
}

export class AdeptBehavior extends RoleBehavior {
    private findNewTarget(){
        var site : Structure | ConstructionSite | null;

        site = <Structure | null > this.creep.room.find(FIND_STRUCTURES,{filter: (structure) => {
            return (
                ((((<Structure>structure).structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < 75000) ||
                ((<Structure>structure).structureType != STRUCTURE_WALL && structure.hits < structure.hitsMax * 0.9)) &&
                this.room.Creeps.Creeps.filter(c => c.memory.Target == structure.id).length == 0
            );
        }}).sort((a,b) => (a.hitsMax / a.hits) - (b.hitsMax / b.hits) ).pop();

        this.creep.memory.Stage = STAGE.REPAIRING;
        
        if(site == null){
            site = this.creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES);
            this.creep.memory.Stage = STAGE.BUILDING;
        }

        if(site == null){
            this.creep.memory.Stage = STAGE.IDLE; 
        }else{
            this.target = site;
            this.creep.memory.Target = this.target.id;
        }
    }

    private refill(){
        var container : Resource | Structure | null = <Resource | null> this.creep.room.find(FIND_DROPPED_RESOURCES).filter(r => r.resourceType == RESOURCE_ENERGY).pop();
        if(container != null){
            this.creep.memory.Stage = STAGE.GATHERING;
        }
        
        if(container == null){
            container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => structure.structureType == STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0 });
            this.creep.memory.Stage = STAGE.FETCHING;
        }

        if(container == null){
            this.creep.memory.Stage = STAGE.IDLE; 
        }else{
            this.target = container;
            this.creep.memory.Target = this.target.id;
        }
    }

    public Execute(){
        if(this.creep.memory.Stage == STAGE.FETCHING && this.creep.carry.energy == this.creep.carryCapacity || 
            this.creep.memory.Stage == STAGE.IDLE && this.creep.carry.energy != 0 || this.target == null || (this.target instanceof Structure && (<Structure>this.target).hits == (<Structure>this.target).hitsMax)) { 
            this.findNewTarget();
        }

        if(this.creep.memory.Stage != STAGE.FETCHING && this.creep.carry.energy == 0 || STAGE.IDLE) {
            this.refill();
        }

        if(this.target != null){
            switch(this.creep.memory.Stage){
                case STAGE.IDLE:
                    this.creep.moveTo(Game.flags["Idle"]);
                break;
                case STAGE.FETCHING:
                    var harvestResult = this.creep.withdraw(<Structure>this.target,RESOURCE_ENERGY);
                    switch(harvestResult){
                        case ERR_NOT_IN_RANGE:
                            this.creep.moveTo(this.target);
                        break;
                        case OK:
                            this.findNewTarget();
                        break;
                    }
                    case STAGE.BUILDING:
                        var buildResult = this.creep.build(<ConstructionSite>this.target);
                        switch(buildResult){
                            case ERR_NOT_IN_RANGE:
                                this.creep.moveTo(this.target);
                                break; 
                            case ERR_NOT_ENOUGH_RESOURCES:
                            case ERR_NOT_ENOUGH_ENERGY:
                                this.refill();
                                break;
                            case ERR_INVALID_TARGET:
                                this.findNewTarget();
                                break;
                        }
                        break;
                    case STAGE.REPAIRING:
                        var repairResult = this.creep.repair(<Structure>this.target);
                        switch(repairResult){
                            case ERR_NOT_IN_RANGE:
                                this.creep.moveTo(this.target);
                                break; 
                            case ERR_INVALID_TARGET:
                                this.findNewTarget();
                                break;
                            case ERR_NOT_ENOUGH_RESOURCES:
                            case ERR_NOT_ENOUGH_ENERGY:
                                this.refill();
                                break;
                        }
                    break;
                    
                    case STAGE.GATHERING:
                        var gatherResult = this.creep.pickup(<Resource>this.target);
                        switch(gatherResult){
                            case ERR_NOT_IN_RANGE:
                                this.creep.moveTo(this.target);
                                break; 
                            case ERR_INVALID_TARGET:
                                this.findNewTarget();
                                break;
                        }
                    break;
            }
        }

    }
}

export class ProbeBehavior extends RoleBehavior {

    private findSource(){
        var sources = this.room.Room.find(FIND_SOURCES);
        var maxProbesAtSource = this.room.Room.memory.RoleMemberships[ROLE.PROBE].Amount / sources.length;
     

        var availableSource = _(sources).filter(source => this.room.Creeps.Creeps.filter(c => c.memory.Target == source.id).length < maxProbesAtSource).sample();
        if(availableSource != null){
            this.target = availableSource;
            this.creep.memory.Target = this.target.id;
            this.creep.memory.Stage = STAGE.WORKING;
        }else{
            this.creep.memory.Stage = STAGE.IDLE;
        }
    }

    private findTarget(){
        var container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => {
            return (
                (structure.structureType == STRUCTURE_SPAWN && (<StructureSpawn>structure).energy < (<StructureSpawn>structure).energyCapacity) || 
                (structure.structureType == STRUCTURE_EXTENSION && (<StructureExtension>structure).energy < (<StructureExtension>structure).energyCapacity)
            );
        }});
        
        if(container == null)
            container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => {
                return (
                    (structure.structureType == STRUCTURE_CONTAINER && (<StructureContainer>structure).store[RESOURCE_ENERGY] < (<StructureContainer>structure).storeCapacity)
                );
            }});

        if(container == null){
            this.creep.memory.Stage = STAGE.IDLE;
        }else{
            this.target = container;
            this.creep.memory.Target = container.id;
            this.creep.memory.Stage = STAGE.EMPTYING;
        }
    }

    public Execute() {
        if(this.creep.memory.Stage == STAGE.WORKING && this.creep.carry.energy == this.creep.carryCapacity || 
            this.creep.memory.Stage == STAGE.IDLE && this.creep.carry.energy != 0) { 
                this.findTarget();
        }

        if(this.creep.memory.Stage != STAGE.WORKING && this.creep.carry.energy == 0) {
            this.findSource();
        }
        
        if(this.target != null){
            switch(this.creep.memory.Stage){
                case STAGE.IDLE:
                    this.creep.moveTo(Game.flags["Idle"]);
                break;
                case STAGE.WORKING:
                    if(this.target instanceof Source){
                        var harvestResult = this.creep.harvest(this.target);
                        switch(harvestResult){
                            case ERR_NOT_IN_RANGE:
                                this.creep.moveTo(this.target);
                                break;
                        }
                    }
                case STAGE.EMPTYING:
                    var transferResult = this.creep.transfer(<Structure>this.target,RESOURCE_ENERGY);
                    switch(transferResult){
                        case ERR_NOT_IN_RANGE:
                            this.creep.moveTo(this.target);
                            break; 
                        case ERR_FULL:
                            this.findTarget();
                            break;
                    }
                break;
            }
        }
    }
} 
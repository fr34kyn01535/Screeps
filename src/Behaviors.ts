import RoomManager from "./RoomManager"
import {ICreep,STAGE,ROLE} from "./Creep"
import * as _ from "lodash"

export abstract  class RoleBehavior {
    protected room : RoomManager;
    protected creep : ICreep;
    protected target : Structure | Tombstone | ConstructionSite | Source | Resource | null = null;

    constructor(room: RoomManager, creep : Creep){
        this.room = room;
        this.creep = <ICreep>creep;
        if(this.creep.memory.Target != null){
            this.target = Game.getObjectById(this.creep.memory.Target);
        }

    }
    abstract Execute() : void;

    
    protected refill(){
        var container : Resource | Structure | Tombstone | null = <Resource | null> this.creep.room.find(FIND_DROPPED_RESOURCES).filter(r => r.resourceType == RESOURCE_ENERGY).pop();
        if(container != null){
            this.creep.memory.Stage = STAGE.GATHERING;
        } else{
            container = <Tombstone | null> this.creep.room.find(FIND_TOMBSTONES).pop();
            if(container != null){
                this.creep.memory.Stage = STAGE.GATHERING;
            }else{
                container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && structure.store[RESOURCE_ENERGY] > 0 });
            
                if(container != null){
                    this.creep.memory.Stage = STAGE.FETCHING;
                }
            }
        }
        
       
        if(container == null){
            this.creep.memory.Stage = STAGE.IDLE; 
        }else{
            this.target = container;
            this.creep.memory.Target = this.target.id;
        }

    }
}

export class AcolyteBehavior extends RoleBehavior {

    private findController(){
        this.creep.memory.Stage = STAGE.EMPTYING;
        this.target = (<StructureController>this.room.Room.controller);
        this.creep.memory.Target = this.target.id;
    }

    public Execute(){
        if(this.creep.memory.Stage == STAGE.FETCHING && this.creep.carry.energy == this.creep.carryCapacity || 
            this.creep.memory.Stage == STAGE.IDLE && this.creep.carry.energy != 0) { 
            this.findController();
        }

        if(this.creep.memory.Stage != STAGE.FETCHING && this.creep.carry.energy == 0 || STAGE.IDLE) {
            this.refill();
        }
        console.log(this.creep.memory.Stage);

        if(this.target != null){
            console.log(STAGE[this.creep.memory.Stage]);
            switch(this.creep.memory.Stage){
                case STAGE.IDLE:
                    this.creep.moveTo(Game.flags["Idle"],{visualizePathStyle: {stroke: '#ffffff'}});
                break;
                case STAGE.FETCHING:
                    var harvestResult = this.creep.withdraw(<Structure>this.target,RESOURCE_ENERGY);
                    switch(harvestResult){
                        case ERR_NOT_IN_RANGE:
                            this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                            break;
                        case ERR_NOT_ENOUGH_RESOURCES:
                            this.refill();
                            break;
                        case OK:
                            if(this.creep.carry.energy == this.creep.carry.energy)
                                this.findController();
                            break;
                    }
                case STAGE.EMPTYING:
                    var transferResult = this.creep.transfer(<Structure>this.target,RESOURCE_ENERGY);
                    switch(transferResult){
                        case ERR_NOT_IN_RANGE:
                            this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                            break; 
                    }
                break;
            }
        }

    }
} 
 
export class SentryBehavior extends RoleBehavior{
    private findTower(){
        var site : Structure | ConstructionSite | null;

        site = <Structure | null > this.creep.room.find(FIND_STRUCTURES,{filter: (structure) => {
            return (
                (structure.structureType == STRUCTURE_TOWER  && structure.energy < structure.energyCapacity)
            ); 
        }}).sort((a,b) => (a.hitsMax / a.hits) - (b.hitsMax / b.hits) ).pop();

        this.creep.memory.Stage = STAGE.FILLING; 
        
        if(site == null){
            this.creep.memory.Stage = STAGE.IDLE; 
        }else{
            this.target = site;
            this.creep.memory.Target = this.target.id;
        }
    }


    public Execute(){
        if(this.creep.memory.Stage == STAGE.FETCHING && this.creep.carry.energy == this.creep.carryCapacity || 
            this.creep.memory.Stage == STAGE.IDLE && this.creep.carry.energy != 0 || this.target == null || (this.target instanceof Structure && (<Structure>this.target).hits == (<Structure>this.target).hitsMax)) { 
            this.findTower();
        }

        if(this.creep.memory.Stage != STAGE.FETCHING && this.creep.carry.energy == 0 || STAGE.IDLE) {
            this.refill();
        }

        if(this.target != null){
            switch(this.creep.memory.Stage){
                case STAGE.IDLE:
                    this.creep.moveTo(Game.flags["Idle"],{visualizePathStyle: {stroke: '#ffffff'}});
                break;
                case STAGE.FETCHING:
                    var harvestResult = this.creep.withdraw(<Structure>this.target,RESOURCE_ENERGY);
                    switch(harvestResult){
                        case ERR_NOT_IN_RANGE:
                            this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                        break;
                        case OK:
                            this.findTower();
                        break;
                    }
                    case STAGE.FILLING:
                        var repairResult = this.creep.transfer(<Structure>this.target,RESOURCE_ENERGY);
                        switch(repairResult){
                            case ERR_NOT_IN_RANGE:
                                this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                                break; 
                            case ERR_INVALID_TARGET:
                                this.findTower();
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
                                this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                                break; 
                            case ERR_INVALID_TARGET:
                                this.findTower();
                            break;
                        }
                    break;
            }
        }

    }
}
 
export class StalkerBehavior extends RoleBehavior{
    public Execute(){
        var enemy = this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS)
        if(enemy == null){
            this.creep.moveTo(Game.flags["Gate"],{visualizePathStyle: {stroke: 'blue'}});
        }else{
            if(this.creep.rangedAttack(enemy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(enemy,{visualizePathStyle: {stroke: 'blue'}});
        }
    }
}

export class OracleBehavior extends RoleBehavior{
    public Execute(){
        var creep = this.creep.pos.findClosestByRange(FIND_MY_CREEPS,{filter: c => (c.hits < c.hitsMax)})
        if(creep == null){
            this.creep.moveTo(Game.flags["Gate"],{visualizePathStyle: {stroke: 'green'}});
        }else{
            if((this.room.InDanger ? this.creep.rangedHeal(creep) : this.creep.heal(creep)) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(creep,{visualizePathStyle: {stroke: 'green'}});
        }
    }
}


export class BerserkBehavior extends RoleBehavior{
    public Execute(){
        var enemy = this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS)
        if(enemy == null){
            this.creep.moveTo(Game.flags["Gate"],{visualizePathStyle: {stroke: 'red'}});
        }else{
            if(this.creep.attack(enemy) == ERR_NOT_IN_RANGE)
                this.creep.moveTo(enemy,{visualizePathStyle: {stroke: 'red'}});
        }
    }
}

export class AdeptBehavior extends RoleBehavior {
    private findTarget(){
        var site : Structure | ConstructionSite | null;
        
        site = <Structure | null > this.creep.room.find(FIND_STRUCTURES,{filter: (structure) => {
            return (
                (((structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < 100000) ||
                (structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART && structure.hits < structure.hitsMax * 0.9)) &&
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

    public Execute(){
        if(this.creep.memory.Stage == STAGE.FETCHING && this.creep.carry.energy == this.creep.carryCapacity || 
            this.creep.memory.Stage == STAGE.IDLE && this.creep.carry.energy != 0 || this.target == null || (this.target instanceof Structure && (<Structure>this.target).hits == (<Structure>this.target).hitsMax)) { 
            this.findTarget();
        }

        if(this.creep.memory.Stage != STAGE.FETCHING && this.creep.carry.energy == 0 || STAGE.IDLE) {
            this.refill();
        }

        if(this.target != null){
            switch(this.creep.memory.Stage){
                case STAGE.IDLE:
                    this.creep.moveTo(Game.flags["Idle"],{visualizePathStyle: {stroke: '#ffffff'}});
                break;
                case STAGE.FETCHING:
                    var harvestResult = this.creep.withdraw(<Structure>this.target,RESOURCE_ENERGY);
                    switch(harvestResult){
                        case ERR_NOT_IN_RANGE:
                            this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                        break;
                        case OK:
                            this.findTarget();
                        break;
                    }
                    case STAGE.BUILDING:
                        var buildResult = this.creep.build(<ConstructionSite>this.target);
                        switch(buildResult){
                            case ERR_NOT_IN_RANGE:
                                this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                                break; 
                            case ERR_NOT_ENOUGH_RESOURCES:
                            case ERR_NOT_ENOUGH_ENERGY:
                                this.refill();
                                break;
                            case ERR_INVALID_TARGET:
                                this.findTarget();
                                break;
                        }
                        break; 
                    case STAGE.REPAIRING:
                        var repairResult = this.creep.repair(<Structure>this.target);
                        switch(repairResult){
                            case ERR_NOT_IN_RANGE:
                                this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                                break; 
                            case ERR_INVALID_TARGET:
                                this.findTarget();
                                break;
                            case ERR_NOT_ENOUGH_RESOURCES:
                            case ERR_NOT_ENOUGH_ENERGY:
                                this.refill();
                                break;
                            default: this.creep.say(repairResult.toString());
                        }
                    break;
                    
                    case STAGE.GATHERING:
                        var gatherResult = this.creep.pickup(<Resource>this.target);
                        switch(gatherResult){
                            case ERR_NOT_IN_RANGE:
                                this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                                break; 
                            case ERR_INVALID_TARGET:
                            case ERR_FULL:
                                this.findTarget();
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
        var availableSource : undefined | Source;
        if(this.creep.memory.Role == ROLE.PROBE){
        var maxProbesAtSource = (this.room.Room.memory.RoleMemberships[ROLE.PROBE].Amount / sources.length);
            availableSource = _(sources).filter(source => this.room.Creeps.Creeps.filter(c => c.memory.Target == source.id && c.memory.Role == ROLE.PROBE).length < maxProbesAtSource).sample();
        }else{
            availableSource = _(sources).sample();
        } 

        if(availableSource != null){
            this.target = availableSource;
            this.creep.memory.Target = this.target.id;
            this.creep.memory.Stage = STAGE.WORKING;
        }else{
            this.creep.memory.Stage = STAGE.IDLE;
        }
    }

    private findEnergyContainer(){
        var container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => {
            return (
                (structure.structureType == STRUCTURE_SPAWN && (<StructureSpawn>structure).energy < (<StructureSpawn>structure).energyCapacity) || 
                (structure.structureType == STRUCTURE_EXTENSION && (<StructureExtension>structure).energy < (<StructureExtension>structure).energyCapacity)
            );
        }});
        
        if(container == null)
            container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => {
                return (
                    ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && (<StructureContainer | StructureStorage>structure).store[RESOURCE_ENERGY] < (<StructureContainer | StructureStorage>structure).storeCapacity)
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
                this.findEnergyContainer();
        }

        if(this.creep.memory.Stage != STAGE.WORKING && this.creep.carry.energy == 0) {
            this.findSource();
        }
        
        if(this.target != null){
            switch(this.creep.memory.Stage){
                case STAGE.IDLE:
                    this.creep.moveTo(Game.flags["Idle"],{visualizePathStyle: {stroke: '#ffffff'}});
                break;
                case STAGE.WORKING:
                    if(this.target instanceof Source){
                        var harvestResult = this.creep.harvest(this.target);
                        switch(harvestResult){
                            case ERR_NOT_IN_RANGE:
                                this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                                break;
                        }
                    }
                case STAGE.EMPTYING:
                    var transferResult = this.creep.transfer(<Structure>this.target,RESOURCE_ENERGY);
                    switch(transferResult){
                        case ERR_NOT_IN_RANGE:
                            this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                            break; 
                        case ERR_FULL:
                            this.findEnergyContainer();
                            break;
                    }
                break;
            }
        }
    }
} 
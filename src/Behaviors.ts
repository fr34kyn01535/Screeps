import RoomManager from "./RoomManager"
import {ICreep,STAGE,ROLE} from "./Creep"
import * as _ from "lodash"

export abstract class RoleBehavior {
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
    abstract Execute() : boolean | void ;


    protected idle(){
        if(this.room.IdleFlag != null)
            this.creep.moveTo(this.room.IdleFlag);
    }
    
    protected refill(){
        var container : Resource | Structure | Tombstone | null = <Resource | null> this.creep.room.find(FIND_DROPPED_RESOURCES).filter(r => r.resourceType == RESOURCE_ENERGY).pop();
        if(container != null){
            this.creep.memory.Stage = STAGE.GATHERING;
        } else{
            container = <Tombstone | null> this.creep.room.find(FIND_TOMBSTONES).filter(t => t.store[RESOURCE_ENERGY] > 0).pop();
            if(container != null){
                this.creep.memory.Stage = STAGE.GATHERING;
            }else{
                container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && structure.store[RESOURCE_ENERGY] > 0 });
            
                if(container == null && this.room.Room.find(FIND_STRUCTURES,{filter:f => f.structureType == STRUCTURE_CONTAINER || f.structureType == STRUCTURE_STORAGE}).length == 0){
                    container = this.room.Spawns[0];
                }

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
        if(this.creep.carry.energy == 0) {
            this.refill();
        }
        else if(this.creep.memory.Stage == STAGE.IDLE && this.creep.carry.energy != 0) {
            this.findController();
        }

        if(this.target != null){
            switch(this.creep.memory.Stage){
                case STAGE.IDLE:
                    this.idle();
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
        
     /*   if(site == null){
            this.room.Room.find(FIND_HOSTILE_CREEPS, {filter: f => f})
        }
*/
        if(site == null){
            this.creep.memory.Stage = STAGE.IDLE; 
        }else{
            this.target = site;
            this.creep.memory.Target = this.target.id;
        }
    }


    public Execute() : boolean | void {
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
                    this.idle();
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
 
export abstract class TroopBehavior extends RoleBehavior {
    protected Enemy : Creep | null = null;
    public TroopBehavior(){
        this.Enemy = this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS)
    }
    public Execute() : boolean | void{
        var target = Game.flags["Target"];
        if(target != null && target.room != null && target.room.name != this.creep.room.name){
            this.creep.moveTo(Game.flags["Target"]);
            return true;
        }
        if(this.Enemy == null){
            this.creep.moveTo(Game.flags["Target"]);
            return true;
        }
        return false;
    }
}

export class StalkerBehavior extends TroopBehavior{
    public Execute(){
        if(super.Execute()) return;
        if(this.Enemy != null && this.creep.rangedAttack(this.Enemy) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.Enemy,{visualizePathStyle: {stroke: 'blue'}});
        
    }
}

export class BerserkBehavior extends TroopBehavior{
    public Execute(){
        if(super.Execute()) return;
        if(this.Enemy != null && this.creep.rangedAttack(this.Enemy) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(this.Enemy,{visualizePathStyle: {stroke: 'red'}});
        
    }
}
export class OracleBehavior extends TroopBehavior{
    public Execute(){
        if(super.Execute()) return;
        
        var creep = this.creep.pos.findClosestByRange(FIND_MY_CREEPS,{filter: c => (c.hits < c.hitsMax)})
        if(creep != null && (this.room.InDanger ? this.creep.rangedHeal(creep) : this.creep.heal(creep)) == ERR_NOT_IN_RANGE)
            this.creep.moveTo(creep,{visualizePathStyle: {stroke: 'green'}});
    }
}


export class ArchonBehavior extends RoleBehavior{
    public Execute(){
        this.creep.moveTo(Game.flags["Settle"],{visualizePathStyle: {stroke: 'orange'}});
        if(Game.flags["Settle"].pos.isNearTo(this.creep.pos))
            this.creep.say(this.creep.claimController(<StructureController>this.room.Room.controller).toString());
    }
}

export class AdeptBehavior extends RoleBehavior {
    private findTarget(){
        var site : Structure | ConstructionSite | null;
        
        site = <Structure | null > this.creep.room.find(FIND_STRUCTURES,{filter: (structure) => {
            return (
                (((structure.structureType == STRUCTURE_WALL || structure.structureType == STRUCTURE_RAMPART) && structure.hits < 250000) ||
                (structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_RAMPART && structure.hits < structure.hitsMax * 0.9)) &&
                this.room.Creeps.filter(c => c.memory.Target == structure.id).length == 0
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
        if(this.creep.carry.energy == 0){
            this.refill();
        }
        else if(this.target == null || (this.target instanceof Structure && (<Structure>this.target).hits == (<Structure>this.target).hitsMax)) { 
            this.findTarget();
        }
        if(this.target != null){
            switch(this.creep.memory.Stage){
                case STAGE.IDLE:
                    this.idle();
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
    private resource : ResourceConstant = RESOURCE_ENERGY;

    public ProbeBehavior(resource : ResourceConstant = RESOURCE_ENERGY){
        this.resource = resource;
    }

    private findSource(){
        var availableSource : undefined | Source | StructureExtractor;
        if(this.resource == RESOURCE_ENERGY){
            var sources = this.room.Room.find(FIND_SOURCES);
            if(this.creep.memory.Role == ROLE.PROBE){
                var maxProbesAtSource = (this.room.Room.memory.RoleMemberships[ROLE.PROBE].Amount / sources.length);
                availableSource = _(sources).filter(source => this.room.Creeps.filter(c => c.memory.Target == source.id && c.memory.Role == ROLE.PROBE).length < maxProbesAtSource).sample();
            }else{
                availableSource = _(sources).sample();
            } 
        }else{
            availableSource = <StructureExtractor | undefined>this.room.Room.find(FIND_STRUCTURES,{filter: f => f.structureType == STRUCTURE_EXTRACTOR}).pop();
        }

        if(availableSource != null){
            this.target = availableSource;
            this.creep.memory.Target = this.target.id;
            this.creep.memory.Stage = STAGE.WORKING;
        }else{
            this.creep.memory.Stage = STAGE.IDLE;
        }
    }

    private findContainer(){
        var container = null;
        if(this.resource = RESOURCE_ENERGY){
            container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => {
                return (
                    this.creep.room.name == structure.room.name &&
                    (structure.structureType == STRUCTURE_SPAWN && (<StructureSpawn>structure).energy < (<StructureSpawn>structure).energyCapacity) || 
                    (structure.structureType == STRUCTURE_EXTENSION && (<StructureExtension>structure).energy < (<StructureExtension>structure).energyCapacity)
                );
            }});
        }

        if(container == null)
            container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => {
                return (
                    ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && this.creep.room.name == structure.room.name && <number>(<StructureContainer | StructureStorage>structure).store[this.resource] < (<StructureContainer | StructureStorage>structure).storeCapacity)
                );
            }});

        if(container == null)
            container = this.creep.pos.findClosestByPath(FIND_STRUCTURES,{filter: (structure) => {
                return (
                    ((structure.structureType == STRUCTURE_TERMINAL) && this.creep.room.name == structure.room.name && <number>(<StructureTerminal>structure).store[this.resource] < (<StructureTerminal>structure).storeCapacity)
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
        if(this.creep.memory.Stage == STAGE.WORKING && this.creep.carry[this.resource] == this.creep.carryCapacity || 
            this.creep.memory.Stage == STAGE.IDLE && this.creep.carry[this.resource] != 0) { 
                this.findContainer();
        }

        if(this.creep.memory.Stage != STAGE.WORKING && this.creep.carry[this.resource] == 0) {
            this.findSource();
        }
        
        if(this.target != null){
            switch(this.creep.memory.Stage){
                case STAGE.IDLE:
                    this.idle();
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
                    var transferResult = this.creep.transfer(<Structure>this.target,this.resource);
                    switch(transferResult){
                        case ERR_NOT_IN_RANGE:
                            this.creep.moveTo(this.target,{visualizePathStyle: {stroke: '#ffffff'}});
                            break; 
                        case ERR_FULL:
                            this.findContainer();
                            break;
                    }
                break;
            }
        }
    }
} 
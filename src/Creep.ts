import RoomManager from "./RoomManager";
import * as _ from "lodash"

export enum ROLE{
    PROBE = 0,
    ACOLYTE = 1
}

export enum STAGE{
    IDLE = 0,
    WORKING = 1,
    EMPTYING = 2,
    UPGRADING = 3
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
    protected target : Structure | null = null;

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
    public Execute(){
        if(this.creep.memory.Stage == STAGE.WORKING && this.creep.carry.energy == this.creep.carryCapacity || 
            this.creep.memory.Stage == STAGE.IDLE && this.creep.carry.energy != 0) { 
            this.creep.memory.Target = (<StructureController>this.room.Room.controller).id;
            this.creep.memory.Stage = STAGE.EMPTYING;
        }

        if(this.creep.memory.Stage != STAGE.WORKING && this.creep.carry.energy == 0 || STAGE.IDLE) {
            this.target = this.room.Spawn.Spawn;
            this.creep.memory.Target = this.target.id;
            this.creep.memory.Stage = STAGE.WORKING;
        }

        if(this.target != null){
            switch(this.creep.memory.Stage){
                case STAGE.WORKING:
                    if(this.target){
                        var harvestResult = this.creep.withdraw(this.target,RESOURCE_ENERGY);
                        switch(harvestResult){
                            case ERR_NOT_IN_RANGE:
                                this.creep.moveTo(this.target);
                                break;
                        }
                    }
                case STAGE.EMPTYING:
                    var transferResult = this.creep.transfer(this.target,RESOURCE_ENERGY);
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


export class ProbeBehavior extends RoleBehavior {

    public Execute() {
        if(this.creep.memory.Stage == STAGE.WORKING && this.creep.carry.energy == this.creep.carryCapacity || 
            this.creep.memory.Stage == STAGE.IDLE && this.creep.carry.energy != 0) { 
            this.creep.memory.Target = this.room.Spawn.Spawn.id;
            this.creep.memory.Stage = STAGE.EMPTYING;
        }

        if(this.creep.memory.Stage != STAGE.WORKING && this.creep.carry.energy == 0) {
            var availableSource = _(this.room.Room.find(FIND_SOURCES)).find(source => {
                return this.room.Creeps.Creeps.filter(c => c.memory.Target == source.id).length < 2
            });
            if(availableSource != null){
                this.creep.memory.Target = availableSource.id;
                this.creep.memory.Stage = STAGE.WORKING;
            }else{
                this.creep.memory.Stage = STAGE.IDLE;
            }
        }


        if(this.target != null){
            switch(this.creep.memory.Stage){
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
                    var transferResult = this.creep.transfer(this.target,RESOURCE_ENERGY);
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
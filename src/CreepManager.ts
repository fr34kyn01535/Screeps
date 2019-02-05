import { IRoom } from "./Room"
import { ProbeBehavior, ROLE, ICreepMemory, ICreep, AcolyteBehavior, AdeptBehavior, BerserkBehavior } from "./Creep"
import RoomManager from "./RoomManager";

import * as _ from "lodash"

export default class CreepManager{
    public Creeps : Array<ICreep> 
    private room: RoomManager

    constructor(room: RoomManager){
        this.room = room;
        this.Creeps = <Array<ICreep>> _(Game.creeps).filter((creep) => creep.room.name ==  room.Room.name).value();
    }
    public Run(){
        this.Creeps.forEach(creep => {
            switch((<ICreepMemory>creep.memory).Role){
                case ROLE.PROBE: return new ProbeBehavior(this.room, creep).Execute();
                case ROLE.ACOLYTE: return new AcolyteBehavior(this.room, creep).Execute();
                case ROLE.ADEPT: return new AdeptBehavior(this.room, creep).Execute();
                case ROLE.BERSERK: return new BerserkBehavior(this.room, creep).Execute();
            } 
        })
    }
} 
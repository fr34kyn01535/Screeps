import { IRoom } from "./Room"
import { ProbeBehavior, ROLE, ICreepMemory, ICreep, AcolyteBehavior } from "./Creep"
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
                case ROLE.PROBE:
                    var behavior = new ProbeBehavior(this.room, creep);
                    behavior.Execute();
                break;
                case ROLE.ACOLYTE:
                    var behavior = new AcolyteBehavior(this.room, creep);
                    behavior.Execute();
                break;
            } 
        })
    }
} 
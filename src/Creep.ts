import RoomManager from "./RoomManager";
import * as _ from "lodash"

export enum ROLE{
    PROBE = 0,
    ACOLYTE = 1,
    ADEPT = 2,
    BERSERK = 3,
    STALKER = 4,
    SENTRY = 5,
    ORACLE = 6,
    EPROBE = 7,
    ARCHON = 8
}

export enum STAGE{
    IDLE = 0,
    WORKING = 1,
    EMPTYING = 2,
    UPGRADING = 3,
    FETCHING = 4,
    BUILDING = 5,
    REPAIRING = 6,
    GATHERING = 7,
    FILLING = 8
}

export interface ICreep extends Creep{
    memory : ICreepMemory 
}

export interface ICreepMemory extends CreepMemory {
    Role : ROLE
    Stage: STAGE
    Room : string
    Target : string | null
}

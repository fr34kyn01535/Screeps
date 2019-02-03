import SpawnManager from "./SpawnManager";
import CreepManager from "./CreepManager";
import {IRoom} from "./Room";
import {ROLE} from "./Creep";

export default class RoomManager {
    public Room: IRoom;
    public Spawn: SpawnManager; 
    public Creeps: CreepManager; 
    constructor(room: Room, spawn:StructureSpawn){
        this.Room = <IRoom>room;

        this.Room.memory.RoleMemberships = [];
        this.Room.memory.RoleMemberships[ROLE.ACOLYTE] = 8;
        this.Room.memory.RoleMemberships[ROLE.PROBE] = 4;

        this.Spawn = new SpawnManager(this,spawn); 
        this.Creeps = new CreepManager(this); 
    }
    public Run(){
        this.Spawn.Run();
        this.Creeps.Run();
    }
} 
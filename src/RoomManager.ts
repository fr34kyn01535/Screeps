import SpawnManager from "./SpawnManager";
import CreepManager from "./CreepManager";
import {IRoom, RoleMembership} from "./Room";
import {ROLE} from "./Creep";

export default class RoomManager {
    public Room: IRoom; 
    public Spawn: SpawnManager; 
    public Creeps: CreepManager; 
    constructor(room: Room, spawn:StructureSpawn){
        this.Room = <IRoom>room;

        this.Room.memory.RoleMemberships = [];
        this.Room.memory.RoleMemberships[ROLE.PROBE] = new RoleMembership(1,10);
        this.Room.memory.RoleMemberships[ROLE.ACOLYTE] = new RoleMembership(99,2);
        this.Room.memory.RoleMemberships[ROLE.ADEPT] = new RoleMembership(99,6);

        this.Spawn = new SpawnManager(this,spawn); 
        this.Creeps = new CreepManager(this); 
    }
    public Run(){
        this.Spawn.Run();
        this.Creeps.Run();
    }
} 
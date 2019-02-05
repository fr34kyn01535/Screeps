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
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.PROBE,1,6));
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.ACOLYTE,85,10)); 
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.ADEPT,80,5));
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.BERSERK,90,7)); 
 
        this.Spawn = new SpawnManager(this,spawn); 
        this.Creeps = new CreepManager(this); 
    }
    public Run(){
        this.Spawn.Run();
        this.Creeps.Run();
    }
} 
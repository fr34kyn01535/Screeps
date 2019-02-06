import SpawnManager from "./SpawnManager";
import CreepManager from "./CreepManager";
import {IRoom, RoleMembership} from "./Room";
import {ROLE} from "./Creep";
 
export default class RoomManager {
    public Room: IRoom;  
    public Spawn: SpawnManager; 
    public Creeps: CreepManager;  
    public InDanger: boolean = false;
    constructor(room: Room, spawn:StructureSpawn){
        this.Room = <IRoom>room;
        this.Room.memory.RoleMemberships = [];
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.PROBE,1,2));
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.ACOLYTE,85,2)); 
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.ADEPT,20,4));
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.BERSERK,50,4)); 
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.STALKER,50,4)); 
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.ORACLE,49,2)); 
        this.Room.memory.RoleMemberships.push(new RoleMembership(ROLE.SENTRY,33,1)); 
 
        this.Spawn = new SpawnManager(this,spawn);  
        this.Creeps = new CreepManager(this); 

        this.runRoomDefense();
    }

    private runRoomDefense(){
        var tower = <StructureTower[]>this.Room.find(FIND_STRUCTURES,{filter: s => s.structureType == STRUCTURE_TOWER});
        var enemy = this.Room.find(FIND_HOSTILE_CREEPS).pop();
        if(enemy != null){
            this.InDanger = true;
            tower.forEach(t => t.attack(<Creep>enemy));
        }
    }

    public Run(){
        this.Spawn.Run();
        this.Creeps.Run();
    }
} 
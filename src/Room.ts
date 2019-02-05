
import {ROLE} from "./Creep"

export class RoleMembership{
    constructor(role:ROLE, priority: number, amount:number){
        this.Role = role;
        this.Priority = priority;
        this.Amount = amount;
    } 
    public Priority:number;
    public Amount:number;
    public Role:ROLE;
}

export interface IRoomMemory extends RoomMemory {
    RoleMemberships: RoleMembership[];
}
 
export interface IRoom extends Room{
    memory : IRoomMemory 
}
 
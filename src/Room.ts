
export class RoleMembership{
    constructor(priority: number, amount:number){
        this.Priority = priority;
        this.Amount = amount;
    }
    public Priority:number
    public Amount:number
}

export interface IRoomMemory extends RoomMemory {
    RoleMemberships: Array<RoleMembership>;
}
 
export interface IRoom extends Room{
    memory : IRoomMemory 
}
 
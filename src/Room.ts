

export interface IRoomMemory extends RoomMemory {
    RoleMemberships: Array<number>;
}

export interface IRoom extends Room{
    memory : IRoomMemory 
}
 
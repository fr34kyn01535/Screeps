import RoomManager from "./RoomManager";
import * as _ from "lodash"
import { ROLE } from "./Creep";
import { IRoomMemory } from "./Room";
import Visualizer from "./Visualizer";

for(var i in Memory.creeps) {
    if(!Game.creeps[i]) {
        delete Memory.creeps[i]; 
    }
}

_(Game.creeps).map(c => c.room).concat(_(Game.spawns).map(c => c.room).value()).union().value().forEach((room) => {
    new RoomManager(room).Run();
});

(<any>global).ROLE = ROLE;
(<any>global).spawn = function(room:string,role :ROLE,amount:number | undefined){
    var response = null;
    (<IRoomMemory>Game.rooms[room].memory).RoleMemberships.some((value, i, list)=>{
        if(value.Role == role) {
            if(amount == null)
                response = list[i].Amount;
            else
                list[i].Amount = amount;
            return true;
        }
        return false;
    });
    return response;
};

Visualizer.visuals();
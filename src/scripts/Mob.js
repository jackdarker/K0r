"use strict";

class Mob extends Character {
    constructor(){
        super();
        this.level_min = 1;     
        this.baseXPReward=0;
        this.loot =[];   //[{id:'healthpotion',chance:5, amount:1}]
        this.levelUp(1);
        this.autoLeveling();
        this.despawn=false;
        this.unique=false; //true if this is a persistent character
        this.baseName=""; //name might be Slime#1 but baseName is Slime
        this.fconv = null; //lazy init because descfixer depends on gm.player
    }
    toJSON(){return window.storage.Generic_toJSON("Mob", this); }
    static fromJSON(value){ 
        var _x = window.storage.Generic_fromJSON(Mob, value.data);
        _x.rebuildAfterLoad();
        return(_x);
    };
    //override to return the next move to execute
    //OK = false if no action, else true
    //msg should contain a message formatted for view (move description )g 
    //this function should decide what actions the mob takes; 
    //query _canAct to check if stunned or otherwise incapaciated
    calcCombatMove(enemys,friends){
        let rnd = _.random(1,100);
        let result = {OK:true,msg:''};
        result.action =result.target= null;
        if(rnd>80 || (rnd>20 && this.Effects.findEffect('effHesitant').length<=0)){  
            rnd = _.random(0,enemys.length-1);
            result.action = "Attack";
            result.target = [enemys[rnd]];
            //result.msg =this.name+" attacks "+ result.target[0].name+".</br>"+result.msg;
        } else {
            if(this.Skills.countItem('Guard')>0){
                result.action = "Guard";
                result.target = [this];
            }
            result.msg =this.name+" takes a defensive stance.</br>"+result.msg;
        }
        return(result);
    }
    //return false if skill should be manually selected
    get isAIenabled(){ return(true);}
    //randomize mob level around target-level but not below min-level: +-20%;
    scaleLevel(lvl){ 
        let x;
        x=Math.round(window.gm.util.randomNormal(lvl,lvl*0.2));
        x = Math.max(this.level_min,x);
        x=x-this.level;   
        if(x>0){
            this.levelUp(x);
            this.autoLeveling();
        }
        //refill gained stats 
        this.Stats.increment("health",99999); this.Stats.increment("energy",99999);this.Stats.increment("will",99999);
    };
    levelUp(add){
        super.levelUp(add);
        this.baseXPReward = this.level*20; //todo baseXP = sum of statpoints + skills ?
    }
}



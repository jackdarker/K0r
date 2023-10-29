"use strict";
//stuff for Nightgames
window.gm.build_DngNG=function(){
    function addMob(type,pos){
        //type refers either to a unique char existing in s.chars
        //or is generic mob, then we have to append idcounter and create instance
        let _id=type;
        if(!window.story.state.chars[type]) {
            _id=type+IDGenerator.instance().createID();
            window.story.state.chars[_id]=window.gm.Mobs[type]();
        }
        //state = see window.gm.mobAI
        //timerA & B = ; used for mobAI
        //att = 0=indifferent|1=friendly|-1=unfriendly|-2=hostile;
        //tick = last time updated
        data.tmp.mobs.push({
            id:_id,
            mob:type,pos:pos,path:[pos],state:0,tick:'',att:0,timerA:0,timerB:0});
    }
    const _m=[
        'D1  E1  F1--G1--H1--I1--J1--K1--L1',
        '                                  ',
        'D2--E2  F2--G2--H2--I2--J2  K2--L2',
        '        |       |   |   |   |   | ',
        'D3--E3  F3--G3--H3  I3  J3  K3  L3',
        '            |       |   |    |     ',
        'D4--E4--F4  G4--H4--I4--J4  K4--L4',
        '    |                             ',
        'D5--E5--F5  G5--H5--I5--J5  K5--L5',
        '|       |   |           |         ',
        'D6  E6--F6--G6--H6--I6--J6  K6--L6'];
    function _d(dir){return({dir:dir,exp:0});}
    let _grid =[
    {room:'D2', dirs:[_d('E2')]},
    {room:'E2', dirs:[_d('D2'),_d('F2')]},
    {room:'F2', dirs:[_d('G2'),_d('F3')]},
    {room:'G2', dirs:[_d('F2'),_d('H2')], name:"corridor"},
    {room:'H2', dirs:[_d('G2'),_d('I2'),_d('H3')]},
    {room:'I2', dirs:[_d('I3'),_d('J2'),_d('H2')]},
    {room:'J2', dirs:[_d('I2'),_d('J3')]},
    {room:'K2', dirs:[_d('L2'),_d('K3')]},
    {room:'L2', dirs:[_d('K2'),_d('L3')]},
    {room:'D3', dirs:[_d('E3')]},
    {room:'E3', dirs:[_d('D3'),_d('F3')]},
    {room:'F3', dirs:[_d('G3'),_d('F2')]},
    {room:'G3', dirs:[_d('F3'),_d('H3'),_d('G4')]},
    {room:'H3', dirs:[_d('H2'),_d('G3')]},
    {room:'I3', dirs:[_d('I4'),_d('I2')]},
    {room:'J3', dirs:[_d('J2'),_d('J4')]},
    {room:'K3', dirs:[_d('K2'),_d('K4')]},
    {room:'L3', dirs:[_d('L2')]},
    {room:'D4', dirs:[_d('E4')]                 },
    {room:'E4', dirs:[_d('F4'),_d('D4'),_d('E5')]},
    {room:'F4', dirs:[_d('G4'),_d('E4')]},
    {room:'G4', dirs:[_d('G3'),_d('H4')]},
    {room:'H4', dirs:[_d('G4'),_d('I4')]},
    {room:'I4', dirs:[_d('I3'),_d('H4'),_d('J4')]},
    {room:'J4', dirs:[_d('I4'),_d('J3')]    },      
    {room:'K4', dirs:[_d('L4'),_d('K3')]},
    {room:'L4', dirs:[_d('L3'),_d('K5')]    },
    {room:'D5', dirs:[_d('D6'),_d('E5')]},
    {room:'E5', dirs:[_d('F5'),_d('E4'),_d('D5')]},
    {room:'F5', dirs:[_d('E5'),_d('F6')]},
    {room:'G5', dirs:[_d('G4'),_d('G6'),_d('H5')]},
    {room:'H5', dirs:[_d('G5'),_d('I5')]},
    {room:'I5', dirs:[_d('H5'),_d('J5')]},
    {room:'J5', dirs:[_d('J6')]},
    {room:'K5', dirs:[_d('L5')]},
    {room:'L5', dirs:[_d('K5')]},
    {room:'D6', dirs:[_d('D5')]},
    {room:'E6', dirs:[_d('F6')]},
    {room:'F6', dirs:[_d('E6'),_d('F5'),_d('G6')]},
    {room:'G6', dirs:[_d('G5'),_d('F6'),_d('H6')]}, 
    {room:'H6', dirs:[_d('I6'),_d('G6')]},
    {room:'I6', dirs:[_d('H6'),_d('J6')]},
    {room:'J6', dirs:[_d('J5'),_d('I6')]},
    {room:'K6', dirs:[_d('L6')]},
    {room:'L6', dirs:[_d('K6')]}];
    let s = window.story.state,data,map={grid:new Map(_grid.map((x)=>{return([x.room,x]);})),
        width:14,height:8,legend:''}
    /////// --!!!!
    const version=1;
    ////// -- !!!!                          // <== increment this if you change anything below - it will reinitialize data !
    if(s.DngNG && s.DngNG.version===version){
        data=s.DngNG;
    } else {
        data=s.DngNG,data.version=version;
        data.tmp={tickPass:'', tier:0
            ,powerLevel:0
            ,inCombat:false
            ,hiding:false
        };
        data.tmp.evtLeave = { //events on tile-leave
            A1_B1: [{id:"Trap_Gas",type:'encounter',tick:window.gm.getTime(),state:0,chance:100 }, //todo cannot assign fct here because saveing
                {id:"Box",type:'encounter',tick:window.gm.getTime(),state:0,chance:100 },
                {id:"Fungus",type:'encounter',tick:window.gm.getTime(),state:0,chance:100 }],
            F4_G4: [{id:"Trap_Dehair",type:'encounter',tick:window.gm.getTime(),state:0,chance:100 }],
            I4_H4: null
        }
        data.tmp.evtEnter = { //events on tile-enter
             //F4: {sbot:{tick:window.gm.getTime(),state:0 }}
            //,H4: {gas:{tick:window.gm.getTime(),state:0 }}
        }
        data.tmp.doors = { //doors 2way
            //E4:{E5:{state:0 }},
            //G4:{G3:{state:0 },G5:{state:0 }},
            //H4:{I4:{state:0 }},
            //E5:{F5:{state:0 }},
        }
        data.tmp.evtSpawn = { //respawn evts 
        }
        data.tmp.mobs = [ //wandering mobs pos=current tile, path = walk area, nogo = dont enter here,
            //{id:"Ruff",mob:"Ruff",pos:"G3",path:["G3"],state:0,tick:'',att:0,timerA:0,timerB:0}
            //,{id:"SlimeG2",mob:"slime",pos:"G2",path:["G2"],state:0,hp:15,tick:'',att:0,timerA:0,timerB:0}
            //,{id:"SlimeI2",mob:"slime",pos:"I2",path:["I2"],state:0,hp:15,tick:'',att:-2,timerA:0,timerB:0}
          ];
        addMob("Ruff","G3"),addMob("Slime","I2"),addMob("Slime","G2");
        data.task = {},data.rolledTask=[]; //active task
        data.tasks = { //task list 
        };
    }
    //install function to calculate chance of evtLeave
    window.gm.encounterChance=function(evt){
        let res=100.0,s=window.story.state,dng=window.story.state.DngSY.dng;
        res*=evt.chance/100.0;
        if(evt.id==='Trap_Dehair'){ //Dehair if nude and hair
            //if(window.gm.player.clothLevel()==='naked') {res*=2;}
            if(window.gm.getDeltaTime(window.gm.getTime(),evt.tick)>200) res*=2;
            else res=0;
        }
        return(res);
    }
    //TODO cannot save graph due circular neigbours data.tmp.graph = window.gm.gridToGraph(_grid);  //for pathfinding  let path = window.astar.search(data.tmp.graph,"F2","I2",null,{heuristic:(function(a,b){return(1);})})
    //add some helper funcs
    data.getMobById=function(id){
        for(var i=data.tmp.mobs.length-1;i>=0;i--){
            if(data.tmp.mobs[i].id===id) return(data.tmp.mobs[i]);
        }
        return(null);
    }
    data.addMob=addMob;
    return({map:map,data:data});
};

//build message+actions for NPC around player.
//returns {msg,attitudeToPlayer}
// 
//hostile=attack on sight ; this indicates to trigger combat
window.gm.build_NPCInfo=function(mob,position){
    let att=mob.att, msg,_mob =window.story.state.chars[mob.id]; //only unique mobs are stored here TODO 
    msg = "A "+mob.mob+" is here."; //TODO what is the mob doing? sleeping/hiding/lurking
    if(_mob instanceof Mob) {
        msg = _mob.unique?(mob.id+" is around."):msg;
        //Todo interaction depends on mob (can talk, detects player, is cloaked) and player (crawl toward)
        att=0;  //Todo calc attitude by history/relation and player-state (vulnerable or not)
        msg+= window.gm.printPassageLink("Talk to"+mob.id,"DngNG_"+mob.id+"_Talk");
    } else {
            //Todo how do we know something about mob if its not unique
        if(mob.state===4 || mob.state===3){ 
            att+=(att>-2)?-1:0;
            msg+="You better not get closer."
        }
    }
    mob.att=att;
    return({msg:msg,att:att});
};

//build message about NPC in surrounding tiles(tiles connected to this position)
window.gm.build_NPCProximity=function(position){
    let msg ="", mob,_d=window.story.state[window.story.state.DngSY.dng].tmp;
    let rooms= window.gm.getRoomDirections(position).map((x)=>{return(x.dir);});
    for(var i=_d.mobs.length-1;i>=0;i--){ // go through list of mobs and check if they are in rooms around position
        mob=_d.mobs[i];
        if(mob.state<0) continue;
        if(rooms.indexOf(mob.pos)<0) continue;
        msg+=(mob.state===3)?"Something is approaching from "+mob.pos:"There seems to be someone in "+mob.pos;  //TODO ...is stomping in your direction/ shuffling around/ slushing
        msg+=".<br>"
    }
    
    //translate _to in north/south/above...
    //Was there some noise coming from western direction? You hear something shuffling around east of here | Ruff might be hunting north of here 
    return(msg)
}
class CraftMaterial extends Item {
    constructor(){ super('CraftMaterial');
        this.addTags([window.gm.ItemTags.Material]); this.price=this.basePrice=10;   
        this.style=0;this.lossOnRespawn = false;
    }
    set style(style){ 
        this._style = style; 
        if(style===0) this.id=this.name='Jlorb';
        else if(style===5) this.id=this.name='Shlack';
        else if(style===10) this.id=this.name='Glib';
        else if(style===20) this.id=this.name='Gorb';
        else if(style===30) this.id=this.name='Igent';
        else if(style===40) this.id=this.name='Remk';
        else if(style===50) this.id=this.name='Murk';
        else throw new Error(this.id +' doesnt know '+style);
    }
    get style(){return this._style;}
    get desc(){ 
        let msg ='';
        switch(this._style){
            case 0: 
            case 5: 
            case 10: 
            case 20: 
            case 30: 
            case 40:
            case 50:
                msg ='some strange material';
                break;
            default: throw new Error(this.id +' doesnt know '+style);
        }
        return(msg);
    }
    toJSON(){return window.storage.Generic_toJSON("CraftMaterial", this); };
    static fromJSON(value){ return window.storage.Generic_fromJSON(CraftMaterial, value.data);};
}

class Gun extends Weapon {
    static factory(style){
        let x = new Gun();
        x.style=style;
        return(x);
    }
    constructor(){
        super();
        this.slotUse = ['RHand'];
        this.style=0;
    }
    set style(style){ 
        this._style = style; 
        if(style===0) this.id=this.name='Taser';
        else if(style===100) this.id=this.name='Blaster';
        else if(style===105) this.id=this.name='BlasterMK2';
        else if(style===120) this.id=this.name='Cryonizer';
        else throw new Error(this.id +' doesnt know '+style);
    }
    get style(){return this._style;}
    get desc(){ 
        let msg ='';
        switch(this._style){
            case 0: msg+=(' pistol-like plastic tool that shocks someone with 30kV');  
            break;
            case 100: msg+=('scifi-revolver that fires a plasma-fireball');  
            break;
            case 105: msg+=('scifi-revolver that fires a bigger plasma-fireball');  
            break;
            case 120: msg+=('looks like a hair-dryer but can deep freeze something on short distance');  
            break;
            default:
        }
        return(msg);
    }
    toJSON(){return window.storage.Generic_toJSON("Gun", this); }
    static fromJSON(value){return(window.storage.Generic_fromJSON(Gun, value.data));}
    onEquip(context){
        let res=super.onEquip(context);
        if(res.OK){
            let sk = new SkillSpark();
            sk.weapon = this.id;
            this.parent.parent.Skills.addItem(sk);  //todo
        }
        return(res);
    }
    onUnequip(context){
        super.onUnequip(context)
        this.parent.parent.Skills.removeItem('Spark');
        return({OK:true, msg:'unequipped'});
    }
    /*attackMod(target){  //todo
        let mod = new SkillMod();
        mod.onHit = [{ target:target, eff: [effDamage.factory(11,'blunt')]}];
        mod.critChance=5;
        mod.onCrit = [{ target:target, eff: [effDamage.factory(11,'blunt'), new effStunned()]}];
        return(mod);
    }*/
}

window.gm.ItemsLib = (function (ItemsLib){
    window.storage.registerConstructor(CraftMaterial);
    window.storage.registerConstructor(Gun);
    ItemsLib['Jlorb'] = function(){ let x= new CraftMaterial();x.style=0;return(x);}
    ItemsLib['Shlack'] = function(){ let x= new CraftMaterial();x.style=5;return(x);}
    ItemsLib['Glib'] = function(){ let x= new CraftMaterial();x.style=10;return(x);}
    ItemsLib['Gorb'] = function(){ let x= new CraftMaterial();x.style=20;return(x);}
    ItemsLib['Igent'] = function(){ let x= new CraftMaterial();x.style=30;return(x);}
    ItemsLib['Remk'] = function(){ let x= new CraftMaterial();x.style=40;return(x);}
    ItemsLib['Murk'] = function(){ let x= new CraftMaterial();x.style=50;return(x);}
    ItemsLib['Taser'] = function(){ let x= new Gun();x.style=0;return(x);}
    ItemsLib['Blaster'] = function(){ let x= new Gun();x.style=100;return(x);}
    ItemsLib['BlasterMK2'] = function(){ let x= new Gun();x.style=105;return(x);}
    ItemsLib['Cryonizer'] = function(){ let x= new Gun();x.style=120;return(x);}
return ItemsLib; 
}(window.gm.ItemsLib || {}));

window.gm.simpleCombatInit=function(instance) {
    var s = window.story.state;
    s.combat.tmp={};
    var tmp=s.combat.tmp;
    tmp.inst=instance;
    tmp.now="";
}
window.gm.simpleCombatCleanup=function() {
    var s = window.story.state,tmp=s.combat.tmp;

    s.combat.tmp={};
}
//overrides for Latec
window.gm.InspectSelf = function() {
    let msg="",s=window.story.state;
    if(s.DngNG.tmp.qBabble===1){ msg+= "</br>A datapad is in your possession."; }
    if(s.DngNG.tmp.qBabble===2){msg+= "</br>The babble companion is talking by an in-ear speaker to you.";}
    msg += window.gm.printBodyDescription(window.gm.player,true);
    return msg+"</br>"
}

window.gm.canOpenDoor=function(from,to) {
    let s=window.story.state,res={OK:false,msg:''};
    if(from==='E4' && to==='E5') {
        if(s.DngNG.tmp.qKeyBlue!==0) { res.OK=true; 
            s.DngNG.tmp.doors[from][to].state=1;
            res.msg= "</br>With the blue keycard in your possesion, you can open the door.";
        } else res.msg= "</br>There is a sl.";
    }
    return(res);
};

window.gm.doMobAi=function(){
    let _info,msg="",here = window.gm.player.location,_d=window.story.state[window.story.state.DngSY.dng].tmp;
    let fightMobs=[],interactMobs=[];
    let node="section article div#output";
    for(var i=_d.mobs.length-1;i>=0;i--){ //check persistent mobs
      var mob=_d.mobs[i];
      window.gm.mobAI(mob);
      //TODO if mob is with other mob, they might interact; if they are with player he will witness, if they are closely around, he will hear something 
      if(window.story.state.DngSY.dng+"_"+mob.pos===here){
        //if mob is at same position as player and alive: trigger passage or just show note
        if(mob.state>=0){
            if(mob.att<=-2) { fightMobs.push(mob);
            } else {
                interactMobs.push(mob);
            }
        } else {
            window.gm.printOutput("A "+mob.mob+" was once possibly around. ","section article div#output",true);
        }
      }
    }
    _d.inCombat=false;
    if(fightMobs.length>0) {     //there might be mobs forcing a fight
        //TODO make this trapquest-style: pictures to click on with cmds; mmore foes ould approach!
        //after click calc turn
        //switch scene after defeat
        _d.inCombat=true;
        for(var i=fightMobs.length-1;i>=0;i--){
            _info = window.gm.build_NPCCombat(fightMobs[i],here);
            window.gm.printOutput(_info.msg,node,true);
        }
        document.getElementById("navpanel").replaceChildren("You cant escape");
        /*window.gm.encounters[fightMobs[0].mob]({noStart:true});
        var _oldVictory=window.gm.Encounter.onVictory.bind(window.gm.Encounter);
        window.gm.Encounter.onVictory= function(){fightMobs[0].state=-1;return(_oldVictory());}
        window.gm.Encounter.initCombat(); return;*/
    } else {
        for(var i=interactMobs.length-1;i>=0;i--){
            _info = window.gm.build_NPCInfo(interactMobs[i],here);
            window.gm.printOutput(_info.msg,node,!_info.clear);
        }
    }
    if(_d.inCombat==false && _d.hiding==false){
        msg+= window.gm.printLink("Hide",'window.gm.tryHide()');
    } else if(_d.hiding==true) {
        msg+= "You are hidden, but maybe its time to "+window.gm.printLink("leave your hiding spot.",'window.gm.tryUnhide()');
    }
    window.gm.printOutput(msg,node,true);
    window.gm.printOutput(window.gm.build_NPCProximity(here),node,true);
};
//mob does act, desc & list of player choices is returned
window.gm.build_NPCCombat=function(mob,position){
    let msg, dmg=_.random(2,10), clear=false,_d=window.story.state[window.story.state.DngSY.dng].tmp;
    _d.hiding=false; //mob found you
    msg = mob.mob+" attacks you:";
    msg+= "-"+dmg.toFixed(0)+'dmg</br>';
    window.gm.player.Stats.increment("health",dmg*-1);
    if(window.gm.player.isDead()) {
        msg+= window.gm.printLink("Accept your defeat",'window.gm.respawn({keepInventory:true});');
        clear=true; //remove actions from prev combatants
    }else {
        msg+= window.gm.printLink("Slap it",'window.gm.slapMob(\"'+mob.id+'\")');
    }
    return({msg:msg,clear:clear});
};
//player acts, then press button for next turn
window.gm.slapMob=function(id){
    let msg,dmg=5,_d=window.story.state[window.story.state.DngSY.dng].tmp;
    let mob=window.story.state[window.story.state.DngSY.dng].getMobById(id);
    _d.hiding=false; //TODO suprise attack
    mob.hp-=dmg;
    msg="You punch toward the "+mob.mob+" and hit it for "+dmg.toFixed(0)+"dmg (now "+ mob.hp.toFixed(0)+"HP)."; 
    if(mob.hp<=0) {
        msg+=window.gm.mobDefeat(mob);
    }
    msg+=window.gm.printLink('Next','window.story.show(window.gm.player.location)'); 
    window.gm.printOutput(msg,"section article div#output");//<= overwrite output!
};
window.gm.tryHide=function(){
    let _d=window.story.state[window.story.state.DngSY.dng].tmp,msg="";
    _d.hiding=true; //TODO trying to hide while someone is around fails
    msg+="TODO You hide somewhere. ";
    msg+=window.gm.printLink('Stay quiet','window.story.show(window.gm.player.location)'); 
    window.gm.printOutput(msg,"section article div#output");
};
window.gm.tryUnhide=function(){
    let _d=window.story.state[window.story.state.DngSY.dng].tmp,msg="";
    _d.hiding=false; //TODO option for suprise attack
    msg+="You get out of your hidingspot. ";
    msg+=window.gm.printLink('Next','window.story.show(window.gm.player.location)'); 
    window.gm.printOutput(msg,"section article div#output");
};
window.gm.mobDefeat=function(mob) {
    let msg="";
    mob.state=-2; //knocked out
    msg=mob.mob+" got knocked out."; 
    return(msg);
}
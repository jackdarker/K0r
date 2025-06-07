"use strict";
//stuff for ISurive
class CraftMaterial extends Item {
    constructor(){ super('CraftMaterial');
        this.addTags([window.gm.ItemTags.Material]); this.price=this.basePrice=10;   
        this.style=0;this.lossOnRespawn = false;
    }
    set style(style){ 
        this._style = style; 
        if(style===0) this.id=this.name='Shards';
        else if(style===1) this.id=this.name='SilverShards';
        else throw new Error(this.id +' doesnt know '+style);
    }
    get style(){return this._style;}
    get desc(){ 
        let msg ='';
        switch(this._style){
            case 0: 
                msg ='some strange material';
                break;
            case 1: 
                msg ='similiar to normal shards but with a silvery glitter';
                break;
            default: throw new Error(this.id +' doesnt know '+style);
        }
        return(msg);
    }
    toJSON(){return window.storage.Generic_toJSON("CraftMaterial", this); };
    static fromJSON(value){ return window.storage.Generic_fromJSON(CraftMaterial, value.data);};
}

class PaddleWood extends Weapon {
    static factory(style){
        let x = new PaddleWood();
        x.style=style;
        return(x);
    }
    toJSON(){return window.storage.Generic_toJSON("PaddleWood", this); }
    static fromJSON(value){return(window.storage.Generic_fromJSON(PaddleWood, value.data));}
    constructor(){
        super();
        this.slotUse = ['RHand'];
        this.lossOnRespawn = true;this.style=0;
    }
    set style(style){ 
        this._style = style; 
        if(style===0) this.id='PaddleWood',this.name='Wooden Paddle';
        else throw new Error(this.id +' doesnt know '+style);
    }
    get style(){return this._style;}
    get desc(){ 
        let msg ='a steel dagger';
        switch(this._style){
            case 10:
                msg=('a syringe filled with mysterious liquid');
                break;
            default:
        }
        return(msg);
    }
    attackMod(target){
        let mod = new SkillMod();
        mod.onHit = [{ target:target, eff: [effDamage.factory(5,'blunt')]}];
        mod.critChance=50;
        mod.onCrit = [{ target:target, eff: [effDamage.factory(10,'blunt')]}];
        return(mod);
    }
}

/**Infection
 * "Some infection seems to root in your limbs/torso. It might have something to do with the bunny you met before."
 * add Infection by POSTSEX, 
 * after DELAY trigger mutation in X
 * mutation MIGHT trigger infection in Y (depends on magnitude)  
 * infection might be STOPPED or DELAYED by something
 * infection in X might be overwritten or increased in magnitude (replace/merge)
 */
window.gm.ItemsLib = (function (ItemsLib){
    window.storage.registerConstructor(CraftMaterial);
    window.storage.registerConstructor(PaddleWood);
    ItemsLib['Shards'] = function(){ let x= new CraftMaterial();x.style=0;return(x);}
    ItemsLib['SilverShards'] = function(){ let x= new CraftMaterial();x.style=1;return(x);}

return ItemsLib; 
}(window.gm.ItemsLib || {}));

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
    let s = window.story.state,data;
    
    /////// --!!!!
    const version=1;
    ////// -- !!!!                          // <== increment this if you change anything below - it will reinitialize data !
    if(s.DngNG && s.DngNG.version===version){
        data=s.DngNG;
    } else {
        data=s.DngNG,data.version=version;
        data.TimesDefeat=0;data.TimesVictory=0;
        data.map= []; //the actual region-map
        data.tmp={tickPass:'', tier:0 ,region:"", room:-1 };
    }
    //this defines the possible region layouts; one of it is selected
    //questtypes
    const qExit = "exit"    //just reach exit
    const qFind = "find"    //find a weapon
    data.Regions = [ //database of region-layouts
        {region: "Appartmentblock",  
            quest: [qExit], //
            minTier: 0, 
            maxTier: 1, 
            tiles:[{id:"DngNG_00_05"},
            {id:"DngNG_00_01"},
            {id:"DngNG_00_02"},
            {id:"DngNG_00_05"},
            {id:"DngNG_00_99"}]
        },
        {region: "Appartmentblock",  
            quest: [qExit], //
            minTier: 1, 
            maxTier: 2, 
            tiles:[{id:"DngNG_00_03"},
            {id:"DngNG_00_02"},
            {id:"DngNG_00_01"},
            {id:"DngNG_00_00"},
            {id:"DngNG_01_05"},
            {id:"DngNG_00_99"}]
        },
        {region: "Suburbs",  
            quest: [qExit], //
            minTier: 1, 
            maxTier: 2, 
            tiles:[{id:"DngNG_01_03"},
            {id:"DngNG_01_02"},
            {id:"DngNG_01_01"},
            {id:"DngNG_01_00"},
            {id:"DngNG_01_05"},
            {id:"DngNG_01_99"}]
        }
    ]
    //override to limit how much items player can pickup
    window.story.state.chars.PlayerVR.Inv.canAddItem=function(item,count,force=false){
        let list,_count=0,_rst={OK:true,msg:"",count:count};
        if(item.hasTag(window.gm.ItemTags.Heal)){
            list=this.findItemByTag(window.gm.ItemTags.Heal);
            list.forEach(X=>{_count+=X.count();});
            _rst.count=Math.max(0,Math.min((  3  -_count),_rst.count));
            if(_rst.count<=0) {
                _rst.OK=false;
                _rst.msg=this.parent.name+" cant carry more of those healing items.";
            } else if(_rst.count<count){ 
                _rst.msg=this.parent.name+" can carry only some more of those healing items.";
            }
        }
        return(_rst);
    };
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
    window.gm.toNextRoom=function(){
        let s=window.story.state;
        if(s.DngNG.tmp.room<0){ //Start
            s.DngNG.tmp.room=0;
        } else {
        s.DngNG.tmp.room++;
            if(s.DngNG.tmp.room>=s.DngNG.map.length){ //this room should either have a exit or we start from begin
                s.DngNG.tmp.room=0;
            }
        }
        window.gm.addTime(120);
        window.story.show(s.DngNG.map[s.DngNG.tmp.room])
    }
    data.rerollTiles=function(region,tier){
        //select map from database
        let list=[],n;
        this.Regions.forEach(x=>{if(x.region==region && (x.minTier<=tier && x.maxTier>=tier)){list.push(x);}});
        n=_.random(0,list.length-1);
        this.map=list[n].tiles.map(y=>{return(y.id);});
        this.tmp.region=list[n].region;
    }
    data.rerollRegion=function(){
        //select the next region; it shouldnt be the same region as the last one
        let list=[],n;
        this.Regions.forEach(x=>{if(x.region!=this.tmp.region && (x.minTier<=this.tmp.tier && x.maxTier>=this.tmp.tier)){list.push(x);}});
        if(list.length>0){
            n=_.random(0,list.length-1);
            this.tmp.region=list[n].region;
        } else this.tmp.region=""; 
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
    {   //stuff for upgrades
        function NOP(){return({OK:true,msg:""});}
        function exclude(itmIdList){ 
            var s=window.story.state;
            let res={OK:true,msg:""};
            for(var i=itmIdList.length-1;i>=0;i--){
                if(s.NGP.hasOwnProperty(itmIdList[i])){
                    res.OK=false,res.msg+="Cannot be used with "+itmIdList[i]+".";
                }
            }
            return(res);
        }
        function include(itmIdList){ 
            var s=window.story.state;
            let res={OK:true,msg:""};
            for(var i=itmIdList.length-1;i>=0;i--){
                if(!s.NGP.hasOwnProperty(itmIdList[i])){
                    res.OK=false,res.msg+="requires also "+itmIdList[i]+".";
                }
            }
            return(res);
        }
        window.gm.achievementsInfo={ //see window.gm.achievements //this is kept separate to not bloat savegame
            //hidden bitmask: 0= all visisble, 1= hide Name, 2= hide Todo
            looseEnd: {hidden:3, name:"loose end", descToDo:"Find a loose end.",descDone:"Found a link without target."}, //
            firstRun: {hidden:0, name:"first run", descToDo:"Get to the extit in the first region",descDone:"Finished the first region."} 
        }
        window.gm.NGP=window.gm.NGP||{}
        window.gm.NGP.catalog = [ //this defines the buyable upgrades
            {catId:"slots",desc:"slots",
            items:[
                {itmId:"BSlot1",name:"Benefit Slot A",cost:{token:1},disabled:false,slot:["A"],req:NOP,desc:"A benefit-slot where you can equip cards of type A"},
                {itmId:"BSlot2",name:"Benefit Slot B",cost:{token:15},disabled:false,slot:["B"],req:NOP,desc:"A benefit-slot where you can equip cards of type B"},
                {itmId:"BSlot3",name:"Benefit Slot C",cost:{token:30},disabled:false,slot:["C"],req:NOP,desc:"A benefit-slot where you can equip cards of type C"},
                {itmId:"TSlot1",name:"Tradeoff Slot A",cost:{token:5},disabled:false,slot:["A"],req:NOP,desc:"A tradeoff-slot where you can equip cards of type A"},
                {itmId:"TSlot2",name:"Tradeoff Slot B",cost:{token:10},disabled:false,slot:["B"],req:NOP,desc:"A tradeoff-slot where you can equip cards of type B"},
            {itmId:"TSlot3",name:"Tradeoff Slot A/B",cost:{token:10},disabled:false,slot:["A","B"],req:NOP,desc:"A tradeoff-slot where you can equip cards of type A or B"}
            ]},
            {catId:"startgear",desc:"Starting Gear",
            items:[
                {itmId:"Compass",name:"Compass",cost:{token:1},disabled:false,slot:['A','C'],req:NOP,desc:"a compass that makes it easier to navigate in some areas"},
                {itmId:"ProteinBars",name:"a couple proteinbars",cost:{token:1},disabled:false,slot:['A'],req:NOP,desc:"a package of powerbars to restore your energy"},
                {itmId:"HealtPotion",name:"a couple small healthpotions",cost:{token:1},disabled:false,slot:['A','C'],req:NOP,desc:"a package of drinks to restore some health"}
                //tool like crowbar
                //replace standard outfit with ...
                //grinder that converts unsused gear to money
            ]},
            {catId:"transformation",desc:"transformation boons",
            items:[
                {itmId:"transformWeakOnly",name:"transformWeakOnly",cost:{token:2},disabled:true,slot:['B'],req:NOP,desc:"Transformations only take place in a weakend state."}
            ]},
            {catId:"itemMods",desc:"Item Mods",
            items:[
                {itmId:"decreasedClothDurability",name:"decreased clothing durability",cost:{token:1},disabled:false,slot:['B'],req:exclude.bind(null,["increasedClothDurability"]),desc:"Clothes tend to break faster. Might help to get rid of some undesired things faster."},
                {itmId:"increasedClothDurability",name:"increased clothing durability",cost:{token:1},disabled:false,slot:['B'],req:exclude.bind(null,["decreasedClothDurability"]),desc:"Clothes are much more durable, especially specific ones."}
                //...but wear you find is already in bad shape 
            ]},
            {catId:"eventMods",desc:"Event Mods",
            items:[
                {itmId:"moreHealItems",name:"increased drop rate of healing items",cost:{token:1},disabled:false,slot:['B'],req:NOP,desc:"You will have more luck in findig healing-items at the expenso of other items."},
                {itmId:"postCombatHeal",name:"post combat healing",cost:{token:3},disabled:false,slot:['C'],req:NOP,desc:"After a fight, your health is restored somewhat but healing items are less effective."}
                //increases the number of locations you have to pass through with a good chance that there is loot;
                //reduced risk to get suprised but ...  
            ]},
            {catId:"weirdMods",desc:"Mods that dont require slots",
            items:[
                {itmId:"noTierUp",name:"manually select if you increase tier or not (doesnt require card-slot!)",cost:{token:15},disabled:false,slot:[],req:NOP,desc:"After successful completion of a region, the tier usually increases automatically. This mod gives you the option to bypass this."},
                {itmId:"noRegionTier",name:"removes the region-restriction by tier (doesnt require card-slot!)",cost:{token:15},disabled:false,slot:[],req:NOP,desc:"Usually the selected region is restricted by tier (thatswhy you always start in Appartmentblock). This mod gives you the option to remove the restriction."},
                {itmId:"displayCorruption",name:"display Corruption-Stat (doesnt require card-slot!)",cost:{token:100},disabled:false,slot:[],req:NOP,desc:"enables the Corruption Indicator to give an indication why your corruption increases"}
            ]}
        ];
        window.gm.NGP.catalogToList=function(){ //converts catalog tree into flat item list
            let itm=null,list=[];
            for(var cat of window.gm.NGP.catalog){
                for(var it of cat.items){
                    it.catId=cat.catId;
                    list.push(it);
                }
            }
            return(list);
        }
        window.gm.NGP.findItem=function(itmId){ //returns an item (not category) from catalaog
            let itm=null;
            for(var cat of window.gm.NGP.catalog){
                for(var it of cat.items){
                    if(it.itmId===itmId) {
                        it.catId=cat.catId;
                        return(it);
                    }
                }
            }
            if(itm===null) throw new Error("unknown item " + itmId);
            return(itm);
        }
    }

    return({map:data.map,data:data});
};
//override postVictory
window.gm.postVictory=function(params){
    window.gm.toNextRoom();
}
window.gm.renderRoomNG= function(room){ //see also window.gm.renderRoom
    let msg="",s=window.story.state, dng=s.DngSY.dng;
    let _c=room.replace(dng+"_",""), _v=s.DngNG.map.grid.get(_c).visuals;
    switch(_v){
        case "trees":
            msg+="There is a group of smaller trees."
            break;
        case "bushes":
            msg+="Bushes of different sizes are growing close to each other."
            break;
        case 'bigtree':
            msg+="The area here lies in the shadow of a huge tree."
            break;
        case 'meadow':
            msg+="The sun shines down on the meadow, casting a warm and inviting glow over the entire area."
            break;
        case 'garage':
            msg+="A garage with a slightly open door.Maybe you can find some tools there."
            break;
        case 'trailer':
            msg+="A rundown trailer with a messy kitchen corner and a unfolded bed."
            break;
        default:
            break;
    }
    switch(_v){
        case "appletree":
            msg+=window.story.render(dng+'_'+_v);
            break;
        case "entry":
            msg+=window.story.render(dng+'_'+_v);
            break;
        default:
            break;
    }
    return(msg);
}
//build message+actions for NPC around player.
//returns {msg,attitudeToPlayer}
// 
//hostile=attack on sight ; this indicates to trigger combat
window.gm.build_NPCInfo=function(mob,position){
    let att=mob.att, msg,_mob =window.story.state.chars[mob.id]; //only unique mobs are stored here TODO 
    msg = "A "+mob.mob+" is here."; //TODO what is the mob doing? sleeping/hiding/lurking
    if(_mob instanceof Mob) {
        msg = _mob.unique?(mob.id+" is around."):msg;
        msg+=window.gm.images._sizeTo(window.gm.images[_mob.pic](),200,200)
        //Todo interaction depends on mob (can talk, detects player, is cloaked) and player (crawl toward)
        //att=0;  //Todo calc attitude by history/relation and player-state (vulnerable or not)
        //msg+= window.gm.printPassageLink("Talk to"+mob.id,"DngNG_"+mob.id+"_Talk");
        if(mob.state===4 || mob.state===3){ 
            att-=(att>-2)?1:0;
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
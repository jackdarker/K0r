"use strict";
///////// stuff for Groombridge/BalckSwan   ////////////////
window.gm.getSaveVersion= function(){return([0,0,1,0]);};
// reimplement to setup the game
//let _origInitGame = window.gm.initGame;
window.gm.initGame= function(forceReset,NGP=null){
    _origInitGame(forceReset,NGP);
    window.gm.images = imagesBattlers(window.gm.images||{});
    window.gm.images = imagesMaps(window.gm.images);
    window.gm.images = imagesEquip(window.gm.images);
    window.gm.images = imagesIcons(window.gm.images);
    window.gm.images = imagesScenes(window.gm.images);
    //if svg have no size set, they use whole space, use this to force them to fit into a box
    window.gm.images._sizeTo = function(_pic,width,height){ 
        var node = SVG(_pic);
        node.width(width),node.height(height)
        return(node.node.outerHTML);
    }
    var s = window.story.state;
    s._gm.timeRL= s._gm.timeVR = s._gm.time;
    s._gm.dayRL= s._gm.dayVR = s._gm.day;
    s._gm.debug = 1,   //   <==    TODO set debug to 0 for distribution or 1 for debug!
    s._gm.dbgShowCombatRoll= true,
    s._gm.dbgShowQuestInfo= true;
    s._gm.dbgShowMoreInfo=true;
    if (!s.vars||forceReset){ // storage of variables that doesnt fit player
        s.vars = {
        inVR: false,
        spawnAt: 'Home',
        playerPartyVR:[], //names of chars
        playerPartyRL:[],
        //flags for global states
        qDogSit : 0,   // see park
        Explored:{}, //{WM_Lv1_A1:1}
        qUnlockCampus : 0,  //see passage into city
        qUnlockPark : 0,
        qUnlockMall : 0,
        qUnlockBeach : 0,
        qUnlockDowntown : 0,
        qUnlockNorthlake : 0,
        qUnlockRedlight : 0,
        qUnlockBeach : 0,
        crowBarLeft: 1,
        busDestination : ""
        }; 
    }
    if (!s.Kitchen||forceReset){
      s.Kitchen = {
        foodStore : [{type:'balanced', count:5}],
        foodMaxStore : 10
      };
    }
    if (!s.chars.Megan||forceReset){  
        let ch = new Character();
        ch.id="Megan";
        ch.name="Megan";ch.unique=true;
        ch.faction="Player";
        ch.Wardrobe.addItem(new Jeans());
        ch.Wardrobe.addItem(new Briefs());
        ch.Wardrobe.addItem(new Sneakers());
        ch.Wardrobe.addItem(new Pullover());
        ch.Outfit.addItem(new BaseHumanoid());
        ch.Outfit.addItem(new FaceHuman());
        ch.Outfit.addItem(HandsHuman.factory('human'));
        ch.Outfit.addItem(new SkinHuman());
        ch.Outfit.addItem(AnusHuman.factory('human'));
        ch.Outfit.addItem(VulvaHuman.factory('human'));
        ch.Outfit.addItem(new Jeans());
        ch.Outfit.addItem(new Sneakers());
        ch.Outfit.addItem(new Pullover());
        s.chars.Megan=ch;
    } 
    if (!s.chars.Ruff||forceReset){  //Ruff the wolf
      //s.chars.Ruff = new Ruff()
    }
    if (!s.chars.PlayerRL||forceReset){  
        let ch = new Character();
        ch.id="PlayerRL";
        ch.name="Lisa";ch.unique=true;
        ch.faction="Player";
        //ch.Effects.addItem(new skCooking());
        //add some basic inventory
        ch.Inv.addItem(new Money(),20);
        ch.Inv.addItem(new LighterDad());
        ch.Inv.addItem(new FlashBang(),2);
        ch.Inv.addItem(new CanOfCoffee(),2);
        ch.Wardrobe.addItem(new Jeans());
        ch.Wardrobe.addItem(new Briefs());
        ch.Wardrobe.addItem(new Sneakers());
        ch.Wardrobe.addItem(new Pullover());
        ch.Outfit.addItem(new BaseHumanoid());
        ch.Outfit.addItem(new FaceHuman());
        ch.Outfit.addItem(HandsHuman.factory('human'));
        ch.Outfit.addItem(new SkinHuman());
        ch.Outfit.addItem(AnusHuman.factory('human'));
        ch.Outfit.addItem(VulvaHuman.factory('human'));
        ch.Outfit.addItem(new Jeans());
        ch.Outfit.addItem(new Sneakers());
        ch.Outfit.addItem(new Pullover());
        //special skills
        //ch.Effects.addItem(new effNotTired()); //depending on sleep Tired will be set to NotTired or Tired
        //ch.Skills.addItem(SkillCallHelp.factory('Mole'));
        ['ftVoyeurism'].forEach((name)=>{stFetish.setup(ch.Stats,0,10,name)});
        let stats=Stat.setupStatWithLimitAndRegen('influence',{base:300,regen:0,max:300});
        stats=stats.concat(Stat.setupStatWithLimitAndRegen('stress',{base:10,regen:0,max:100}))
        stats.forEach(x=>{ch.Stats.addItem(x);}),stats.forEach(x=>{x.Calc();});
        s.chars.PlayerRL=ch;
    }    
    window.gm.initGameFlags(forceReset,NGP);
    window.gm.switchPlayer("PlayerRL");
    //take over flags for newgameplus
    if(NGP){ //TODO
    }
    NGP=null; //release memory
};
//this initialises game-objects that are not class-based
window.gm.initGameFlags = function(forceReset,NGP=null){
  let s= window.story.state,map,data;
  function dataPrototype(){return({visitedTiles:[],mapReveal:[],tmp:{},version:0});}
  if (forceReset){  
    s.Settings=s.DngSY=null; 
    s.NGP = {};
    s.Know = {}
  }
  let Know = {};
  let Settings = {
    showCombatPictures:true,
    showNSFWPictures:true,
    showDungeonMap:true,
    nonMetric:false  //TODO
  };
  if(!window.gm.achievements){//||forceReset) { 
    window.gm.resetAchievements();
  }
  window.storage.loadAchivementsFromBrowser();
  let DngSY = {
      //////////////////////////
      visitedTiles: [],mapReveal: [],
      dng:'', //current dungeon name
      prevLocation:'', nextLocation:'', //used for nav-logic
      dngMap:{} //dungeon map info
  };
  if(s.NGP && NGP!=null){ //update if exist
    s.NGP=window.gm.util.mergePlainObject(NGP,s.NGP);
  }
  //see comment in rebuildFromSave why this is done
  s.Settings=window.gm.util.mergePlainObject(Settings,s.Settings);
  s.Know=window.gm.util.mergePlainObject(Know,s.Know);
  s.DngSY=window.gm.util.mergePlainObject(DngSY,s.DngSY);
  //todo cleanout obsolete data ( filtering those not defined in template) 
};
///
window.gm.resetAchievements = function() { //declare achievements here
  window.gm.achievements={
      RunOutofInfluence: 0 
    }
};
///
window.gm.rollExploreCity= function(){
    let s=window.story.state;
    let loc,places=[];   
    let r = _.random(0,100);
    
    //depending of your actual location you have a chance to find connected locations 
    //todo: multiple rools required, ignore found locations
    //todo: trigger scenes
    if(window.gm.player.location=='Home')   places = ['Park','Downtown'];
    if(window.gm.player.location=='Park')   places = ['Mall','Downtown'];
    if(window.gm.player.location=='Mall')   places = ['Park','Beach','Downtown']; 
    if(window.gm.player.location=='Beach')   places = ['Park','Mall']; 
    if(window.gm.player.location=='Downtown')   places = ['Pawn shop','Mall']; 
    places=places.filter((x)=>{return(!s.vars.Explored[x]>0);}); // ignore found locations
    if(places.length==0) loc = "City_ExploredAll"; //fallback if unspeced location
    else {
      loc = places[_.random(1, places.length)-1]; //chances are equal
      s.vars.Explored[loc]=1+(s.vars.Explored[loc]||0);
      s.vars.Explored[window.gm.player.location]=1+(s.vars.Explored[window.gm.player.location]||0);
    }
    window.gm.addTime(60);
    window.story.show(loc);
};
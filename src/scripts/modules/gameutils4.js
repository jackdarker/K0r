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
        Explored:{}, //{Park:1}
        ExploredToday:0,
        qMap:0, //1=Map gained
        qUnlock:{ //see passage Into the city
          Beach : 0,
          Central : 0,  
          Downtown : 0,
          Gym: 0,
          Mall : 0,
          Park : 0,
          Redlight : 0,
        },
        qWetDream:0,
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
        ['ftVoyeurism','ftHetero','ftLesbian'].forEach((name)=>{stFetish.setup(ch.Stats,0,10,name)});
        let stats=Stat.setupStatWithLimitAndRegen('influence',{base:300,regen:0,max:300});
        stats=stats.concat(Stat.setupStatWithLimitAndRegen('stress',{base:10,regen:0,max:100})).
          concat(Stat.setupStatWithLimitAndRegen('study',{base:6,regen:0,max:15}))
        stats.forEach(x=>{ch.Stats.addItem(x);}),stats.forEach(x=>{x.Calc();});
        ch.Stats.get("arousalMax").data.base=100,ch.Stats.get("arousalRegen").data.base=0;ch.Stats.get("arousalRegen").Calc();ch.Stats.get("arousalMax").Calc();
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
    let loc,places=[],scenes=[];   
    let r = _.random(0,100),time=window.gm.getTimeStruct();
    //depending of your actual location you have a chance to find connected locations 
    //todo: trigger scenes
    if(window.gm.player.location=='Home')   { places = ['Park','Central'];}; //,'Gym']
    if(window.gm.player.location=='Park')   { 
      places = ['Central','Downtown'];
      scenes = ["Park_JoggerMale"];//,"Park_Bank"]
    };
    if(window.gm.player.location=='Central'){ places = ['Park','Mall','Downtown']; };
    if(window.gm.player.location=='Beach')  { 
      places = ['Downtown']; 
      if(time.daytime=="evening"){ scenes.push("Beach_Dusk")}
    };
    if(window.gm.player.location=='Downtown'){places = ['Pawn shop','Beach'];};//,'Red lights']; 
    places=places.filter((x)=>{return(!(s.vars.Explored[x]>0) && !(s.vars.ExploredToday>0));}); // ignore found locations || only one explore per day
    if(places.length==0) {
      if(scenes.length==0) loc = "City_ExploredAll"; //
      else loc = scenes[_.random(1, scenes.length)-1];
    }else {
      loc = places[_.random(1, places.length)-1]; //chances are equal
      s.vars.ExploredToday=1;
      window.gm.addTime(60);
      s.vars.Explored[loc]=1+(s.vars.Explored[loc]||0);
      s.vars.Explored[window.gm.player.location]=1+(s.vars.Explored[window.gm.player.location]||0);
    }
    window.story.show(loc);
};
//this starts a timer that hides (hidden-attribut) one element and unhides another if it triggers; can be used for links that should vanish after some time
//the function returns a cleanup operation you have to call to abort the timer and a start function you call to (re)start the timer, 
//an optional callback gets called on timeout
//example: <!--
//<div id="timed"><a0 onclick='x.cleanup();window.story.show("Park");'>OPPORTUNITY</a></div><div id="timedOut" hidden>[[Back|_back_]]</div>
//<script>var x=window.gm.timedElment(5000,"timed","timedOut");x.start();</script>   -->
window.gm.timedElment = function(timeout,IDtoHide,IDtoShow,TOCCallback){
  var timer=0,time=0,_timeout=0,_IDtoHide,_IDtoShow,_TOCallback;
  _timeout=timeout;_IDtoHide=IDtoHide,_IDtoShow=IDtoShow,_TOCallback=TOCCallback;
  //const controller = new AbortController();
  function timed(){
		time-=1000;
		if( time<=0){
			clearInterval(timer);//controller.abort(); 
			if(IDtoHide) document.getElementById(IDtoHide).setAttribute("hidden","");  
			if(IDtoShow) document.getElementById(IDtoShow).removeAttribute("hidden","");
      if(_TOCallback) callback(_IDtoShow);
		}
	}
  function cleanup(){ clearInterval(timer)};
  return({  
    cleanup: cleanup,
    start: ()=>{
      cleanup();
      time=_timeout;
      if(IDtoHide) {
        let _elmnt=document.getElementById(IDtoHide);
        //this is to animate a bargraph
        _elmnt.style["background-image"] = "linear-gradient(270deg, #dd4a4a80, #dd4a4a80)", //have to use image not just color!
        _elmnt.style["background-size"]="0%", //this is active after animation ends
        _elmnt.style["width"]="fit-content"; //otherwise the bar would be as wide as the page
        _elmnt.style["background-repeat"]="no-repeat",
        _elmnt.animate([  // key frames see https://developer.mozilla.org/en-US/docs/Web/API/KeyframeEffect/
          { backgroundSize: "100%"},{backgroundSize: "0%"}    //use CamelCase instead background-size!
        ], {          // sync options
          duration: _timeout
        });//.addEventListener("finish", (event) => {time=0,timed(); },{ signal: controller.signal }); //instead of timer use finish listener
        _elmnt.removeAttribute("hidden","");
      }
      if(IDtoShow) document.getElementById(IDtoShow).setAttribute("hidden","");
      timer=setInterval(timed, 1000); 
    }
  });
};

window.gm.printStatChange = function(what,value){
  let up=(value>0);
  if(value===0) return('');
  switch(what){
    case 'stress': up=!up;  //up is bad
      break;
    default:
      break;
  }
  if(up) return('<statup> '+what+' '+window.gm.util.formatInt(value,true,0)+' </statup>');
  else return('<statdown> '+what+' '+window.gm.util.formatInt(value,true,0)+' </statdown>');
}
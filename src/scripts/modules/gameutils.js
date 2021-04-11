"use strict";
/* bundles some utility operations*/

window.gm.getSaveVersion= function(){
    var version = [0,1,0];
      return(version);    
};
// reimplement to setup the game
window.gm.initGame= function(forceReset,NGP=null) {
  //var toast = new Toasty();
//toast.info("Here is some information!");

    //this does not work because hidden is called to late
    /*$(window).on('sm.passage.hidden', function(event, eventObject) {
      if(eventObject.passage) {// No passage to hide when story starts
          console.log('hiding'+eventObject.passage.name);        
      }
    });*/
    $(window).on('sm.passage.showing', function(event, eventObject) {
        // Current Passage object
        $("tw-passage").fadeIn(500);  //fade in if was previously faded out
      console.log('showing '+eventObject.passage.name);
    });
    // Render the passage named HUD into the element todo replace with <%=%>??
    $(document).on('sm.passage.shown', function (ev,eventObject) { window.gm.updateOtherPanels();});
    
    var s = window.story.state; //s in template is window.story.state from snowman!
    if (!s.vars||forceReset) { // storage of variables that doesnt fit player
        s.vars = {
        debug : true,   //TODO set to 0 for distribution !   see debug passage for meaning
        dbgShowCombatRoll: false,
        version : window.gm.getSaveVersion(),
        log : [],
        passageStack : [], //used for passage [back] functionality
        defferedStack : [], //used for deffered events
        time : 700, //represented as hours*100 +minutes
        day : 1,
        activePlayer : 'Lisa', //id of the character that the player controls currently
        //queststates  // see passage
        qHomeInspect : 0,
        qPart1: 0  
        }; 
    }
    if (!s.tmp||forceReset) { 
      // storage of temporary variables; dont use them in stacking passages or deffered events      
      s.tmp = {
        rnd : 0,  // can be used as a random variable for use in CURRENT passage
        args: []  // can be used to set arguments before another passage is called (passage-arguments) 
      }
  }
    if (!window.gm.achievements||forceReset) {  //outside of window.story !
      window.gm.achievements= {
        moleKillerGoldMedal: false //add your flags here
      }
      window.storage.loadAchivementsFromBrowser();
    }
    if (!s.enemy||forceReset) { //actual/last enemy
      s.enemy = new Character();
    }
    if (!s.combat||forceReset) { //see encounter & combat.js
      s.combat = {
        newTurn : false,
        enemyFirst : false, //if true, enemy moves first
        enemyTurn : false, //true if enemys turn
        state : ""  , //internal state
        playerFleeing : false,
        playerSubmitting : false,
        turnCount: 0,
        scenePic : 'assets/bg_park.png'
      }
    }

    if (!s.Kor||forceReset) {  //
      window.gm.Kor = new Character()
      window.gm.Kor.name="Kor";
      //add some basic inventory
      //window.gm.Kor.Wardrobe.addItem(new Jeans());      
      //window.gm.Kor.Outfit.addItem(new Jeans());
      window.gm.Kor.Stats.increment('strength',3);
      s.Kor = window.gm.Kor;
    }
    if (!s.Lisa||forceReset) {  
        window.gm.Lisa = new Character();
        window.gm.Lisa.name="Lisa";
        window.gm.Lisa.Effects.addItem(skCooking.name,new skCooking());
        //add some basic inventory
        //window.gm.Lisa.Wardrobe.addItem(new Jeans());
        //window.gm.Lisa.Outfit.addItem(new Jeans());
        s.Lisa=window.gm.Lisa;
    }      
    window.gm.switchPlayer(s.Lisa.name); //start-player
    if(NGP) { window.story.state.vars.crowBarLeft = NGP.crowBarLeft; }
    NGP=null; //release memory
}
// lookup function for scene background
window.gm.getScenePic = function(id){
  if(id==='Garden' || id ==='Park')   return('assets/bg_park.png');
  return('assets/bg_park.png');//todo placehodler
}
//prints a list of todo quest
window.gm.printTodoList= function() {
    var elmt='<form><ul style=\"list-style-type: none\" >';
    var s= window.story.state;
    var list=['qDogSit'];
    elmt +="<li><label><input type=\"checkbox\" name=\"y\" value=\"x\" readonly disabled>always: keep the fridge filled</label></li>";
    for(var i=0; i<list.length; i++) {
        var val = s.vars[list[i]];
        var msg ='';
        if(list[i]==='qDogSit') {       //todo we could use <%=> instead
        if(val<=0) {  
        } else if(val<=0x100) {
            msg = 'There was this dogsit-ad in the park. Maybe you should call there to earn some money.';
        } else if(val<=0x200) {
            msg = 'You called dogsit but didnt get a response...';
        }else if(val<=0x300) {
            msg = 'Get a task from dogsit!';
        }
        }
        if(msg!='') elmt +="<li><label><input type=\"checkbox\" name=\"y\" value=\"x\" readonly disabled>"+msg+"</label></li>";
    }
        elmt +="</ul></form></br>";
        return(elmt);
};
//prints a list of perks for unlock
window.gm.printUnlockPerk= function(id, descr) {
    var elmt='';
    var s= window.story.state;
        if(window.gm.player[id]==0 && window.gm.player.skillPoints>0) {
            elmt +=''.concat("<a0 id='"+id+"' onclick='(function ( $event ) { unlockPerk($event.id); })(this);'>"+descr+"</a>");
        elmt +=''.concat("    [[Info|"+id+"]]");
        } else if(window.gm.player[id]>0) {
            elmt +=id+": "+descr;
        }
        elmt +=''.concat("</br>");
        return(elmt);
};


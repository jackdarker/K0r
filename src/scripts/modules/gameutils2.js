"use strict";

/*  combat-sm:  from AM_Lv2_H3 set ..args[1]=null and move to AM_Lv2_H3_Attack
    AM_Lv2_H3_Attack calls printMinePodCombatMenu

    window.story.state.tmp.args[0] = called by GenericPassage to render output + Next-Link
 *  ...args[1] = {} - store for your temporary data between combat-steps
    ...args[2] = passage-name to return on flee success 
    ...args[3] = foe variable name
 */

window.gm.printCombatSceneNext=function(msg) {
    window.story.state.tmp.args[0] = function() {window.gm.printOutput(msg,"section article div#choice");};
    window.story.show("GenericPassage");
}

window.gm.printMinePodCombatMenu=function(FoeId){
    let msg ='',s=window.story.state.vars.mine;
    window.story.state.tmp.args[1] = window.story.state.tmp.args[1]||{blast:0}; //buffers data between calls
    if(s[FoeId]<=0) {
        let tmp = window.gm.player.location.slice(0,window.gm.player.location.lastIndexOf('_')); //AM_Lv2_G2_Attack -> AM_Lv2_G2
        msg= 'The hull of the pod is completely deflated. Should be no thread anymore.</br>';
        msg+= '<a href=\'javascript:void(0)\' onclick=\'window.story.show(\"'+tmp+'\")\'>Next</a></br>';
    } else { 
        if(s[FoeId]<50) {
            msg= 'The pod is still alive.</br>';
        } else {
            msg= 'The pod looks healthy.</br>';
        }
        if(s.qSprayerCharge>0) {
            msg+= '<hr><a href=\'javascript:void(0)\' onclick=\'window.gm.printMinePodCombat(\"'+FoeId+'\",\"Sprayer\")\'>use Sprayer</a></br>';
        } else {
            msg+= 'Your sprayer is empty.</br>';
        }
        if(s.qHasCrowbar>0) {
            msg+= '<hr><a href=\'javascript:void(0)\' onclick=\'window.gm.printMinePodCombat(\"'+FoeId+'\",\"Crowbar\")\'>use Crowbar</a></br>'//;window.gm.printLink('use Crowbar','window.gm.printMinePodCombat(\"'+FoeId+'\",\"Crowbar\")');
        }
        msg+= '<hr><a href=\'javascript:void(0)\' onclick=\'window.gm.printMinePodCombat(\"'+FoeId+'\",\"Stone\")\'>throw a Stone</a></br>'
        msg+= '<hr><a href=\'javascript:void(0)\' onclick=\'window.gm.printMinePodCombat(\"'+FoeId+'\",\"Flee\")\'>Run away</a></br>'
    }
    return(msg);
}
window.gm.printMinePodCombat=function(FoeId,Weapon){
    let msg='',s=window.story.state.vars.mine;
    let rnd = _.random(0,100);
    if(Weapon==='Flee') {
        msg+= 'You fled from the fight.</br>' 
        msg+= window.gm.printLink('Next','window.story.show(window.story.state.tmp.args[2])');
        window.gm.printCombatSceneNext(msg);
        return;
    }else if(Weapon==='Crowbar') { //
        msg = 'Your crowbar deals some damage to the pods hull.'
        s[FoeId]+=-45;
    } else if(Weapon==='Stone') {
        msg = 'Grabing a stone from the ground, you throw it full force against the pod.</br>'
        if(rnd<30) {
            msg += 'You hit the pod but only deal little damage.</br>'
            s[FoeId]+=-25;
        } else {
            msg += 'Your throw missed its target.</br>'
        }
    } else if(Weapon==='Sprayer') { s.qSprayerCharge-=1;
        window.story.state.tmp.args[1].blast+=1;
        msg = 'The color of the pod changes and it expands as well.'
        s[FoeId]+=-60;
    }
    if(s[FoeId]<=0) { 
        s[FoeId]=0;
        if(window.story.state.tmp.args[1].blast>1) {
            msg += '</br>The pod explodes in a fiery mess, scatering its remains around.</br>'+window.gm.printMinePodDamage();
        } else {
            msg += '</br>The pod shakes violently but its content just squirts out from a wound at its side. The once proud bulb quickly deflates in a pitiable sag.</br>';
        }
    } else {
        msg+='As the bulb releses some of its content into the air you try to gain some distance.'
        if(rnd<30) {
            msg += '</br>But unfortunatly you got a good dose of it.</br>'+window.gm.printMinePodDamage();
        } else {
        }
    }
    //back to combat passage
    msg+= window.gm.printLink('Next','window.story.show(window.gm.player.location)');
    window.gm.printCombatSceneNext(msg);
}
window.gm.printMinePodDamage=function() { //pod blast or spray attack
    let msg='',s=window.story.state.vars.mine;
    if(s.qCoverallHP>0) {
        s.qCoverallHP=Math.max(0,s.qCoverallHP-10);
        msg += 'You got hit too and whatever was inside the pod, is now eating away your cloths!</br><statdown>clothing damage</statdown></br>';
        if(s.qCoverallHP<=0) msg += 'All of your overgarment is now falling apart. You use some of the shreds to wipe off the fluids from your skin.</br>';
    } else {
        msg += 'You got hit too and and you feel the goo stinging your skin. You should find something to wash it off !</br>';
    }
    return(msg);
}
window.gm.printMineTentacleCombatMenu=function(FoeId){
    let msg ='',s=window.story.state.vars.mine;
    window.story.state.tmp.args[1] = window.story.state.tmp.args[1]||{bound:0, enraged:0}; //buffers data between calls
    if(s[FoeId]<=0) {
        let tmp = window.gm.player.location.slice(0,window.gm.player.location.lastIndexOf('_'));
        msg= 'The nasty creature drops to the ground.</br>';
        msg+= '<a href=\'javascript:void(0)\' onclick=\'window.story.show(\"'+tmp+'\")\'>Next</a></br>';
    } else if(window.story.state.tmp.args[1].bound===4){ //BAD END
        msg+='</br></br>The vile creature finally proved to strong (or your tactic to bad). As it now entwines your lower body with multiple of its strong appendages and can easily move you insides its own homestead.';
        msg+='</br>TODO BAD END';
    } else { 
        if(s[FoeId]<50) {
            msg= 'The tentacle is twitching around.</br>';
        } else {
            msg= 'The tentacle has a strong grip on you.</br>';
        }
        if(s.qSprayerCharge>0) {
            s.qSprayerCharge-=1;
            msg+= '<hr><a href=\'javascript:void(0)\' onclick=\'window.gm.printMineTentacleCombat(\"'+FoeId+'\",\"Sprayer\")\'>use Sprayer</a></br>';
        } else {
            msg+= 'Your sprayer is empty.</br>';
        }
        if(s.qHasCrowbar>0) {
            msg+= '<hr><a href=\'javascript:void(0)\' onclick=\'window.gm.printMineTentacleCombat(\"'+FoeId+'\",\"Crowbar\")\'>use Crowbar</a></br>';
        } 
        msg+= '<hr><a href=\'javascript:void(0)\' onclick=\'window.gm.printMineTentacleCombat(\"'+FoeId+'\",\"Struggle\")\'>Struggle</a></br>';
    }
    return(msg);
}
window.gm.printMineTentacleCombat=function(FoeId,Weapon){
    let msg='',s=window.story.state.vars.mine,t=window.story.state.tmp.args[1];
    let rnd = _.random(0,100);
    if(Weapon==='Crowbar') { //
        msg = 'You hit the tentacle and it seemed to release its grip somewhat, even if just for a moment. Maybe with some more hits you can break free.'
        s[FoeId]+=-20;
    } else if(Weapon==='Sprayer') {
        s.qSprayerCharge-=1;
        if(t.enraged===0) {
            msg+= 'The tentacles starts sweeling and its color get more lifely, the grip on you tightens even more.'
            s[FoeId]+=-35;t.enraged+=1;
        } else {
            msg+= 'The sprayer doesnt seem to affect the creature any further. Maybe it needs a higher dose?'
        }
    } else if(Weapon==='Struggle') {
        t.bound = Math.max(0,t.bound-2);
        msg+= 'You trash around to get away from the slimy appendage. ' + (t.bound===0)?'The thing still has a hold on you. You need to deal soe damage to break free.':'';
    }
    if(t.enraged>=1) {
        t.bound+=1;
        if (t.bound>=3) {
            msg+= '</br>You have to struggle free or you will be entwined by the creature completely !'
        } else {
            msg+= '</br>The angry tentacle pulls you in closer !'
        }
    }
    if(s[FoeId]<=0) { 
        s[FoeId]=0;
        msg+='Finally you dealt enough damage to break free from the grip of the tentacle. It quickly retreats in the safety of its encasing and you crawl away quickly to get a safe distance as well.'
    } 
    //back to combat passage
    msg+= window.gm.printLink('Next','window.story.show(window.gm.player.location)');
    window.gm.printCombatSceneNext(msg);
}
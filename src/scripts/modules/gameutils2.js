"use strict";


window.gm.printMinePodCombatMenu=function(FoeId){
    let msg ='',s=window.story.state.vars.mine;
    window.story.state.tmp.args[1] = window.story.state.tmp.args[1]||{blast:false}; //buffers data between calls
    if(s[FoeId]<=0) {
        let tmp = window.gm.player.location.slice(0,window.gm.player.location.lastIndexOf('_'));
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
            msg+= '<hr><a href="javascript:void(0)" onclick="window.gm.printMinePodCombat(\"'+FoeId+'\",\"Crowbar\")">use Crowbar</a></br>'//;window.gm.printLink('use Crowbar','window.gm.printMinePodCombat(\"'+FoeId+'\",\"Crowbar\")');
        }
    }
    return(msg);
}
window.gm.printMinePodCombat=function(FoeId,Weapon){
    let msg='',s=window.story.state.vars.mine;
    if(Weapon==='Crowbar') { //
        msg = 'you couldnt land a hit.'
    } else if(Weapon==='Sprayer') {
        window.story.state.tmp.args[1].blast+=1;
        msg = 'The color of the pod changes and it expands as well.'
        s[FoeId]+=-50;
    }
    if(s[FoeId]<=0) { 
        s[FoeId]=0;
        if(window.story.state.tmp.args[1].blast>1) {
            msg += '</br>The pod explodes in a fiery mess, scatering its remains around.</br>';
            if(s.qCoverallHP>0) {
                s.qCoverallHP=Math.max(0,s.qCoverallHP-10);
                msg += 'You got hit too and whatever was inside the pod, is now eating away your cloths!</br><statdown>clothing damage</statdown></br>';
                if(s.qCoverallHP<=0) msg += 'All of your overgarment is now falling apart. You use some of the shreds to wipe off the fluids from your skin.</br>';
            } else {
                msg += 'You got hit too and and you feel the goo stinging your skin. You should find something to wash it off !</br>';
            }
        } else {
            msg += '</br>The pod shakes violently but its content just squirts out from a wound at its side. The once proud bulb quickly deflates in a pitiable sag.</br>';
        }
    } 
    //back to combat passage
    msg+= window.gm.printLink('Next','window.story.show(window.gm.player.location)');
    window.story.state.tmp.args[0] = function() {window.gm.printOutput(msg,"section article div#choice");};
    window.story.show("GenericPassage");
}
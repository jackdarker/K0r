"use strict";
//constant declarations


//this will make sure the item-ctor are registered and it can be used as a lookup 
function createItemLookups(){
    window.gm.ItemsLib = {};
    //window.gm.ItemsLib['TailCat'] = new TailCat();

    //register constructors for reviver or your loaded save will not work !
    //...items
    //window.storage.registerConstructor(LighterDad);
    
  
    //mapping from passage-locations to background images
    window.gm.getScenePic = function(id){
        if(id==='Garden' || id ==='Park')   return('assets/bg_park.png');
        return('assets/bg_park.png');//todo placehodler
    }
}
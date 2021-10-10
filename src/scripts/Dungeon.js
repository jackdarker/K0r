"use strict";
/* bundles some operations related to dungeon navigation */
window.gm = window.gm || {};
window.gm.dng = window.gm.dng || null; //{};

//represents a button the player can press for directions N,E,S,W; this will also be used to generate the map
//if you have to connect 2 rooms, you have to define direction in both of them
class DngDirection{
    //creates direction between 2 rooms and assigns them to them; you can then modify them
    static createDirection(DirEnum, RoomA, RoomB, onlyAtoB=false) {
        var Label = DngDirection.DirEnumToString(DirEnum);
        var DirAtoB = new DngDirection(DirEnum,Label, "");
        var inverseDir = DngDirection.inverseDirection(DirEnum);
        var backLabel = DngDirection.DirEnumToString(inverseDir);
        var DirBtoA = new DngDirection(inverseDir,backLabel, "");
        DirBtoA.oneWay=onlyAtoB;
        DirAtoB.roomA = DirBtoA.roomB = RoomA;
        DirAtoB.roomB = DirBtoA.roomA = RoomB;
        if(RoomA != null) RoomA.setDirection(DirEnum, DirAtoB);
        if(RoomB != null ) RoomB.setDirection(inverseDir, DirBtoA);
    }
    //returns the opposite direction f.e up-down
    static inverseDirection(DirEnum) {
        switch(DirEnum) {
            case DngDirection.DirN: 
                return DngDirection.DirS;
                break;
            case DngDirection.DirS: 
                return DngDirection.DirN;
                break;
            case DngDirection.DirE: 
                return DngDirection.DirW;
            case DngDirection.DirW: 
                return DngDirection.DirE;
                break;
            case DngDirection.StairDown: 
                return DngDirection.StairUp;
                break;
            case DngDirection.StairUp: 
                return DngDirection.StairDown;
                break;
            default: 
                break;
        }
        return 0;
    }
    //converts direction enum to label
    static DirEnumToString(DirEnum) {
        var backLabel = "";
        switch(DirEnum) {
            case DngDirection.DirN: 
                backLabel = "N";
                break;
            case DngDirection.DirS: 
                backLabel = "S";
                break;
            case DngDirection.DirE: 
                backLabel = "E";
                break;
            case DngDirection.DirW: 
                backLabel = "W";
                break;
            case DngDirection.StairUp: 
                backLabel = "Stair up";
                break;
            case DngDirection.StairDown: 
                backLabel = "Stair down";
                break;
            default: 
                break;
        }
        return backLabel;
    }
    //Enum for possible directions  ??static DirS = 2; doesnt work ??
    static get DirW() { return(4); }
    static get DirE() { return(3); }
    static get DirN() { return(1); }
    static get DirS() { return(2); }
    static get StairUp() { return(6); }
    static get StairDown() { return(5); }
           
    // default functions for callbacks
    static FALSE(Me) { return false; };
    static TRUE(Me) { return true; };
    
    constructor(dirEnum,name,descr){	
        this.name = name,this.descr = (descr===null) ? function() {return(name)}:descr;
        this.direction = dirEnum;
        this.oneWay=false;
        this.onExitFct= this.onEnterFct = null; //should return true if something is happening (aborts other fct-evaluation! )
        this.canExitFct= null;
        
        this.roomA //DngRoom;	//source room
        this.roomB//:DngRoom;	//target room
        this.tooltip="";//:String = "";	//tooltip of the button
    }
    //gets called when player enters from this direction
    onEnter() { 
        if (this.onEnterFct == null) return false;
        return (onEnterFct(this));
    }
    //gets called when player  exits into this direction
    onExit() { 
        if (this.onExitFct == null) return false;
        return this.onExitFct(this);
    };
    //function to check if player can use this direction; you should also set tooltip for display
    canExit() { 
        if (this.canExitFct == null) return(!this.oneWay);
        return this.canExitFct(this); 
    }
    //the direction is hidden if one of the connected rooms is hidden
    hidden() {
        return (this.roomA.isHidden || this.roomB.isHidden);
    }
}
// a room connected by directions
class DngRoom {
    constructor(name,descr,hidden) {
        this.name = name, this.descr = (descr===null)?function(){ return(name)}:descr; 
        this.directions/*DngDirection*/ = [null, null, null, null, null, null];	//list of directions
        this.isHidden = hidden;
        //those you can adjust
        this.isDungeonExit = false; // player can leave to camp with Leave-button
        this.isDungeonEntry = false; //when entering the dungeon player will be coming from here; there should only be one of this
        this.operations/*DngOperations*/ = []; //list of additional operations (= buttons you can press)
        this.allowSave=false;
        this.onEnterFct = null; //should return true if something is happening, see also DngDirection.onEnterFct/onExitFct
        //internal
        this.origResumeFct = null;
        this.it;
        this.fromRoom;
    }
    //the floor where the room is assigned to
    get floor() {return this._parent();}
    setDirection(DirEnum, direction, invalid=false) { 
        this.directions.splice(DirEnum-1,1,direction);
    }
    getDirections() { return(this.directions);   }
    getDirection(DirEnum) { return (this.directions[DirEnum-1]);    }
    //this is called after the direction onEnter-Event was called
    onEnter() { 
        this.isHidden = false;
        if (this.onEnterFct == null) return false;
        return this.onEnterFct(this);
    }

    moveHere(from) {
        this.origResumeFct = this.floor.dungeon.inRoomedDungeonResume;
        this.fromRoom = from;
        this.it = 0;
        this.moveIterator();
    }

    // Whats that good for: onExit or onEnter might trigger an interaction/combat that we have to finish first befor displaying navigation buttons again.
    // iterator->onExit->startCombat->won->doNext(resume)->iterator
    
    moveIterator() {
        var dir;//DngDirection;
        var _it=0;//int = 0;
        //call Exit function from previous room
        var _dirs = this.fromRoom.getDirections();
        for(var i=0;i<_dirs.length;i++) {
            var element = _dirs[i];
            _it = _it +1; 
            if (element == null ) continue;
            if (_it <= this.it) continue;
            this.it = _it;
            dir = element;// as DngDirection;
            if (dir.roomA == this.fromRoom && dir.roomB==this) {
                if (dir.onExit())
                {
                    this.floor.dungeon.inRoomedDungeonResume = this.moveIterator
                    return;
                }
            }
        }
        //call Entry function of this room
        _dirs = this.getDirections();
        for(var i=0;i<_dirs.length;i++) {
            var element1 = _dirs[i];
            _it = _it +1; 
            if (element1 == null) continue;
            if (_it <= this.it) continue;
            this.it = _it;
            dir = element1;// as DngDirection;
            if (dir.roomA==this && dir.roomB == this.fromRoom) {
                if (dir.onEnter()) {
                    this.floor.dungeon.inRoomedDungeonResume = this.moveIterator
                    return;
                }
            }
        }
        _it = _it +1; 
        if (_it > this.it && this.onEnter()) {
            this.it = _it;
            this.floor.dungeon.inRoomedDungeonResume = this.moveIterator
            return;
        }
        
        this.floor.dungeon.inRoomedDungeonResume = this.origResumeFct;
        this.floor.dungeon.inRoomedDungeonResume();
    
    }
    //gets called when entering the floor or room; override it to update the other properties
    updateRoom() { };
}

//a floor of the dungeon
//a floor consist of several rooms that are arranged in a xy-coordinate system
//every room is connected up to 4 surrounding rooms, + stairs to lower/higher floor; 
class DngFloor {
    constructor(name,descr) {
        this.rooms = [];//list of rooms
        this.descr = (descr===null)?function(){ return(name)}:descr;
        this.name = name; //label of the floor 
    }
	
    /*addRoom(room) { 
        this.rooms.push(room);
    };*/
    setRooms(Rooms) { 
        this.rooms = Rooms;
        var found = null;
        for (var i=0; i<this.rooms.length;i++ ) {
            var element = this.rooms[i];
            if (element == null) continue;
            found = (element);
            if (found != null ) {
                //found.floor = this;
                found._parent = window.gm.util.refToParent(this);
            }
        }
    };
    get dungeon() {return this._parent();}
    allRooms() {   return this.rooms;   }
    getRoom(Name) {
        var found = null;
        for (var i=0; i<this.rooms.length;i++ ) {
            var element = this.rooms[i];
            if (element == null) continue;
            found = (element);
            if (found.name == Name) {
                break;
            }
            found = null;
        }
        return found;
    }	
}
// an additional operation that the player can trigger by pressing a button
class DngOperation {
    constructor(name) {
        this.name=name; //label of the button
    };
    //function to check if player can use this button
    canTrigger() { return false; }
    //override this to do something;
    /* f.e set window.gm.dng.renderEvent to a function that creates a html-string (including links)
    then call window.story.show("DungeonGenericEvent") to render that event
    add a link that calls window.gm.dng.resumeRoom() to continue in dungeon
     */
    onTrigger() { };
}
/**
 * persistData should be a "pointer" to a location where to store dungeon data f.e. story.state.dng.myDungeon
 */
class DngDungeon	{
    constructor(name,descr) {
        this.name = name;//name of the dungeon
        this.descr= descr;//text diplayed when entering the dungeon
        let persistData = window.story.state.dng[name];
        if(persistData===undefined || persistData===null) {
            persistData = window.story.state.dng[name]=this.persistentDngDataTemplate(); 
        }
        this.data = persistData;
        this.floors =[];//list of Dngfloors
        this.actualRoom = null;
        this.Mapper = {};//DngMapper; 
        this.buttons=[];
        this.inRoomedDungeonResume = this.inRoomedDungeonDefeat = null;
    }
    //override this to return a data-object that will be used to store persistent data
    persistentDngDataTemplate() {return({});}
    setFloors(Floors) {  
        this.floors = Floors; 
        for(var i=0;i<this.floors.length;i++) {
            this.floors[i]._parent = window.gm.util.refToParent(this);
        }  
    }
    allFloors() {  return this.floors;   }
    getFloor(Name) {
        var found = null;
        for (var i=0; i<this.floors.length;i++ ) {
            found = this.floors[i];
            if (found == null) continue;
            if (found.name == Name) {
                break;
            }
            found = null;
        }
        return found;
    }
    //enters the dungeon; also does some checks to verify that dungeon was properly setup
    enterDungeon() {
        this.Mapper = new DngMapper();
        this.actualRoom = null;
        var Entry = null;
        var Exit = null;
        var Room;
        //search the dungeon-Entry, has to be in first floor
        var rooms = (this.floors[0]).allRooms();
        for (var i = 0; i < rooms.length; i++ ) {
            Room = (rooms[i]);
            if (Room.isDungeonEntry) {
                Entry = Room;
            }
            if (Room.isDungeonExit) {
                Exit = Room;
            }
        }
        if (Entry == null || Exit == null) {
            throw new Error('Error: Dungeon-Exit or Entry missing');
        }
        this.inRoomedDungeonDefeat = this.exitDungeon;
        this.moveToRoom(Entry);
       // playerMenu();
    }
    //used to exit the dungeon via Leave-button or by battledefeat
    //You need to override this to return to a proper passage with window.story.show
    //You should also set window.gm.dng=null to release memory
    exitDungeon() {
        window.gm.dng=null;
        window.story.state.dng.id = ""; //clear or load would send you into dng again
    }
    //similiar to moveTo except no onenter/onexit processing
    teleport(Room) {
        this.actualRoom = null;
        this.moveToRoom(Room);
    }
    //move to an ADJOINING room next to the actual one
    //this might trigger onenter/onexit scenes, those scenes should then call resumeRoom to finish room-swap
    moveToRoom(newRoom) {
        /*clearOutput();
        cheatTime(1 / 12);
        EngineCore.statScreenRefresh(true);
        //DungeonCore.setTopButtons();
        spriteSelect(-1);
        menu();*/
        var _actualRoom = this.actualRoom;
        this.actualRoom = newRoom;
        this.inRoomedDungeonResume = this.resumeRoom;
        if (_actualRoom != null) {
            newRoom.moveHere(_actualRoom); //this will trigger onExit/onEnter
        } else {   
            this.inRoomedDungeonResume();
        }
    }
    clearButtons() {
        this.buttons=[];
        for(var i=0;i<15;i++) { //up to 15 buttons
            this.buttons.push({name:"",disabled:true,func:null,data:null});
        }
    }
    addButton(bt, name, func,arg) {
        this.buttons[bt] = {name:name,disabled:false,func:func,data:arg};
    }
    addButtonDisabled(bt, name, arg) {
        this.buttons[bt] = {name:"-",disabled:true,func:null,data:arg};
    }
    //render 5x3 grid of buttons
    printButtons() {    
        //because click-event mapping this has to manipulate DOM-tree instead of just rendering html-code
        var table =document.createElement('table');
        var tbody =document.createElement('tbody');
        table.appendChild(tbody);
        for(var y=0;y<3;y++) {
            var tr =document.createElement('tr')
            tbody.appendChild(tr);
            for(var x=0;x<5;x++) {
                //<a0 onclick=getBanana(this,5)>Get more banana</a>
                var td=document.createElement('td');
                tr.appendChild(td);
                var entry = document.createElement('a');
                entry.href='javascript:void(0)';
                entry.addEventListener("click", 
                    this.buttons[y*5+x].func ? (function(me,bt){ 
                        return(bt.func.bind(me,bt.data));}(this,this.buttons[y*5+x]))
                        : null);
                entry.textContent=this.buttons[y*5+x].name;
                entry.disabled=this.buttons[y*5+x].disabled;
                td.appendChild(entry);
                //$("div#panel")[0].appendChild(entry);
            }
        }
        $("div#panel")[0].appendChild(table);

    }
    resumeRoom() {
        /*		Menu Layout
            * 		[ Op1 ]	[ Op2 ]	[ Op3 ]	[ Op4 ]	[More ]
            * 		[ Up  ]	[  N  ]	[Down ]	[Mast ]	[     ]
            * 		[  W  ]	[  S  ]	[  E  ]	[ Inv ]	[ Map ]
            *  
            */
        this.clearButtons();
        this.actualRoom.updateRoom();
        var bt;
        var btMask = 0xE;
        this.actualRoom.getDirections().forEach( function(element, index, arr) {
            var Dir = element;
            if (Dir == null) return;
            bt = Dir.direction;
            if (bt == DngDirection.DirN) bt = 6;
            else if (bt == DngDirection.DirS) bt = 11;
            else if (bt == DngDirection.DirE) bt = 12;
            else if (bt == DngDirection.DirW) bt = 10;
            else if (bt == DngDirection.StairDown) bt = 7;
            else if (bt == DngDirection.StairUp) bt = 5;
            if(Dir.canExit()) {
                this.addButton(bt, Dir.name, this.moveToRoom, Dir.roomB);
            }else {
                this.addButtonDisabled(bt, Dir.name, Dir.tooltip);
            }
            btMask = btMask ^ (1 >>> bt);
        },this);
        //if (player.lust >= 30) addButton(8, "Masturbate", SceneLib.masturbation.masturbateGo);
        //addButton(13, "Inventory", inventory.inventoryMenu).hint("The inventory allows you to use an item.  Be careful as this leaves you open to a counterattack when in combat.");
        this.addButton(14, "Map", this.displayMap);//.hint("View the map of this dungeon.");
        bt = 0;
        for(el of this.actualRoom.operations) {
            if(bt>4) break;
            if(el===null) continue;
            if(el.canTrigger()) this.addButton(bt, el.name, el.onTrigger);
            else this.addButton(bt, el.name, "");
            bt+=1;
        }
        if(this.actualRoom.isDungeonExit) {
            for (var i = 5; i < 15; i++ ) {	//find an empty navigation button for leave
                bt = i;
                if ( ((btMask << i) & 1) == 0) break;
            }
            this.addButton(bt, "Leave", this.exitDungeon, false);
        }
        //add _nosave_ tag except allowed; because there could be some fct running in each room, it would be diffivcult to recover those after save
        //only allow save where nothing special is happening !
        let tags = window.story.passage("Dungeon").tags;
        for(var i=tags.length-1;i>=0;i--) {
            if(tags[i]==='_nosave_') tags.splice(i,1);
        }
        if(!window.gm.dng.actualRoom.allowSave) {  //todo should we allow defferedEvents or could this mess with onEnter/onExit-calls?
            tags.push('_nosave_');
        } 
        let _state = window.story.state.dng;
        _state.roomId =  this.actualRoom.name;
        _state.id = this.name;
        _state.floorId = this.actualRoom.floor.name;
        window.story.show("Dungeon"); //call the scene
    }
    //shows a map-screen
    displayMap() {
        //this.Mapper.createMap(this.actualRoom.floor);
        window.story.show("DungeonMap");
    }
}
// a helper class to store info for a room
class DngMapperInfo {
    constructor() {    
        this.X = this.Y = 0;
        this.Name="";
        this.Hidden=false;
        this.Connect= 0;	//bitwise encoding of directions
    }  
}
// builds the map from the dungeons info and actualRoom
// it is expected that all rooms in a floor are somehow connected with each other - no isolated rooms !
class DngMapper { 
    constructor()   {
        this.dungeon = this.floor=null;
        this.allInfo=[];
        this.maxX=this.maxY=this.minX=this.minY=0;
    }
    //todo only show parts of the map the player already visited or knows off - but this would bloat save
    createMap(Floor) {
        this.floor = Floor;
        var allrooms = Floor.allRooms();
        var roomIndexs = [];
        this.allinfo = new Array(allrooms.length);
        var dirs;
        var dir;//:DngDirection;
        var room,room2;
        var x,y,m;
        var roomInfo = new DngMapperInfo();
        var roomInfo2 ;
        roomInfo.X = x = this.maxX = this.minX = 0;
        roomInfo.Y = y = this.maxY = this.minY = 0;
    /*  put 1.room of actual floor to dictionary, set coord XY ={0,0]
        *  get next room from dictionary until no more
        *  	for every direction of room
        * 			get targt room and place into dictionary
        * 			depending of direction, add flags to source & target room
        * 			calculate coord of target room  (f.e. direction =E then X/Y = {+1 , +0})
        * 		...
        *  ...
        */ 
        this.allinfo[0] = roomInfo;
        roomIndexs[0] = 0;
        for (var i = 0; i < roomIndexs.length; i++ ) { //allrooms.length??
            m = (roomIndexs[i]);
            room = (allrooms[m]);
            roomInfo = (this.allinfo[m]);
            roomInfo.Name = room.name;
            roomInfo.Hidden = roomInfo.Hidden || room.isHidden;
            dirs = room.getDirections();
            for (var k=0; k < dirs.length; k++ ) {
                if (dirs[k] == null) continue;
                dir = dirs[k];
                room2 = dir.roomB;
                roomInfo.Connect = roomInfo.Connect + (1 << dir.direction);
                m = allrooms.indexOf(room2);
                if (m >= 0) {	//create new roominfo and set coordinate
                    roomInfo2 = new DngMapperInfo();
                    roomInfo2.Hidden = dir.hidden();
                    roomInfo.Entry = room.isDungeonEntry || room.isDungeonExit;
                    roomInfo.Save = room.allowSave;
                    switch (dir.direction) {
                        case DngDirection.DirN: 
                            roomInfo2.X = roomInfo.X;
                            roomInfo2.Y = roomInfo.Y-1;
                            break;
                        case DngDirection.DirS: 
                            roomInfo2.X = roomInfo.X;
                            roomInfo2.Y = roomInfo.Y+1;
                            break;
                        case DngDirection.DirE: 
                            roomInfo2.X = roomInfo.X+1;
                            roomInfo2.Y = roomInfo.Y;
                            break;
                        case DngDirection.DirW: 
                            roomInfo2.X = roomInfo.X-1;
                            roomInfo2.Y = roomInfo.Y;
                            break;
                        default:
                            break;
                    }
                    if (roomInfo2.X < this.minX) this.minX = roomInfo2.X;
                    if (roomInfo2.X > this.maxX) this.maxX = roomInfo2.X;
                    if (roomInfo2.Y < this.minY) this.minY = roomInfo2.Y;
                    if (roomInfo2.Y > this.maxY) this.maxY = roomInfo2.Y;
                    if (roomIndexs.indexOf(m) < 0) 
                    {
                        roomIndexs.push(m);
                        this.allinfo[m] = roomInfo2;
                    }
                }
            }
        
        }

        return;
    }

    /* now we have a dictonary of all rooms, their coordinate and flags
        * create 2DArray of size ( 2*(maxX-minX) , 2*(maxY-minY)) ; even indices store rooms "[ ]", uneven indices store directions " - "
        * for every room in dictionary
        * 		update Array[2*(X-minX)][2*(Y-minY)] with room-information
        * 		update Array[2*(X-1-minX)][2*(Y-0-minY)] with W-direction
        * 		update Array[2*(X-0-minX)][2*(Y-1-minY)] with N-direction
        * 		aso.
        * ...
        * now we can print something like this:
        * 	[ ]-[ ]-[ ]-[S]
        *   |	 |	 |   |	
        *  [ ]-[P]-[ ]-[ ]
    */
    printMap(playerRoom, minimap) { //Todo use images or special font instead ascii?
        var _line ="";
        var map=[];
        var roomInfo;
        var i,j;
        var playerX=0, playerY=0;
        this.createMap(playerRoom.floor); //todo only recreate if necessary
        //create 2d-array to store textual representation of room and connection between them
        map = new Array(2*(this.maxX - this.minX)+1); 
        for (i = 0; i < map.length; i++) {  
            var submap = new Array(2*(this.maxY - this.minY)+1); 
            for (j = 0; j < submap.length; j++) {   
                submap[j] = "   ";   
            }
            map[i] = submap;
        }
        //convert the MapperInfo to textual representation
        for (i = 0; i < this.allinfo.length; i++ ) {
            if (this.allinfo[i] == null) continue;
            roomInfo = this.allinfo[i] ;
            _line = " ";
            if ((roomInfo.Connect & (1 << DngDirection.StairDown)) ||
                (roomInfo.Connect & (1 << DngDirection.StairUp)) ) {
                _line = "&ang;";
            }
            if (playerRoom != null && playerRoom.name == roomInfo.Name) {
                _line = "P";
                playerX=roomInfo.X, playerY= roomInfo.Y;
            }
            if (roomInfo.Save && playerRoom.name != roomInfo.Name) {
                _line = "S";
            }
            if (roomInfo.Entry && playerRoom.name != roomInfo.Name) {
                _line = "E";
            }
            //each room/connection has to be 3 chars long or it will messup formatting !
            //todo format as table?
            if (!roomInfo.Hidden) {
                _line = "[" +_line+ "]";
                map[2 * (roomInfo.X - this.minX)][2 * (roomInfo.Y - this.minY)] = _line; 
            
                if ((roomInfo.Connect & (1 << DngDirection.DirN))) {
                    _line = " | ";
                    map[2 * (roomInfo.X - this.minX) + 0][2 * (roomInfo.Y - this.minY) - 1] = _line;
                }
                if ((roomInfo.Connect & (1 << DngDirection.DirE))) {
                    _line = " - ";
                    map[2 * (roomInfo.X - this.minX) + 1][2 * (roomInfo.Y - this.minY) + 0] = _line;
                }
                if ((roomInfo.Connect & (1 << DngDirection.DirS))) {
                    _line = " | ";
                    map[2 * (roomInfo.X - this.minX) + 0][2 * (roomInfo.Y - this.minY) + 1] = _line;
                }
                if ((roomInfo.Connect & (1 << DngDirection.DirW))) {
                    _line = " - ";
                    map[2 * (roomInfo.X - this.minX) - 1][2 * (roomInfo.Y - this.minY) - 0] = _line;
                }
            }
        }
        //print
        _line = "<pre>"; //pre-formatted or messup allignment of ascii-rows
        if(minimap) { //only print rooms 1 step around player
            _line += this.floor.name +"</br>";
            let x,y;
            for (j= -3; j <= 3; j++) {   
                for (i = -3; i <= 3; i++) {
                    x=i+(playerX- this.minX)*2, y=j+(playerY-this.minY)*2; //coord can be negative ! 
                    if(map.length-1<x || 0>x) continue;   
                    if(map[x].length-1<y || 0>y) continue;           
                    _line += ((i==-3)?"&nbsp;":"")+map[x][y]; //todo hack:if line starts with -, snowman-markdown interprets this as <ul> ?!
                }
                _line +="\n";
            }
        } else { //full map of floor
            _line += (this.floor.dungeon.name + " " + this.floor.name +"</br>");
            for (j= 0; j < (2 * (this.maxY - this.minY) + 1); j++) {   
                for (i = 0; i < (2*(this.maxX - this.minX)+1); i++) { 
                    _line += map[i][j];
                }
                _line += "\n";
            }
            _line += "<pre>Legend: P=Player, &ang;=Stair, E=Entry/Exit S=Save</pre></br>";
        }
        _line += "</pre>";
        return _line;
    }
}
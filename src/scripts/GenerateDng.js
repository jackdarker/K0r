//UMD export from https://github.com/umdjs/umd/blob/master/templates/returnExports.js
//TODO if this module requires something, enable code with b
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory); //define(['b'], factory);  
    } else if(typeof module === 'object' && typeof module.exports === 'object'){//(typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();//module.exports = factory(require('b'));
    } else {
        // Browser globals (root is window)
        root.GenerateDng = factory();//root.returnExports = factory(root.b);
    }
}(typeof self !== 'undefined' ? self : this, function () {//function (b) {// Use b in some fashion.
    class Room{ //a room here means 5 tiles arranged as a cross
        constructor(){
            this.pos = [0,0];
            this.sectiles =[[0,0],[0,-1],[0,1],[-1,0],[1,0]]; //tile coord. relativ to maintile
            this.dirs =[];
            this.setPosition(this.pos);
        }
        setPosition(pos){
            this.pos=pos;
            this.tiles = this.sectiles.map((x)=>{return([x[0]+this.pos[0],x[1]+this.pos[1]])}); //tile coord. absolute
        }
        getAddress(){return(this.pos[0]+'_'+this.pos[1]);}
    }
    /** Generates a map made from cross-patterned rooms 
    * 
    */
    class Generator {
        constructor(){  }
        //resets state of generator
        reset(){
            this.length=1;
            this.minX=0,this.minY=0,this.maxX=0,this.maxY=0;
            this.mainrooms = [];  // [ '1_3',... ]
            this.doors =[]; //[ [ [1,1],[0,1] ],... ]
            this.room = new Room();
            this.grid = new Map(); //structure depends on state of generation!
            this.placeRoom(this.room);            
        };
        intersects(newRoom){ //is the new structure intersecting with existing ones?   
            let inter=[],rooms = Array.from(this.grid.values()),newtiles=newRoom.tiles;
            for(var i=rooms.length-1;i>=0;i--){
                let tiles=rooms[i].tiles;
                for(var k =newtiles.length-1;k>=0;k--){
                    for(var l =tiles.length-1;l>=0;l--){
                        if(newtiles[k][0]===tiles[l][0] && newtiles[k][1]===tiles[l][1]) {
                            return(true);
                        }
                    }
                }
            }
            return(false);
        }
        placeRoom(newRoom){ //place a roomtemplate on grid
            this.grid.set(newRoom.getAddress(),newRoom);
            for(var k=newRoom.tiles.length-1;k>=0;k--){//add doors to templates
                this.minX=Math.min(this.minX,newRoom.tiles[k][0]),this.minY=Math.min(this.minY,newRoom.tiles[k][1]);
                this.maxX=Math.max(this.maxX,newRoom.tiles[k][0]),this.maxY=Math.max(this.maxY,newRoom.tiles[k][1]);
                for(var l=newRoom.tiles.length-1;l>=0;l--){
                    if( this.isNeighbour(newRoom.tiles[k],newRoom.tiles[l])){ //tiles directly beside each other?
                        this.doors.push([newRoom.tiles[k],newRoom.tiles[l]]);
                    }
                }
            }
            this.mainrooms.push(newRoom.getAddress());
        }
        isNeighbour(tileA,tileB){ //are 2 tiles neigbors
            //yes: [1,0] & [1,-1]     [2,-1] & [1,-1]
            //no:   [-1,0] & [1,-1]
            let tx=tileA[0]-tileB[0],ty=tileA[1]-tileB[1];
            if( (tx===0 && (ty===1 || ty ===-1)) || (ty===0 && (tx===1 || tx ===-1)))return(true);
            return(false);
        }

        furnishRooms(){ //furnish the rooms
            let _r,i=0,k=0,visuals = ['bigtree','bushes','meadow','trees']
            let uniques = ['entry','appletree','brokencabin','totem','hollowtreestump','mushroom']

            let _UnusedRooms = Array.from(this.grid);

            //scatter uniques semi-randomly:
            while(uniques.length>0){ //repeat until uniques done
                i=_.random(0,_UnusedRooms.length-1);
                _r=_UnusedRooms.splice(i,1)[0][1]; //splice returns array [key,value] !
                _r.visuals=uniques.pop();
                if(_r.visuals==="entry") _r.anno='E';
                //this.grid.set(_r.room,_r);
            }
            //remaining unused rooms get other visuals but make sure that each visual occurs at least once
            k=visuals.length;
            if(k>0){
                while(k>0){ //repeat until uniques done
                    k--;
                    i=_.random(0,_UnusedRooms.length-1);
                    _r=_UnusedRooms.splice(i,1)[0][1];         //TODO Exception if not enough room
                    _r.visuals=visuals[k];
                    //this.grid.set(_r.room,_r);
                }
                while(_UnusedRooms.length>0){ //repeat until done
                    k=_.random(0,visuals.length-1);
                    _r=_UnusedRooms.pop()[1];
                    _r.visuals=visuals[k];
                    //this.grid.set(_r.room,_r);
                }
            }
        }
        toCoord(tile){ //translates the numeric coord. into a name
            const X=['A','B','C','D','E','F','G','H','I','J','K','L','M','N'];
            const Y=['0','1','2','3','4','5','6','7','8','9'];
            switch(this.params.naming){
                case 'A1': return(X[tile[0]-this.minX]+Y[tile[1]-this.minY]); //returns 'E5', also shifts Position as smallest value is A1
                break;
                case '12_1': return((tile[0]-this.minX)+'_'+(tile[1]-this.minY)); //smallest value is 0, no negatives
                break;
                case '12_01': return(window.gm.util.formatInt(tile[0]-this.minX,false,2)+
                    '_'+window.gm.util.formatInt(tile[1]-this.minY,false,2));    //smallest value is 00, no negatives
                case '-12_+01': return(window.gm.util.formatInt(tile[0],true,2)+
                    '_'+window.gm.util.formatInt(tile[1],true,2));              //negatives can occur
                break;
            }
        } 
        sanitizeDoors(){    //remove double entries of doors
            let _sane =[];
            for (let y of this.doors.values()){
                if(_sane.find((el)=>{return((y[0]===el[0] && y[1]===el[1]) || (y[0]===el[1] && y[1]===el[0]))})) {
                    continue;
                }
                _sane.push(y);
            }
        }
        carveRooms(){  //
            let pos,n,branched=0;
            let slots =[[-2,-1],[2,1],[-2,1],[2,-1],[-1,-2],[1,-2],[-1,2],[1,2]]; //relative coord. around a cross-pattern where new patterns could be placed
            while(this.length<this.params.length){
                n = Array.from(slots); 
                n.sort(() => Math.random() - 0.5);// scramble array TODO could be used to control where the next room is added like placing them as line or spiral
                let newRoom= new Room();
                while(true){
                    pos = n.pop();
                    newRoom.setPosition([pos[0]+this.room.pos[0],pos[1]+this.room.pos[1]]);
                    //check if newRoom would intersect with present rooms
                    if(!this.intersects(newRoom)) {
                        this.placeRoom(newRoom);
                        //find neigboring tiles of new and previous room and build main doors 
                        var brk=false;
                        for(var k=newRoom.tiles.length-1;k>=0 && brk===false ;k--){
                            for(var l=this.room.tiles.length-1;l>=0 && brk===false;l--){
                                if( this.isNeighbour(newRoom.tiles[k],this.room.tiles[l])){ //tiles directly beside each other?
                                    this.doors.push([newRoom.tiles[k],this.room.tiles[l]]);
                                    brk=true;
                                }
                            }
                        }
                        this.length+=1;
                        //create branch
                        //after adding a room, there is a chance to select a previous mainroom to continue on instead of extending from current mainroom
                        if(branched<this.params.branches) {
                            var x = Math.round((this.params.length-1)*Math.random()); //likelyness to branch should increase with length
                            if(x<(this.mainrooms.length-1)) {
                                this.room = this.grid.get(this.mainrooms[x]);
                                branched+=1;
                            } else this.room = newRoom;
                        } else this.room = newRoom; //memorize for next iter
                        break;
                    }
                }
            }           
            let _allrooms = [];
            for (let x of this.grid.values()){
                for (let y of x.tiles.values()){
                    _allrooms.push(y);
                }
            }
            //build additional doors between templates
            for(var i=1;i<this.mainrooms.length;i++){//walk each mainroom
                let brk,ra=this.grid.get(this.mainrooms[i]);
                let n=this.params.doors,tiles= ra.tiles;
                for (let x of _allrooms.values()){
                    for(var k=tiles.length-1; k>=0 && n>0;k--){
                        //select a random tile and check neighbours from other mainrooms
                        if(tiles.includes(x)) continue; //only tiles from others
                        if(this.isNeighbour(tiles[k],x)){ //create door to neighbour, if there is already one skip ahead
                            this.doors.push([tiles[k],x]);
                            n--;
                            if(n<=0) break;
                        }
                        //repeat n times or no more tiles
                    }
                }
            }
            this.sanitizeDoors();
            //restructure to:
            //{grid:new Map(_grid.map((x)=>{return([x.room,x]);})),width:14,height:8,legend:''}
            //where x= {room:'D2', dirs:[{dir:'E2'}]},
            let _grid=[];
            for (let x of this.grid.values()){
                let pos,dirs;
                for(var i=x.tiles.length-1;i>=0;i--){
                    dirs=[]; //doors defined for this tile?
                    for(var k=this.doors.length-1;k>=0;k--){
                        if(this.doors[k][0]==x.tiles[i] ) {
                            dirs.push({dir:this.toCoord(this.doors[k][1])});
                        } else if(this.doors[k][1]==x.tiles[i] ) {
                            dirs.push({dir:this.toCoord(this.doors[k][0])});
                        }
                    }
                    pos=this.toCoord(x.tiles[i]);
                    _grid.push({room:pos,dirs:dirs})
                }
            }
            this.grid = new Map(_grid.map((x)=>{return([x.room,x]);}));
        }
        /**
         *  generates new map and returns it
         * @memberof Generator
         * @param {params} params
         * 
         * parameter options:
         * length: length of rooms chained, default 4
         * doors: additional doors between template, default none
         * naming: namingstyle of rooms , see toCoord: A1 (max = N9 ! ); 12_1 ; 12_01 (default); -12_+01
         * branches: defines if mainrooms can branch out: default 0; 2 means there could be 2 forks
         */
        generate(params){
            this.params=params||{};
            this.params.length = (this.params.length)?this.params.length:4;
            this.params.doors = (this.params.doors)?this.params.doors:0;
            this.params.naming = (this.params.naming)?this.params.naming:'12_01';
            this.params.branches = (this.params.branches)?this.params.branches:0;
            this.params.progress = (this.params.progress)?this.params.progress:function(){}; //TODO display generation progress 
            this.reset();
            this.carveRooms();
            this.furnishRooms();
            //TODO remove unused rooms with single door



            return({grid:this.grid,width:this.maxX-this.minX+1,
                height:this.maxY-this.minY+1,legend:'E:Exit  B:Boss'});
        }

    }
    return {DngGen:new Generator()};
}));
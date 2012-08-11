(function() {

var express = require('express')
  , http = require('http');
  
var app = express();
var server = http.createServer(app);


	var io;
	var whiteboards = {};
	var whiteboardsXML = {};
	var whiteboardsSaveVersionBucket = {};
	var whiteboardsUserCountAtVersionSaveRequest = {};
	var users = {};
	
	const TABLE = 'whiteboard';
    const TABLE_VERSION = 'whiteboard_versions';
    
	var check = require('validator').check;
    var sanitize = require('validator').sanitize;
    
var databaseUrl = 'wb1:ganesh123@alex.mongohq.com:10027/whiteboard1';
//var databaseUrl = "localhost/whiteboard";
var collections = ["whiteboards"];

var db =require("mongojs").connect(databaseUrl,collections);
    
	io = require('./node_modules/socket.io').listen(server);
//	io.set( 'resource', '/nodejs/socket.io' );
	console.log('************* WHITEBOARD SERVER IS READY *************');
	
app.use("/css", express.static(__dirname + '/css'));
app.use("/js", express.static(__dirname + '/js'));
app.use("/images", express.static(__dirname + '/images'));
app.use("/locale", express.static(__dirname + '/locale'));
	
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});
	
	
	io.sockets.on('connection', function(socket) {

		function broadcastExceptMe(whiteboardName,event,dataToBeSent,entityUUID)
		{
			var wbusers = whiteboards[entityUUID+'_'+whiteboardName];		
			if(wbusers)
			{	
				var i =0;
				for(i=0;i<wbusers.length;i++) 
				{
				     if(users[entityUUID+'_'+whiteboardName+'_'+wbusers[i]] && users[entityUUID+'_'+whiteboardName+'_'+wbusers[i]] != socket) {			    	 
				    	 users[entityUUID+'_'+whiteboardName+'_'+wbusers[i]].emit(event,dataToBeSent);
				     }
				 }			
			}
			else
				console.log('no users exist for ' + whiteboardName);
			
		}
		
		function broadcastAll(whiteboardName,event,dataToBeSent,entityUUID)
		{
			var wbusers = whiteboards[entityUUID+'_'+whiteboardName];		
			if(wbusers)
			{	
				var i =0;
				for(i=0;i<wbusers.length;i++) 
				{
					users[entityUUID+'_'+whiteboardName+'_'+wbusers[i]].emit(event,dataToBeSent);
				}			
			}
			else
				console.log('no users exist for ' + whiteboardName);
			
		}
		

		
		socket.on('userConnect',function(data){
			console.log('user connecting');
			console.log(data);
			var userId = data.user.userId;
			var userName = data.user.userName;
			var userColor = data.user.userId;
			var whiteboardName = data.whiteboard;
			var entityUUID = data.entityUUID; 
			var whiteboardId = null;
			var wbUsers;
			socket.userId = userId;
			socket.userName = userName;
			socket.whiteboardName = whiteboardName;
			socket.entityUUID = entityUUID;
			socket.whiteboardId = null;
			//store user socket in global array
			users[entityUUID+'_'+whiteboardName+'_'+userId] = socket;
			
			if(whiteboards[entityUUID+'_'+whiteboardName])
			{
				//old whiteboard				
				//getWhiteboardId
				db.whiteboards.find({whiteboard_name : data.whiteboard},function(err,objects){

					if(err || !objects)
					{
						console.log('>>>>>>>>>> ERROR <<<<<<<<<<<<');
						console.log(err);
					}
					else 
					{
						//if found
						if(objects.length)						
						{
						
							whiteboardId = objects[0]._id;
							socket.whiteboardId = objects[0]._id;
							
							wbUsers = whiteboards[entityUUID+'_'+whiteboardName];
							if(wbUsers[userId]===undefined || wbUsers[userId]===null)
							{
								for(i=0;i<wbUsers.length;i++) 
								{
									users[entityUUID+'_'+whiteboardName+'_'+wbUsers[i]].emit('userJoined',userName + ' has joined the discussion.');
								}
													
								wbUsers.push(userId);
								whiteboards[entityUUID+'_'+whiteboardName] = wbUsers;
								if(whiteboardsXML[entityUUID+'_'+whiteboardName])
									socket.emit('connectAck',whiteboardsXML[entityUUID+'_'+whiteboardName],whiteboardId);
							
							}
							else
								console.log('User already exist');
							
						}
					}
				});				
				
			}
			else
			{
				console.log('new white board');
				// new whiteboard
				wbUsers = [];
				wbUsers.push(userId);				
				whiteboards[entityUUID+'_'+whiteboardName] = wbUsers;
				//queryFactory.selectWhiteboard
				//queryFactory.insertWhiteboard
				
				db.whiteboards.find({"whiteboard_name" : whiteboardName},function(err,objects){
					if(err)
					{
						console.log('>>>>>>>>>>> Error finding new whiteboard <<<<<<<<<<<');
						console.log(err);
					}
					else
					{
						//if found
						if(objects.length)
						{
							console.log("inside connectAck");
							console.log(objects)
						    whiteboardsXML[entityUUID+'_'+whiteboardName]=objects[0].xml;
							socket.whiteboardId = objects[0]._id;
						    socket.emit('connectAck',whiteboardsXML[entityUUID+'_'+whiteboardName],socket.whiteboardId);						
						}
						else //not found
						{
							db.whiteboards.save({ "whiteboard_name" : whiteboardName, "xml":""},function(err,objects){
								
								if(err || !objects)
								{
									console.log('>>>>>>> Error occurred while saving ' + whiteboardName + ' <<<<<<<');
									console.log(err);
								}
								else
								{	
										if(objects.length)
										{
											socket.whiteboardId = objects[0]._id;
											socket.emit('connectAckNewWhiteboard',objects[0]._id);
											whiteboardsXML[entityUUID+'_'+whiteboardName]=objects[0].xml;
										}
								}
								
							});	
						}
					}
				});
				
			console.log(whiteboards);
		}
		});
		
		socket.on('drawClick', function(data) {
			console.log(data);
			var wbusers = whiteboards[data.entityUUID+'_'+data.whiteboard];
			
			if(wbusers)
			{	
				if(data.completeXML)
					whiteboardsXML[data.entityUUID+'_'+data.whiteboard] = data.completeXML;
				
					var whiteboardName = data.whiteboard;
		    	
					broadcastExceptMe(whiteboardName,'draw',data.xml,data.entityUUID);									
			
			/******** Insert into database START **********/
			
				if(data.completeXML)
				{
					console.log('inserting into database');
					try
					{
						db.whiteboards.update({ whiteboard_name : data.whiteboard},{$set:{xml : data.completeXML}},true,function(err,objects){
							if(err || !objects)
							{
								console.log('>>>>>>> Error occurred while saving into db <<<<<<<<<');
							}
							else
							{
								console.log('saved');
								console.log(objects);
							}
						});
					}
					catch(exp)
					{
						console.log(exp);
					}
				}
			}
			else
				console.log('no users exist for ' + data.whiteboard);

			/******** Insert into database END **********/

		});

		socket.on('disconnect',function(){
			
			var userId = socket.userId ;
			var userName = socket.userName ;
			var whiteboardName = socket.whiteboardName;
			var entityUUID = socket.entityUUID;
			var combinedId = entityUUID+'_'+whiteboardName+'_'+userId;			
			var wbusers = whiteboards[entityUUID+'_'+whiteboardName];
			
				
			if(wbusers)
			{
				var index = wbusers.indexOf(userId);
				wbusers.splice(index,1);
				
				broadcastExceptMe(whiteboardName,'userLeft',userName + ' has left the discussion.',entityUUID);
			}
			
			if(users[combinedId])
				delete users[combinedId];

			console.log(whiteboards);
			
		});
		
		socket.on('userChatSend',function(data){
			console.log('userChatSend');
			console.log(data);
			
			var wbusers = whiteboards[data.entityUUID+'_'+data.whiteboard];
			if(wbusers)
			{
				console.log('sanitizing');
				var message = sanitize(data.message).entityEncode();
				message = sanitize(message).xss();
				console.log(message);
				//var message = data.message;								
				broadcastAll(data.whiteboard,'userChatReceive',{'color' : data.user.userColor,'sender':data.user.userName, 'message':message},data.entityUUID);
			}
			else
				console.log('no users exist for ' + data.whiteboard);			
		});
		
	
	});
	
	server.listen(4000);
}).call(this);

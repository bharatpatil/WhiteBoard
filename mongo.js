(function(){

var databaseUrl = "localhost/whiteboard";
var collections = ["whiteboards"];

var db =require("mongojs").connect(databaseUrl,collections);

//db.whiteboard.colle


db.whiteboards.save({whiteboard_name : 'bharat',xml:'<?xml version="1.0" encoding="utf-8" ?>\n<sql>\n<table id="1343722850115__bharat_1_1343722858591" x="643" y="46" name="new block">\n<row name="Empty Description">\n</row>\n</table>\n</sql>\n'}, function(err,objects){
	if(err || !objects) 
	{
		console.log('>>>>>>> Error occurred while saving new whiteboard');
	}
	else
	{
		console.log('saved');
		console.log(objects);
	}
	
});

db.whiteboards.update({whiteboard_name : 'bharat'},{$set : {xml:''}});

db.whiteboards.update({whiteboard_name : 'bharat'},{$set : {xml:'<?xml version="1.0" encoding="utf-8" ?>\n<sql>\n<table id="1343722850115__bharat_1_1343722858591" x="643" y="46" name="new block">\n<row name="Empty Description">\n</row>\n</table>\n</sql>\n'}}, function(err,objects){
	if(err || !objects) 
	{
		console.log('>>>>>>> Error occurred while saving new whiteboard');
	}
	else
	{
		console.log('saved');
		console.log(objects);
	}
	
});


db.whiteboards.find({whiteboard_name:'test'},function(err,objects){
	if(err || !objects)
	{
		console.log('not found');
		console.log(err);
	}
	else
	{
		if(!objects.length)
		{
			console.log('Empty');
		}
		else
		{	
			console.log(objects);
			console.log(objects[0]._id);
		}
	}
});



}).call(this);
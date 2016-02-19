// Initialization
var express = require('express');

// Required if we need to use HTTP query or post parameters
var bodyParser = require('body-parser');
var validator = require('validator'); // See documentation at https://github.com/chriso/validator.js
var app = express();
// See https://stackoverflow.com/questions/5710358/how-to-get-post-query-in-express-node-js
app.use(bodyParser.json());
// See https://stackoverflow.com/questions/25471856/express-throws-error-as-body-parser-deprecated-undefined-extended
app.use(bodyParser.urlencoded({ extended: true }));

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/nodemongoexample';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
	db = databaseConnection;
});

// Serve static content
app.use(express.static(__dirname + '/public'));

app.post('/addRoute', function(request, response) {
	var childID = request.body.childID;
	//route ID = date
	var routeID = request.body.routeID;
	var polylines = request.body.polylines;
	var intersectX = request.body.intersectX;
	var streetX = request.body.streetX;
	var toInsert = {
		"routeID": routeID,
		"polylines": polylines,
		"intersectX": intersectX,
		"streetX": streetX
	};
	
	db.collection('children', function(error, coll){
	var id = coll.update({"childID": childID},
			{ $push: {"routes": routeID}					
			}, function (error, results){ 
				if (error) {
					response.send(500);
				}
				else {
					db.collection('routes', function(error, coll) {
					var id = coll.insert(toInsert, function(error, saved) {
						if (error) {
							response.send(500);
						}
						else {
							response.send(200);
						}
	    				});
					});
				}
			});
			});
	});

app.post('/addChild', function(request, response) {
	var childID = request.body.childID;
	var parentID = request.body.parentID;
	var childName = request.body.childName
	// no routes when first added
	var routes = [];
	var toInsert = {
		"childID": childID,
		"parentID": parentID,
		"routes": routes,
		"childName": childName
	};
	db.collection('children', function(error, coll) {
		var id = coll.insert(toInsert, function(error, saved) {
			if (error) {
				response.send(500);
			}
			else {
				response.send(200);
			}
	    });
	});
});

app.get('/', function(request, response) {
	response.set('Content-Type', 'text/html');
	var indexPage = '';
	db.collection('children', function(er, collection) {
		collection.find().toArray(function(err, cursor) {
			if (!err) {
				indexPage += "<!DOCTYPE HTML><html><head><title>data </title></head><body><h1>children</h1>";
				for (var count = 0; count < cursor.length; count++) {
					indexPage += "<p>child " + cursor[count].childID + " parent " + cursor[count].parentID + " routes 						"+ cursor[count].routes + "!</p>";
				}				
			} 
		});
	})
	db.collection('routes', function(er, collection) {
		collection.find().toArray(function(err, cursor) {
			if (!err) {
				indexPage += "<h1>Routes</h1>";
				for (var count = 0; count < cursor.length; count++) {
					indexPage += "<p>child " + cursor[count].childID + " " + cursor[count].childName + " routeID "+ cursor[count].routeID + " polylines "+ cursor[count].polylines + " intersections crossed " + cursor[count].intersectX + " streets crossed " + cursor[count].streetX +"</p>";
				}
				indexPage += "</body></html>"
				response.send(indexPage);
			} 
		});
	});

});

app.get('/deleteAll', function(request, response) {
	db.collection('children',function(err, collection){
    		collection.remove({},function(err, removed){
			if (err) {
				response.send(500)
			} 
			else{
				db.collection('routes',function(err, collection){
    					collection.remove({},function(err, removed){
    					});			
				});
			}   	
		});
	});
});

app.post('/getChildRoutes', function(request, response) {
 	var parentID = request.body.parentID;
	var childName = request.body.childName;
	response.set('Content-Type', 'text/html');

	db.collection('children', function(err, collection) {
		collection.find({"childName": childName}).toArray(function(err, cursor) {
			if (err) {
				response.send(500);
			}
			else {				
				if (cursor[0].parentID == parentID){
					db.collection('routes', function(error, coll) {
						response.send(cursor);
					})
				response.send(coll);
				} else 
					response.send("invalid child parent pair");				
			}
		})
	})				
	});			


app.post('/getRouteDetails', function(request, response) {
 	var routeID = request.body.routeID;
	response.set('Content-Type', 'text/html');
		db.collection('routes', function(error, coll) {
			coll.find({"routeID": routeID}).toArray(function(error, saved) {	
						if (error) {
							response.send(500);
						} else
							response.send(saved);				
			})
		})				
	});			
app.listen(process.env.PORT || 3000);

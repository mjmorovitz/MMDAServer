// Initialization
var express = require('express');
var fs = require("fs");

// Required if we need to use HTTP query or post parameters
var bodyParser = require('body-parser');
var validator = require('validator'); // See documentation at https://github.com/chriso/validator.js
var app = express();
// See https://stackoverflow.com/questions/5710358/how-to-get-post-query-in-express-node-js
app.use(bodyParser.json());
// See https://stackoverflow.com/questions/25471856/express-throws-error-as-body-parser-deprecated-undefined-extended
app.use(bodyParser.urlencoded({ extended: true }));

var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/mOTivator';
var MongoClient = require('mongodb').MongoClient, format = require('util').format;
var db = MongoClient.connect(mongoUri, function(error, databaseConnection) {
  db = databaseConnection;
});
var lastTime = null;
// Serve static content
app.use(express.static(__dirname + '/public'));
setInterval(function(){fs.readFile("/mnt/sd/accel3.txt", 'utf8', function (err,data2) {
  if (err) {
    return console.log(err);
  }
  
  //get data stays for last modified time
  fs.stat("/mnt/sd/accel3.txt", function(err, data1){
  var currentTime = data1.mtime;
  var dataToSend = {currData: data2}
  //first time reading file
  if(lastTime == null){
        lastTime = currentTime;
        db.collection('data', function(error, coll) {
       if (error){console.log(error);}
        var id = coll.insert(dataToSend, function(error, saved) {
          if (error) {
          console.log(error);  
          }
          else {
            console.log(dataToSend);
          }
      });
      });
  }
  //if timestamp has changed aka file modified, read file
  if (lastTime.getTime() != currentTime.getTime()){
        lastTime = currentTime;
        db.collection('data', function(error, coll) {
        coll.find({}).toArray(function(error, saved) {  
            if (error) {
              
            } else{
                coll.remove({},function(err, removed){
                if (err) {
                 
                } 
                else{
                   var id = coll.insert(dataToSend, function(error, saved) {
                   if (error) {
                      
                   }
                   else {
                     console.log(dataToSend);
                   }
                   });
                }     
              });
            }
          });                                                      
      })
  }
   })
})
}, 1000);

app.post('/updateRecord', function(request, response) {
  var type = request.body.type;
        var newRecord = request.body.record;
  var sum = 0;
  response.set('Content-Type', 'text/html');
               db.collection('tasks', function(error, coll) {
      coll.find({"type": type}).toArray(function(error, saved) {  
            if (error) {
              response.send(500);
            } else{
                                                       var recordArray = saved[0].record;
                                                       var origColorAll = saved[0].colorAll;
                                                       var origColorWeek = saved[0].colorWeek;
                                                       var origColorMonth = saved[0].colorMonth;
                                                       var sumAll = 0;
                                                       var sumWeek = 0;
                                                       var sumMonth = 0;
                                                       var origRecord = recordArray.slice(0);
                                                       recordArray.push(newRecord);
                                                       var numRecords = recordArray.length
                                                       var numWeekRecords = 0;
                                                       var numMonthRecords = 0;
                                                       var date = new Date();

                                                       var days7  = 7; // Days you want to subtract
                                                       var date7  = new Date();
                                                       var last7  = new Date(date.getTime() - (days7 * 24 * 60 * 60 * 1000));
                                                       var day7   = last7.getDate();
                                                       var month7 = last7.getMonth()+1;
                                                       var year7  = last7.getFullYear();
                                                       date7.setFullYear(year7, month7, day7);

                                                       var days30  = 30; // Days you want to subtract
                                                       var date30  = new Date();
                                                       var last30  = new Date(date.getTime() - (days30 * 24 * 60 * 60 * 1000));
                                                       var day30   = last30.getDate();
                                                       var month30 = last30.getMonth()+1;
                                                       var year30  = last30.getFullYear();
                                                       date30.setFullYear(year30, month30, day30);
                                                       
                                                       for (var i = 0; i < numRecords; i++){
                                                       testDate = new Date(JSON.parse(recordArray[i]).date);
                                                                sumAll += JSON.parse(recordArray[i]).bool;

                                                                if (date7 < testDate){
                                                                        numWeekRecords++;
                                                                        sumWeek += JSON.parse(recordArray[i]).bool;
                                                                }
                                                                if (date30 < testDate){
                                                                        numMonthRecords++;
                                                                        sumMonth += JSON.parse(recordArray[i]).bool;
                                                                }
                                                        }
                                                       
                                                      var  colorAll = calcColor(sumAll, numRecords);
                                                      if(numMonthRecords != 0){
                                                                var colorMonth = calcColor(sumMonth, numMonthRecords);
                                                      } else {
                                                                var colorMonth = origColorMonth;
                                                      }

                                                      if(numWeekRecords != 0){
                                                                var colorWeek = calcColor(sumWeek, numWeekRecords);
                                                      } else {
                                                                var colorWeek = origColorWeek;
                                                      }  

                                                      
                                                       
                                                        db.collection('tasks', function(wrror, coll){
                                                                var temp = coll.update({record: origRecord},
                                                                         {$set: {record: recordArray, colorAll: colorAll,
                                                                                 colorMonth: colorMonth, colorWeek: colorWeek}
                                                                        }); 
                                                                
                                                                        });
                                                                        response.send(200);
                                                      }               
      })
    })

  });

function calcColor(sum, numRecords){
// color based on number of tasks completed (ie record of 1)
//~0 - 25% completed = red
//~26 - 74% completed = yellow
//~75 - 100% completed = green 
console.log("sum is " + sum + " record num is " + numRecords);

 if(sum < Math.ceil(numRecords/4)){
        color = "red";
 } else if (sum > numRecords - Math.ceil(numRecords/4)){
        color = "green";        
 } else {
        color = "yellow";
 }
        return color;
}

app.post('/addTask', function(request, response) {
       var type = request.body.type;
        var caretakerInfo = request.body.caretakerInfo;
        var caretakerNotes = request.body.caretakerNotes;
        var startDate = request.body.startDate;
        var endDate = request.body.endDate;
        var completionTime = request.body.completionTime;
        var icon = request.body.icon;
        var caretaker = { 
                           contactInfo: caretakerInfo,
                           notes: caretakerNotes
                        } 
        
  // no routes when first added
  var routes = [];
  var toInsert = {
                "type": type,
    "caretaker": caretaker,
    "startDate": startDate,
    "endDate": endDate,
                "completionTime": completionTime,
                "record": [],
                "icon": icon,
                "colorAll": "green",
                "colorWeek": "green",
                "colorMonth": "green"
  };
  db.collection('tasks', function(error, coll) {
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
  //response.set('Content-Type', 'text/html');
  var indexPage = '';
  
  

});

app.get('/deleteAll', function(request, response) {
  db.collection('tasks',function(err, collection){
        collection.remove({},function(err, removed){
      if (err) {
        response.send(500)
      } 
      else{
      }     
    });
  });
db.collection('data',function(err, collection){
        collection.remove({},function(err, removed){
      if (err) {
        response.send(500)
      } 
      else{
      }     
    });
  });
});

app.post('/getTasks', function(request, response) {
  var type = request.body.type;
  
  response.set('Content-Type', 'text/html');

  db.collection('tasks', function(err, collection) {
    collection.find({"type": type}).toArray(function(err, cursor) {
      if (err) {
        response.send(500);
      }
      else {        
                     
            response.send(cursor);
      }
        
    })
  })        
});   

app.post('/getData', function(request, response) {
  var type = request.body.type;
  
  response.set('Content-Type', 'text/html');

  db.collection('data', function(err, collection) {
    collection.find({}).toArray(function(err, cursor) {
      if (err) {
        response.send(500);
      }
      else {        
                     
            response.send(cursor);
                        }
        
    })
  })        
}); 
app.listen(3000, '0.0.0.0');

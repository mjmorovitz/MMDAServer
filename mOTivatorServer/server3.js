// Initialization
var express = require('express');
var https = require('https');
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
/*setInterval(function(){fs.readFile("/mnt/sd/hello.txt", 'utf8', function (err,data2) {
  if (err) {
    return console.log(err);
  }
  
  //get data stays for last modified time
  fs.stat("/mnt/sd/hello.txt", function(err, data1){
  var currentTime = data1.mtime;
  var dataToSend = {currData: data2}
  //first time reading file
  if(lastTime == null){
        lastTime = currentTime;
        fs.writeFile("/mnt/sd/accel3.txt", data2, 'utf8');
       /* db.collection('data', function(error, coll) {
        var id = coll.insert(dataToSend, function(error, saved) {
          if (error) {
            
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
         fs.writeFile("/mnt/sd/accel3.txt", data2, 'utf8');
  }
   })
})
}, 1000);*/

app.post('/updateRecord', function(request, response) {
  var type = request.body.type;
        var newRecord = request.body.record;
  var sum = 0;
  fs.readFile("/mnt/sd/Tasks/"+type+".txt", 'utf8', function (err,saved) {
                                                       saved = JSON.parse(saved);
                                                       var recordArray = saved.record;
                                                       var origColorAll = saved.colorAll;
                                                       var origColorWeek = saved.colorWeek;
                                                       var origColorMonth = saved.colorMonth;
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

                                                      
                                                       var toInsert = {
                                                                "type": type,
                                                                "caretaker": saved.caretaker,
                                                                "startDate": saved.startDate,
                                                                "endDate": saved.endDate,
                                                                "completionTime": saved.completionTime,
                                                                "record": recordArray,
                                                                "icon": saved.icon,
                                                                "colorAll": colorAll,
                                                                "colorWeek": colorWeek,
                                                                "colorMonth": colorMonth
                                                        };

  fs.writeFile("/mnt/sd/Tasks/"+type+".txt", JSON.stringify(toInsert), 'utf8');
                                                                        
                                                                        response.send(200);
                                                                     
     });

  });

function calcColor(sum, numRecords){
// color based on number of tasks completed (ie record of 1)
//~0 - 25% completed = red
//~26 - 74% completed = yellow
//~75 - 100% completed = green 

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
                "colorAll": "black",
                "colorWeek": "black",
                "colorMonth": "black"
  };
  fs.writeFile("/mnt/sd/Tasks/"+type+".txt", JSON.stringify(toInsert), 'utf8');
  response.send(200); 
 
});

app.get('/', function(request, response) {
  

});


var tasks = [];
app.post('/getTasks', function(request, response) {
   fs.readdir("/mnt/sd/Tasks", function(err, filenames) {
    
    if (err) {
        console.log(err);   
    }
    filenames.forEach(function(filename) {
    fs.readFile("/mnt/sd/Tasks/" + filename, 'utf-8', function(err, content) {
    if (err) {      
        console.log(err);
    }
    tasks.push(JSON.parse(content));
    });
    });
  });
response.send(tasks);


 
});
   

app.post('/getData', function(request, response) {
   response.set('Content-Type', 'text/html');
  fs.readFile("/mnt/sd/accel3.txt", 'utf8', function (err,saved) {response.send(saved)});
         
}); 


app.listen(3000, '0.0.0.0');
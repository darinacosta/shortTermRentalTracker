var express = require('express');
var app = express();
var path = require('path');
var http = require('http');
var url = require('url');
var mongo = require('mongodb');
var mdbServer = mongo.Server('localhost', 27017, {'auto_reconnect' : true});
var strdb = mongo.Db('shorttermrentals', mdbServer);
var ltrdb = mongo.Db('longtermrentals', mdbServer);
var assessordb = mongo.Db('assessordata', mdbServer);
var reviewdb = mongo.Db('reviewtracker', mdbServer);
var BSON = require('mongodb').BSON;

//Routing

app.get('/reviewtracker', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  var urlParts = url.parse(req.url, true);
  var queryPost = urlParts.query;
  var query = (function(){
    var queryObject = {};
    
    if (queryPost.neighborhood){
      queryObject['properties.neighborhood'] =  {'$regex': queryPost.neighborhood, '$options': 'i'}; 
    };

    return queryObject;
  })();
  console.log(query);
  reviewdb.open(function(err, db){
     db.collection('features')
     .find(query)
     .toArray(function(err,features){
       res.send({body:features});
       db.close()
     });
   });
});

app.get('/longtermrentals', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  var urlParts = url.parse(req.url, true);
  var queryPost = urlParts.query;
  var query = (function(){
    var queryObject = {};
    
    if (queryPost.neighborhood){
      queryObject['properties.neighborhood'] =  {'$regex': queryPost.neighborhood, '$options': 'i'}; 
    };

    return queryObject;
  })();
  console.log(query);
  ltrdb.open(function(err, db){
     db.collection('features')
     .find(query)
     .toArray(function(err,features){
       res.send({body:features});
       db.close()
     });
   });
});

app.get('/assessordata', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  var urlParts = url.parse(req.url, true);
  var queryPost = urlParts.query;
  var query = (function(){
    var queryObject = {};
    return queryObject;
  })();
  console.log(query);
  assessordb.open(function(err, db){
     db.collection('features')
     .find(query)
     .toArray(function(err,features){
       res.send({body:features});
       db.close()
     });
   });
});

app.get('/rentaltracker', function(req, res){
  res.setHeader('Content-Type', 'application/json'); 
  var urlParts = url.parse(req.url, true);
  var queryPost = urlParts.query;
  var propertiesInt = ["monthlyprice","nightlyprice"];
  var propertiesStr = ["city","id","roomtype","provider","user","url"];
  var query = (function(){
    var queryObject = {};
    
    for (var property in queryPost){
      if (propertiesInt.indexOf(property) > -1){
        queryObject['properties.' + property] = parseInt(queryPost[property]); 
      } else if (propertiesStr.indexOf(property) > -1){
        queryObject['properties.' + property] = queryPost[property];
      };

      //Query for active listings
      if (queryPost.pasttwoweeks === "true"){
        var today = new Date();
        var twoWeeks = new Date(today.setDate(today.getDate() - 75));  
        queryObject['properties.updated'] = {"$gte": twoWeeks};
      };

      //Query for verified lisitings
      if (queryPost['userexists'] === "true"){
        queryObject["properties.user"] = { "$exists" : true };
      } else if (queryPost.userexists === "false"){
        queryObject["properties.user"] = { "$exists" : false };
      };
      
      //Query feature to determine New Orleans listings for now; geospatial solution later
      if (queryPost['neworleans'] === "true"){
        queryObject['properties.city'] = /^new[ +]orleans$/i;
      };

    };

    return queryObject;
  })();
  console.log(query);
  strdb.open(function(err, db){
     db.collection('features')
     .find(query)
     .toArray(function(err,features){
       res.send({body:features});
       db.close()
     });
   });
});



//Servers 
var port = 8080;
app.listen(port, function(err, res) {
   if (err) { console.log( err ) };
   console.log('server listening on port ' + port);
});

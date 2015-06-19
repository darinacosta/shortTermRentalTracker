var express = require('express');
var app = express();
var path = require('path');
var http = require('http');
var url = require('url');
var mongo = require('mongodb');
var mdbServer = mongo.Server('localhost', 27017, {'auto_reconnect' : true});
var mdb = mongo.Db('shorttermrentals', mdbServer);
var BSON = require('mongodb').BSON;

//Routing


app.get('/rentaltracker', function(req, res){
  res.setHeader('Content-Type', 'application/json'); 
  var urlParts = url.parse(req.url, true);
  var queryObject = urlParts.query;
  var query = queryObject.all === true ? {} : queryObject; 
  mdb.open(function(err, db){
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

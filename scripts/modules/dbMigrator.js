var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    http = require('http'),
    path = require('path'),
    ObjectId = require('mongodb').ObjectID,
    Q = require("q"),
    url = 'mongodb://localhost:27017/shorttermrentals',
    multiUnitGeojsonPath = '/rentaltracker/layers/multiUnitRentals.json';


function getLocalFile(path) {
  var deferred  = Q.defer(),
      json = '';
  http.get({
    host: 'localhost',
    path: path
  }, function(response){
      response.on('data', function(d) {
      json += d;
    });
    response.on('end', function(){
      deferred.resolve(JSON.parse(json));
    });
  });
  return deferred.promise;
}

var insertDocument = function(db, feature) {
  if (cursorKeyLength === 0){
    db.collection('feature').insertOne(feature);
    //console.log(feature.properties.url + ' added.');
  //}
};

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log('Connected to db');
  getLocalFile(multiUnitGeojsonPath).then(function(data){
    console.log('Got ' + data.features.length + ' features.');
    for (var i = 0; i < 100; i ++){
      var feature = data.features[i];
      console.log('Passing ' + feature.properties.url)
      insertDocument(db, feature);
    }
    console.log('For loop has executed.')
    console.log('Closing database connection.')
    db.close();
  })
});


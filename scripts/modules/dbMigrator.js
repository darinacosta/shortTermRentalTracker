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
  var deferred  = Q.defer(),
      cursor = db.collection('features').find({"properties.url" : feature.properties.url});
  cursor.count(function(err, num){
    deferred.resolve(num);
  })
  return deferred.promise;
  /*if (cursor === null){
    db.collection('features').insertOne(feature);
    console.log(feature.properties.url + ' added.');
  }else{
    console.log('Feature already exists.')
  }*/
};

/*MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log('Connected to db');
  getLocalFile(multiUnitGeojsonPath).then(function(data){
    console.log('Got ' + data.features.length + ' features.');
    for (var i = 0; i < data.features.length; i ++){
      var feature = data.features[i];
      console.log(i + ': Passing ' + feature.properties.url)
      insertDocument(db, feature).
      then(function(items){
        console.log(items)
      })
    }
    console.log('For loop has executed.')
    console.log('Closing database connection.')
    db.close();
  })
});*/

MongoClient.connect(url, function(err, db) {
  getLocalFile(multiUnitGeojsonPath).then(function(data){
    for (var i = 0; i < data.features.length; i ++){
      var feature = data.features[i];
      insertDocument(db, feature)
      .then(function(num){
        console.log(num);
      })
    }
    db.close();
  })
})


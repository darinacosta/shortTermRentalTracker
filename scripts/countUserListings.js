var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    rentaldb = 'mongodb://localhost:27017/shorttermrentals';



function countUserListings(){
  MongoClient.connect(rentaldb, function(e, db) {
    db.collection('features').find({'properties.provider':'air'}).toArray(function(err, cursor){
      var users = [];
      for (var i = 0; i < cursor.length; i ++){
      	if (cursor[i]['properties'] !== undefined && cursor[i]['properties']['user'] !== undefined && users.indexOf(cursor[i]['properties']['user']) === -1){
          users.push(cursor[i].properties.user);
        }
      };  
      console.log(users.length);
      for (var k = 0; k < users.length; k ++){
	console.log(users[k]);
        db.collection('features').find({"properties.user": users[k]}).count(function(e, n){
          db.collection('features').update({"properties.user": users[k]}, {$set: {"properties.units" : n}},{multi: true}, function(){
            console.log(n);
	    db.close();
          })
        })
      }
    })  
  });
}

countUserListings();


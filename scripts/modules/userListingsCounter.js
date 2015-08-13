var MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    rentaldb = 'mongodb://localhost:27017/shorttermrentals',
    userListingsCounter = {}
    Q = require("q");;

userListingsCounter.countUserListings = function(){
  MongoClient.connect(rentaldb, function(e, db) {
    
    function buildUserObject(){
    var deferred = Q.defer();
    db.collection('features').find({'properties.provider':'air'}).toArray(function(err, cursor){
      var users = {};
      for (var i = 0; i < cursor.length; i ++){
      	if (cursor[i]['properties'] !== undefined && cursor[i]['properties']['user'] !== undefined){
          var user = cursor[i]['properties']['user'];
	  users[user] > 0 ? users[user] += 1 : users[user] = 1; 
        }
      };
      deferred.resolve(users);
    })
    return deferred.promise;
    }; 
    
    function setListingNumbers(users){
    var userLength = Object.keys(users).length;
    for (user in users){
      db.collection('features').update({"properties.user": user}, {$set: {"properties.units" : users[user]}}, {multi:true}, function(err, output){
        if (err){ console.log(err); return err };
	console.log(userLength + ': ' + user + " updated.");
	userLength -= 1;
	if (userLength === 0) {
	  db.close();
	};
      })
    }
    }

    buildUserObject().then(function(users){
      setListingNumbers(users)
    });
  });
}

module.exports = userListingsCounter;

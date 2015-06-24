var request = require('request');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var mapSeries = require('promise-map-series');
var Q = require('q');
var today = new Date();
var ltrdb = 'mongodb://localhost:27017/longtermrentals';


var config = {
  token: "6467f98a0c3d0cf2abd6dc81e7d0817d",
  county: "USA-LA-ORL",
  retvals: "id,heading,price,currency,location",
  page: 0,
  tier: 0,
  feature: 0 
};

function search(){
  
  var url = "http://search.3taps.com?" +
 	    "auth_token=" + config.token + 
	    "&location.county=" + config.county +
	    "&retvals=" + config.retvals + 
	    "&category=RHFR" + 
	    "&page=" + config.page + 
	    "&tier=" + config.tier;

  request(url, function(e,r,b){
    var res = JSON.parse(b);
    var postings = res.postings;  
    var features = [];
    config.page += 1;
    if (res.next_tier > config.tier){
      config.tier += 1
    }
    for (var i = 0; i < postings.length; i++){
      var feature = buildFeature(postings[i]);
      features.push(feature);
    };
    mapSeries(features, writeToDb)
    .then(function(){
      search();
    })
  });
};


function writeToDb(feature){   
  var deferred = Q.defer();
  MongoClient.connect(ltrdb, function(e, db){
    setTimeout(function(){
      config.feature += 1;
      console.log("Feature: " + config.feature + " | ID: " + feature.properties.id + " | Page: " + config.page + " | Tier: " + config.tier);  
      db.collection('features').find({"properties.id": feature.properties['id']}).count(function(e,n){
        if (n === 0){
          db.collection('features').insert(feature, function(e, records){
	    assert.equal(e, null);
	    console.log(feature.properties.id + ' was inserted.');
            db.close();
	    deferred.resolve();
	  })
        } else {
          console.log(feature.properties.id + ' already exists.');
	  db.close();
	  deferred.resolve();
	}
      })
    }, 100)
  });
  return deferred.promise;
};

function buildFeature(listing){
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [listing.location['long'], listing.location['lat']]
    },
    properties: {
      id: listing['id'],
      account_id: listing['account_id'],
      city: listing.location['city'],
      zip: listing.location['zipcode'],
      heading: listing['heading'],
      currency: listing['currency'],
      price: listing['price'] || 0
    }
  } 
};

search();

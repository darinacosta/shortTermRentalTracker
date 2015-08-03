var request = require('request');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var gju = require('geojson-utils');
var mapSeries = require('promise-map-series');
var neighborhoodGeojson = require('../layers/neighborhoods.geojson'); 
var path = require('path');
var Q = require('q');
var today = new Date();
var ltrdb = 'mongodb://localhost:27017/longtermrentals';

var ltrScraper = {};

var config = {
  token: "6467f98a0c3d0cf2abd6dc81e7d0817d",
  county: "USA-LA-ORL",
  retvals: "id,heading,price,currency,location,external_url",
  page: 0,
  tier: 0,
  feature: 0 
};

var counter = {
  page: 0,
  tier: 0,
  feature: 0
};

ltrScraper.search = function(){
 
  var ltrScraper= this;

  var url = "http://search.3taps.com?" +
 	    "auth_token=" + config.token + 
	    "&location.county=" + config.county +
	    "&retvals=" + config.retvals + 
	    "&category=RHFR" + 
	    "&page=" + counter.page + 
	    "&tier=" + counter.tier;

  request(url, function(e,r,b){
    var res = JSON.parse(b);
    var postings = res.postings;  
    var features = [];
    counter.page += 1;
    if (res.next_tier > counter.tier){
      counter.tier += 1
    }
    for (var i = 0; i < postings.length; i++){
      var feature = ltrScraper.buildFeature(postings[i]);
      features.push(feature);
    };
    mapSeries(features, ltrScraper.writeToDb)
    .then(function(){
     ltrScraper.search();
    })
  });
};

ltrScraper.writeToDb = function(feature){   
  var deferred = Q.defer();
  MongoClient.connect(ltrdb, function(e, db){
    setTimeout(function(){
      counter.feature += 1;
      console.log("Feature: " + counter.feature + " | ID: " + feature.properties.id + " | Page: " + counter.page + " | Tier: " + counter.tier);  
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

ltrScraper.buildFeature = function(listing){
  var coords =  [listing.location['long'], listing.location['lat']];
  var neighborhood = this.getNeighborhood(coords);
  return {
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": coords
    },
    "properties": {
      "id": listing['id'],
      "account_id": listing['account_id'],
      "city": listing.location['city'],
      "zip": listing.location['zipcode'],
      "heading": listing['heading'],
      "currency": listing['currency'],
      "price": listing['price'] || 0,
      "neighborhood": neighborhood,
      "url": listing['external_url']
    }
  } 
};

ltrScraper.getNeighborhood = function(coords){
  var point = {"type": "Point", "coordinates": coords};
  for (var i = 0; i < neighborhoodGeojson.features.length; i ++){
    var neighborhood = neighborhoodGeojson.features[i];
    var poly = {"type": "Polygon", "coordinates": neighborhood.geometry.coordinates[0]};
    var inPoly = gju.pointInPolygon(point, poly);
    if (inPoly !== false){ return neighborhood.properties.neighbourhood };
  }
}

ltrScraper.search();
//module.exports = ltrScraper;

#!/usr/bin/env node

var unirest = require('unirest'),
    fs = require('fs'),
    path = require('path'),
    config = require('./../config'),
    today = new Date(),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    rentaldb = 'mongodb://localhost:27017/shorttermrentals';

rentalScraper = {

  _rentalsGeoJsonPath: path.join(__dirname, '../../layers/rentals.json'),

  _logFile: path.join(__dirname, '../output/log.txt'),

  _totPageCount: 1,

  _numberOfFeaturesWritten: 0,

  _pageTracker: {},

  init: function(providers) { 
    var rentalScraper = this;
    providers.forEach(function(provider){
      rentalScraper._pageTracker[provider] = 1;
      rentalScraper._fetchListingsByProvider(provider);
    });
  },

  _fetchListingsByProvider: function(provider){
    var rentalScraper = this,
        nelatitude = 30.123749,
        nelongitude = -89.868164,
        swlatitude = 29.881137,
        swlongitude = -90.557556,
        url = "https://zilyo.p.mashape.com/search?isinstantbook=false" + 
              "&nelatitude=" + nelatitude + "&nelongitude=" + nelongitude + 
              "&swlatitude=" + swlatitude + "&swlongitude=" + swlongitude + 
              "&&provider=" + provider + "&" +
              "page=" + rentalScraper._pageTracker[provider];
    
    unirest.get(url)
    .header("X-Mashape-Key", config.mashape_key)
    .header("Accept", "application/json")
    .end(function (result) {
      console.log('Scanning ' + provider + ' page ' + rentalScraper._pageTracker[provider] + '...')
      var parsedResult = JSON.parse(result.body);
      rentalScraper._handlePageResult(parsedResult);
      rentalScraper._pageTracker[provider] = rentalScraper._pageTracker[provider] + 1;
      rentalScraper._pageCount = rentalScraper._pageCount + 1;
      if (parsedResult['ids'].length > 0){
        rentalScraper._fetchListingsByProvider(provider)
      } else {
        rentalScraper._pageTracker[provider] = "complete";
        console.log(provider + ' scan complete.');
        if (rentalScraper._detectScanCompletion() === true){
          rentalScraper._writeToLog();
        }
      }
    })
  },

  _detectScanCompletion: function(){
    var pageTracker = rentalScraper._pageTracker;
        resultList = [],
        scanComplete = true;

    for (var provider in pageTracker) {
      var result = pageTracker[provider];
      resultList.push(result); 
    };

    for (var i = 0; i < resultList.length; i ++){
      if (resultList[i] !== "complete"){
        scanComplete = false;
      }
    };

    return scanComplete;
  },
  
  _handlePageResult: function(result){
    var rentalScraper = this, 
        resultLength = result['result'].length;
    for (var i = 0; i < result['result'].length; i += 1){
      var feature = rentalScraper._buildFeature(result['result'][i]); 
      rentalScraper._writeFeatureToDb(feature);
    }
  },

  _buildFeature: function(location){
    var latlng = switchLatLong(location['latLng']);
    var feature = {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": latlng
      },
      "properties":{
        "id": location['id'],
        "url": location['provider']['url'],
        "roomType": location['attr']['roomType']['text'],
        "city": location['location']['city'],
        "neighborhood": location['location']['neighbourhood'],
        "street": location['location']['streetName'],
        "nightlyPrice": location['price']['nightly'],
        "monthlyPrice": location['price']['monthly'],
        //"description": location['attr']['description'],
        //"reviews" : location['reviews']['entries'],
        "dateCollected": today,
        "scraped": false
      }
    };
    return feature;
  },

  _writeFeatureToDb: function(feature){
    MongoClient.connect(rentaldb, function(err, db) {
      db.collection('features').find({"properties.id" : feature.properties.id}).count(function(e, n){
        assert.equal(e, null);
        if (n === 0){
          db.collection('features').insert(feature, function(e, records) {
            console.log(feature.properties.id + ' added to features.');
            rentalScraper._numberOfFeaturesWritten += 1;
          });
        } else {
          db.collection('features').update({"properties.id" : feature.properties.id}, {$set: {"properties.dateCollected" : feature.properties.dateCollected}}, function(err, obj){
            console.log(feature.properties.id + ' date updated.')
          })
        };
        db.close();
      });
    })
  },

  _writeToLog: function(){
    var rentalScraper = this,
    logString = "--------------------------" + "\n" +
    "Rental Scraper Log: " + today + "\n" +
    "Features collected: " + rentalScraper._numberOfFeaturesWritten + "\n" +
    "Calls to server:    " + rentalScraper._totalPageCount + "\n" +
    "--------------------------"+ "\n";
    console.log(logString);
    fs.appendFile(rentalScraper._logFile, logString);
  }
};

function switchLatLong(latlng){
  var lat = latlng[0],
      lng = latlng[1];
      return [lng, lat]
};

module.exports = rentalScraper;


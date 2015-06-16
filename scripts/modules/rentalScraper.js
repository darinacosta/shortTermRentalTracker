var unirest = require('unirest'),
    fs = require('fs'),
    request = require('request'),
    path = require('path'),
    config = require('./../config'),
    today = new Date(),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    rentaldb = 'mongodb://localhost:27017/shorttermrentals',
    cheerio = require('cheerio'),
    mapSeries = require('promise-map-series'),
    Q = require("q");

rentalScraper = {

  _rentalsGeoJsonPath: path.join(__dirname, '../../layers/rentals.json'),

  _logFile: path.join(__dirname, '../output/log.txt'),

  _totalApiPageCount: 1,

  _numberOfFeaturesWritten: 0,

  _numberOfUserProfilesCrawled: 0,

  _apiPageTracker: {},

  init: function(providers) { 
    var rentalScraper = this;
    providers.forEach(function(provider){
      rentalScraper._apiPageTracker[provider] = 1;
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
              "page=" + rentalScraper._apiPageTracker[provider];
    
    unirest.get(url)
    .header("X-Mashape-Key", config.mashape_key)
    .header("Accept", "application/json")
    .end(_getListing);
    
    function _getListing(result){
      console.log('Scanning ' + provider + ' page ' + rentalScraper._apiPageTracker[provider] + '...')
      var parsedResult = JSON.parse(result.body);
      rentalScraper._apiPageTracker[provider] = rentalScraper._apiPageTracker[provider] + 1;
      rentalScraper._pageCount = rentalScraper._pageCount + 1;
      rentalScraper._handleApiPageResult(parsedResult, function(){
        if (parsedResult['ids'].length > 0){
          rentalScraper._fetchListingsByProvider(provider)
        } else {
          rentalScraper._apiPageTracker[provider] = "complete";
          console.log(provider + ' scan complete.');
          if (rentalScraper._detectScanCompletion() === true){
            rentalScraper._writeToLog();
          }
        }
      })
    };
  },

  _detectScanCompletion: function(){
    var pageTracker = rentalScraper._apiPageTracker;
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
  
  _handleApiPageResult: function(result, cb){
    var rentalScraper = this, 
        resultLength = result['result'].length,
        features = [];
    for (var i = 0; i < result['result'].length; i += 1){
      var feature = rentalScraper._buildFeature(result['result'][i]);
      features.push(feature);
    };
    mapSeries(features, rentalScraper._writeFeatureToDb)
    .then(
    function () { 
      cb();
    },
    function (err) { 
      cb(err);
    })
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
    var deferred = Q.defer();
    MongoClient.connect(rentaldb, function(e, db) {
      if (db === null){
        console.log('Bad database connection.')
        deferred.resolve();
      }
      db.collection('features').find({"properties.id" : feature.properties.id}).count(function(e, n){
        assert.equal(e, null);
        function _addNewFeature(feature){
          db.collection('features').insert(feature, function(e, records) {
            assert.equal(e, null);
            console.log(feature.properties.id + ' added to features.');
            rentalScraper._numberOfFeaturesWritten += 1;
            db.close();
            deferred.resolve();
          });
        };
        if (n === 0){
          if (feature['properties']['id'].match(/air/g) !== null && feature['properties']['id'].match(/air/g)[0] === "air" && feature.properties['user'] === undefined){ 
            rentalScraper._scrapeListing(feature, function(listingFeature){
              rentalScraper._scrapeUserProfile(listingFeature, function(userFeature){
                _addNewFeature(userFeature)
              });
            });
          } else {
            _addNewFeature(feature);
          }
        } else {
          db.collection('features').update({"properties.id" : feature.properties.id}, {$set: {"properties.dateCollected" : feature.properties.dateCollected}}, function(e, obj){
            console.log(feature.properties.id + ' date updated.')
            db.close();
            deferred.resolve();
          })
        };
      });
      return deferred.promise;
    })
  },


  _scrapeListing: function(feature, callback){

    options = {
      url: feature.properties.url,
      headers: {
        'User-Agent': "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36"
      }
    };

    request(options, _getUserProfileUrl)

    function _getUserProfileUrl(error, response, html){
      setTimeout(function() { 
        if (error){
          console.log(error)
        } else {
          var $ = cheerio.load(html);
          userDetails = $('#host-profile').find("a")[0];
          if (userDetails !== undefined){
            var href = $('#host-profile').find("a")[0]['attribs']['href'];
            feature.properties['user'] = "http://airbnb.com" + href;
            console.log(feature.properties.id + ' was succesfully scraped.')
          } else {
            console.log(feature.properties.id + ' was not scraped. Check to ensure it still exists.')
          }
          callback(feature);
        }
      }, 600);
    }
  },

  _scrapeUserProfile: function(feature, callback){
    var rentalTracker = this,

    options = {
      url: feature.properties.user,
      headers: {
        'User-Agent': "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36"
      }
    };

    request(options, _getTotalUserListings);

    function _getTotalUserListings(error, response, html){
      if (error){
        console.log(error)
      } else {
        console.log('---------------------------------------------')
        console.log(html);
        console.log('---------------------------------------------')
        var $ = cheerio.load(html),
        rentalNumberParan = $('.row-space-3').find("small").text(),
        rentalNumberRegex = /\(([^\)]+)\)/.exec(rentalNumberParan);
        setTimeout(function() { 
          if (rentalNumberParan !== undefined && rentalNumberRegex !== null ){
            var rentalNumber = rentalNumberRegex[1];
            feature.units = rentalNumber;
            callback(feature); 
            rentalTracker._numberOfUserProfilesCrawled += 1;
            console.log('User profile ' + feature.properties.user + ' was succesfully scraped.');
          } else {
            console.log(feature.properties.user + ' was not scraped. Check to ensure that it still exists and contains a listings div.')
          }
        }, 900);
      }
    }
  },

  _getLocalFile: function(path) {
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
        deferred.resolve(json);
      });
    });
    return deferred.promise;
  },

  _writeToLog: function(){
    var rentalScraper = this,
    logString = "--------------------------" + "\n" +
    "Rental Scraper Log: " + today + "\n" +
    "Features collected: " + rentalScraper._numberOfFeaturesWritten + "\n" +
    "Calls to server:    " + rentalScraper._totalApiPageCount + "\n" +
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


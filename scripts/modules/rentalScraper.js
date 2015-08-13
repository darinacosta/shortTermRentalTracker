var unirest = require('unirest'),
    csvConverter = require('./csvConverter'),
    fs = require('fs'),
    request = require('request'),
    path = require('path'),
    config = require('./../config'),
    today = new Date(),
    todayCalc = new Date(),
    past2weeks =  new Date(todayCalc.setDate(todayCalc.getDate() - 0)),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    rentaldb = 'mongodb://localhost:27017/shorttermrentals',
    userListingsCounter = require('./userListingsCounter'),
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
        swlongitude = -90.152435,
        url = "https://zilyo.p.mashape.com/search?isinstantbook=false" + 
              "&nelatitude=" + nelatitude + "&nelongitude=" + nelongitude + 
              "&swlatitude=" + swlatitude + "&swlongitude=" + swlongitude + 
              "&&provider=" + provider + "&" +
              "page=" + rentalScraper._apiPageTracker[provider];
    
    unirest.get(url)
    .header("X-Mashape-Key", config.mashape_key)
    .header("Accept", "application/json")
    .end(_getListings);
    
    function _getListings(result){
      var parsedResult;
      console.log('Scanning ' + provider + ' page ' + rentalScraper._apiPageTracker[provider] + '...');
      try {
        parsedResult = JSON.parse(result.body);
      } catch (e) {
        console.log(e);
        parsedResult = null;
      }
      rentalScraper._apiPageTracker[provider] = rentalScraper._apiPageTracker[provider] + 1;
      rentalScraper._pageCount = rentalScraper._pageCount + 1;
      rentalScraper._handleApiPageResult(parsedResult, function(){
        if (parsedResult === null || parsedResult['ids'].length > 0){
          rentalScraper._fetchListingsByProvider(provider)
        } else {
          rentalScraper._apiPageTracker[provider] = "complete";
          console.log(provider + ' scan complete.');
          if (rentalScraper._detectScanCompletion() === true){
            userListingsCounter.countUserListings();
	    csvConverter.convert2csv('air','airbnb.txt');
	    csvConverter.convert2csv('hma','homeaway.txt');
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
        "provider": location['id'].replace(/[0-9]/g, '').substring(0,3),
        "url": location['provider']['url'],
        "roomtype": location['attr']['roomType']['text'],
        "city": location['location']['city'],
        "neighborhood": location['location']['neighbourhood'],
        "street": location['location']['streetName'],
        "nightlyprice": location['price']['nightly'],
        "monthlyprice": location['price']['monthly'],
        "datecollected": today,
        "updated": today
      }
    };
    return feature;
  },

  _writeFeatureToDb: function(feature){
    var deferred = Q.defer();
    MongoClient.connect(rentaldb, function(e, db) {
      setTimeout(function(){
        if (db === null){
          console.log('Bad database connection.')
          deferred.resolve();
        }
        db.collection('features').find({"properties.id" : feature.properties.id}).toArray(function(e, docs){
          assert.equal(e, null);
          
	  function _addNewFeature(feature){
            db.collection('features').insert(feature, function(e, records) {
              assert.equal(e, null);
              //console.log(feature.properties.id + ' added to features.');
              rentalScraper._numberOfFeaturesWritten += 1;
              db.close();
              deferred.resolve();
            });
          };

          function _replaceFeature(feature){
            db.collection('features').update({"properties.id" : feature.properties.id}, feature, function(e, records) {
              assert.equal(e, null);
              //console.log(feature.properties.id + ' added to features.');
              rentalScraper._numberOfFeaturesWritten += 1;
              db.close();
              deferred.resolve();
            });
          };

          if (docs.length === 0){
            rentalScraper._scrapeListing(feature, function(listingFeature){
	      console.log(feature.properties.id + ' has been created.');
              _addNewFeature(listingFeature);
            });
          } else if (docs[0].properties.updated < past2weeks || docs[0].properties.updated === undefined) {
            rentalScraper._scrapeListing(feature, function(listingFeature){
	      //If listing wasn't scraped, don't replace the feature
	      if (listingFeature !== false){
	        _replaceFeature(listingFeature);
                console.log(feature.properties.id + ' has been updated.');
	      } else {
		console.log(feature.properties.id + ' has not been updated.'); 
	        db.close();
	        deferred.resolve();
	      }
	    });
          } else { 
            console.log('No action required on ' + feature.properties.id);
	    db.close();
	    deferred.resolve();
	  }
	  ;
        });
      },300)
    })
    return deferred.promise;
  },

  _scrapeListing: function(feature, callback){
    var targetUrl = feature.properties.url;
    options = {
      url: targetUrl,
      headers: {
        'User-Agent': "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36"
      }
    };

    request(options, _getListingData)

    function _getListingData(error, response, html){
      setTimeout(function() { 
        if (error){
          console.log(error)
        } else {
          var $ = cheerio.load(html);
          var scrapedFeature;
          if (feature.properties.provider === "air"){
	    scrapedFeature = _getAirbnbListingData($, feature);
	  } else if (feature.properties.provider.substring(0,3) === "hma"){
	    scrapedFeature = _getHomeawayListingData($, feature);  
	  }	  
	  callback(scrapedFeature);
        }
      }, 5000);
      
      function _getAirbnbListingData($, feature){ 
        userDetails = $('#host-profile.room-section').find("a")[0];
	console.log($('body').text().slice(0,300).replace(/\s/g, ""));
        if (userDetails !== undefined){
          var href = userDetails['attribs']['href'];
          var numReviewsRegex = $('span[itemprop="reviewCount"]').text();
          var numReviews = numReviewsRegex === undefined || numReviewsRegex === null ? 0 : parseInt(numReviewsRegex);
          feature.properties['user'] = "http://airbnb.com" + href;
          feature.properties['reviews'] = numReviews;
          console.log(feature.properties.id + ' was succesfully scraped.')
	} else {
          console.log(feature.properties.url + ' was not scraped. Check to ensure it still exists.');
          feature = false;
	};
        return feature;
      };

      function _getHomeawayListingData($, feature){
        console.log('Scraping ' + feature.properties.url);
        var userNameDiv = $('.contact-info-wrapper > .owner-name');
	var numReviewsDiv = $('span[itemprop="reviewCount"]');
	if (userNameDiv[0] !== undefined){
	  var numReviewsRegex = numReviewsDiv.text().match(/^([0-9]+)[ a-zA-Z]/);
	  var numReviews = numReviewsDiv === undefined || numReviewsRegex === null ? 0 : parseInt(numReviewsRegex[1]);
	  var userRegex = userNameDiv.text().trim().match(/^([0-9\-a-zA-Z ]+)/)
	  var user = userRegex === null ? "Unkown" : userRegex[1].replace(/\n/g,'');
          feature.properties['user'] = userRegex;
	  feature.properties['reviews'] = numReviews;
	} else {
          console.log(feature.properties.url + ' was not scraped. Check to ensure it still exists.');
	  feature = false;
	}
        return feature;
      };
    }
  },

  _scrapeUserProfile: function(feature, callback){
    if (feature.properties.provider === "hma" || feature.properties.user === undefined){callback(feature); return};

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
        var $ = cheerio.load(html),
        rentalNumberParan = $('.row-space-3').find("small").text(),
        rentalNumberRegex = /\(([^\)]+)\)/.exec(rentalNumberParan);
        setTimeout(function() { 
          if (rentalNumberParan !== undefined && rentalNumberRegex !== null ){
            var rentalNumber = rentalNumberRegex[1];
            feature.properties['units'] = rentalNumber;
            callback(feature); 
            rentalTracker._numberOfUserProfilesCrawled += 1;
            //console.log('User profile ' + feature.properties.user + ' was succesfully scraped.');
          } else {
            console.log(feature.properties.user + ' was not scraped. Check to ensure that it still exists and contains a listings div.')
            callback(feature); 
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
    "New features collected: " + rentalScraper._numberOfFeaturesWritten + "\n" +
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


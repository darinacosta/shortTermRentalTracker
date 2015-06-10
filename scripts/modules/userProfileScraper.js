#!/usr/bin/env node

var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    request = require('request'),
    http = require('http'),
    cheerio = require('cheerio'),
    Q = require("q"),
    today = new Date();

userProfileScraper = {

  _logFile: path.join(__dirname, '../output/log.txt'),
  _multiUnitUrlDoc: path.join(__dirname, '../output/multiUnits.json'),
  _multiUnitGeojsonPath: path.join(__dirname,'../../layers/multiUnitRentals.json'),
  _pagesRequested: 0,
  _pagesWritten: 0,

  crawlUserProfiles: function(){
    var userScraper = this,
        rentalsGet = userScraper._getLocalFile('/rentaltracker/layers/rentals.json'),
        userProfilesGet = userScraper._getLocalFile('/rentaltracker/scripts/output/userProfiles.json'),
        userProfileData,
        rentalsGeojson,
        urls;
    Q.all([rentalsGet, userProfilesGet])
    .then(function(res){
      rentalsGeojson = JSON.parse(res[0]);
      urls = JSON.parse(res[1])['body'];
      userScraper._pagesRequested = urls.length;
      userScraper._pagesWritten = urls.length;
      userScraper._scrapePages(urls).then(function(multiUnitProfiles){
        userScraper._mergeMultiUnitDataIntoGeojson(rentalsGeojson, multiUnitProfiles)
      });
    })
  },

  _mergeMultiUnitDataIntoGeojson: function(rentalsGeojson, multiUnitProfiles){
    console.log('BEGIN MERGE');
    var userScraper = this,
        i = 0;
    rentalsGeojson["features"].forEach(function(feature){
      var geoFeatureUrl = feature['properties']['url'];
      multiUnitProfiles.forEach(function(profile){
        profileRentalUrl = profile['rental'];
        console.log(profileRentalUrl)
        if (profileRentalUrl === geoFeatureUrl){
          feature['properties']['units'] = profile['units'];
          feature['properties']['user'] = profile['user'];
          feature['properties']['dateCollected'] = 'today';
          if (feature['properties']['id'].match(/air/g)[0] === "air" && feature['properties']['user'] === undefined){
            console.log(i + ': ' + profileRentalUrl + ' does not exist and has been removed.');
            delete rentalsGeojson["features"][i];
          } else {
            console.log(i + ': Data added to ' + profileRentalUrl);
          }
        } 
      })
      i+=1
    });
    userScraper._writeToLog();
    rentalsGeojsonString = JSON.stringify(rentalsGeojson);
    fs.writeFile(userScraper._multiUnitGeojsonPath, rentalsGeojsonString);
  },

  _writeToLog: function(){
    var userScraper = this;
    logString = '-----------------------------' + '\n' +
    "User Scraper log: " + today + "\n" +
    'Pages requested: ' + userScraper._pagesRequested + '\n' +
    'Pages written:   '+  userScraper._pagesWritten + '\n' +
    '-----------------------------'
    fs.appendFile(userScraper._logFile, logString);
    console.log(logString)
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

  _scrapePages: function(urls){
    var userScraper = this,
    entries = [],
    i = 0,
    deferred  = Q.defer();


    console.log('Begining to scrape ' + userScraper._pagesRequested + ' urls.');
    
    var _fetch = function(cb){
      options = {
        url: urls[i]['user'],
        headers: {
          'User-Agent': "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36"
        }
      };
      request(options, _scrapePage);

      function _scrapePage(error, response, html){
        if (error){
          console.log(error)
        } else {
          var $ = cheerio.load(html),
          rentalNumberParan = $('.row-space-3').find("small").text(),
          rentalNumberRegex = /\(([^\)]+)\)/.exec(rentalNumberParan);
          if (rentalNumberParan !== undefined && rentalNumberRegex !== null ){
            rentalNumber = rentalNumberRegex[1];
            console.log(i + ': ' + urls[i]['user'] + ', ' + rentalNumber)
            entry = {
              rental: urls[i]['rental'],
              user: urls[i]['user'],
              units: rentalNumber
            };
            entries.push(entry);
            setTimeout(function() { i++; cb(null,entry); }, 200);
          } else {
            userScraper._pagesWritten -= 1;
            console.log(urls[i]['user'] + ' was not scraped. Check to ensure that it still exists and contains a listings div.')
            i++;
            cb(null, 'error')
          }
        }
      }
    };
  
    async.whilst(
      function() { return i <= urls.length - 1; }, 
  
      function(cb){
        _fetch(cb)
      },
  
      function(err, results){
        deferred.resolve(entries);
      }
    )
    return deferred.promise; 
  }
}

module.exports = userProfileScraper;


/*
if (err){
          console.log('Connection Error. Continuing application...');
        };
        */


#!/usr/bin/env node

var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    request = require('request'),
    http = require('http'),
    cheerio = require('cheerio'),
    Q = require("q"),
    multiUnitUrlDoc = path.join(__dirname, '../output/multiUnits.json'),
    multiUnitGeojsonPath = path.join(__dirname,'../../layers/multiUnitRentals.json'),
    today = new Date();

userProfileScraper = {

   _logFile: path.join(__dirname, '../output/log.txt'),

  crawlUserProfiles: function(){
    var userScraper = this;
    userScraper._getLocalFile('/rentaltracker/scripts/output/userProfiles.json')
    .then(function(response){
      userScraper._scrapePages(response, multiUnitUrlDoc)
    });
  },

  _buildMultiUnitGeojson: function(){
    var userScraper = this,
        multiUnitsGet = userScraper._getLocalFile('/rentaltracker/scripts/output/multiUnits.json'),
        rentalsGet = userScraper._getLocalFile('/rentaltracker/layers/rentals.json');
    Q.all([multiUnitsGet, rentalsGet])
      .then(userScraper._mergeMultiUnitDataIntoGeojson);
   },

  _mergeMultiUnitDataIntoGeojson: function(res){
    var multiUnitProfiles = JSON.parse(res[0]),
        rentalGeojson = JSON.parse(res[1]),
        i = 0;
    rentalGeojson["features"].forEach(function(feature){
      var geoFeatureUrl = feature['properties']['url'];
      multiUnitProfiles['result'].forEach(function(profile){
        profileRentalUrl = profile['rental'];
        if (profileRentalUrl === geoFeatureUrl){
          feature['properties']['units'] = profile['units'];
          feature['properties']['user'] = profile['user'];
          feature['properties']['dateCollected'] = today;
          console.log(i + ': Data added to ' + profileRentalUrl);
          i++
        }
      })
    });
    rentalGeojsonString = JSON.stringify(rentalGeojson)
    fs.writeFile(multiUnitGeojsonPath, rentalGeojsonString);
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

  _scrapePages: function(response, writeDoc){
    var urls = JSON.parse(response)['body'],
    entries = [],
    urlsLength = urls.length,
    i = 0;

    console.log('Begining to scrape ' + urlsLength + ' urls.');
    
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
            urlsLength -= 1;
            console.log(urls[i]['user'] + ' was not scraped. Check to ensure that it still exists and contains a listings div.')
            i++;
            cb(null, 'error')
          }
        }
      }
    };
  
    async.whilst(
      function() { return i <= urls.length-1; },
  
      function(cb){
        _fetch(cb)
      },
  
      function(err, results){
        if (err){
          console.log('Connection Error. Continuing application...');
        };
        var writeJson = {'body': entries},
        writeString = JSON.stringify(writeJson),
        logString = '-----------------------------' + '\n' +
        "User Scraper log: " + today + "\n" +
        'Entries requested: ' + i + '\n' +
        'Entries written:   '+  urlsLength + '\n' +
        '-----------------------------'
        fs.writeFile(writeDoc, writeString, function(err){
          userProfileScraper._buildMultiUnitGeojson();
        });
        fs.appendFile(userProfileScraper._logFile, logString);
        console.log(logString)
      }
    )
  }
}

module.exports = userProfileScraper;


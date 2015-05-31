#!/usr/bin/env node

var async = require('async'),
    fs = require('fs'),
    request = require('request'),
    http = require('http'),
    cheerio = require('cheerio'),
    Q = require("q"),
    multiUnitUrlDoc = './multiUnits.json',
    i = 0;

userScraper = {

  buildMultiUnitJson: function(){
    var userScraper = this;
    userScraper._getUserProfiles()
    .then(_getHtml);

    function _getHtml(response) {
      var json = '';
      response.on('data', function(d) {
        json += d;
      });
      response.on('end', function(){
        var urls = JSON.parse(json)['userProfiles'];
        userScraper._scrapePages(urls, multiUnitUrlDoc);
    });
    }
  },

  _getUserProfiles: function(){
    var deferred = Q.defer();
    http.get({
      host: 'localhost',
      path: '/rentaltracker/scripts/userProfiles.json'
     }, deferred.resolve);
    return deferred.promise;
  },

  _scrapePages: function(urls, writeDoc){
    var entries = [],
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
        writeJson = {'result': entries}
        writeString = JSON.stringify(writeJson);
        fs.writeFile(writeDoc, writeString);
        console.log('-----------------------------' + '\n' +
                    'Entries requested: ' + i + '\n' +
                    'Entries written:   '+  urlsLength + '\n' +
                    '-----------------------------')
      }
    )
  }
}

userScraper.buildMultiUnitJson()





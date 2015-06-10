#!/usr/bin/env node

var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    request = require('request'),
    http = require('http'),
    cheerio = require('cheerio'),
    Q = require("q"),
    i = 0, 
    today = new Date();

listingInfoScraper = {

  _totalUrlsCrawled: 0,

  _totalUrlsRequested: 0,

  _logFile: path.join(__dirname, '../output/log.txt'),

  _userProfileUrlDoc: path.join(__dirname, '../output/userProfiles.json'),

  crawlListingHtml: function(){
    var listingInfoScraper = this;
    listingInfoScraper._getUrlList()
    .then(_getHtml);

    function _getHtml(response) {
      var json = '';
      response.on('data', function(d) {
        json += d;
      });
      response.on('end', function(){
        var parsedJSON = JSON.parse(json),
        features = parsedJSON.features,
        urls = [];
        features.forEach(function(feature){
          urls.push(feature.properties.url)
        })
        listingInfoScraper._totalUrlsRequest = urls.length;
        listingInfoScraper._totalUrlsCrawled = urls.length;
        listingInfoScraper._scrapePages(urls, listingInfoScraper._userProfileUrlDoc);
      });
    };
  },

  _getUrlList: function(){
    var deferred = Q.defer();
    http.get({
      host: 'localhost',
      path: '/rentaltracker/layers/rentals.json'
     }, deferred.resolve);
    return deferred.promise;
  },

  _writeToLog: function(){
    var listingInfoScraper = this,
    logString = "--------------------------" + "\n" +
    "Listing Scraper log: " + today + "\n" +
    "URLs requested: " + listingInfoScraper._totalUrlsRequested + "\n" +
    "URLs crawled:    " + listingInfoScraper._totalUrlsCrawled + "\n" +
    "--------------------------" + "\n";
    console.log(logString);
    fs.appendFile(listingInfoScraper._logFile, logString);
  },

  _scrapePages: function(urls, writeDoc){
    var entries = [],
    urlsLength = listingInfoScraper._totalUrlsCrawled,
    i = 0;

    console.log('Begining to scrape ' + urlsLength + ' urls.');
    
    var _fetch = function(cb){
      options = {
        url: urls[i],
        headers: {
          'User-Agent': "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36"
        }
      };
      request(options, _scrapePage);

      function _scrapePage(error, response, html){
        if (error){
          console.log(error)
        } else {
          var $ = cheerio.load(html);
          userDetails = $('#host-profile').find("a")[0];
          if (userDetails !== undefined){
            href = $('#host-profile').find("a")[0]['attribs']['href'],
            entry = {
              rental: urls[i],
              user: "http://airbnb.com" + href,
              dateRetrieved: today
            };
            entries.push(entry);
            console.log(i + ': ' + urls[i] + ' belonging to user ' + href + ' was succesfully scraped.')
            setTimeout(function() { i++; cb(null,entry); }, 200);
          } else {
            urlsLength -= 1;
            console.log(i + ': ' + urls[i] + ' was not scraped. Check to ensure it still exists.')
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
        writeJson = {'body': entries}
        writeJsonString = JSON.stringify(writeJson);
        fs.writeFile(writeDoc, writeJsonString);
        listingInfoScraper._writeToLog();
      }
    )
  }
}

module.exports = listingInfoScraper;






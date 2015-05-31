#!/usr/bin/env node

var async = require('async'),
    fs = require('fs'),
    request = require('request'),
    http = require('http'),
    cheerio = require('cheerio'),
    Q = require("q"),
    userProfileUrlDoc = './userProfiles.json',
    i = 0;

listingInfoScraper = {

  buildUserProfileJson: function(){
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
        urls = parsedJSON['urls'];
        listingInfoScraper._scrapePages(urls, userProfileUrlDoc);
      });
    };
  },

  _getUrlList: function(){
    var deferred = Q.defer();
    http.get({
      host: 'localhost',
      path: '/rentaltracker/scripts/urlList.json'
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
              user: "http://airbnb.com" + href
            };
            entries.push(entry);
            setTimeout(function() { i++; cb(null,entry); }, 200);
          } else {
            urlsLength -= 1;
            console.log(urls[i] + ' was not scraped. Check to ensure it still exists.')
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

listingInfoScraper.buildUserProfileJson()





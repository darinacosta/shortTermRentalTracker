#!/usr/bin/env node

var async = require('async'),
    fs = require('fs'),
    request = require('request'),
    http = require('http'),
    cheerio = require('cheerio'),
    Q = require("q"),
    url ='localhost/rentaltracker/scripts/urlList.json',
    userProfileUrls = './userProfiles.js',
    userProfiles = {'userProfiles': []},
    i = 0;

getUrlList = function() {
  var deferred = Q.defer();
  http.get({
    host: 'localhost',
    path: '/rentaltracker/scripts/urlList.json'
   }, deferred.resolve);
  return deferred.promise;
};

function handleResponse(response) {
  var body = '';
  response.on('data', function(d) {
    body += d;
  });
  response.on('end', function(){
    fetchHtml(body)
  });
};

function fetchHtml(urlJson){
  var parsedJSON = JSON.parse(urlJson),
  urls = parsedJSON['urls'].slice(15,20),
  urlsLength = urls.length,
  i = 0;
  console.log('Begining to scrape ' + urlsLength + ' urls.')
  
  var fetch = function(cb){
    options = {
      url: urls[i],
      headers: {
        'User-Agent': "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36"
      }
    };
    request(options, function(error, response, html){
      if (error){
        console.log(error)
      } else {
        var $ = cheerio.load(html),
        userDetails = $('#host-profile').find("a")[0];
        if (userDetails !== undefined){
          href = $('#host-profile').find("a")[0]['attribs']['href'],
          entry = {
            rental: urls[i],
            user: "http://airbnb.com" + href
          };
          userProfiles['userProfiles'].push(entry);
          setTimeout(function() { i++; cb(null,entry); }, 200);
        } else {
          urlsLength -= 1;
          console.log(urls[i] + ' was not scraped. Check to ensure it exists.')
          i++;
          cb(null, 'error')
        }
      }
    })
  };

  async.whilst(
    function() { return i <= urls.length-1; },

    function(cb){
      fetch(cb)
    },

    function(err, results){
      if (err){
        console.log('Connection Error. Continuing application...');
      }
      userProfilesString = JSON.stringify(userProfiles);
      fs.writeFile(userProfileUrls, userProfilesString);
      console.log('-----------------------------' + '\n' +
                  'Entries requested: ' + i + '\n' +
                  'Entries written:   '+  urlsLength + '\n' +
                  '-----------------------------')
    }

  )
}


getUrlList()
  .then(handleResponse)


#!/usr/bin/env node

var async = require('async'),
    fs = require('fs'),
    request = require('request'),
    http = require('http'),
    cheerio = require('cheerio'),
    Q = require("q"),
    userProfileUrlDoc = './userProfiles.json',
    i = 0;

userScraper = {

  buildUserProfileJson: function(){
    var userScraper = this;
    userScraper._getUrlList()
    .then(_getHtml);

    function _getHtml(response) {
      var json = '';
      response.on('data', function(d) {
        json += d;
      });
      response.on('end', function(){
        var parsedJSON = JSON.parse(json),
        urls = parsedJSON['urls'].slice(15,20);
        userScraper._scrapePages(urls, userProfileUrlDoc);
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






/*profiles['result'].forEach(function(profile){
	console.log(profile['user'] + ', ' + profile['rental'] + ', ' + profile['units'])
})

Object.keys(propertyCount).forEach(function(key){
	var val = propertyCount[key];
	if (val > 1){
    console.log(key + ', ' + val)
	}
 }) */


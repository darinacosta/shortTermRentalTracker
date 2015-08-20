var listings;
var strCalculator = {};
var express = require('express');
var http = require('http');

var options = {
  host: 'nolarentalreport.com',
  path: '/rentaltracker'
};

var requestCallback = function(response){
  var str = '';

  response.on('data', function(chunk){
    str += chunk;
  });

  response.on('end', function(){
    listings = JSON.parse(str)['body'];
    console.log(listings);
  });
};

strCalculator.getData = function(){
  http.request(options, requestCallback).end();
};

strCalculator.calculateAverageNightlyPrice = function(){
  listings.forEach(function(listing){
    console.log('not yet');
  });
};

strCalculator.buildMultiUnitHostIndex = function(unitNumber){
  var userList = strCalculator.buildUserList();
  var multiUnitUsers = [];
    userList.forEach(function(user){
      listings.forEach(function(listing){
        if (listing.properties.user === user && listing.properties.units - 1 > unitNumber){
	  multiUnitUsers.push(listing);
	}
      })
  });
  return multiUnitUsers;
}

strCalculator.countMultiListingUsers = function(unitNumber){
  var multiUnitUsers = strCalculator.buildMultiUnitHostIndex(unitNumber);
  console.log(multiUnitUsers.length)
}

module.exports = strCalculator;

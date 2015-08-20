var listings;
var strCalculator = {};
var express = require('express');
var fs = require('fs');
var http = require('http');
var Q = require('q');
var path = require('path');
var output = path.join(__dirname, '../../public/assets/data/stats.json');

var options = {
  host: 'nolarentalreport.com',
  path: '/rentaltracker?neworleans=true'
};

var requestCallback = function(response){
  var str = '';

  response.on('data', function(chunk){
    str += chunk;
  });

  response.on('end', function(){
    var listings = JSON.parse(str)['body'];
    var listingTotals = strCalculator.countListings(listings);
    var multiListingUsers = strCalculator.countMultiListingUsers(listings, 2);
    var averagePrices = strCalculator.calculateAveragePrice(listings);
    var roomTypeTotals = strCalculator.countRoomTypes(listings);
    var stats = {
      listingTotals: listingTotals,
      roomTypeTotals: roomTypeTotals,
      multiListingUsers: multiListingUsers,
      averagePrices: averagePrices 
    };
    statsString = JSON.stringify(stats);
    fs.writeFile(output, statsString, function(){
      console.log('Stats file saved.');
    });
  });
};

strCalculator.getData = function(cb){
  http.request(options, requestCallback).end();
};

strCalculator.countListings = function(listings){
  var air = 0;
  var hma = 0;
  listings.forEach(function(listing){
    if (listing.properties.provider === 'air'){
      air += 1;
    } else if (listing.properties.provider === 'hma'){
      hma += 1;
    }
  });
  return {air: air,
	  hma: hma};
};

//CREATE COUNT ROOMTYPE
strCalculator.countRoomTypes = function(listings){
  var entireHome = 0;
  var sharedRoom = 0;
  var privateRoom = 0;

  listings.forEach(function(listing){
    if (listing.properties.provider === "air" && listing.properties['roomtype'] !== undefined){
      var roomType = listing.properties.roomtype;
      entireHome = roomType === "Entire home/apt" ? entireHome + 1 : entireHome;
      sharedRoom = roomType === "Shared room" ? sharedRoom + 1 : sharedRoom;
      privateRoom = roomType === "Private room" ? privateRoom + 1 : privateRoom;
    }
  });

  return {entireHome: entireHome,
	  sharedRoom: sharedRoom,
	  privateRoom:privateRoom};
}

strCalculator.buildUserList = function(listings){
  var userList = [];
  listings.forEach(function(listing){
    if (userList.indexOf(listing.properties['user']) === -1){
      userList.push(listing.properties['user'])
    }
  })
  return userList;
};

strCalculator.calculateAveragePrice = function(listings){
  var totalNightly = 0;
  var totalMonthly = 0;
  var airNightly = 0;
  var airMonthly = 0;
  var hmaNightly = 0;
  var hmaMonthly = 0;
  var totalCount = 0;
  var airCount = 0;
  var hmaCount = 0;
  var average;
  listings.forEach(function(listing){
    //caculate total
    var nightlyPrice = isNaN(listing.properties.nightlyprice) === true ? 0 : parseInt(listing.properties.nightlyprice); 
    var monthlyPrice = isNaN(listing.properties.monthlyprice) === true ? 0 : parseInt(listing.properties.monthlyprice);
    totalNightly += nightlyPrice;
    totalMonthly += monthlyPrice;
    totalCount += 1;

    //calculate air
    if (listing.properties.provider === "air"){
      airNightly += nightlyPrice;
      airMonthly += monthlyPrice;
      airCount += 1;
    } else if (listing.properties.provider === "hma"){
      hmaNightly += nightlyPrice;
      hmaMonthly += monthlyPrice;
      hmaCount += 1;
    }
  });
  
  averageNightly = Math.round(totalNightly/totalCount); 
  averageMonthly = Math.round(totalMonthly/totalCount);
  averageAirNightly = Math.round(airNightly/airCount);
  averageAirMonthly = Math.round(airMonthly/airCount);
  averageHmaNightly = Math.round(hmaNightly/hmaCount);
  averageHmaMonthly = Math.round(hmaMonthly/hmaCount);

  return {totalNightly: averageNightly,
	  totalMonthly: averageMonthly,
          airNightly: averageAirNightly,
          airMonthly: averageAirMonthly,
          hmaNightly: averageHmaNightly,
          hmaMonthly: averageHmaMonthly};
};

strCalculator.buildMultiUnitHostIndex = function(listings, unitNumber){
  var userList = strCalculator.buildUserList(listings);
  var multiUnitUsers = [];
    userList.forEach(function(user){
      listings.forEach(function(listing){
        if (listing.properties.user === user && listing.properties.units > unitNumber - 1){
	  multiUnitUsers.push(listing);
	}
      })
  });
  return multiUnitUsers;
}

strCalculator.countMultiListingUsers = function(listings, unitNumber){
  var multiUnitUsers = strCalculator.buildMultiUnitHostIndex(listings, unitNumber);
  return multiUnitUsers.length;
}

strCalculator.getData();

module.exports = strCalculator;

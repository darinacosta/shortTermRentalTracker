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
    console.log('Response received');
    var listings = JSON.parse(str)['body'];
    var listingTotals = strCalculator.countListings(listings);
    var multiListingUsers = strCalculator.countMultiListingUsers(listings, 2);
    var prices = strCalculator.calculatePrices(listings);
    var roomTypeTotals = strCalculator.countRoomTypes(listings);
    var stats = {
      listingTotals: listingTotals,
      roomTypeTotals: roomTypeTotals,
      multiListingUsers: multiListingUsers,
      prices: prices 
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

strCalculator.calculatePrices = function(listings){
  
  //combined
  var totalNightly = 0;
  var totalMonthly = 0;
  
  //air
  var airNightly = 0;
  var airMonthly = 0;
  var airEntirePlaceNightly = 0;
  var airEntirePlaceMonthly = 0;
  var airPrivateRoomNightly = 0;
  var airPrivateRoomMonthly= 0;
  var airSharedRoomNightly = 0;
  var airSharedRoomMonthly = 0;
  var airMaxNightly = 0;
  var airMaxMonthly = 0;
  var airMaxNightlyUser = '';
  var airMaxMonthlyUser = '';
  var airMaxNightlyListing = '';
  var airMaxMonthlyListing = '';
  
  //hma
  var hmaNightly = 0;
  var hmaMonthly = 0;
  var hmaMaxNightly = 0;
  var hmaMaxMonthly = 0;
  var hmaMaxNightlyListing = '';
  var hmaMaxMonthlyListing = '';
  
  //counts
  var totalCount = 0;
  var airCount = 0;
  var airEntirePlaceCount = 0;
  var airPrivateRoomCount = 0;
  var airSharedRoomCount = 0;
  var hmaCount = 0;
  var average;
  
  listings.forEach(function(listing){
    
    //get listing info
    var user = listing.properties['user'];
    var url = listing.properties['url'];
    
    //caculate total
    var nightlyPrice = isNaN(listing.properties.nightlyprice) === true ? 0 : parseInt(listing.properties.nightlyprice); 
    var monthlyPrice = isNaN(listing.properties.monthlyprice) === true ? 0 : parseInt(listing.properties.monthlyprice);
    
    totalNightly += nightlyPrice;
    totalMonthly += monthlyPrice;
    totalCount += 1;

    //calculate air
    if (listing.properties.provider === "air"){
      
      //cummulative prices	    
      airNightly += nightlyPrice;
      airMonthly += monthlyPrice;

      //max price users
      airMaxNightlyUser = airMaxNightly < nightlyPrice ? user : airMaxNightlyUser;  
      airMaxMonthlyUser = airMaxMonthly < monthlyPrice ? user : airMaxMonthlyUser; 
      
      //max price listings 
      airMaxNightlyListing = airMaxNightly < nightlyPrice ? url : airMaxNightlyListing;  
      airMaxMonthlyListing = airMaxMonthly < monthlyPrice ? url : airMaxMonthlyListing; 
      
      //max prices
      airMaxNightly = airMaxNightly < nightlyPrice ? nightlyPrice : airMaxNightly; 
      airMaxMonthly = airMaxMonthly < monthlyPrice ? monthlyPrice : airMaxMonthly; 
      
      airCount += 1;
      
      if (listing.properties.provider === "air" && listing.properties.roomtype === "Entire home/apt"){
        airEntirePlaceNightly += nightlyPrice;
	airEntirePlaceMonthly += monthlyPrice;
	airEntirePlaceCount += 1
      } else if (listing.properties.provider === "air" && listing.properties.roomtype === "Private room"){ 
        airPrivateRoomNightly += nightlyPrice;
	airPrivateRoomMonthly += monthlyPrice;
	airPrivateRoomCount += 1 
      } else if (listing.properties.provider === "air" && listing.properties.roomtype === "Shared room"){ 
        airSharedRoomNightly += nightlyPrice;
	airSharedRoomMonthly += monthlyPrice;
	airSharedRoomCount += 1
      }

    // calculate hma
    } else if (listing.properties.provider === "hma"){
      hmaNightly += nightlyPrice;
      hmaMonthly += monthlyPrice;
     
      //max price listings 
      hmaMaxNightlyListing = hmaMaxNightly < nightlyPrice ? url : hmaMaxNightlyListing;  
      hmaMaxMonthlyListing = hmaMaxMonthly < monthlyPrice ? url : hmaMaxMonthlyListing; 
      
      //max prices
      hmaMaxNightly = hmaMaxNightly < nightlyPrice ? nightlyPrice : hmaMaxNightly; 
      hmaMaxMonthly = hmaMaxMonthly < monthlyPrice ? monthlyPrice : hmaMaxMonthly; 
      
      hmaCount += 1;
    }
  });
  
  //total averages  
  averageNightly = Math.round(totalNightly/totalCount); 
  averageMonthly = Math.round(totalMonthly/totalCount);

  //air averages
  averageAirNightly = Math.round(airNightly / airCount);
  averageAirMonthly = Math.round(airMonthly / airCount);
  averageAirEntirePlaceNightly = Math.round(airEntirePlaceNightly / airEntirePlaceCount);
  averageAirEntirePlaceMonthly = Math.round(airEntirePlaceMonthly / airEntirePlaceCount);
  averageAirSharedRoomNightly = Math.round(airSharedRoomNightly / airSharedRoomCount);
  averageAirSharedRoomMonthly = Math.round(airSharedRoomMonthly / airSharedRoomCount);
  averageAirPrivateRoomNightly = Math.round(airPrivateRoomNightly / airPrivateRoomCount);
  averageAirPrivateRoomMonthly = Math.round(airPrivateRoomMonthly / airPrivateRoomCount);
  
  //hma averages
  averageHmaNightly = Math.round(hmaNightly/hmaCount);
  averageHmaMonthly = Math.round(hmaMonthly/hmaCount);

  return {total: {averageNightly: averageNightly,
	          averageMonthly: averageMonthly},
          air: {averageTotalNightly: averageAirNightly,
                averageTotalMonthly: averageAirMonthly,
	        averageEntirePlaceNight: averageAirEntirePlaceNightly,
	        averageEntirePlaceMonthly: averageAirEntirePlaceMonthly,
	        averagePrivateRoomNightly: averageAirPrivateRoomNightly,
	        averagePrivateRoomMonthly: averageAirPrivateRoomMonthly,
	        averageSharedRoomNightly: averageAirSharedRoomNightly,
		averageSharedRoomMonthly: averageAirSharedRoomMonthly,
		maxNightlyPrice: airMaxNightly,
		maxMonthlyPrice: airMaxMonthly,
		maxNightlyListing: airMaxNightlyListing,
		maxMonthlyListing: airMaxMonthlyListing,
		maxNightlyUser: airMaxNightlyUser,
		maxMonthlyUser: airMaxMonthlyUser
	  },
          hma: {averageTotalNightly: averageHmaNightly,
                averageTotalMonthly: averageHmaMonthly,
		maxNightlyPrice: hmaMaxNightly,
		maxMonthlyPrice: hmaMaxMonthly,
	        maxNightlyListing: hmaMaxNightlyListing,
		maxMonthlyListing: hmaMaxMonthlyListing
	  }
  };
};

strCalculator.buildMultiUnitHostIndex = function(listings, unitNumber){
  var userList = strCalculator.buildUserList(listings);
  var multiUnitUsers = {air: 0,
	                hma: 0
                       };
    userList.forEach(function(user){
      listings.forEach(function(listing){
        if (listing.properties.user === user && listing.properties.units > unitNumber - 1){
	  if (listing.properties.provider === "air"){
	    multiUnitUsers.air += 1;
	  } else if (listing.properties.provider === "hma"){
	    multiUnitUsers.hma += 1;
	  }
	}
      })
  });
  return multiUnitUsers;
}

strCalculator.countMultiListingUsers = function(listings, unitNumber){
  var multiUnitUsers = strCalculator.buildMultiUnitHostIndex(listings, unitNumber);
  return multiUnitUsers;
}

module.exports = strCalculator;

#!/usr/bin/env node

var unirest = require('unirest'),
    fs = require('fs'),
    path = require('path'),
    scraperEnv = require('./../env/scraperEnv'),
    today = new Date();

rentalScraper = {
  _rentalsGeoJsonPath: path.join(__dirname, '../../layers/rentals.json'),
  _logFile: path.join(__dirname, '../output/log.txt'),
  _urlListFile: path.join(__dirname, '../output/urlList.json'),
  _geoJson: { "type": "FeatureCollection",
             "features": []},
  _pageCount: 1,
  _numberOfFeaturesWritten: 0,
  _urlList: {urls:[]},
  fetchListings: function(pageNum) { 
  	var rentalScraper = this,
        nelatitude = 30.123749,
        nelongitude = -89.868164,
        swlatitude = 29.881137,
        swlongitude = -90.557556,
        url = "https://zilyo.p.mashape.com/search?isinstantbook=false" + 
              "&nelatitude=" + nelatitude + "&nelongitude=" + nelongitude + 
              "&swlatitude=" + swlatitude + "&swlongitude=" + swlongitude + 
              "&&provider=airbnb%2C+alwaysonvacation%2C+apartmentsapart%2C+bedycasa%2C+bookingpal%2C+citiesreference%2C+edomizil%2C+geronimo%2C+gloveler%2C+holidayvelvet%2C+homeaway%2C+homestay%2C+hostelworld%2C+housetrip%2C+interhome%2C+nflats%2C+roomorama%2C+stopsleepgo%2C+theotherhome%2C+travelmob%2C+vacationrentalpeople%2C+vaycayhero%2C+waytostay%2C+webchalet%2C+zaranga&" + 
              "page=" + rentalScraper._pageCount;
    
  	unirest.get(url)
  	.header("X-Mashape-Key", scraperEnv.mashape_key)
  	.header("Accept", "application/json")
  	.end(function (result) {
      console.log('Scanning page ' + rentalScraper._pageCount + '...')
  		var parsedResult = JSON.parse(result.body);
      rentalScraper._handleResult(parsedResult);
      rentalScraper._pageCount = rentalScraper._pageCount + 1;
      if (parsedResult['ids'].length > 1 && pageNum === undefined){
        rentalScraper.fetchListings()
      }else if (pageNum !== undefined){
        console.log(pageNum)
        console.log(parsedResult['result'][1]['provider']['url'])
      }else {
        rentalScraper._writeGeojsonToFile();
      }
    });
  },
  
  _handleResult: function(result){
    var rentalScraper = this, 
        resultLength = result['result'].length;
    rentalScraper._numberOfFeaturesWritten += resultLength;
    for (var i = 0; i < result['result'].length; i += 1){
      rentalScraper._pushToGeoJson(result['result'][i]); 
      rentalScraper._urlList['urls'].push(result['result'][i]['provider']['url']); 
    }
  },

  _writeGeojsonToFile: function(){
    var geoJsonString = JSON.stringify(this._geoJson),
        urlString = JSON.stringify(this._urlList);
    fs.writeFile(this._rentalsGeoJsonPath, geoJsonString, function (err) {
      if (err) throw err;
    });
    fs.writeFile(this._urlListFile, urlString);
    this._writeToLog();
    console.log('Complete.')
  },

  _pushToGeoJson: function(location){
    var latlng = switchLatLong(location['latLng']);
    this._geoJson['features'].push({
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": latlng
      },
      "properties":{
        "url": location['provider']['url'],
        "roomType": location['attr']['roomType']['text'],
        "city": location['location']['city'],
        "neighborhood": location['location']['neighbourhood'],
        "street": location['location']['streetName'],
        "dateCollected": today
      }
    })
  },

  _writeToLog: function(){
    var rentalScraper = this,
    logString = "--------------------------" + "\n" +
    "Rental Scraper Log: " + today + "\n" +
    "Features collected: " + rentalScraper._numberOfFeaturesWritten + "\n" +
    "Calls to server:    " + rentalScraper._pageCount + "\n" +
    "--------------------------"+ "\n";
    fs.appendFile(rentalScraper._logFile, logString);
  }
};

function switchLatLong(latlng){
  var lat = latlng[0],
      lng = latlng[1];
      return [lng, lat]
};

module.exports = rentalScraper;


var unirest = require('unirest'),
    fs = require('fs'),
    Q = require('q'),
    scraper_env = require('./scraper_env'),
    rentalsGeoJsonPath = '../layers/rentals.json', 
    i = 1;

rentalScraper = {

  geoJson: { "type": "FeatureCollection",
             "features": []},

  getResponseByPage: function(pageNumber, callback) { 
  	var nelatitude = 30.123749,
        nelongitude = -89.868164,
        swlatitude = 29.881137,
        swlongitude = -90.557556,
        url = "https://zilyo.p.mashape.com/search?isinstantbook=false" + 
              "&nelatitude=" + nelatitude + "&nelongitude=" + nelongitude + 
              "&swlatitude=" + swlatitude + "&swlongitude=" + swlongitude + 
              "&&provider=airbnb%2C+alwaysonvacation%2C+apartmentsapart%2C+bedycasa%2C+bookingpal%2C+citiesreference%2C+edomizil%2C+geronimo%2C+gloveler%2C+holidayvelvet%2C+homeaway%2C+homestay%2C+hostelworld%2C+housetrip%2C+interhome%2C+nflats%2C+roomorama%2C+stopsleepgo%2C+theotherhome%2C+travelmob%2C+vacationrentalpeople%2C+vaycayhero%2C+waytostay%2C+webchalet%2C+zaranga&" + 
              "page=" + pageNumber;
    
  	unirest.get(url)
  	.header("X-Mashape-Key", scraper_env.mashape_key)
  	.header("Accept", "application/json")
  	.end(function (result) {
      console.log('Scanning page ' + pageNumber + '...')
  		var parsedResult = JSON.parse(result.body);
      if (parsedResult['ids'] > 1){
        callback(parsedResult)
      } else {
        return 'Complete';
      }
    });
  },
  
  getCompleteResponse: function(){
    var rentalScraper = this,
    i = 1,
    escape = 0,
    results = [];
    rentalScraper.getResponseByPage(i, function(pageResult){
      if (pageResult === 'Complete') return;
      bodyResult = pageResult['result'];
      if (pageResult['ids'] < 1) escape = 1;
      for (var n = 0; n < bodyResult.length; n ++){
        rentalScraper._pushToGeoJson(bodyResult[n])
        console.log(bodyResult[n])
      } 
    }); 
  },

  writeGeojsonToFile: function(){
    this.getCompleteResponse();
    var geoJsonString = JSON.stringify(this.geoJson);
    fs.writeFile(rentalsGeoJsonPath, geoJsonString);
  },

  _pushToGeoJson: function(location){
    var latlng = switchLatLong(location['latLng']);
    this.geoJson['features'].push({
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": latlng
      },
      "properties":{
        "url": location['provider']['url'],
      }
    })
  }
};

function switchLatLong(latlng){
  var lat = latlng[0],
      lng = latlng[1];
      return [lng, lat]
};

rentalScraper.writeGeojsonToFile();
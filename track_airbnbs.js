var unirest = require('unirest'),
    rentalsGeoJsonPath = './rentals.json',
    rentalsGeoJson = require(rentalsGeoJsonPath),
    fs = require('fs'),
    geoJson = { "type": "FeatureCollection",
      "features": []};

unirest.get("https://zilyo.p.mashape.com/search?isinstantbook=true&nelatitude=30.123749&nelongitude=-89.868164&provider=airbnb%2Chousetrip&swlatitude=29.881137&swlongitude=-90.557556")
.header("X-Mashape-Key", "9qRGPp2G8Pmsh63uQFNtIAesIx8cp1ZisvLjsnt2HhMqd6jGu7")
.header("Accept", "application/json")
.end(function (result) {
  handleResult(result);
});

function handleResult(result){
  var parsedResult = JSON.parse(result.body);
  for (var i = 0; i < parsedResult['result'].length; i += 1){
    pushToGeoJson(parsedResult['result'][i]); 
  }
  var geoJsonString = JSON.stringify(geoJson);
  fs.writeFile(rentalsGeoJsonPath, geoJsonString);
}

function pushToGeoJson(location){
  geoJson['features'].push({
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": location['latLng']
    },
    "properties":{
      "url": location['provider']['url'],
    }
  })
};
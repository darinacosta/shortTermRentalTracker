var unirest = require('unirest'),
    rentalsGeoJsonPath = './rentals.json',
    rentalsGeoJson = require(rentalsGeoJsonPath),
    fs = require('fs'),
    geoJson = { "type": "FeatureCollection",
      "features": []};

unirest.get("https://zilyo.p.mashape.com/search?isinstantbook=true&nelatitude=30&nelongitude=-90&provider=airbnb%2Chousetrip&swlatitude=29&swlongitude=-91")
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
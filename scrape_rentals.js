var unirest = require('unirest'),
    rentalsGeoJsonPath = './rentals.json',
    rentalsGeoJson = require(rentalsGeoJsonPath),
    fs = require('fs'),
    geoJson = { "type": "FeatureCollection",
      "features": []},
    i = 1;


function paginate() { 
	console.log('Reading page ' + i + '...')
	unirest.get("https://zilyo.p.mashape.com/search?isinstantbook=false&nelatitude=30.123749&nelongitude=-89.868164&provider=airbnb%2Chousetrip&swlatitude=29.881137&swlongitude=-90.557556&page=" + i)
	.header("X-Mashape-Key", "9qRGPp2G8Pmsh63uQFNtIAesIx8cp1ZisvLjsnt2HhMqd6jGu7")
	.header("Accept", "application/json")
	.end(function (result) {
		var parsedResult = JSON.parse(result.body);
	  handleResult(parsedResult);
	  i = i + 1;
	  if (parsedResult['ids'].length > 1){
	  	paginate(); 
	  } else {
	  	console.log('==================FINAL PAGE===============\n' +
	  	result + '\n' + 
	  	'==============END FINAL PAGE===============')
	  	var geoJsonString = JSON.stringify(geoJson);
	  	fs.writeFile(rentalsGeoJsonPath, geoJsonString);
	  }
	});
}; 
paginate();

function handleResult(result){
  for (var i = 0; i < result['result'].length; i += 1){
    pushToGeoJson(result['result'][i]); 
  }
}

function pushToGeoJson(location){
	var latlng = switchLatLong(location['latLng']);
  geoJson['features'].push({
    "type": "Feature",
    "geometry": {
      "type": "Point",
      "coordinates": latlng
    },
    "properties":{
      "url": location['provider']['url'],
    }
  })
};

function switchLatLong(latlng){
  var lat = latlng[0],
      lng = latlng[1];
      return [lng, lat]
};
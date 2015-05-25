var unirest = require('unirest'),
  gdal = require("gdal");
  rentalsGeoJsonPath = './rentals.json',
  rentalsGeoJson = require(rentalsGeoJsonPath),
  fs = require('fs'),
  geoJson = { "type": "FeatureCollection",
    "features": []},
  i = 1;


function paginate() { 
  console.log('Reading page ' + i + '...')
  unirest.get("https://zilyo.p.mashape.com/search?isinstantbook=false&nelatitude=30.123749&nelongitude=-89.868164&&provider=airbnb%2C+alwaysonvacation%2C+apartmentsapart%2C+bedycasa%2C+bookingpal%2C+citiesreference%2C+edomizil%2C+geronimo%2C+gloveler%2C+holidayvelvet%2C+homeaway%2C+homestay%2C+hostelworld%2C+housetrip%2C+interhome%2C+nflats%2C+roomorama%2C+stopsleepgo%2C+theotherhome%2C+travelmob%2C+vacationrentalpeople%2C+vaycayhero%2C+waytostay%2C+webchalet%2C+zaranga&swlatitude=29.881137&swlongitude=-90.557556&page=" + i)
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
      JSON.stringify(result) + '\n' + 
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
    console.log(JSON.stringify(result['result'][i]['provider']['url']));
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
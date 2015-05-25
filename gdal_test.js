var gdal = require("gdal");
  rentalsGeoJsonPath = './rentals.json',
  rentalsGeoJson = require(rentalsGeoJsonPath);

var envelope = new gdal.Polygon();

for (var i = 0; i < 2; i++) { 
	console.log(rentalsGeoJson.features[i].geometry.coordinates);
	var test_point = new gdal.Point(rentalsGeoJson.features[i].geometry.coordinates[0],rentalsGeoJson.features[i].geometry.coordinates[1])
}

console.log(envelope);

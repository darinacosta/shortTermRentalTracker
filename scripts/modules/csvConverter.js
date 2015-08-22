var fs = require('fs');
var json2csv = require('json2csv');
var http = require('http');
var path = require('path');
var csvConverter = {};

csvConverter.airFields = ['properties.id','properties.x', 'properties.y', 'properties.city','properties.updated','properties.nightlyprice','properties.monthlyprice','properties.neighborhood','properties.roomtype','properties.street','properties.units','properties.url','properties.user'];

csvConverter.airFieldNames = ['ID', 'X', 'Y', 'City', 'Date Collected', 'Nightly Price', 'Monthly Price', 'Neighborhood', 'Room Type', 'Street', 'Units', 'URL', 'User URL'];

csvConverter.hmaFields = ['properties.id','properties.x','properties.y','properties.city','properties.updated','properties.nightlyprice','properties.monthlyprice','properties.neighborhood','properties.roomtype','properties.street','properties.url','properties.user'];

csvConverter.hmaFieldNames = ['ID', 'X', 'Y', 'City', 'Date Collected', 'Nightly Price', 'Monthly Price', 'Neighborhood', 'Room Type', 'Street', 'URL', 'Name Provided'];

csvConverter.convert2csv = function(provider, filename) {
  http.get({
    host: 'nolarentalreport.com',
    path: '/rentaltracker?provider=' + provider
  }, function(res){
    var body = '';
    res.on('data', function(d){
      body += d;
    });
    res.on('end', function(){
      var parsed = JSON.parse(body);
      
      for (var i = 0; i < parsed.body.length; i++){
      	var listing = parsed.body[i];
	listing.properties.x = listing.geometry.coordinates[0];
        listing.properties.y = listing.geometry.coordinates[1];
	if (listing.properties.provider === 'hma'){
          listing.properties['user'] = listing.properties['user'] !== null && typeof(listing.properties['user']) === 'object' ? listing.properties['user'][0] : listing.properties['user'];
	}
      };

      var csvOptions = {
        data: parsed.body,
        fields: provider === "air" ? csvConverter.airFields : csvConverter.hmaFields,
        fieldNames: provider === "air" ? csvConverter.airFieldNames : csvConverter.hmaFieldNames,
        nested: true,
        del: ','
      };

      json2csv(csvOptions, function(err, csv){
        if (err) console.log(err);
        fs.writeFile(path.join(__dirname, '../../public/assets/' + filename), csv, function(err){
          if (err) throw err;
	  console.log(filename + ' saved to ' + path.join(__dirname, '../../public/assets'));
        })
      })
    })
  })
}

module.exports = csvConverter;



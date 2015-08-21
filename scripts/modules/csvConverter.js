var fs = require('fs');
var json2csv = require('json2csv');
var http = require('http');
var path = require('path');
var csvConverter = {};

csvConverter.fields = ['properties.id','geometry.coordinates','properties.city','properties.updated','properties.nightlyprice','properties.monthlyprice','properties.neighborhood','properties.roomtype','properties.street','properties.units','properties.url','properties.user'];

csvConverter.fieldNames = ['ID', 'Coordinates', 'City', 'Date Collected', 'Nightly Price', 'Monthly Price', 'Neighborhood', 'Room Type', 'Street', 'Units', 'URL', 'User URL'];

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
    
      var csvOptions = {
        data: parsed.body,
        fields: csvConverter.fields,
        fieldNames: csvConverter.fieldNames,
        nested: true,
        del: ';'
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



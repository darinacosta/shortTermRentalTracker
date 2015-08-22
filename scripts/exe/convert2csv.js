csvConverter = require('./../modules/csvConverter');

csvConverter.convert2csv('air','airbnb.csv');

//Wait before making another request to the server
setTimeout(function(){
  csvConverter.convert2csv('hma','homeaway.csv')
}, 1000);	

csvConverter = require('./../modules/csvConverter');

csvConverter.convert2csv('air','airbnb.txt');

//Wait before making another request to the server
setTimeout(function(){
  csvConverter.convert2csv('hma','homeaway.txt')
}, 2000);	

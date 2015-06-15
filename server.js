var express = require('express');
var app = express();
var path = require('path');

app.use('/',express.static(__dirname + '/public'));
app.use('/bower_components',express.static(__dirname + '/bower_components'));
app.use('/node_modules',express.static(__dirname + '/node_modules'));

app.get('*', function(req, res){
   res.sendFile(__dirname + '/public/index.html');
});
 
var port = process.env.PORT || 3000;
app.listen(port, function() {
   console.log('server listening on port ' + port);
});
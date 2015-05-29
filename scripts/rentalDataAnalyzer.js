var http = require('http'),
    Q = require("q");

promise = function() {
  var deferred = Q.defer();
  http.get({
    host: 'localhost',
    path: '/rentaltracker/scripts/urlList.json'
   }, deferred.resolve);
  return deferred.promise;
};

function handleResponse(response) {
  var body = '';
  response.on('data', function(d) {
    body += d;
  });
  response.on('end', function(data){
    console.log(data)
  });
};

function handleNextResponse(nextResponse){
  console.log(nextResponse);
};


promise()
  .then(handleResponse)


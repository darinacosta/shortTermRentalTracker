var Q = require("q");
var array =[1,2,3,4,5,6,7,8];


mapSeries = function(arr, iterator, cb) {
  // create a empty promise to start our series (so we can use `then`)
  var currentPromise = Q()
  var promises = arr.map(function (el) {
    return currentPromise = currentPromise.then(function () {
      // execute the next function after the previous has resolved successfully
      return iterator(el)
    })
  })
  // group the results and return the group promise
  return Q.all(promises)
  .then(
    function () { 
      cb();
    },
    function (err) { 
      cb(err);
    })
};

function delayLog(string){
  var deferred = Q.defer();
  setTimeout(function() {
    deferred.resolve(console.log(string + " delayed."))
  }, 500);
  return deferred.promise;
}

mapSeries(array, delayLog, function(){
  console.log('complete')
})


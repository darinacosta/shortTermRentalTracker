app.factory("asyncHelper", ['$rootScope', '$timeout', asyncHelper]);

function asyncHelper($rootScope, $timeout){
  
  return function asyncHelper(callback){
    $timeout(function(){
      $rootScope.$apply(
        callback()
      )
    });
  };

}

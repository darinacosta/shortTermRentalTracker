app.controller('resourcesCtrl', ['$scope', '$http', 'asyncHelper',  resourcesCtrl]);

function resourcesCtrl($scope, $http, asyncHelper) {
  $http.get("assets/data/resources.json").success(function(data){
    console.log(data);
    asyncHelper(function(){
      $scope.resources = data.body; 
      console.log(data.body);
    })
  });
}

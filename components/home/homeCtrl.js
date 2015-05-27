app.controller('homeCtrl', ['$scope', 'mapSvc', homeCtrl]);

function homeCtrl($scope, mapSvc) {
  console.log(mapSvc.layers)
  
}
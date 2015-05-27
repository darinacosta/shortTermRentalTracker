app.controller('homeCtrl', ['$scope', 'mapSvc', homeCtrl]);

function homeCtrl($scope, mapSvc) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes;

  map.setView(mapAttributes.center, mapAttributes.zoom);
  
}
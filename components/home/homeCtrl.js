app.controller('homeCtrl', ['$scope', 'mapSvc', 'layerHelpers', '$http', homeCtrl]);

function homeCtrl($scope, mapSvc, layerHelpers, $http) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl;

  map.setView(mapAttributes.center, mapAttributes.zoom);

 
  
}
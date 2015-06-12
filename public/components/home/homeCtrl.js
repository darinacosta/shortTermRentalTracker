app.controller('homeCtrl', ['$scope', 'mapSvc', 'layerHelpers', '$http', homeCtrl]);

function homeCtrl($scope, mapSvc, layerHelpers, $http) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl,
    layerManager = layerHelpers.layerManager,
    shortTermRentalClustersManager = new layerManager("Regional Short Term Rental Clusters"),
    shortTermRentalClusters;

  map.setView(mapAttributes.center, mapAttributes.zoom);
  $scope.$on('loadBaseLayers', function(){
    shortTermRentalClusters = shortTermRentalClustersManager.getLayer();
  	map.addLayer(shortTermRentalClusters);
  })
  
}
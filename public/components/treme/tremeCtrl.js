app.controller('tremeCtrl', ['$scope', 'mapSvc', 'layerHelpers', tremeCtrl]);

function tremeCtrl($scope, mapSvc, layerHelpers) {
  var map = mapSvc.map,
  shortTermRentalClustersManager = new layerManager("Regional Short Term Rental Clusters"),
  shortTermRentalClusters;
  
  map.setView([29.965494, -90.067849], 16);

  $scope.$on('loadBaseLayers', function(){
    shortTermRentalClusters = shortTermRentalClustersManager.getLayer();
  	map.addLayer(shortTermRentalClusters);
  })
}
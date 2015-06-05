app.controller('mapCtrl', ['$scope', '$q', '$timeout', 'mapSvc', 'layerSvc', 'layerHelpers', '$http', mapCtrl]);

function mapCtrl($scope, $q, $timeout, mapSvc, layerSvc, layerHelpers, $http) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl,
    shortTermRentalLayer = {},
    shortTermRentalClusters = {};
    $scope.legend = "";

  layerSvc.getShortTermRentals().then(function(rentalLayers){
    map.addLayer(rentalLayers.shortTermRentalClusters);
    layerHelpers.populateBaseLayerControl({
      "Regional Short Term Rental Clusters": rentalLayers.shortTermRentalClusters, 
      "Regional Short Term Rental Points": rentalLayers.shortTermRentalLayer
    })
  })

  layerSvc.getLicensedRentals().then(function(licensedRentals){
    layerHelpers.populateLayerControl({
      "Orleans Parish Licensed Rentals": licensedRentals 
    });
  })
}

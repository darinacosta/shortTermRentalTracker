app.controller('mapCtrl', ['$scope', '$q', '$timeout', 'mapSvc', 'layerSvc', 'layerHelpers', '$http', mapCtrl]);

function mapCtrl($scope, $q, $timeout, mapSvc, layerSvc, layerHelpers, $http) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl,
    shortTermRentalLayer = {},
    shortTermRentalClusters = {};
    $scope.legend = "";


  layerSvc.getShortTermRentals().then(function(rentalLayers){
    console.log(rentalLayers)
    map.addLayer(rentalLayers.shortTermRentalClusters);
    layerHelpers.populateBaseLayerControl({
      "Regional STR Clusters": rentalLayers.shortTermRentalClusters, 
      "Regional STR Points": rentalLayers.shortTermRentalLayer
    })
  })

  layerSvc.getLicensedRentals().then(function(licensedRentals){
    layerHelpers.populateLayerControl({
      "Orleans Parish Licensed Rentals": licensedRentals 
    });
  })
}

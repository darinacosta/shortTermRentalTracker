app.controller('mapCtrl', ['$scope', '$rootScope', '$q', '$timeout','layerSvc', 'layerHelpers', '$http', mapCtrl]);

function mapCtrl($scope, $rootScope, $q, $timeout, layerSvc, layerHelpers, $http) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl,
    shortTermRentalLayer = {},
    shortTermRentalClusters = {};
    $scope.legend = "";

  layerSvc.getShortTermRentals().then(function(rentalLayers){
    layerHelpers.populateBaseLayerControl({
      "Regional Short Term Rental Clusters": rentalLayers.shortTermRentalClusters, 
      "Regional Short Term Rental Points": rentalLayers.shortTermRentalLayer
    })
    map.addLayer(rentalLayers.shortTermRentalLayer);
    $rootScope.$broadcast('loadBaseLayers', 'complete');
  })

  layerSvc.getLicensedRentals().then(function(licensedRentals){
    layerHelpers.populateLayerControl({
      "Orleans Parish Licensed Rentals": licensedRentals 
    });
  })
}

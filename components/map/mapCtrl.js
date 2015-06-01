app.controller('mapCtrl', ['$scope', '$q', '$timeout', 'mapSvc', 'layerHelpers', '$http', 'geojsonUtils', mapCtrl]);

function mapCtrl($scope, $q, $timeout, mapSvc, layerHelpers, $http, gju) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl;

  function shortTermRentalPointStyle(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 4,
      fillColor: colorPointsConditionally(feature),
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    })
  };

  function colorPointsConditionally(feature){
    unitNumber = parseInt(feature.properties.units)
    if (unitNumber > 1 && unitNumber < 5){
      return "#FF7000";
    }else if (unitNumber > 4 && unitNumber < 20){
      return "#FF4000"
    }else if (unitNumber > 20){ 
      return "#FF0000"
    }else{
      return "#FFE000"
    }
  };

  function shortTermRentalPopup(feature, layer) {
    var popup;
    if (feature.properties.user !== undefined){
      var pluralListing = feature.properties.units === '1' ? 'listing' : 'listings';
      popup = '<h4>' + feature.properties.street + ' Rental<br> <small>' + feature.properties.roomType + '</small></h4>' +
              '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>' +
              '<b>User:</b> <a target="_blank" href="' + feature.properties.user + '">' + feature.properties.user + '</a><br><br>' + 
              '<b>This user has ' + feature.properties.units + ' ' + pluralListing + '.</b>'
    } else {
      popup = '<h3>' + feature.properties.street + ' Rental (' + feature.properties.roomType + ')</h3>' +
              '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>';
    }
    layer.bindPopup(popup);
  };

  function configureShortTermRentalLayer(data, status) {
    var shortTermRentalLayer = L.geoJson(data, {
      onEachFeature: shortTermRentalPopup,
      pointToLayer: shortTermRentalPointStyle
    });
    var shortTermRentalClusters = new L.MarkerClusterGroup();
    shortTermRentalClusters.addLayer(shortTermRentalLayer);
    layerHelpers.addLayerCustom({alias: "Rental Clusters",
                                layer:  shortTermRentalClusters});
    layerHelpers.populateBaseLayerControl({
      "Rental Clusters": shortTermRentalClusters, 
      "Rental Points": shortTermRentalLayer
    });
    console.log(data);
  };


  $http.get("./layers/multiUnitRentals.json?v=0.02").success(
    configureShortTermRentalLayer
  );

  /*$http.get('./scripts/stats.json').success(function(data){  
    $timeout(function() {
      $scope.$apply(function() {
        $scope.total = data.stats.total;
        console.log(data.stats.total)
      });
    });
  });*/

  
}

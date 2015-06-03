app.controller('mapCtrl', ['$scope', '$q', '$timeout', 'mapSvc', 'layerSvc', 'layerHelpers', '$http', 'geojsonUtils', mapCtrl]);

function mapCtrl($scope, $q, $timeout, mapSvc, layerSvc, layerHelpers, $http, gju) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl
    $scope.legend = "<i>Regional Short Term Rental Clusters</i>";

  function shortTermRentalPointStyle(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 4,
      fillColor: colorPointsConditionally(feature),
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
      name: 'shortterm'
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
    var nolaTotal = 0;
    angular.forEach(data['features'], function(feature){
      if (feature['properties']['city'] === 'New Orleans'){
        nolaTotal += 1;
      }
    });
    $timeout(function() {
      $scope.$apply(function() {
        $scope.nolaTotal = nolaTotal;
      });
    });
    var shortTermRentalLayer = L.geoJson(data, {
      onEachFeature: shortTermRentalPopup,
      pointToLayer: shortTermRentalPointStyle
    });
    var shortTermRentalClusters = new L.MarkerClusterGroup();
    shortTermRentalClusters.addLayer(shortTermRentalLayer);
    layerHelpers.addLayerCustom({alias: "Rental Clusters",
                                layer:  shortTermRentalClusters});
    layerHelpers.populateBaseLayerControl({
      "Regional STR Clusters": shortTermRentalClusters, 
      "Regional STR Points": shortTermRentalLayer
    });
  };
  

  //create asyncSvc
  function asyncHelper(callback){
    $timeout(function(){
      $scope.$apply(
        callback()
      )
    });
  }

  map.on('baselayerchange', function(e){
    console.log(e)
   if (e.name === "Regional STR Clusters"){
      asyncHelper(function() {
        $scope.legend = "<i>Regional Short Term Rental Clusters</i>";
      });
    }else if (e.name === "Regional STR Points"){
      asyncHelper(function() {
        $scope.legend = "<i>Regional Short Term Rental Points</i>";
      });
    } else {
      asyncHelper(function() {
        $scope.legend = "<i>Orleans Parish Licensed Short Term Rentals</i>";
      });
    }
  });


  $http.get("./layers/multiUnitRentals.json").success(
    configureShortTermRentalLayer
  );

  layerSvc.getLicensedRentals().then(function(licensedRentals){
     layerHelpers.populateBaseLayerControl({
      "Orleans Parish Licensed Rentals": licensedRentals 
    });
  })

  /*$http.get('./scripts/stats.json').success(function(data){  
    $timeout(function() {
      $scope.$apply(function() {
        $scope.total = data.stats.total;
        console.log(data.stats.total)
      });
    });
  });*/

  
}

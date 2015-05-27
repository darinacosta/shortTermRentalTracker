app.controller('homeCtrl', ['$scope', 'mapSvc', 'layerHelpers', '$http', homeCtrl]);

function homeCtrl($scope, mapSvc, layerHelpers, $http) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl;

  map.setView(mapAttributes.center, mapAttributes.zoom);

  function shortTermRentalPointStyle(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 4,
      fillColor: "#ff7800",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    })
  };

  function shortTermRentalPopup(feature, layer) {
    layer.bindPopup('<a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a>');
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
    layerHelpers.populateLayerControl({
      "Rental Clusters": shortTermRentalClusters, 
      "Rental Points": shortTermRentalLayer
    });
    console.log(layerControl);
  };

  
  $http.get("./layers/rentals.json").success(
    configureShortTermRentalLayer
  );
  
}
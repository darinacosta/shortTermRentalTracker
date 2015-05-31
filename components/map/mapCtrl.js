app.controller('mapCtrl', ['$scope', 'mapSvc', 'layerHelpers', '$http', mapCtrl]);

function mapCtrl($scope, mapSvc, layerHelpers, $http) {
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
    console.log(unitNumber)
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
      popup = '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>' +
              '<b>Renter profile:</b> <a target="_blank" href="' + feature.properties.user + '">' + feature.properties.user + '</a><br>' + 
              '<b>Total units listed by renter:</b> '+ feature.properties.units
    } else {
      popup = '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>';
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
    layerHelpers.populateLayerControl({
      "Rental Clusters": shortTermRentalClusters, 
      "Rental Points": shortTermRentalLayer
    });
    console.log(layerControl);
  };


  $http.get("./layers/multiUnitRentals.json?v=0.01").success(
    configureShortTermRentalLayer
  );
  
}

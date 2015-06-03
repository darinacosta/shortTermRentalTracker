app.factory("layerSvc", ['$http', layerSvc]);

function layerSvc($http){
  return layerSvc = {
    getLicensedRentals: function(){
    	return $http.get("./layers/licensed-rentals.json")
    	.then(function(res){
        return configureLicensedRentals(res.data)
      });
    }
  }
}

function configureLicensedRentals(geojson){
	return L.geoJson(geojson, {
    pointToLayer: styleLicensedRentals,
    onEachFeature: licensedRentalPopup
  })
};

function styleLicensedRentals(feature,latlng){
  return L.circleMarker(latlng, {
    radius: 4,
    fillColor: "lightblue",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8,
    name: 'licensed'
  })
}

function licensedRentalPopup(feature, layer) {
  var popup = '<h4>' + feature.properties.Trade_Name + '<br> <small>' + feature.properties.Address + '</small></h4>';
  layer.bindPopup(popup);
};
 
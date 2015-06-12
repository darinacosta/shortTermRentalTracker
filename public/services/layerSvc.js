app.factory("layerSvc", ['$http', 'layerHelpers', layerSvc]);

  function layerSvc($http, layerHelpers){
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
      var pluralListing = feature.properties.units === '1' ? 'listing' : 'listings',
      userUrl = feature.properties.user,
      userUrlArray = userUrl.split('/'),
      userId = userUrlArray[userUrlArray.length -1];
      popup = '<h4>' + feature.properties.street + ' Rental<br> <small>' + feature.properties.roomType + '</small></h4>' +
              '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>' +
              '<b>User Profile:</b> <a target="_blank" href="' + userUrl + '">' + userUrl + '</a><br>' + 
              '<b>User ID:</b> ' + userId + '<br><br>' + 
              '<b>This user has ' + feature.properties.units + ' ' + pluralListing + '.</b>'
    } else {
      popup = '<h3>' + feature.properties.street + ' Rental (' + feature.properties.roomType + ')</h3>' +
              '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>';
      if (feature.properties.id !== undefined && feature.properties.id.match(/air/g)[0] === "air"){
        popup += "<br><i>This listing has been recently removed."
      }
    }
    layer.bindPopup(popup);
  };
  
  function configureShortTermRentalLayer(data, status) {
    shortTermRentalLayer = L.geoJson(data, {
      onEachFeature: shortTermRentalPopup,
      pointToLayer: shortTermRentalPointStyle
    });
    //gotta make an extra layer for the cluster or it freaks outs
    var shortTermRentalClusterLayer = L.geoJson(data, {
      onEachFeature: shortTermRentalPopup,
      pointToLayer: shortTermRentalPointStyle
    });
    shortTermRentalClusters = new L.MarkerClusterGroup();
    shortTermRentalClusters.addLayer(shortTermRentalClusterLayer);
    
    return {
      shortTermRentalClusters: shortTermRentalClusters, 
      shortTermRentalLayer: shortTermRentalLayer
    };
  };
  
  function asyncHelper(callback){
    $timeout(function(){
      $scope.$apply(
        callback()
      )
    });
  };


  return layerSvc = {
    getLicensedRentals: function(){
    	return $http.get("./layers/licensed-rentals.json")
    	.then(function(res){
        return configureLicensedRentals(res.data)
      });
    },
    getShortTermRentals: function(){
      return $http.get("./layers/multiUnitRentals.json?v=0.03").then(function(res){
        return configureShortTermRentalLayer(res.data);
      });
    }
  }
}


 
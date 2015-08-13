app.factory("layerSvc", ['$http', 'layerHelpers', layerSvc]);

function layerSvc($http, layerHelpers){

  /*LICENSED RENTALS*/

  function configureLicensedRentals(geojson){
    return L.geoJson(geojson, {
      pointToLayer: styleLicensedRentals,
      onEachFeature: licensedRentalPopup
    })
  };
  
  function styleLicensedRentals(feature,latlng){
    return L.circleMarker(latlng, {
      radius: 3,
      fillColor: "green",
      color: "green",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
      name: 'licensed'
    })
  };
  
  function licensedRentalPopup(feature, layer) {
    var popup = '<h4>' + feature.properties.Trade_Name + '<br> <small>' + feature.properties.Address + '</small></h4>';
    layer.bindPopup(popup);
  };

  /*SHORT TERM RENTALS TOTAL*/

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
  
  function shortTermRentalPointStyle(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 3,
      fillColor: colorTotalPointsConditionally(feature),
      color: colorTotalPointsConditionally(feature),
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
      name: 'shortterm'
    })
  };
  
  function colorTotalPointsConditionally(feature){
    provider = feature.properties.provider;
    if (provider.substring(0,3) === "air"){
      return "#B32B2B";
    } else if (provider.substring(0,3) === "hma") {
      return "#ABA925";
    }
  };
  
  function shortTermRentalPopup(feature, layer) {
    var popup;
    var units = parseInt(feature.properties.units);
    if (feature.properties.user !== undefined && feature.properties.provider === "air" && feature.properties.units !== undefined ){
      var pluralListing = units === 1 ? 'listing' : 'listings',
      userUrl = feature.properties.user,
      userUrlArray = userUrl.split('/'),
      userId = userUrlArray[userUrlArray.length -1];
      popup = '<h4>' + feature.properties.street + ' Rental<br> <small>' + feature.properties.roomtype + ' | ' + feature.properties.reviews + ' reviews</small></h5>' +
              '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>' +
              '<b>User Profile:</b> <a target="_blank" href="' + userUrl + '">' + userUrl + '</a><br>' + 
              '<b>User ID:</b> ' + userId + '<br><br>' + 
              '<b>This user has ' + feature.properties.units + ' ' + pluralListing + '.</b>';
    } else if (feature.properties.reviews !== undefined && feature.properties.provider === "hma"){ 
      userName = typeof(feature.properties.user) === 'object' && feature.properties.user !== null ? feature['properties']['user'][0] : feature.properties.user,
      popup = '<h4>' + feature.properties.street + ' Rental<br> <small>' + feature.properties.roomtype + ' | ' + feature.properties.reviews + ' reviews</small></h5>' +
              '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>' +
              '<b>Name provided by user:</b> ' + userName + '<br><br>'  
    } else {
      popup = '<h3>' + feature.properties.street + ' Rental<br> <small>(' + feature.properties.roomtype + ')</small></h3>' +
              '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>';
    }
    layer.bindPopup(popup);
  };

  /*Airbnb Layer*/ 
  
  function configureAirbnbs(geojson){
    return L.geoJson(geojson, {
      pointToLayer: airbnbPointStyle,
      onEachFeature: shortTermRentalPopup
    })
  };

  function airbnbPointStyle(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 3,
      fillColor: colorAirbnbsConditionally(feature),
      color: colorAirbnbsConditionally(feature),
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
      name: 'shortterm'
    })
  };

  function colorAirbnbsConditionally(feature){
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
      return $http.get("http://nolarentalreport.com/rentaltracker?userexists=true&neworleans=true&pastweek=true").then(function(res){
        var geojson = {
          "type": "FeatureCollection",
          "features": res.data.body
        };
        var airbnbGeojson
        return configureShortTermRentalLayer(geojson);
      });
    },

    getAirbnbs: function(){
      return $http.get("http://nolarentalreport.com/rentaltracker?provider=air").then(function(res){
        var geojson = {
          "type": "FeatureCollection",
          "features": res.data.body
        };
        return configureAirbnbs(geojson);
      });
    }
  }
}


 

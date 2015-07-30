app.controller('mapCtrl', ['$scope', '$rootScope', '$q', '$timeout', '$http', 'leafletData', mapCtrl]);

function mapCtrl($scope, $rootScope, $q, $timeout, $http, leafletData) {

  var shortTermRentalLayer = {},
    shortTermRentalClusters = {};
    $scope.legend = "",
    layerControl = L.control.layers(); 

  leafletData.getMap().then(function(map) {
    layerControl.addTo(map);
  });

  Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  });

  function configureLicensedRentals(geojson){
    var licensedRentals = L.geoJson(geojson, {
      pointToLayer: styleLicensedRentals,
      onEachFeature: licensedRentalPopup
    });

    return licensedRentals;
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

    layerControl.addBaseLayer(shortTermRentalLayer, "Short Term Rental Points"); 
    layerControl.addBaseLayer(shortTermRentalClusters, "Short Term Rental Clusters"); 
        
    leafletData.getMap().then(function(map) {
      map.addLayer(shortTermRentalClusters);
    });
    
  };
  
  function shortTermRentalPointStyle(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 4,
      fillColor: colorTotalPointsConditionally(feature),
      color: "#000",
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
    if (feature.properties.user !== undefined && feature.properties.provider === "air"){
      var pluralListing = feature.properties.units === '1' ? 'listing' : 'listings',
      userUrl = feature.properties.user,
      userUrlArray = userUrl.split('/'),
      userId = userUrlArray[userUrlArray.length -1];
      popup = '<h4>' + feature.properties.street + ' Rental<br> <small>' + feature.properties.roomtype + ' | ' + feature.properties.reviews + ' reviews</small></h5>' +
              '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>' +
              '<b>User Profile:</b> <a target="_blank" href="' + userUrl + '">' + userUrl + '</a><br>' + 
              '<b>User ID:</b> ' + userId + '<br><br>' + 
              '<b>This user has ' + feature.properties.units + ' ' + pluralListing + '.</b>';
    } else if (feature.properties.reviews !== undefined && feature.properties.provider === "hma"){ 
      userName = feature.properties.user,
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
      radius: 4,
      fillColor: colorAirbnbsConditionally(feature),
      color: "#000",
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


  var layerSvc = {
 
    getLicensedRentals: (function(){
      $http.get("./layers/licensed-rentals.json")
      .then(function(res){
        var layer = configureLicensedRentals(res.data)
        $scope.layers['licensedRentals'] = layer;
      });
    })(),

    getShortTermRentals: (function(){
      return $http.get("http://54.152.46.39/rentaltracker?userexists=true&neworleans=true").then(function(res){
        var geojson = {
          "type": "FeatureCollection",
          "features": res.data.body
        };
        var airbnbGeojson
        return configureShortTermRentalLayer(geojson);
      });
    })(),

    getAirbnbs: function(){
      return $http.get("http://54.152.46.39/rentaltracker?provider=air").then(function(res){
        var geojson = {
          "type": "FeatureCollection",
          "features": res.data.body
        };
        return configureAirbnbs(geojson);
      });
    }
  };

  angular.extend($scope, {
    defaults: {
      tileLayer: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 16,
      path: {
        weight: 10,
        color: '#800000',
        opacity: 1
      }
    },
    center: {
      lat: 29.970996, 
      lng: -90.058537,
      zoom: 12
    },
  });
}

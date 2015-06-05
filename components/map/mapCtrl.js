app.controller('mapCtrl', ['$scope', '$q', '$timeout', 'mapSvc', 'layerSvc', 'layerHelpers', '$http', 'geojsonUtils', mapCtrl]);

function mapCtrl($scope, $q, $timeout, mapSvc, layerSvc, layerHelpers, $http, gju) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl
    $scope.legend = "",
    queryLayer = {},
    shortTermRentalLayer = {},
    shortTermRentalClusters = {};


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
              '<b>Rental:</b> <a target="_blank" href="' + userUrl + '">' + userUrl + '</a><br>';
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
    map.addLayer(shortTermRentalClusters);
    layerHelpers.populateBaseLayerControl({
      "Regional STR Clusters": shortTermRentalClusters, 
      "Regional STR Points": shortTermRentalLayer
    });
  };

  function dateSplit(date){
    var dateSplit = date.split('-');
    return dateSplit[1] + '/' + dateSplit[2].slice(0,2) + '/' +  dateSplit[0]
  }

  function gatherStats (data){
    var nolaTotal = 0,
        mostListings = 0,
        usersWithMultiListings = 0,
        highestUrl, mostListings;

    angular.forEach(data['features'], function(feature){
      numUnits = parseInt(feature['properties']['units']);
      userUrl = feature['properties']['user'];
      feature['properties']['city'] === 'New Orleans' ? nolaTotal += 1 : nolaTotal = nolaTotal;
      numUnits > 1 ? usersWithMultiListings += 1 : usersWithMultiListings = usersWithMultiListings;
      if (numUnits > mostListings){
        mostListings = numUnits;
        highestUrl = userUrl;
      } 
    });
    asyncHelper(function() {
      $scope.mostListings = "<a href='" + highestUrl + "' target='_blank'>" + mostListings + "</a>";
      $scope.nolaTotal = nolaTotal;
      $scope.lastUpdate = dateSplit(data['features'][0]['properties']['dateCollected']);
      $scope.usersWithMultiListings = usersWithMultiListings;
    });
  };
  

  //create asyncSvc
  function asyncHelper(callback){
    $timeout(function(){
      $scope.$apply(
        callback()
      )
    });
  };

  /*map.on('baselayerchange', function(e){
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
        $scope.legend = "";
      });
    }
  });*/

  $scope.queryByUserUrl = function(userId){
    var userUrl = 'http://airbnb.com/users/show/' + userId;
    map.removeLayer(queryLayer);
    asyncHelper(function() {
      $scope.searchError = ''
    });
    $http.get("./layers/multiUnitRentals.json?v=0.03").success(function(data){
      var filteredFeatures = [],
      queryValid;
      data['features'].filter(function (feature) {
        if (feature.properties.user === userUrl){
          filteredFeatures.push(feature);
        } 
      });
      queryValid = filteredFeatures.length > 0 ? true : false;
      data['features'] = filteredFeatures;
      if (queryValid === true){
        configureQueryRentalLayer(data)
      } else {
        asyncHelper(function() {
          $scope.searchError = 'Unable retrieve listings for requested user ID.'
        });
      }
    });
  }

  function configureQueryRentalLayer(data, status) {
    var group; 
    queryLayer = L.geoJson(data, {
      onEachFeature: shortTermRentalPopup,
      pointToLayer: shortTermRentalPointStyle
    });
    group = new L.featureGroup([queryLayer]);
    layerHelpers.hideAllLayers();
    map.addLayer(queryLayer);
    map.fitBounds(group.getBounds());
  }

  $scope.clearSelection = function(){
    layerHelpers.hideAllLayers();
    map.addLayer(shortTermRentalClusters);
    map.setView(mapSvc.mapAttributes.center, mapSvc.mapAttributes.zoom);
  }

  $http.get("./layers/multiUnitRentals.json?v=0.03").success(function(data){
      configureShortTermRentalLayer(data);
      gatherStats(data)
    }
  );

  layerSvc.getLicensedRentals().then(function(licensedRentals){
    var layerNumber = 0;
    layerHelpers.populateLayerControl({
      "Orleans Parish Licensed Rentals": licensedRentals 
    });
    for (x in licensedRentals._layers){
      layerNumber ++;
    };
    asyncHelper(function() {
      $scope.licensedRentals = layerNumber;
    })
  })

  
}

app.controller('sidebarCtrl', ['$scope', '$q', '$timeout', 'mapSvc', 'layerSvc', 'layerHelpers', '$http', sidebarCtrl]);

function sidebarCtrl($scope, $q, $timeout, mapSvc, layerSvc, layerHelpers, $http) {
  
  var map = mapSvc.map,
      layerControl = mapSvc.layerControl,
      layerManager = layerHelpers.layerManager,
      shortTermRentalClusters = {},
      queryLayer = {},
      shortTermRentalClustersManager = new layerManager("Regional Short Term Rental Clusters");

  $http.get("./layers/multiUnitRentals.json?v=0.03").success(function(data){
      gatherStats(data)
    }
  );

  layerSvc.getLicensedRentals().then(function(licensedRentals){
    var layerNumber = 0;
    for (x in licensedRentals._layers){
      layerNumber ++;
    };
    asyncHelper(function() {
      $scope.licensedRentals = layerNumber;
    })
  });

  function gatherStats (data){
    var nolaTotal = 0,
        numEntireHomes = 0,
        mostListings = 0,
        usersWithMultiListings = 0,
        multiListingUsers = [],
        highestUrl, mostListings;

    angular.forEach(data['features'], function(feature){
      if (feature === null){return false};
      numUnits = parseInt(feature['properties']['units']);
      userUrl = feature['properties']['user'];
      if (feature['properties']['city'] === 'New Orleans'){
        nolaTotal += 1;
        feature['properties']['roomType'] === 'Entire home/apt' ? numEntireHomes += 1 : numEntireHomes = numEntireHomes;
        if (numUnits > 1 && multiListingUsers.indexOf(feature['properties']['user']) === -1){
          usersWithMultiListings += 1;
          multiListingUsers.push(feature['properties']['user']);
        }
        if (numUnits > mostListings){
          mostListings = numUnits;
          highestUrl = userUrl;
        } 
        if (feature.properties.id !== undefined && feature.properties.id.match(/air/g)[0] === "air" && feature.properties.user === undefined){
          nolaTotal -= 1;
        }
      }
    });
    asyncHelper(function() {
      $scope.mostListings = "<a href='" + highestUrl + "' target='_blank'>" + mostListings + "</a>";
      $scope.nolaTotal = nolaTotal;
      $scope.numEntireHomes = numEntireHomes;
      $scope.lastUpdate = dateSplit(data['features'][0]['properties']['dateCollected']);
      $scope.usersWithMultiListings = usersWithMultiListings;
    });
  };

  function dateSplit(date){
    var dateSplit = date.split('-');
    return dateSplit[1] + '/' + dateSplit[2].slice(0,2) + '/' +  dateSplit[0]
  }

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
    //layerControl.addOverlay(queryLayer, 'User Query');
    map.fitBounds(group.getBounds());
  }

  $scope.clearSelection = function(){
    var clusterLayer = shortTermRentalClustersManager.getLayer();
    map.removeLayer(queryLayer);
    //map.removeOverlay(queryLayer);
    layerHelpers.hideAllLayers();
    map.addLayer(clusterLayer);
    map.setView(mapSvc.mapAttributes.center, mapSvc.mapAttributes.zoom);
  }

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
  });


  function shortTermRentalPointStyle(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 6,
      fillColor: "yellow",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
      name: 'shortterm'
    })
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
  

  //create asyncSvc
  function asyncHelper(callback){
    $timeout(function(){
      $scope.$apply(
        callback()
      )
    });
  };

}
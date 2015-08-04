app.controller('sidebarCtrl', ['$scope', '$q', '$timeout', 'mapSvc', 'layerSvc', 'layerHelpers', '$http', sidebarCtrl]);

function sidebarCtrl($scope, $q, $timeout, mapSvc, layerSvc, layerHelpers, $http) {
  
  var map = mapSvc.map,
      layerControl = mapSvc.layerControl,
      layerManager = layerHelpers.layerManager,
      shortTermRentalClusters = {},
      queryLayer = {},
      shortTermRentalClustersManager = new layerManager("Regional Short Term Rental Clusters");

  $http.get("http://nolarentalreport.com/rentaltracker?userexists=true&neworleans=true&pastweek=true").success(function(data){
      gatherStats(data.body)
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
        airbnbTotal = 0,
        homeawayTotal = 0,
        mostListings = 0,
        usersWithMultiListings = 0,
        highestListing = 0,
        multiListingUsers = [],
        highestUrl, mostListings, maxRenterObj, recentDate;

    angular.forEach(data, function(feature){
      if (feature === null){return false};
      airbnbTotal = feature.properties.provider === "airbnb" ? airbnbTotal + 1 : airbnbTotal ;
      homeawayTotal = feature.properties.provider === "hma" || feature.properties.provider === "hmavb" ? homeawayTotal + 1 : homeawayTotal ; 
      numUnits = parseInt(feature['properties']['units']);
      userUrl = feature['properties']['user'];
      recentDate = feature['properties']['datecollected'] > recentDate || recentDate === undefined ? feature['properties']['datecollected'] : recentDate;
      if (feature['properties']['city'].toLowerCase().replace(/ /g, '') === 'neworleans'){
        nolaTotal += 1;
        if (feature['properties']['roomtype'] === ( 'Entire home/apt'||'Entire Place')){
          numEntireHomes += 1;
        };
        if (numUnits > 1){
          usersWithMultiListings += 1;
          multiListingUsers.push(userUrl);
        };
        /*if (numUnits > mostListings){
          mostListings = numUnits;
          highestUrl = userUrl;
        }; */
        /*if (feature.properties.id !== undefined && feature.properties.id.match(/air/g)[0] === "air" && feature.properties.user === undefined){
          nolaTotal -= 1;
        }*/
      }
    });
    maxRenterObj = mode(multiListingUsers);
    asyncHelper(function() {
      $scope.mostListings = "<a href='" + maxRenterObj['maxEl'] + "' target='_blank'>" + maxRenterObj['maxCount'] + "</a>";
      $scope.nolaTotal = nolaTotal;
      $scope.airbnbTotal = airbnbTotal;
      $scope.homeawayTotal = homeawayTotal;
      $scope.numEntireHomes = numEntireHomes;
      $scope.lastUpdate = dateSplit(recentDate);
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
    $http.get("http://nolarentalreport.com/rentaltracker?userexists=true&neworleans=true").success(function(data){
      var filteredFeatures = [],
      queryValid;
      data['body'].filter(function (feature) {
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
      onEachFeature: queryPopup,
      pointToLayer: queryPointStyle
    });
    group = new L.featureGroup([queryLayer]);
    layerHelpers.hideAllLayers();
    map.addLayer(queryLayer);
    //layerControl.addOverlay(queryLayer, 'User Query');
    map.fitBounds(group.getBounds());
  };

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


  function queryPointStyle(feature, latlng) {
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

  function queryPopup(feature, layer) {
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
  

  //HELPER FUNCTIONS MOVE THESE TO A SERVICE
  function asyncHelper(callback){
    $timeout(function(){
      $scope.$apply(
        callback()
      )
    });
  };

  function mode(array){
    if(array.length == 0)
      return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
      var el = array[i];
      if(modeMap[el] == null)
        modeMap[el] = 1;
      else
        modeMap[el]++;  
      if(modeMap[el] > maxCount)
      {
        maxEl = el;
        maxCount = modeMap[el];
      }
    }
    return {maxEl: maxEl, maxCount:maxCount};
  };

}

app.controller('sidebarCtrl', ['$scope', '$q', '$timeout', 'asyncHelper', 'layerSvc', 'layerHelpers', 'scrollHelper', '$http', sidebarCtrl]);

function sidebarCtrl($scope, $q, $timeout, asyncHelper, layerSvc, layerHelpers, scrollHelper, $http) {
  
  var map = mapSvc.map,
      layerControl = mapSvc.layerControl,
      layerManager = layerHelpers.layerManager,
      shortTermRentalClusters = {},
      queryLayer = {},
      shortTermRentalPointManager = new layerManager("Regional Short Term Rental Points");

  $scope.mostListings = '----';
  $scope.nolaTotal = '----';
  $scope.airbnbTotal =  '----';
  $scope.homeawayTotal = '----';
  $scope.numEntireHomes = '----';
  $scope.lastUpdate = '--/--/----';
  $scope.usersWithMultiListings =  '----';
  $scope.licensedRentals = '----';
  $scope.searchOutput = 'To search a user by ID, click an <b>Airbnb point</b> in the map, <b>copy the "User ID"</b> from the popup, <b>paste</b> it into the search bar, and <b>click "Map"</b>.'
  $scope.scrollTo = scrollHelper.scrollTo;
  $scope.scrollToTop = scrollHelper.scrollToTop;
  
  $http.get("http://nolarentalreport.com/rentaltracker?userexists=true&neworleans=true&pasttwoweeks=true").success(function(data){
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
      airbnbTotal = feature.properties.provider === "air" ? airbnbTotal + 1 : airbnbTotal ;
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
    var userSummary = {
      "total"      : 0,
      "entirePlace": 0,
      "privateRoom": 0,
      "sharedRoom" : 0,
      "streets": []
    };
    map.removeLayer(queryLayer);
    asyncHelper(function() {
      //$scope.searchOutput = 'To search a user by ID, click an Airbnb point in the map, copy the "User ID" from the popup, paste it into the search bar, and click "Map".'
    });
    $http.get("http://nolarentalreport.com/rentaltracker?userexists=true&neworleans=true&pasttwoweeks=true").success(function(data){
      var filteredFeatures = [],
      queryValid;
      data['body'].filter(function (feature) {
        if (feature.properties.user === userUrl){
          filteredFeatures.push(feature);
        } 
      });
     
      for (var i = 0; i < filteredFeatures.length; i ++){
        var feature = filteredFeatures[i];
        
        userSummary.total += 1;

	if (userSummary.streets.indexOf(feature.properties.street) === -1){
	  userSummary.streets.push(feature.properties.street);
	};

	if (feature.properties.roomtype === "Entire home/apt"){
          userSummary.entirePlace += 1; 
        } else if (feature.properties.roomtype === "Private room"){
          userSummary.privateRoom += 1;
        } else if (feature.properties.roomtype === "Shared room"){
	  userSummary.sharedRoom += 1;
	};

      };

      queryValid = filteredFeatures.length > 0 ? true : false;
      data['features'] = filteredFeatures;
      
      if (queryValid === true){
	var street = userSummary.streets.length !== 1 ? "streets" : "street";	
	var listing = userSummary.total.length !== 1 ? "listings" : "listing";
	var entireHomeListing = userSummary.entirePlace !== 1 ? "listings" : "listing";

	var ofWhich = (function(){
	  if (userSummary.entirePlace === userSummary.total && userSummary.total > 2){
	    return ', of which all are listed as "Entire home/apt". ';
	  } else if (userSummary.entirePlace < userSummary.total && userSummary.entirePlace === 1) {
	    return ', and one is listed as "Entire home/apt". ';
	  } else if (userSummary.entirePlace === userSummary.total && userSummary.total === 2) {
	    return ', and both are listed as "Entire home/apt". ';
	  } else if (userSummary.entirePlace === 0){
	    return '. ';
	  } else { 
	    return ', of which ' + userSummary.entirePlace  + ' are listed as "Entire home/apt". ';
	  }
	})(); 

	var distributed = (function(){
	  if (userSummary.streets.length > 1){
	    return "The listings are distributed across " + userSummary.streets.length + " " + street + '.';;
	  }else{
	    return "All the listings are located on " + userSummary.streets[0] + ".";
	  }
	})();

        console.log(userSummary);
	configureQueryRentalLayer(data);
	
	$scope.searchOutput = 'This user has <b>' + userSummary.total + " " +  listing + '</b>' + ofWhich + distributed;
        $scope.searchOutput = userSummary.entirePlace === 1 && userSummary.total === 1 ? 'This user has <b>1 listing</b>: an "Entire home/apt" on ' 
		                                                                         + userSummary.streets[0] + '.' : $scope.searchOutput;
        $scope.searchOutput = userSummary.entirePlace === 0 && userSummary.total === 1 ? 'This user has <b>1 listing</b>, located on '  
		                                                                         + userSummary.streets[0] + '.' : $scope.searchOutput;
      } else {
        asyncHelper(function() {
          $scope.searchOutput = '<b>Unable to retrieve listings for requested ID.</b>'
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
    var pointLayer = shortTermRentalPointManager.getLayer();
    map.removeLayer(queryLayer);
    //map.removeOverlay(queryLayer);
    layerHelpers.hideAllLayers();
    map.addLayer(pointLayer);
    map.setView(mapSvc.mapAttributes.center, mapSvc.mapAttributes.zoom);
    $scope.userUrl = "";
    $scope.searchOutput = 'To search a user by ID, click an <b>Airbnb point</b> in the map, <b>copy the "User ID"</b> from the popup, <b>paste</b> it into the search bar, and <b>click "Map"</b>.'
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
      fillColor: "red",
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
      var pluralListing = feature.properties.units === 1 ? 'listing' : 'listings',
      userUrl = feature.properties.user,
      userUrlArray = userUrl.split('/'),
      userId = userUrlArray[userUrlArray.length -1];
      popup = '<h4>' + feature.properties.street + ' Rental<br> <small>' + feature.properties.roomtype + '</small></h4>' +
              '<b>Rental:</b> <a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a><br>' +
              '<b>User Profile:</b> <a target="_blank" href="' + userUrl + '">' + userUrl + '</a><br>' + 
              '<b>User ID:</b> ' + userId + '<br><br>' + 
              '<b>This user has ' + feature.properties.units + ' ' + pluralListing + '.</b>'
    } else {
      popup = '<h3>' + feature.properties.street + ' Rental (' + feature.properties.roomtype + ')</h3>' +
              '<b>Rental:</b> <a target="_blank" href="' + userUrl + '">' + userUrl + '</a><br>';
    }
    layer.bindPopup(popup);
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

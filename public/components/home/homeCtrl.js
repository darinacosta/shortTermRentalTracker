app.controller('homeCtrl', ['$scope', 'layerHelpers', 'asyncHelper', '$http', '$location', '$anchorScroll', homeCtrl]);

function homeCtrl($scope, layerHelpers, asyncHelper, $http, $location, $anchorScroll) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl,
    layerManager = layerHelpers.layerManager,
    shortTermRentalClustersManager = new layerManager("Regional Short Term Rental Clusters"),
    shortTermRentalClusters;
  
  $http.get("assets/data/stats.json?v=2").success(function(data){
    console.log(data); 
 
    $scope.scrollTo = function(id){
      $location.hash(id);
      $anchorScroll();
      $location.hash('');
    };

    $scope.scrollToTop = function(){
      $('body').scrollTop(0);
    }

    //body variables  
    $scope.stats = data;  
    $scope.entireRoomPercent = Math.round((data.roomTypeTotals.entireHome/data.listingTotals.air) * 100);

    //Room Type Chart 
    $scope.rentalTypeLabels = ["Entire home/apt", "Shared Room", "Private Room"];
    $scope.rentalTypeData = [data.roomTypeTotals.entireHome, data.roomTypeTotals.sharedRoom, data.roomTypeTotals.privateRoom];

    //Total Reviews Chart
    $scope.averageNightlyLabels = ['Entire Place', 'Private Room', 'Shared Room'];
    $scope.averageNightlyData = [
      //[data.prices.air.entirePlace.averageNightly, data.prices.hma.averageTotalNightly, data.prices.total.averageNightly] 
      [data.reviews.entireHome, data.reviews.privateRoom, data.reviews.sharedRoom] 
    ];

    $scope.chartColors = [{
      fillColor: 'red',
      strokeColor: 'red',
      highlightFill: 'grey',
      highlightStroke: 'grey'
    }];

    //neighborhood chart
    var sortedTopNeighborhoods = data.neighborhoodStats;
    sortedTopNeighborhoods.sort(function(a,b){
      if (a.total < b.total) {
        return 1;
      }
      if (a.total > b.total) {
	return -1;
      }
      return 0;
    });

    $scope.topFiveNeighborhoods = sortedTopNeighborhoods.slice(0,5);
    
    var sortedBottomNeighborhoods = data.neighborhoodStats
    sortedBottomNeighborhoods.sort(function(a,b){
      if (a.total > b.total) {
        return 1;
      }
      if (a.total < b.total) {
	return -1;
      }
      return 0;
    });
    
    $scope.bottomFiveNeighborhoods = sortedBottomNeighborhoods.slice(0,5);

  });

  map.setView(mapAttributes.center, mapAttributes.zoom);
}


//HELPER FUNCTIONS MOVE THESE TO A SERVICE
function asyncHelper(callback){
  $timeout(function(){
    $scope.$apply(
      callback()
    )
  });
};

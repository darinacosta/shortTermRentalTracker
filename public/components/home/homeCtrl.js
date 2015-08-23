app.controller('homeCtrl', ['$scope', 'layerHelpers', '$http', homeCtrl]);

function homeCtrl($scope, layerHelpers, $http) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl,
    layerManager = layerHelpers.layerManager,
    shortTermRentalClustersManager = new layerManager("Regional Short Term Rental Clusters"),
    shortTermRentalClusters;
  
  $http.get("assets/data/stats.json?v=2").success(function(data){
    console.log(data); 
    
    $scope.stats = data;  

    //Room Type Chart 
    $scope.rentalTypeLabels = ["Entire home/apt", "Shared Room", "Private Room"];
    $scope.rentalTypeData = [data.roomTypeTotals.entireHome, data.roomTypeTotals.sharedRoom, data.roomTypeTotals.privateRoom];

    //Average Nightly Price Chart
    $scope.averageNightlyOptions = {
      tooltipTemplate: function(label){
        return label.label + ': ' + '$' + label.value;
      }
    }
    $scope.averageNightlyLabels = ['Airbnb Entire Place', 'HomeAway Entire Place', 'All Listings'];
    $scope.averageNightlyData = [
      [data.prices.air.entirePlace.averageNightly, data.prices.hma.averageTotalNightly, data.prices.total.averageNightly]  
    ];

    $scope.chartColors = [{
      fillColor: 'red',
      strokeColor: 'red',
      highlightFill: 'grey',
      highlightStroke: 'grey'
    }];
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

app.controller('homeCtrl', ['$scope', 'mapSvc', 'layerHelpers', '$http', homeCtrl]);

function homeCtrl($scope, mapSvc, layerHelpers, $http) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl,
    layerManager = layerHelpers.layerManager,
    shortTermRentalClustersManager = new layerManager("Regional Short Term Rental Clusters"),
    shortTermRentalClusters;

  $scope.airbnbTotal = '----';
  $scope.hmaTotal = '----';
  $scope.combinedTotal = '----';
  
  $http.get("../../assets/data/stats.json").success(function(data){
    console.log(data); 
   
    $scope.combinedTotal = data.listingTotals.air + data.listingTotals.hma; 
    $scope.airbnbTotal = data.listingTotals.air;

    //Room Type Chart 
    $scope.rentalTypeLabels = ["Entire home/apt", "Shared Room", "Private Room"];
    $scope.rentalTypeData = [data.roomTypeTotals.entireHome, data.roomTypeTotals.sharedRoom, data.roomTypeTotals.privateRoom];

    //Average Nightly Price Chart
    $scope.averageNightlyOptions = {
      tooltipTemplate: function(label){
        return label.label + ': ' + '$' + label.value;
      }
    }
    $scope.averageNightlyLabels = ['Airbnb', 'HomeAway', 'Combined Average'];
    $scope.averageNightlyData = [
      [data.averagePrices.airNightly, data.averagePrices.hmaNightly, data.averagePrices.totalNightly]  
    ];

    //Average Monthly Price Chart
    $scope.averageMonthlyLabels = ['Average Nightly Price'];
    $scope.averageMonthlyData = [
      [data.averagePrices.airMonthly, data.averagePrices.hmaMonthly]	  
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

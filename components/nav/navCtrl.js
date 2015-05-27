app.controller('navCtrl', navCtrl);

function navCtrl($scope,  $log) {
    $scope.items = [
    {name:'Citywide Survey', url: "citywide"},
    {name:'Treme', url: "treme"},
    {name:'Bywater', url: "bywater"}
  ];

  $scope.status = {
    isopen: false
  };

  $scope.toggleDropdown = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.status.isopen = !$scope.status.isopen;
  };
};
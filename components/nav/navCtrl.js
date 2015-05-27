app.controller('navCtrl', navCtrl);

function navCtrl($scope,  $log) {
    $scope.items = [
    'Citywide Survey',
    'Treme',
    'Bywater'
  ];

  $scope.status = {
    isopen: false
  };

  $scope.toggled = function(open) {
    $log.log('Dropdown is now: ', open);
  };

  $scope.toggleDropdown = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.status.isopen = !$scope.status.isopen;
  };
};
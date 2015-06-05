app.directive('map', function () {
  return {
    restrict: 'E',
    scope: {},
    controllerAs: "mapCtrl",
    controller: mapCtrl,
    templateUrl: 'components/map/map.html'
  };
});
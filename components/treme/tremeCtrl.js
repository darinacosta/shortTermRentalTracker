app.controller('tremeCtrl', ['$scope', 'mapSvc', tremeCtrl]);

function tremeCtrl($scope, mapSvc) {
  var map = mapSvc.map;
  map.setView([29.965494, -90.067849], 16);
}
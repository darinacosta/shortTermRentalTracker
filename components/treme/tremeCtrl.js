app.controller('tremeCtrl', ['$scope', 'mapSvc', 'layerHelpers', tremeCtrl]);

function tremeCtrl($scope, mapSvc, layerHelpers) {
  var map = mapSvc.map;
  map.setView([29.965494, -90.067849], 16);
}
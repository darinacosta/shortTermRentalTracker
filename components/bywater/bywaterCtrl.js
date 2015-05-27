app.controller('bywaterCtrl', ['$scope', 'mapSvc', bywaterCtrl]);

function bywaterCtrl($scope, mapSvc) {
  var map = mapSvc.map;
  map.setView([29.964304, -90.040212], 15);
}
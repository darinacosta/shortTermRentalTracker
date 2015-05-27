app.factory("mapSvc", mapSvc);

function mapSvc(){
  var mapSvc = {};
  mapSvc.map = L.map('map', {maxZoom: 18});
  return mapSvc;
}
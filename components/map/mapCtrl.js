app.controller('mapCtrl', ['$scope','$http', 'mapSvc', mapCtrl]);

function mapCtrl($scope, $http, mapSvc) {

  var map = mapSvc.map,

  nightTileLayer = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/normal.night.grey/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
    attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    subdomains: '1234',
    mapID: 'newest',
    app_id: 'Y8m9dK2brESDPGJPdrvs',
    app_code: 'dq2MYIvjAotR8tHvY8Q_Dg',
    base: 'base',
    maxZoom: 20
  });

  function shortTermRentalPointStyle(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 11,
      fillColor: "#ff7800",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    })
  };

  function shortTermRentalPopup(feature, layer) {
    layer.bindPopup('<a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a>');
  };

  function configureShortTermRentalLayer(data, status) {
    var geojson = L.geoJson(data, {
      onEachFeature: shortTermRentalPopup,
      pointToLayer: shortTermRentalPointStyle
    });
    map.fitBounds(geojson.getBounds());
    var markers = new L.MarkerClusterGroup();
    markers.addLayer(geojson);
    map.addLayer(markers);
    nightTileLayer.addTo(map);
  }

  $http.get("./layers/rentals.json").success(
    configureShortTermRentalLayer
  );
}
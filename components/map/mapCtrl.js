app.controller('mapCtrl', ['$scope','$http', mapCtrl]);

function mapCtrl($scope, $http) {

  var HERE_normalNightGrey = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/normal.night.grey/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
    attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    subdomains: '1234',
    mapID: 'newest',
    app_id: 'Y8m9dK2brESDPGJPdrvs',
    app_code: 'dq2MYIvjAotR8tHvY8Q_Dg',
    base: 'base',
    maxZoom: 20
  });

  $http.get("./layers/rentals.json").success(function(data, status) {
    var geojson = L.geoJson(data, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup('<a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a>');
      },
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 11,
          fillColor: "#ff7800",
          color: "#000",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
      });
      }
    });
    var map = L.map('map', {maxZoom: 18}).fitBounds(geojson.getBounds());
    var markers = new L.MarkerClusterGroup();
    markers.addLayer(geojson);
    map.addLayer(markers);
    HERE_normalNightGrey.addTo(map);
  });
}
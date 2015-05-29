var app = angular.module("app", ["ngRoute", "ngSanitize", "ui.bootstrap"]) //ngSanitize is require to use ng-bind-html
  
  .config(function ($routeProvider) {
    $routeProvider
      .when("/home", {
        controller: 'homeCtrl', 
        controllerUrl: 'components/home/homeCtrl.js',
        templateUrl: 'components/home/home.html'
      })
      .when("/treme", {
        controller: 'tremeCtrl', 
        controllerUrl: 'components/treme/tremeCtrl.js',
        templateUrl: 'components/treme/treme.html'
      })
      .when("/bywater", {
        controller: 'bywaterCtrl', 
        controllerUrl: 'components/bywater/bywaterCtrl.js',
        templateUrl: 'components/bywater/bywater.html'
      })
      .otherwise({redirectTo: "/home"})
  })

.controller('mapCtrl', ['$scope', 'mapSvc', 'layerHelpers', '$http', mapCtrl]);

function mapCtrl($scope, mapSvc, layerHelpers, $http) {
  var map = mapSvc.map,
    mapAttributes = mapSvc.mapAttributes,
    layerControl = mapSvc.layerControl;

  function shortTermRentalPointStyle(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 4,
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
    var shortTermRentalLayer = L.geoJson(data, {
      onEachFeature: shortTermRentalPopup,
      pointToLayer: shortTermRentalPointStyle
    });
    var shortTermRentalClusters = new L.MarkerClusterGroup();
    shortTermRentalClusters.addLayer(shortTermRentalLayer);
    layerHelpers.addLayerCustom({alias: "Rental Clusters",
                                layer:  shortTermRentalClusters});
    layerHelpers.populateLayerControl({
      "Rental Clusters": shortTermRentalClusters, 
      "Rental Points": shortTermRentalLayer
    });
    console.log(layerControl);
  };

  
  $http.get("./layers/rentals.json").success(
    configureShortTermRentalLayer
  );
  
}

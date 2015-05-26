var app = angular.module("app", ["ngRoute", "ngSanitize","leaflet-directive"]) //ngSanitize is require to use ng-bind-html
  
  .config(function ($routeProvider) {
    $routeProvider
      .when("/map", {
        controller: 'mapCtrl', 
        controllerUrl: 'components/map/mapCtrl.js',
        templateUrl: 'components/map/map.html'
      })
      .otherwise({redirectTo: "/map"})
  })

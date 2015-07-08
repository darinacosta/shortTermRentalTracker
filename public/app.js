var app = angular.module("app", ["ngRoute", "ngSanitize", "ui.bootstrap", "leaflet-directive"]) //ngSanitize is require to use ng-bind-html
  
.config(function ($routeProvider) {
  $routeProvider
    .when("/home", {
      controller: 'mapCtrl', 
      controllerUrl: 'components/map/mapCtrl.js',
      templateUrl: 'components/map/map.html'
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
    .when("/donate", {
      controller: 'donateCtrl', 
      controllerUrl: 'components/donate/donateCtrl.js',
      templateUrl: 'components/donate/donate.html'
    })
    .when("/disclaimer", {
      controller: 'disclaimerCtrl', 
      controllerUrl: 'components/disclaimer/disclaimerCtrl.js',
      templateUrl: 'components/disclaimer/disclaimer.html'
    })
    .otherwise({redirectTo: "/home"})
})


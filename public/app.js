var app = angular.module("app", ["ngRoute", "ngSanitize", "ui.bootstrap", "chart.js"]) //ngSanitize is require to use ng-bind-html
  
.config(function ($routeProvider) {
  $routeProvider
    .when("/", {
      controller: 'homeCtrl', 
      controllerUrl: 'components/home/homeCtrl.js',
      templateUrl: 'components/home/home.html'
    })
    .when("/resources", {
      controller: 'resourcesCtrl', 
      controllerUrl: 'components/resources/resourcesCtrl.js',
      templateUrl: 'components/resources/resources.html'
    })
    .otherwise({redirectTo: "/"})

})



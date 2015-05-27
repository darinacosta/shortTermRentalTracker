var app = angular.module("app", ["ngRoute", "ngSanitize", "ui.bootstrap"]) //ngSanitize is require to use ng-bind-html
  
  .config(function ($routeProvider) {
    $routeProvider
      .when("/home", {
        controller: 'homeCtrl', 
        controllerUrl: 'components/home/homeCtrl.js',
        templateUrl: 'components/home/home.html'
      })
      .otherwise({redirectTo: "/home"})
  })

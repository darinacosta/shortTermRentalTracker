var app = angular.module("app", ["ngRoute", "ngSanitize", "ui.bootstrap", "chart.js"]) //ngSanitize is require to use ng-bind-html
  
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
    .when("/donate", {
      controller: 'donateCtrl', 
      controllerUrl: 'components/donate/donateCtrl.js',
      templateUrl: 'components/donate/donate.html'
    })
    .when("/about", {
      controller: 'aboutCtrl', 
      controllerUrl: 'components/about/aboutCtrl.js',
      templateUrl: 'components/about/about.html'
    })
    .otherwise({redirectTo: "/home"})
})



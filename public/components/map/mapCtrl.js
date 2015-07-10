app.controller('mapCtrl', ['$scope', '$rootScope', '$q', '$timeout', '$http', 'layerSvc', mapCtrl]);

function mapCtrl($scope, $rootScope, $q, $timeout, $http, layerSvc) {
  var shortTermRentalLayer = {},
    shortTermRentalClusters = {};
    $scope.legend = "";

  Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  });

  angular.extend($scope, {
    defaults: {
      tileLayer: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 14,
      path: {
        weight: 10,
        color: '#800000',
        opacity: 1
      }
    },
    center: {
      lat: 29.970996, 
      lng: -90.058537,
      zoom: 12
    }
  });

  layerSvc.getLicensedRentals();
  layerSvc.getShortTermRentals();
}

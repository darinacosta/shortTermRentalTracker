app.directive('sidebar', function () {
  return {
    restrict: 'E',
    scope: {},
    controllerAs: "sidebarCtrl",
    controller: sidebarCtrl,
    templateUrl: 'components/sidebar/sidebar.html'
  };
});
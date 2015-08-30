app.directive('footer', function () {
  return {
    restrict: 'E',
    scope: {},
    controllerAs: "footerCtrl",
    controller: sidebarCtrl,
    templateUrl: 'components/footer/footer.html'
  };
});
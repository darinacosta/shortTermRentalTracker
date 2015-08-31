app.factory("scrollHelper", ['$location', '$anchorScroll', scrollHelper]);


function scrollHelper($location, $anchorScroll){
 
  var svc = {};

  svc.scrollTo = function(id){
    $location.hash(id);
    $anchorScroll();
    $location.hash('');
  };

  svc.scrollToTop = function(){
    $('body, html').animate({scrollTop: 0}, "slow");
    return false;
  };

  return svc;

};

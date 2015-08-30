app.controller('resourcesCtrl', ['$scope', '$http', 'asyncHelper', 'scrollHelper', resourcesCtrl]);

function resourcesCtrl($scope, $http, asyncHelper, scrollHelper) {
  $http.get("assets/data/resources.json").success(function(data){
    $scope.keywords = [];
    $scopeActiveKeywords = [];
    $scope.checkboxModel = [];
    $scope.evalCheckbox;

    var keywords = [];
    var resourceData = data.body;

    for (var i = 0; i < data.body.length; i++){
      if (data.body[i]['keywords'] !== undefined){
        keywordArray = data.body[i].keywords.split(',');
        for (var n = 0; n < keywordArray.length; n ++){
	  keywordArray[n] = keywordArray[n].trim();
	  if (keywords.indexOf(keywordArray[n]) === -1){
	    keywords.push(keywordArray[n]);
	  }
	}
	data.body[i].keywordArray = keywordArray;
      }
    };

    $scope.evalCheckbox = function(){
      var keys = [];
      
      for (var key in $scope.checkboxModel){
        if ($scope.checkboxModel.hasOwnProperty(key)){
          if ($scope.checkboxModel[key] == true){
	    console.log('pushing key ' + key);
	    keys.push(key);
	    console.log('keys length: ' + keys.length);
	  }
	}
      };

      asyncHelper(function(){
	$scope.resources = [];
        var resourceReturn = buildKeywordSet(keys, resourceData);      
	$scope.resources = resourceReturn;
      });
    }
     
    asyncHelper(function(){
      $scope.resources = resourceData; 
      $scope.keywords = keywords;
    })
  });
  
  //scrollHelper.scrollTo('bibliography');
};

function buildKeywordSet(keywords, data){
    var outEntries = []; 
    
    if (keywords.length === 0){ return data };

    console.log('Building keyword set with ' +keywords.length + ' keys.'); 
    for (var i = 0; i < data.length; i ++){
      if (data[i]['keywordArray'] !== undefined){
        outEntries.push(data[i]);
      }
    };

    for (var i = 0; i < outEntries.length; i ++){
      for (var k = 0; k < keywords.length; k ++){
	if (outEntries[i] !== undefined && outEntries[i]['keywordArray'].indexOf(keywords[k]) === -1){
          outEntries.splice(i, 1);	  
	  if (i >= 0){
            i = i - 1;
        }
      }
    }
  }

  return outEntries;
}


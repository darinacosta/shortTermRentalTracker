app.factory("layerHelpers", ['mapSvc', layerHelpers]);

function layerHelpers(mapSvc){

  var layerControlList = [],
    layerControl = mapSvc.layerControl,
    map = mapSvc.map;

  hideAllLayers = function(){
    angular.forEach(layerControl._layers, function(val, key) {
      console.log(layerControl)
      map.removeLayer(layerControl._layers[key]);
    });
  };

  populateLayerControl = function(layers){
    compileLayerControlList();
    angular.forEach(layers, function(layer, alias){
      if (layerControlList.indexOf(alias) === -1){
        layerControl.addOverlay(layer, alias);
      }
    })
  };

  populateBaseLayerControl = function(layers){
    compileLayerControlList();
    angular.forEach(layers, function(layer, alias){
      if (layerControlList.indexOf(alias) === -1){
        layerControl.addBaseLayer(layer, alias);
      }
    })
  };
  
  addLayerCustom = function(layer){
    compileLayerControlList();
    if (layerControlList.indexOf(layer.alias) === -1){
      map.addLayer(layer.layer);
    }
  };

  compileLayerControlList = function(){
    angular.forEach(layerControl._layers, function(val, key){
      layerControlList.push(layerControl._layers[key]['name']);
    });
  };

  return {
    hideAllLayers: hideAllLayers,
    populateLayerControl: populateLayerControl,
    populateBaseLayerControl: populateBaseLayerControl,
    addLayerCustom: addLayerCustom
  }
  
}
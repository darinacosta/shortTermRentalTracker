app.factory("mapSvc", ['$http', mapSvc]);

function mapSvc($http){
  mapAttributes = {
    center: [29.970996, -90.058537],
    zoom: 12,
    zoomControl: false,
    scrollWheelZoom: false
  },
  layers = [],
  map = L.map('map', mapAttributes),
  layerControl = L.control.layers(),
  date = new Date(),
  current_hour = date.getHours(),

  Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  });

  //Zoom Home Bar
  L.Control.zoomHome = L.Control.extend({
    options: {
      position: 'topleft',
      zoomInText: '+',
      zoomInTitle: 'Zoom in',
      zoomOutText: '-',
      zoomOutTitle: 'Zoom out',
      zoomHomeText: '<i class="fa fa-home" style="line-height:1.65;"></i>',
      zoomHomeTitle: 'Zoom home'
    },

    onAdd: function (map) {
      var controlName = 'gin-control-zoom',
      container = L.DomUtil.create('div', controlName + ' leaflet-bar'),
      options = this.options;

      this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle,
      controlName + '-in', container, this._zoomIn);
      this._zoomHomeButton = this._createButton(options.zoomHomeText, options.zoomHomeTitle,
      controlName + '-home', container, this._zoomHome);
      this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
      controlName + '-out', container, this._zoomOut);

      this._updateDisabled();
      map.on('zoomend zoomlevelschange', this._updateDisabled, this);

      return container;
    },

    onRemove: function (map) {
      map.off('zoomend zoomlevelschange', this._updateDisabled, this);
    },

    _zoomIn: function (e) {
      this._map.zoomIn(e.shiftKey ? 3 : 1);
    },

    _zoomOut: function (e) {
      this._map.zoomOut(e.shiftKey ? 3 : 1);
    },

    _zoomHome: function (e) {
      map.setView(mapAttributes.center, mapAttributes.zoom);
    },

    _createButton: function (html, title, className, container, fn) {
      var link = L.DomUtil.create('a', className, container);
      link.innerHTML = html;
      link.href = '#';
      link.title = title;

      L.DomEvent.on(link, 'mousedown dblclick', L.DomEvent.stopPropagation)
          .on(link, 'click', L.DomEvent.stop)
          .on(link, 'click', fn, this)
          .on(link, 'click', this._refocusOnMap, this);

      return link;
    },

    _updateDisabled: function () {
      var map = this._map,
        className = 'leaflet-disabled';

      L.DomUtil.removeClass(this._zoomInButton, className);
      L.DomUtil.removeClass(this._zoomOutButton, className);

      if (map._zoom === map.getMinZoom()) {
        L.DomUtil.addClass(this._zoomOutButton, className);
      }
      if (map._zoom === map.getMaxZoom()) {
        L.DomUtil.addClass(this._zoomInButton, className);
      }
    }
  });

  // add the new control to the map
  var zoomHome = new L.Control.zoomHome();
  zoomHome.addTo(map);
  layerControl.addTo(map);

  (function addBasemap(){
    map.addLayer(Esri_WorldGrayCanvas)
  })();

  mapSvc = {
    layerControl: layerControl,
    map: map,
    mapAttributes: mapAttributes
  }

  return mapSvc;
}

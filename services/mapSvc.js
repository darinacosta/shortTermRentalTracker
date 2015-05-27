app.factory("mapSvc", ['$http', mapSvc]);

function mapSvc($http){
  mapAttributes = {
    center: [29.9930, -90.0667],
    zoom: 11,
    zoomControl:false 
  },
  layers = [],
  map = L.map('map', mapAttributes),
  date = new Date(),
  current_hour = date.getHours(),

  nightTileLayer = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/normal.night.grey/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
    attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    subdomains: '1234',
    mapID: 'newest',
    app_id: 'Y8m9dK2brESDPGJPdrvs',
    app_code: 'dq2MYIvjAotR8tHvY8Q_Dg',
    base: 'base',
    maxZoom: 20
  }),

  dayTileLayer = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/terrain.day/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
    attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    subdomains: '1234',
    mapID: 'newest',
    app_id: 'Y8m9dK2brESDPGJPdrvs',
    app_code: 'dq2MYIvjAotR8tHvY8Q_Dg',
    base: 'aerial',
    maxZoom: 20
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

  (function addBasemap(){
    if (current_hour < 6 || current_hour > 17){
      map.addLayer(nightTileLayer)
    }else{
      map.addLayer(dayTileLayer)
    }
  })();

  function shortTermRentalPointStyle(feature, latlng) {
    return L.circleMarker(latlng, {
      radius: 11,
      fillColor: "#ff7800",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    })
  };

  function shortTermRentalPopup(feature, layer) {
    layer.bindPopup('<a target="_blank" href="' + feature.properties.url + '">' + feature.properties.url + '</a>');
  };

  function configureShortTermRentalLayer(data, status) {
    var geojson = L.geoJson(data, {
      onEachFeature: shortTermRentalPopup,
      pointToLayer: shortTermRentalPointStyle
    });
    var shortTermRentalClusters = new L.MarkerClusterGroup();
    shortTermRentalClusters.addLayer(geojson);
    layers.push(shortTermRentalClusters);
    map.addLayer(shortTermRentalClusters);
  };

  $http.get("./layers/rentals.json").success(
    configureShortTermRentalLayer
  );

  mapSvc = {
    map: map,
    layers: layers
  }

  return mapSvc;
}
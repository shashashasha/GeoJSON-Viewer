var trulia = trulia || {};

if (!trulia.maps) {
  trulia.maps = {};
}

if (!trulia.maps.overlays) {
  trulia.maps.overlays = {};
}

/**
 * @param map Trulia's map object
 */
trulia.maps.overlays.MarkerSourceLayer = function(truliaMap, options, customDisplayOptions, labels) {
    var map = truliaMap.getMap(),
        self = trulia.maps.overlays.Layer(map, options),
        markers = [],
        markersSeen = {},
        loaded = false,
        lastRequest;

    // lower maximum for markersource layers
    self.maximumFeatures = 200;

    self.refresher = function() {
      if (loaded && options.loadOnce)
      {
        return;
      }

      var bounds = truliaMap.bounds(),
          $subFilter,
          filterParams = '';

      google.maps.event.trigger(map.getDiv(), 'close_all_infowindows');

      if (options.data)
      {
        // static data passed in from options
        if (options.isProperties)
        {
          self.loadedProperties(options.data);
        }
        else
        {
          self.loaded(options.data);
        }
      }
      else if (options.requests && options.requests.length)
      {
        // don't show layers under zoom 12
        if (truliaMap.zoom() < 12)
        {
          return;
        }

        // for data that requires multiple requests
        for (var i = 0; i < options.requests.length; i++) {
          var url = options.url.replace('{bounds}', bounds.toUrlValue(6));

          url = url.replace('{request}', options.requests[i]);

          if (typeof options.urlFormatter === 'function')
          {
            url = options.urlFormatter(url);
          }
          self.url(url, options.requests[i]);
        }
      }
      else if (options.url && bounds)
      {
        // don't show layers under zoom 12
        if (truliaMap.zoom() < 12)
        {
          return;
        }
        var url = options.url.replace('{bounds}', bounds.toUrlValue(6));

        if (typeof options.urlFormatter === 'function')
        {
          url = options.urlFormatter(url);
        }

        // Use sub filters if defined. extraParamForm should be an id of a <form> for serialization
        $subFilter = $('#' + options.extraParamForm);
        if ($subFilter.length)
        {
          filterParams = '&' + $subFilter.serialize();
        }

        self.url(url + filterParams);
      }
    };

    // load a geojson file
    self.url = function(url, type) {
      if (labels)
      {
        // loading indicator
        labels.detailInfo({ details: '<div class="mart7"><img width="16" height="16" src="' + _IMAGE_SERVER + '/images/flair/spinner_dots.gif" class="marr5 vamid" > Updating results...</div>' });
      }
      if (!options.requests && lastRequest && lastRequest.readyState !== 4 && lastRequest.readyState !== 0)
      {
        // abort old requests that are ongoing since we've got new input unless we have multiple requests (amenities)
        lastRequest.abort();
      }

      lastRequest = $.ajax({
          url: url,
          dataType: 'json',
          success: function(items) {
            if (options.isProperties === true)
            {
              if (items.success)
              {
                self.loadedProperties(items.properties, items);
                loaded = true;
              }
              else if (labels && labels.detail)
              {
                // hide loading label if failed
                labels.detail.hide();
              }
            }
            else
            {
              self.loaded(items, type);
              loaded = true;
            }
          }
      });

      return self;
    };
    
    self.loaded = function(items, type) {
      if (!self.enabled) {
          return;
      }

  	  var i, marker;

  		for (i = 0; i < items.length; i++) {
  			var item = items[i];
  			var loc = trulia.maps.LatLng(item.latitude, item.longitude);

  			if (!markersSeen[item.url]) {
          // store the category type
          if (type) {
              item.type = type;
          }

  				marker = new trulia.maps.Marker(loc, options.markerOptions ? options.markerOptions(item) : {});

          self.addFeature(marker.getMarker(), item);
  				self.addListeners(marker.getMarker(), item);
  				markersSeen[item.url] = marker;	
  			}
  		}
  
      if (self.idle()) {
          var idleCallback = self.idle();
          idleCallback();
      }
    };

    /**
     * Load properties with home values
     * @param Object propertySet { 'for sale' : [], 'sold' : [] }
     */
    self.loadedProperties = function(propertySet, response) {
      if (!self.enabled) {
          return;
      }
      
      var i, marker, overlay, totalProperties = 0;

      if (truliaMap.overlays().homeMarkers)
      {
        overlay = truliaMap.overlays().homeMarkers;
        overlay.removeAll();
      }
      truliaMap.removeMarkers(markers);
      markers = [];
      markersSeen = {};

      _.each(propertySet, function (properties, type) {
        for (i = 0; i < properties.length; i++)
        {
          totalProperties++;
          if (!markersSeen[properties[i].id])
          {
            marker = new trulia.maps.HomeMarker(truliaMap, properties[i], {
              sticky: true,
              iwOptions: {
                dynamic: true,
                large: false
              }
            });
            markers.push(marker);
            markersSeen[properties[i].id] = marker;
          }
        }
      });

      if (totalProperties < 1 && labels)
      {
        labels.detailInfo({ details: '<div class="mart10 fleft">No results found in this location.</div>' });
      }

      if (overlay)
      {
        overlay.draw();
      }

      if (self.idle()) {
        var idleCallback = self.idle();
        idleCallback(response);
      }
    };

    // t is a boolean, detaches or attaches
    self.toggle = function(t) {
        self.enabled = t;
        try {
            if (t) {
                self.attach();
            } else {
                self.detach();
            }
        }
        catch (e)
        {
            // nothing yet
        }
      return self;
    };

    self.attach = function(map) {
        if (options.isProperties)
        {
            _.each(markers, function (marker) {
              marker.show();
            });
        }
        else
        {
            // markers = [];
            // markersSeen = {};
            self.refill();
        }

        self.on('idle', self.refresher);
        if (self.idle()) {
            var idleCallback = self.idle();
            idleCallback();

            self.on('dragend', idleCallback);
            self.on('zoom_changed', idleCallback);
        }

        // force a slight delay
        setTimeout(function() {
            self.refresher();

            if (self.idle()) {
                self.idle()();
            }
        }, 100);

        // subfilter events
        if (options.extraParamForm)
        {
          $('#' + options.extraParamForm)
            .delegate('select, input', 'change.places', self.refresher);
        }
        return self;
    };

    self.detach = function(map) {
      if (options.isProperties)
      {
          _.each(markers, function (marker) {
            marker.hide();
          });

          if (markers.length > self.maximumFeatures) {
            markersSeen = {};
            markers = [];
          }
      }
      else
      {
          if (self.features.length > self.maximumFeatures) {
            markersSeen = {};
            markers = [];
          }
          self.empty();
      }

      self.off();

      // subfilter events
      if (options.extraParamForm)
      {
        $('#' + options.extraParamForm)
          .undelegate('change.places', self.refresher);
      }
      return self;
    };

    if (options.isProperties)
    {
      /**
       * Override featuresInBBox for property layers (comps)
       */
      self.featuresInBBox = function() {
        var inBBox = [],
            bounds = truliaMap.bounds();
        _.each(markers, function (marker) {
          if (bounds && bounds.contains(marker.position()))
          {
            inBBox.push(marker);
          }
        });
        return inBBox;
      }
    }

    return self;
};

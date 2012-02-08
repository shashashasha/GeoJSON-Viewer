var trulia = trulia || {};

if (!trulia.maps) {
  trulia.maps = {};
}

if (!trulia.maps.overlays) {
  trulia.maps.overlays = {};
}

trulia.maps.overlays.Layer = function(map, options) {
	var self = new google.maps.OverlayView(),
		mouseoverCallback = options.mouseover || null,
		mouseoutCallback = options.mouseout || null,
		clickCallback = options.click || null,
        idleCallback = options.idle || null,
        filterCallback = options.filterer || null;

    self.currentFilter = { empty: true };
    self.features = [];
    self.properties = [];
    self.maximumFeatures = 400;

    // if there was no filterer passed, this is the default for markersourcelayers
    if (!filterCallback) {
        filterCallback = function(filterOptions) {
            var features = self.features,
                properties = self.properties,
                toAdd = [];
            
            if (filterOptions['all'] === true) {
                self.refill();
                self.currentFilter = { empty: true };
                return self;
            }
            else if (filterOptions['all'] === false) {
                self.clear();
                return self;
            }
            
            for (var i = 0; i < features.length; i++) {
                var f = features[i];

                if (!properties[i]) {
                    f.setMap(null);
                    continue;
                }

                var p = properties[i].properties ? properties[i].properties : properties[i];
                
                if (self.visibleInFilter(p, filterOptions)) {
                  if (!f.getMap()) {
                      f.setMap(map);  
                  }
                } else {
                    f.setMap(null);
                }
            }

            return self;
        };
    } 

	self.draw = function() {
		
	};

    self.mouseover = function(f) {
        if (!arguments.length) {
            return mouseoverCallback;
        }

        mouseoverCallback = f;
        return self;
    };

    self.mouseout = function(f) {
        if (!arguments.length) {
            return mouseoutCallback;
        }

        mouseoutCallback = f;
        return self;
    };

    self.click = function(f) {
        if (!arguments.length) {
            return clickCallback;
        }

        clickCallback = f;
        return self;
    };

    self.filterer = function(f) {
        if (!arguments.length) {
            return filterCallback;
        }

        filterCallback = f;
        return self;
    };
    
    // run the filter regardless of whether we have new options
    self.filter = function(options) {
        if (options) {   
            for (var i in options) {
                self.currentFilter[i] = options[i];
            }    

            self.currentFilter.empty = false;
        }
        
        if (filterCallback) {
            filterCallback(self.currentFilter);
        }
        
        return self;
    };

    self.visibleInFilter = function(p, filter) {
        var c = p.category ? p.category.split(' ').join('').toLowerCase() : '_';
        if (filter[c]) {
            return true;
        } else {
            return false;
        }
    };

    self.idle = function(f) {
        if (!arguments.length) {
            return idleCallback;
        }
        
        idleCallback = f;
        return self;
    };

    self.featuresInBBox = function() {
        var inBBox = [],
            bbox = map.getBounds();
        for (var i = 0; i < self.features.length; i++) {
            var f = self.features[i];

            // check the position and if it's visible
            if (f.getPosition && f.getMap()) {   
                var p = f.getPosition();
                if (bbox.contains(p)) {
                    inBBox.push(self.properties[i]);
                }    
            }
        }

        return inBBox;
    };

    // adds the feature to the map
    self.addFeature = function(feature, data, skipMap) {
        if (feature.setMap && !skipMap) {
            feature.setMap(map);
        }

        self.properties.push(data);
        self.features.push(feature);
    };

    // adds listeners to the feature based on the listener object
    self.addListeners = function(feature, data) {
        if (clickCallback) {
	        google.maps.event.addListener(feature, "click", function(e) {
	            clickCallback(e, this, data);
	        });	
        }

        if (mouseoutCallback) {
	        google.maps.event.addListener(feature, "mouseout", function(e) {
	            mouseoutCallback(e, this, data);
	        });	
        }

        if (mouseoverCallback) {
	        google.maps.event.addListener(feature, "mouseover", function(e) {
	            mouseoverCallback(e, this, data);
	        });	
        }
    };

    // empty out the set of features, clear the arrays
    self.empty = function() {
        self.clear();

        if (self.features.length > self.maximumFeatures) {
            self.features = [];
        }

        if (self.properties.length > self.maximumFeatures) {
            self.properties = [];
        }

        return self;
    };

    self.refill = function() {
        for (var i = 0; i < self.features.length; i++) {
            var feature = self.features[i];
            var properties = self.properties[i];
            if (feature.setMap) {
                feature.setMap(map);
                self.addListeners(feature, properties);
            }
        }
    };
    
    // only remove the features, don't clear the arrays
    self.clear = function() {
        for (var i = 0; i < self.features.length; i++) {
            self.removeFeature(self.features[i]);
        }
    };
    
    self.removeFeature = function(feature) {
        if (feature.setMap) {
            feature.setMap(null);
        }

        self.removeListeners(feature);
    };

    self.removeListeners = function(feature) {
        google.maps.event.clearListeners(feature, "click");
        google.maps.event.clearListeners(feature, "mouseout");
        google.maps.event.clearListeners(feature, "mouseover");
    };

    var handles = [];
    self.on = function(event, handler, target) {
        var handle = google.maps.event.addListener(target ? target : map, event, handler);
        handles.push(handle);

        return self;
    };

    self.off = function() {
        while (handles.length) {
            google.maps.event.removeListener(handles.pop());
        }

        return self;
    };

    return self;
};
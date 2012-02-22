var trulia = trulia || {};

if (!trulia.maps) {
    trulia.maps = {};
}

if (!trulia.maps.overlays) {
    trulia.maps.overlays = {};
}

trulia.maps.overlays.GeoJson = function(map, options, customDisplayOptions) {
    var self = trulia.maps.overlays.Layer(map, options),
        zIndex = 0,
        loadCallback = null,
        postLoadCallback = null;

    // default marker image
    // 'media/images/marker_15x15.png'

    // default style options
    self.displayOptions = {
        // no default styles for points
        Point: {},
        Polygon: {
            'default': {
                fillColor: "#559900",
                fillOpacity: .25,
                strokeColor: "#559900",
                strokeWeight: 3,
                strokeOpacity: 0.75
            },
            'mouseover': {
                strokeOpacity: 1.0
            }
        },
        MultiPolygon: {
            'default': {
                fillColor: "#559900",
                fillOpacity: .25,
                strokeColor: "#559900",
                strokeWeight: 3,
                strokeOpacity: 0.75
            },
            'mouseover': {
                strokeOpacity: 1
            }
        }
    };

    self.displayOptions = $.extend(customDisplayOptions, self.displayOptions);

    if (customDisplayOptions.fillColor) {
        self.displayOptions.Polygon.default.fillColor = customDisplayOptions.fillColor;
        self.displayOptions.MultiPolygon.default.fillColor = customDisplayOptions.fillColor;
    }

    // types of geojson
    self.types = {
        Point: function(o, p) {
            var location = new google.maps.LatLng(o.coordinates[1], o.coordinates[0]),
                marker = new google.maps.Marker({
                position: location
            });
            return marker;
        },

        Polygon: function(o, p) {
            var path = [],
            bounds = new google.maps.LatLngBounds(),
            coords = o.coordinates;

            for (i = 0; i < coords.length; i++) {
                var icoords = coords[i];
                for (j = 0; j < icoords.length; j++) {
                    var latlng = new google.maps.LatLng(icoords[j][1], icoords[j][0]);
                    bounds.extend(latlng);
                    path.push(latlng);
                }
            }

            var polygon = new google.maps.Polygon({
                paths: path
            });

            polygon.bounds = bounds;
            return polygon;
        },

        MultiPolygon: function(o, p) {
            var coords = o.coordinates;
            var paths = [];

            for (i = 0; i < coords.length; i++) {
                var icoords = coords[i];
                for (j = 0; j < icoords.length; j++) {
                    var path = [];
                    var jcoords = icoords[j];
                    for (k = 0; k < jcoords.length; k++) {
                        var ll = new google.maps.LatLng(jcoords[k][1], jcoords[k][0]);
                        path.push(ll);
                    }
                    paths.push(path);
                }
            }

            if (paths.length) {
                var polygon = new google.maps.Polygon({
                    paths: paths
                });
                return polygon;
            } else {
                return null;
            }
        },

        GeometryCollection: function(o, p) {
            var geometries = o.geometries;

            // return the first valid geometry, store the other shapes in as properties
            for (i = 0; i < geometries.length; i++) {
                var shape = geometries[i];
                if (self.types[shape.type]) {
                    p.geometries = o.geometries;
                    return self.types[shape.type](shape, p);
                }
            }

            return null;
        }
    };

    if (options.types) {        
        for (var type in options.types) {
            if (self.types[type]) {
                self.types[type] = options.types[type];
            }
        }    
    }

    // put the features back
    self.fill = function() {
        for (var i = 0; i < self.features.length; i++) {
            self.addFeature(self.features[i], self.properties[i], true);
        }
    };

    // load a geojson file
    self.url = function(url) {
        $.ajax({
            url: url,
            dataType: 'json',
            cache: false,
            success: self.loaded
        });

        return self;
    };
    
    self.loaded = function(data) {
        if (!data.features) {
            data = JSON.parse(data);
        }

        // if we have a preprocessor, preprocess it [useful for clustering maybe]
        if (loadCallback) {
            data = loadCallback(data);
        }
        
        self.json(data);
        
        if (postLoadCallback) {
            setTimeout(function() {
                postLoadCallback(data);
            }, 100);
        }
        
        return self;
    };

    self.json = function(data) {        

        $.each(data.features, function(i, e) {
            self.parseFeature(e);
        });

        return self;
    };

    // parse geojson
    self.parseFeature = function(f) {
        // if we can't parse it, ignore
        if (!self.types[f.geometry.type]) {
            return;
        }

        var featureParser = self.types[f.geometry.type],
            feature = featureParser(f.geometry, f.properties);
            
        // automatically add it to the map for now
        if (feature && feature.setMap) {
            self.addFeature(feature, f);
        } else if (feature && feature.length && feature.length > 0) {
            for (var i = 0; i < feature.length; i++) {
                self.addFeature(feature[i], f);
            }
        }
    };

    // adds the feature to the map
    self.addFeature = function(feature, data, skipMap) {
        if (feature.setMap) {
            if (!skipMap) {
                feature.setMap(map);
            }

            if (data && data.geometry) {            
                var type = data.geometry.type;
                if (type == 'GeometryCollection') {
                    type = data.geometry.geometries[0].type;
                }    
                
                // mouse events
                self.addListeners(feature, data, type);

                // set its default display options
                if (self.displayOptions[type]["default"]) {
                    feature.setOptions(self.displayOptions[type]["default"]);   
                }
            }

            self.features.push(feature);
            self.properties.push(data);   
        }
    };

    // this function fires after data is loaded, before geojson is parsed
    self.onload = function(f) {
        if (!arguments.length) {
            return loadCallback;
        }

        loadCallback = f;
        return self;
    };
    
    self.postload = function(f) {
        if (!arguments.length) {
            return postLoadCallback;
        }
        
        postLoadCallback = f;
        return self;
    };
    
    self.draw = function() {
        // hm...
    };
    
    // t is a boolean, detaches or attaches
    self.toggle = function(t) {
        try {
            if (t) {
                self.attach(map);
            } else {
                self.detach(map);
            }
        }
        catch (e) {
            // nothing yet
        }
        return self;
    };

    self.attach = function(map) {
        self.fill();
        self.setMap(map);
        return self;
    };

    self.detach = function(map) {
        self.setMap(null);
        return self;
    };

    self.onRemove = function() {
      self.clear();
    }

    return self;
};

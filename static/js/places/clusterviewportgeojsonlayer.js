

trulia.maps.overlays.ClusterGeoJson = function (map, options, customDisplayOptions) {
    var self = new trulia.maps.overlays.ViewportGeoJson(map, options, customDisplayOptions),
        _self = {},
        clusterer = null;

    clusterer = new MarkerClusterer(map, [], {
        maxZoom: 15,
        styles: options.styles,
        zoomOnClick: false
    });

    self.visibleInFilter = function(p, filters) {
        if (filters['all'] == true || filters.empty == true) {
            return true;
        } else if (filters['all'] == false) {
            return false;
        }

        var c = p.category ? p.category.split(' ').join('').toLowerCase() : '_';
        return filters[c];
    };

    _self.featuresInBBox = self.featuresInBBox;
    self.featuresInBBox = function() {
        var inBBox = [],
            bbox = map.getBounds();
        for (var i = 0; i < self.features.length; i++) {
            var f = self.features[i],
                p = self.properties[i];

            // check the position and if it's visible
            if (p && f.getPosition && self.visibleInFilter(p.properties, self.currentFilter)) {   
                var pos = f.getPosition();
                if (bbox.contains(pos)) {
                    inBBox.push(p);
                }    
            }
        }

        return inBBox;
    };

    self.json = function(data) {  
        if (!self.attached) {
            return;
        }
         
        if (!self.attached) {
            return;
        }
        
        var added = [];
        $.each(data.features, function(i, e) {
            if (self.isUnique(e)) {
                added.push(self.parseFeature(e));
            }
        });
        
        clusterer.addMarkers(added);

        if (self.idle()) {
            self.idle()();
        }
        
        return self;
    };
    
    self.parseFeature = function(f) {
        // if we can't parse it, ignore
        if (!self.types[f.geometry.type]) {
            return;
        }

        var featureParser = self.types[f.geometry.type],
            feature = featureParser(f.geometry, f.properties);

        // don't add it to the map, let the clusterer do that
        if (feature && feature.setMap) {
            self.addFeature(feature, f, false);
            
            // add properties
            feature.properties = f.properties;
        } else if (feature && feature.length && feature.length > 0) {
            for (var i = 0; i < feature.length; i++) {
                self.addFeature(feature[i], f, false);
                
                // add properties
                feature[i].properties = f.properties;
            }

        }

        return feature;
    };

    _self.refill = self.refill;
    self.refill = function() {
        _self.refill();

        clusterer.clearMarkers();
        clusterer.addMarkers(self.features);
    };

    _self.clear = self.clear;
    self.clear = function() {
        _self.clear();

        clusterer.clearMarkers();
    };

    // if there was no filterer passed, this is the default for geojson
    if (!options.filterer) {
        self.filterer(function(filterOptions) {
            var features = self.features,
                properties = self.properties,
                toAdd = [];
            
            if (filterOptions['all'] == true) {
                clusterer.addMarkers(features);
                self.currentFilter = { empty: true };
                return self;
            }
            
            if (filterOptions['all'] == false) {
                clusterer.clearMarkers();
                return self;
            }
            
            for (var i = 0; i < features.length; i++) {
                var f = features[i];
                
                if (!properties[i].properties) {
                    continue;
                }

                var p = properties[i].properties;

                if (self.visibleInFilter(p, filterOptions)) {
                    toAdd.push(f);
                }
            }

            clusterer.clearMarkers();
            clusterer.addMarkers(toAdd);
            
            return self;
        });
    }

    _self.attach = self.attach;
    self.attach = function(map) {
        _self.attach(map);

        if (self.clusterClick) 
            self.on('click', self.clusterClick, clusterer);
        
        if (self.clusterOver)
            self.on('mouseover', self.clusterOver, clusterer);

        if (self.clusterOut)
            self.on('mouseout', self.clusterOut, clusterer);

        return self;
    };
    
    return self;
};
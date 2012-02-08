

trulia.maps.overlays.CrimeGeoJson = function (map, options, customDisplayOptions) {
    var self = new trulia.maps.overlays.ViewportGeoJson(map, options, customDisplayOptions),
        _self = {},
        clusterer = null,
        featuresSeen = {};
        crimeTypes = [],
        crimeTypeDict = {},
        overallCrimeTypeDistribution = {};
        // a distribution object has a length property and has counts keyed by crime type
    
    var styles = [];
    var sizes = [30, 40, 50, 60,70];
    for (var i = 0; i < 5; i++) {
        var size = sizes[i];
        styles[i] = {
            width: size,
            height: size,
            textColor: '#ffffff',
            textSize: 10 + i,
            url: 'media/images/marker_' + size + 'x' + size + '.png'
        };
    }

    clusterer = new MarkerClusterer(map, [], {
        maxZoom: 16,
        styles: styles,
        zoomOnClick: false
    });

    self.json = function(data) {   

        $.each(data.features, function(i, e) {
            var id = e.properties.id ? e.properties.id : e.id;
            if (!featuresSeen[id]) {
                self.parseFeature(e);
                featuresSeen[id] = e;
                
                var category = e.properties.category;
                if (!overallCrimeTypeDistribution[category]) {
                    overallCrimeTypeDistribution[category] = 1;
                } else {
                    overallCrimeTypeDistribution[category]++;
                }

                if (!crimeTypeDict[category]) {
                    crimeTypes.push(category);
                    crimeTypeDict[category] = true;
                }
            }
        });
        
        overallCrimeTypeDistribution.length = data.features.length;
        
        clusterer.clearMarkers();
        clusterer.addMarkers(self.features);
        
        return self;
    };
    
    self.parseFeature = function(f) {
        // if we can't parse it, ignore
        if (!self.types[f.geometry.type]) {
            return;
        }

        var featureParser = self.types[f.geometry.type],
        feature = featureParser(f.geometry, f.properties);

        // automatically add it to the map for now
        if (feature && feature.setMap) {
            self.addFeature(feature, f, false, true);
            
            // add properties
            feature.properties = f.properties;
        } else if (feature && feature.length && feature.length > 0) {
            for (var i = 0; i < feature.length; i++) {
                self.addFeature(feature[i], f, false, true);
                
                // add properties
                feature.properties = f.properties;
            }
        }
    };
    
    self.crimeTypes = function() {
        return crimeTypes;
    };
    
    self.overallDistribution = function() {
        return overallCrimeTypeDistribution;
    };
    
    self.calculateDistribution = function(markers) {
        var dist = {};
        
        for (var i = 0; i < markers.length; i++) {
            var p = markers[i].properties,
                type = p.category;
                
            dist[type] = dist[type] ? dist[type] + 1 : 1;
        }
        
        dist.length = markers.length;
        
        return dist;
    };

    // filter on an object like { 'Arrest' : true, 'Assault' : false }
    self.filter = function(filterOptions) {
        var features = self.features,
            properties = self.properties,
            toAdd = [];
        
        if (filterOptions['All'] == true) {
            clusterer.addMarkers(features);
            return self;
        }
        
        clusterer.clearMarkers();
        
        if (filterOptions['All'] == false) {
            return self;
        }
        
        for (var i = 0; i < features.length; i++) {
            var f = features[i],
                p = properties[i].properties;
            
            if (filterOptions[p.category]) {
                toAdd.push(f);
            }
        }
        
        clusterer.addMarkers(toAdd);
        
        return self;
    };
    
    // _self.attach(map) is the same as calling super.attach(map) in other languages
    _self.attach = self.attach;
    self.attach = function(map) {
        // self.filter({ 'All' : true });
        _self.attach(map);
        return self;
    };
    
    // _self.detach(map) is the same as calling super.attach(map) in other languages
    _self.detach = self.detach;
    self.detach = function(map) {
        // self.filter({ 'All' : false });
        _self.detach(map);
        return self;
    };
    
    return self;
};
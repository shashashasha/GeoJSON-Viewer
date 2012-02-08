

trulia.maps.overlays.ViewportGeoJson = function (map, options, customDisplayOptions) {
    var self = new trulia.maps.overlays.GeoJson(map, options, customDisplayOptions),
        featuresSeen = {},
        hashesSeen = {};
    
    self.attached = false;
    
    self.refresher = function(e) {
        var projection = self.getProjection();
        if (!projection || !self.attached) {
            return;
        }  

        var tl = {x: 0, y: 0},
            bl = {x: 0, y: options.container.height()},
            tr = {x: options.container.width(), y: 0},
            br = {x: options.container.width(), y: options.container.height()},
            tl_loc = projection.fromContainerPixelToLatLng(tl),
            br_loc = projection.fromContainerPixelToLatLng(br),
            bl_loc = projection.fromContainerPixelToLatLng(bl),
            tr_loc = projection.fromContainerPixelToLatLng(tr),
            center = map.getCenter(),
            hashes = [];

        if (options.geohash) {
          var locs = [tl_loc, br_loc, tr_loc, bl_loc, center];

          for (var i = 0; i < locs.length; i++) {            
             var hash = encodeGeoHash(locs[i].lat(), locs[i].lng()),
                 precision = Math.max(4, map.getZoom() - options.geohashPrecision);
             hash = hash.substr(0, precision);

             if (!hashesSeen[hash]) {
               hashes.push(hash);
               hashesSeen[hash] = hash;
               if (options.geohash.indexOf('{hash}') !== -1)
               {
                 self.url(options.geohash.replace('{hash}', hash));
               }
             }
          }
          // combined hash
          if (options.geohash.indexOf('{hashes}') !== -1 && hashes.length)
          {
            self.url(options.geohash.replace('{hashes}', hashes.join(',')));
          }
        } else if (options.template) {
            var dataURL = options.template.replace('{maxlat}', tl_loc.lat())
                            .replace('{maxlon}', br_loc.lng())
                            .replace('{minlat}', br_loc.lat())
                            .replace('{minlon}', tl_loc.lng());    

            self.url(dataURL);
        }
        
    };
    
    // load a geojson file
    self.url = function(url) {
        var opts = {
            url: url,
            success: self.loaded
        };

        if (options.jsonpCallback) {
            opts.dataType = 'jsonp';
            opts.cache = true;
            opts.jsonpCallback = options.jsonpCallback;
        } else {
            opts.dataType = 'json';
        }

        $.ajax(opts);

        return self;
    };

    self.isUnique = function(e) {
        var id = e.properties.id ? e.properties.id : e.id;
        if (!featuresSeen[id]) {
            featuresSeen[id] = e;
            return true;
        }
        else {
            return false;
        }
    };

    self.json = function(data) { 
        if (!self.attached) {
            return;
        }
        
        // don't add duplicates, check with the property id for now
        $.each(data.features, function(i, e) {
            if (self.isUnique(e)) {
                self.parseFeature(e);
            }
        });

        if (self.idle()) {
            self.idle()();
        }

        return self;
    };
    
    self.attach = function(map) {
        self.attached = true;

        self.on('idle', self.refresher);

        if (self.idle()) {
            var idleCallback = self.idle();
            self.on('dragend', idleCallback);
            self.on('zoom_changed', idleCallback);
        }

        self.refill();

        // force a slight delay
        setTimeout(function() {
            self.refresher();

            if (self.idle()) {
                self.idle()();
            }
        }, 100);

        return self;
    };
    
    self.detach = function(map) {
        self.attached = false;
        
        if (self.features.length > self.maximumFeatures) {
            featuresSeen = {};   
            hashesSeen = {}; 
        }

        self.empty();

        self.off();
        return self;
    };
    
    self.setMap(map);
    
    return self;
};
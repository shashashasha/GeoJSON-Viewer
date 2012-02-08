

trulia.maps.overlays.CsvGeoJson = function (map, options, customDisplayOptions) {
    var self = new trulia.maps.overlays.GeoJson(map, options, customDisplayOptions);
    
    // load a geojson file
    self.url = function(url, callback) {
        $.ajax({
            url: url,
            dataType: 'csv',

            success: function(data) {
                data = parseCSV(data);
                
                self.json(data);
            }
        });

        return self;
    };
    
    // load a csv file, turn it into geojson
    var parseCSV = function(data) {
        var lines = data.split('\r');
        var parsed = {
            type: "FeatureCollection",
            features: []
        };
        
        lines.shift();
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var variables = line.split(',');
            var lon = variables[options.loncol];
            var lat = variables[options.latcol];
            
            var feature = {
		        geometry: {
		            coordinates: [lon, lat],
		            type: "Point"
		        },
		        id: variables[0],
		        properties: {
		            variables: variables,
		            image: variables[2]
		        }
		    };
		    
		    parsed.features.push(feature);
        }
        
        return parsed;
    };
    
    return self;
}

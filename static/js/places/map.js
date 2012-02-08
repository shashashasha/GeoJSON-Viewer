explore = explore || {};

explore.map = function(id, hoverID, defaults) {
	// defaults to a selectorView which has convenience hide show functions
	var exploremap = explore.selectorView(),
	    config = {},
	    style = {},
	    jsonText = null,
	    _fullscreen = true,
		hoverWindow = null;

	exploremap.initialize = function(id, hoverID, defaults) {
		var parent = document.getElementById(id);
		
		// set the container
		exploremap.container = $(parent);
		
		config = defaults;
		
		var mapTypeId = "gray";
		var myOptions = {
			zoom: defaults.zoom || 15,
			center: defaults.center || new google.maps.LatLng(37.77, -122.44),
			mapTypeControl: false,
			panControl: false,
			zoomControl: true,
			streetViewControl: false,
			mapTypeId: mapTypeId
		};
        
		// make the map and set it as a cloudmade map
		var map = new google.maps.Map(parent, myOptions);
		
    var styledMapType = new google.maps.StyledMapType(config.mapStyle, {name: 'Grayscale'}); 
    // truliaMapStyle
		map.mapTypes.set(mapTypeId, styledMapType);
		map.setMapTypeId(mapTypeId);
        
		// save the elements
		hoverWindow = $(document.getElementById(hoverID));
		
    exploremap.map = map;
    return exploremap;
	};
	
	exploremap.style = function(json) {
	    if (!arguments.length)  return style;
	    
	    if (style != json) {
	        var id = json.name ? json.name : "new";
    	    var newMapType = new google.maps.StyledMapType(json, {name: id});
    	    exploremap.map.mapTypes.set(id, newMapType);
    	    exploremap.map.setMapTypeId(id);
	    }
	    
	    return exploremap;
	};
	
	// listener shortcuts
	exploremap.on = function(eventName, callback) {
        google.maps.event.addListener(exploremap.map, eventName, callback);
        return exploremap;
	};
	
	// listener shortcuts
	exploremap.off = function(eventName, callback) {
	    google.maps.event.removeListener(exploremap.map, eventName, callback);
	    return exploremap;
	};
	
	exploremap.trigger = function(trigger) {
	    google.maps.event.trigger(exploremap.map, trigger);
	    return exploremap;
	};

	exploremap.initialize(id, hoverID, defaults);

	return exploremap;
};
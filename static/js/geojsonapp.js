var geojsonmap;
var geojsonlabels;

$(function() {
	// create the geojson map
    var ilat = parseFloat(urlParams['lat']) || 37.74;
    var ilon = parseFloat(urlParams['lon']) || -122.44;
    var izoom = parseInt(urlParams['zoom']) || 12;
    
	geojsonmap = explore.map("mapContent", "hoverLabel", {
		mapStyle: styles,
		zoom: izoom,
		center: new google.maps.LatLng(ilat, ilon)
	});

	// default urls for testing
    addLayer(urlParams);

    geojsonlabels = explore.labels({}, geojsonmap.map);

    geojsonlabels.addLabel('hover', '#infoWindow');

	initUI();

    $("#about").click(function() {
        $("#aboutDescription").toggle(); 
    });
});

function addLayer(options) {
    var url = options['url'];
    var type = options['type'];
    var color = options['color'];

    var layer = null, container = $("#mapContent");

    var options = {
        container: container,
        mouseover: defaultMouseover(options),
        mouseout: defaultMouseout(options)
    };

    switch (type) {
        // image tiles
        case 'image-tiles':
            options.url = url;
            layer = trulia.maps.overlays.ImageTiles(geojsonmap.map, options);
            break;

        // template takes url and assumes {hash} or {hashes} in the url somewhere
        // if {hashes}, gives geohashes together separated by commas
        case 'viewport-geohash':
            options.geohash = url;
            options.geohashPrecision = 10;

            layer = trulia.maps.overlays.ViewportGeoJson(geojsonmap.map, options, { 
              color: color 
            });

            break;
        // template takes url and assumes {maxlat}{maxlon}{minlat}{minlon} in the url somewhere
        case 'viewport-bbox':
            options.template = url;

            layer = trulia.maps.overlays.ViewportGeoJson(geojsonmap.map, options, { 
               color: color 
            });
            break;
        
        // geojson takes a single url
        case 'geojson':
        default:
            layer = trulia.maps.overlays.GeoJson(geojsonmap.map, options, { color: color });
            layer.url(url);
            
            // for single static files, try to recenter the map based on the geojson
            layer.postload(function() {
                var features = layer.features;
                var bounds = new google.maps.LatLngBounds();

                if (features.length == 1) {
                    var feature = features[0];
                    
                    if (feature.getPosition) {
                        geojsonmap.map.setCenter(feature.getPosition());
                        return;
                    } else {
                        extendBounds(feature, bounds);  
                    }
                } else {
                    for (var i = 0; i < features.length; i++) {
                        extendBounds(features[i], bounds);
                    }
                }

                geojsonmap.map.fitBounds(bounds);
            });
            break;
    }

    // attach the layer to the map
    layer.attach(geojsonmap.map);

    return layer;
}

function defaultMouseover(options) {

    // hide property from the infowindow display
    var hiddenProperty = options['hideProperty'];

    return function(e, feature, data) {
        var props = [];
        for (var i in data.properties) {
            // we can suppress properties if we want
            if (i == hiddenProperty) continue;

            if (data.properties[i] instanceof Array) {
                props.push("<div><strong>" + i + "</strong>: " + data.properties[i].join(', ') + "</div>");
            } else {
                props.push("<div><strong>" + i + "</strong>: " + data.properties[i] + "</div>");   
            }
        }

        geojsonlabels.updateLabel('hover', props.join(""));
    };
}

function defaultMouseout() { 
    return function(e, feature, data) {
        geojsonlabels.hideLabel('hover');
    };
}

function extendBounds(feature, bounds){
	if (feature.getPosition) {
		bounds.extend(feature.getPosition());
		return;
	} else if (feature.getPaths) {
		var paths = feature.getPaths();

		paths.forEach(function(path, i){
			if (path.getAt) {
				path.forEach(function(loc, index) {
					bounds.extend(loc);		
				});
			}
			else {
				bounds.extend(paths.getAt(i));	
			}
		});
	}
}

function initUI() {
  //Get the original value to test against. We use .val() to grab value="Search"
	var original_val = $('#search').val();
    $('#search').focus(function() {
    	if($(this).val() === original_val) {
			$(this).val('');
		}
	})
    .blur(function() {
		if($(this).val() === ''){
			$(this).val(original_val);
		}
	});

	// geocoding
	$("#searchForm").submit(function() {
	    explore.geocode($("#search").val(), function(response) {
	    	if (response[0].geometry.location) {
	    		if (geojsonmap.map.getZoom() > 12) {
		    		geojsonmap.map.panTo(response[0].geometry.location);	
	    		} else {
	    			geojsonmap.map.setOptions({
		    			center: response[0].geometry.location, 
		    			zoom: 12
		    		});	
	    		}
	    	}
	    });
	    return false;
	});
  
  // zoom controls
  $("#zoomIn").click(function(e) {
      geojsonmap.map.setZoom(geojsonmap.map.zoom + 1);
  });
  
  $("#zoomOut").click(function(e) {
      geojsonmap.map.setZoom(geojsonmap.map.zoom - 1);
  });
}

/* 
	Misc utilities here
*/

// get url params
var urlParams = {};
(function () {
    var e,
        a = /\+/g,  // Regex for replacing addition symbol with a space
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
        q = window.location.search.substring(1);

    while (e = r.exec(q))
       urlParams[d(e[1])] = d(e[2]);
})();

// trulia map style
var styles = [
        {
            "featureType": "administrative",
            "elementType": "all",
            "stylers": [
                {
                    "saturation": 0
                }
            ]
        },
        {
            "featureType": "administrative.country",
            "elementType": "all",
            "stylers": [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "administrative.province",
            "elementType": "all",
            "stylers": [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [
                {
                    "saturation": -10
                }
            ]
        },
        {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "poi.park",
            "elementType": "all",
            "stylers": [
                {
                    "saturation": -10
                },
                {
                    "lightness": 30
                },
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "road",
            "elementType": "all",
            "stylers": [
                {
                    "saturation": -100
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [
                {
                    "saturation": 0
                },
                {
                    "hue": "#5EAB1F"
                },
                {
                    "lightness": 0
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "label",
            "stylers": [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "all",
            "stylers": [
                {
                    "saturation": -100
                },
                {
                    "lightness": 20
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "label",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "road.local",
            "elementType": "label",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        },
        {
            "featureType": "transit",
            "elementType": "all",
            "stylers": [
                {
                    "saturation": -100
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "all",
            "stylers": [
                {
                    "hue": "#0089CF"
                },
                {
                    "saturation": -50
                },
                {
                    "lightness": 30
                }
            ]
        },
        {
            "featureType": "administrative.land_parcel",
            "elementType": "all",
            "stylers": [
                {
                    "visibility": "on"
                }
            ]
        }
];
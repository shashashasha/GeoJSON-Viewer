/*jshint browser: true, jquery: true, indent: 2, white: true, curly: true, forin: true, noarg: true, immed: true, newcap: true, noempty: true, trailing: false */
/*globals trulia:true, google, _, site_root, _CENLONG, _CENLAT, explore:true, Mustache*/

// adding explore ui functions
explore = explore || {};

var sampleConfig = {
  // might need datasets array for compatibility with explore.ui
  // datasets: ['map', ''],

  amenities: {
    name: "amenities",
    selector: '#dataset_amenities',
    aggregate: true,
    points: true,
    polygons: true
  },
  crimes: {
    name: "crimes",
    selector: '#dataset_crimes',
    aggregate: true,
    points: true,
    heatmap: true
  },
  schools: {
    name: "schools",
    selector: '#dataset_schools',
    aggregate: false,
    points: true,
    polygons: true
  },
  comps: {
    name: "comps",
    points: true,
    selector: '#dataset_comparables'
  },
  map: {
    name: "map",
    selector: '#dataset_map'
  }
};

/* 
  Creates all the layers in the layerConfig object, assigns them to the map and associates them with the labels
*/
explore.createLayers = function(map, layerConfig, labels) {
  // 
  _.each(layerConfig, function(config) {
    if (!config.name) {
      return;
    }

    // populate the layers object
    if (explore.layerCreator[config.name]) {
      var creator = explore.layerCreator[config.name];

      // create all possible layers
      if (config.points && creator.points) {
        config.points = creator.points(map, config, labels);
      } 

      if (config.polygons && creator.polygons) {
        config.polygons = creator.polygons(map, config, labels);
      } 

      if (config.heatmap && creator.heatmap) {
        config.heatmap = creator.heatmap(map, config, labels);
      }
    }        
    else {
      trulia.log('no layer to make for', config.name);
    }
  });
};

explore.aggregateData = function(type, items, tableSize) {
  var i, key;

  tableSize = tableSize || 10;

  if (type !== 'amenities' && type !== 'crimes')
  {
    return;
  }

  if (!items || !items.length) {
    return;
  }

  if (!trulia.places.tableFields[type].items)
  {
    trulia.places.tableFields[type].items = {};
    trulia.places.tableFields[type].length = 0;
  }

  for (i = 0; trulia.places.tableFields[type].length < tableSize && i < items.length; i++)
  {
    key = items[i].date + items[i].description + items[i].url;
    if (!trulia.places.tableFields[type].items[key])
    {
      trulia.places.tableFields[type].items[key] = items[i];
      trulia.places.tableFields[type].length++;
    }
  }
};




/*
  The general idea with all these layerCreator functions is that we make one per layer 
  (points, polygons, etc) and we can make new ones if we want. They're all using various 
  general objects, like GeoJsonLayer, ViewportGeoJson, or MarkerSourceLayer. 

  All interaction functions are stored in these functions, so mouseover, mouseout, idle
  behavior. We should set flags in the config object we pass in case we don't want interactivity,
  or if we don't want it to update tables below the page (if we do, config should have the IDs
  required to manipulate the table, this function shouldn't have to know about the rest of the page).

  Ideally, this means that these functions can be used on any map on any page.

  We could then have files like app.pdp.js, or app.locationpage.js to define configs
  and create layers, infowindows, and tables to be updated.
*/
explore.layerCreator = {};

/*
  Amenities layer, only points
  Options object defines the marker image url, whether it's a grocery or bank or restaurant
  Also defines mouseover, mouseout, idle behavior
*/
explore.layerCreator.amenities = {};
explore.layerCreator.amenities.points = function(map, config, labels) {

  var spriteImage = _IMAGE_SERVER + '/images/flair/map_markers/map_marker_sheet_20120117.png';
  var spriteSize = new google.maps.Size(26, 36);
  var spriteAnchor = new google.maps.Point(13,36);
  var markerImages = {
    amenities: {
      bank: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,53), // origin
        spriteAnchor),
      bank_hover: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,99), // origin
        spriteAnchor),
      gas: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,145), // origin
        spriteAnchor),
      gas_hover: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,191), // origin
        spriteAnchor),
      grocery: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,237), // origin
        spriteAnchor),
      grocery_hover: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,283), // origin
        spriteAnchor),
      restaurant: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,382), // origin
        spriteAnchor),
      restaurant_hover: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,428), // origin
        spriteAnchor)
    },
    shadow: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(36, 36),
      new google.maps.Point(0, 842),
      new google.maps.Point(12, 38))
  };

  // helper function for amenities
  var getType = function(item) {
    if (!item) {
      return 'restaurant';
    }
      
    // category is provided as a number for some reason
    var typeNum = parseInt(item.type);
    switch (typeNum) {
      case 8:
        return 'grocery';
      case 7:
        return 'bank';
      case 9:
        return 'gas';
      case 1:
      default:
        return 'restaurant';
    }
  };

  var amenitiesOptions = {
    url: site_root + 'q_points_of_interest.php?category={request}&bounds={bounds}',
    requests: ['1', '7', '8', '9'],
    markerOptions: function(item, hover) {
      var type = getType(item),
          img = hover ? type + '_hover' : type,
          options = {};

      options.shadow = markerImages.shadow;
      options.icon = markerImages.amenities[img];
      item.category = type;

      return options;
    },
    htmlTemplate: '<div class="clear fleft marl5 mart5"><img src="{photo_url}" width="100" height="100" /></div>' + 
                  '<div class="fleft marl10 mart5" style="width:150px;">' +
                  '<div><img src="{rating_img_url}" /></div>' + 
                  '<div class="infowindow_body_text"><div class="mart2 f12 grey italic">Based on {review_count} reviews</div>' +
                  '<div class="f12">{address1}<br />{city}<br />{phone_num}</div></div></div>',
    mouseover: function(event, feature, data) {
      feature.setOptions(amenitiesOptions.markerOptions(data, true));

      if (feature == labels.infoWindowFeature) {
        return;
      }

      var p = data;
      
      if (!p.phone_num) {
        p.phone_num = explore.phoneNumber(p.phone.toString());  
      }

      var details = explore.batchReplace(amenitiesOptions.htmlTemplate, p, '');

      var hover = {
        title: p.name,
        url: p.url,
        details: details
      };
      
      labels.hoverLabel(hover); 
    },
    mouseout: function(event, feature, data) {
      feature.setOptions(amenitiesOptions.markerOptions(data));
      labels.hide();
    },
    click: function(event, feature, data) {
      o_track_ql_click('PlacesMarker|Amenities');
      labels.openHover(event, feature, data);
    },
    idle: function() {
      if (!amenities.currentFilter.empty) {
        amenities.filter();
      }

      var pts = amenities.featuresInBBox(),
          detail = {},
          detailTemplate = '{restaurant} restaurants, {bank} banks, {gas} gas stations, {grocery} groceries.';
      
      detail.restaurant = '0';
      detail.bank = '0';
      detail.gas = '0';
      detail.grocery = '0';

      _.each(pts, function (item) {
          var type = getType(item);
          detail[type] = detail[type] == '0' ? 1 : detail[type] + 1;
      });

      var pluralize = function(num, plural, singular) {
          return num == 1 ? '<span class="bold">' + num + '</span> ' + singular : 
                 num == '0' ? '<span class="bold">no</span> ' + plural 
                 : '<span class="bold">' + num + '</span> ' + plural;
      };

      var nums = [];
      nums.push(pluralize(detail.restaurant, 'restaurants', 'restaurant'));
      nums.push(pluralize(detail.bank, 'banks', 'bank'));
      nums.push(pluralize(detail.gas, 'gas stations', 'gas station'));
      nums.push(pluralize(detail.grocery, 'groceries.', 'grocery.'));
      
      amenitiesInfo = nums.join(', ');

      if (trulia.page_name == 'location_home') {
        amenitiesInfo += '<br /><span class="cta" id="places_module_zoom">Zoom in to see more results</span>';
      }
      
      detail.details = amenitiesInfo;

      labels.detailInfo(detail);

      // only try to update a table if we need to
      if (config.aggregate) {
        explore.aggregateData('amenities', pts, config.tableSize);

        // this is debounced since this callback can be called multiple times
        trulia.places.populateTable('#amenities_container', 'amenities', trulia.places.tableFields['amenities'].items); 
      }
    }
  };

  var amenities = new trulia.maps.overlays.MarkerSourceLayer(map, amenitiesOptions);



  return amenities;
};


/*
  Schools layer districts
*/
explore.layerCreator.schools = {};
explore.layerCreator.schools.polygons = function(map, config, labels) {

  var districtOptions = {
      container: $(map.canvas), 
      jsonpCallback: 'explore.loadSchoolDistricts',
      geohash: _MAPTILE_SERVER + 'schools/districts/?geohashes={hashes}&v=' + _release_version_tab,
      geohashPrecision: 10,
      districtTypes: {
          'U': 'Unified',
          'E': 'Elementary',
          'S': 'Secondary'
      }
  };

  var districts = new trulia.maps.overlays.ViewportGeoJson(map.getMap(), districtOptions);
  explore.loadSchoolDistricts = districts.json;
  
  return districts;
};


/*
  Schools layer points
  Options object defines the geohash precision, the types of schools,
  the mouseover, mouseout, idle behavior, 
  and the images for the icons
*/
explore.layerCreator.schools.points = function(map, config, labels) {

  var spriteImage = _IMAGE_SERVER + '/images/flair/map_markers/map_marker_sheet_20120117.png';
  var spriteSize = new google.maps.Size(26, 36);
  var spriteAnchor = new google.maps.Point(13,36);
  var markerImages = {
    schools: {
      black: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,474), // origin
        spriteAnchor),
      black_hover: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,520), // origin
        spriteAnchor),
      green: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,566), // origin
        spriteAnchor),
      green_hover: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,612), // origin
        spriteAnchor),
      orange: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,658), // origin
        spriteAnchor),
      orange_hover: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,704), // origin
        spriteAnchor),
      red: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,750), // origin
        spriteAnchor),
      red_hover: new google.maps.MarkerImage(spriteImage,
        spriteSize,
        new google.maps.Point(0,796), // origin
        spriteAnchor)
    },
    shadow: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(36, 36),
      new google.maps.Point(0, 842),
      new google.maps.Point(12, 38))
  };

  // setting this to glen's local server
  // _MAPTILE_SERVER = 'http://10.1.29.121/';

  // on attendance zone load
  var loadAttendanceZone = function(id) {
    $.ajax({
      url: _MAPTILE_SERVER + 'schools/zones/?id=' + id + '&v=' + _release_version_tab,
      dataType: 'jsonp',
      cache: true,
      jsonpCallback: 'explore.loadedAttendanceZone',
      success: loadedAttendanceZone
    });
  };

  var loadedAttendanceZone = function(data) {
    // this request has returned too late, we don't need to show the polygon anymore
    if (data.features.length == 0 || data.features[0].id != schoolOptions.mouseOverId) {
      return;
    }

    var feature = data.features[0];

    // if we have no geometry
    if (feature.geometry.geometries.length == 0) {
      return;
    }

    var type = feature.geometry.type;

    if (schoolOptions.schoolZone) {
      schools.removeFeature(schoolOptions.schoolZone);
      schoolOptions.schoolZone = null;
    }

    schoolOptions.schoolZone = schools.types[type](feature.geometry, feature.properties);
    schoolOptions.schoolZone.setOptions(schoolOptions.zoneOptions);
    schoolOptions.schoolZone.setMap(trulia.places.exploremap.map);
  };

  explore.loadedAttendanceZone = loadedAttendanceZone;
  
  var schoolOptions = {
      container: $(map.canvas), 
      jsonpCallback: 'explore.loadSchoolPoints',
      geohash: _MAPTILE_SERVER + 'schools/?geohashes={hashes}&limit=800&v=' + _release_version_tab, 
      geohashPrecision: 10,
      schoolTypes: {
          'C': 'Charter',
          'M': 'Magnet',
          'A': 'Alternative',
          'R': 'Regular',
          'I': 'Indian',
          'L': 'Military',
          'U': 'Unknown'
      },
      htmlTemplate: '<div class="infowindow_body_text"><div class="fleft marl5 f12">{location_address}<br/>' + 
          '{location_city} {location_state} {location_zip}<br/>{phone_num}</div>' + 
          '<div class="clear fleft marl5 mart1 f12 green zone {zoneClass}">{zone}</div></div>',
      schoolRatingTemplate: '<div class="fright school_rating">' + 
          '<div class="rating_badge {rating_color}"><div class="rating_score">{rating}</div><div class="f11 bold">{rating_scale}</div></div>' + 
          '<div class="mart4 f11 grey">{rating_provider}</div></div>',
      schoolDetailsTemplate: 
          '<div class="clear fleft marl5 mart2 padr10"><div class="f11 grey">Grade</div><div class="f20 bold">{grade_level}</div></div>' + 
          '<div class="fleft marl5 mart2 padr10"><div class="f11 grey">Students</div><div class="f20 bold">{student_ct}</div></div>' + 
          '<div class="fleft marl5 mart2 padr10"><div class="f11 grey">Teachers</div><div class="f20 bold">{teacher_ct}</div></div>',
      legendTemplate: 
          '<div class="school_legend mart3"><div class="fleft mart1 grey">Low</div><div class="fleft mart3 marl5 marr5">' + 
          '<div class="legendBlock fleft negative"></div>' + 
          '<div class="legendBlock fleft average"></div><div class="legendBlock fleft positive"></div>' + 
          '</div><div class="fleft mart1 grey">High</div></div>',
      schoolZone: null,
      clickedZone: null,
      mouseOverId: null,
      zoneOptions: {
          fillColor: "#559900",
          fillOpacity: .25,
          strokeColor: "#559900",
          strokeOpacity: .5
      },
      mouseover: function(event, feature, data) {
          var p = data.properties,
              template = schoolOptions.htmlTemplate,
              expandedWidth = false,
              expandedHeight = false;

          feature.setOptions(schoolOptions.markerOptions(p, true));

          if (feature == labels.infoWindowFeature) {
              return;
          }
      
          if (!p.phone_num) {
              p.phone_num = explore.phoneNumber(p.phone.toString());   
          }
          
          // set color of badge
          if (p.rating != null) {
              p.rating_color = p.rating >= 7 ? 'positive' : p.rating <= 4 ? 'negative' : 'average';
              p.rating_scale = 'out of 10';
              p.rating_provider = 'GreatSchools rating';
              template = template + schoolOptions.schoolRatingTemplate;
              expandedWidth = true;
          }

          if (p.grade_level_low || p.teacher_ct || p.student_ct) {
              if (p.grade_level_low && p.grade_level_high) {
                p.grade_level = p.grade_level_low + '-' + p.grade_level_high;  
              } else {
                p.grade_level = 'N/A';
              }
              
              template = template + schoolOptions.schoolDetailsTemplate;
              expandedHeight = true;
          }

          var details = explore.batchReplace(template, p);

          // has an attendance zone
          if (p.has_zone) {
            details = details.replace('{zone}', '');
            details = details.replace('{zoneClass}', 'hidden');
            loadAttendanceZone(data.id);
            schoolOptions.mouseOverId = data.id;
          } else {
            details = details.replace('{zone}', 'No Attendance Zone Info');
            details = details.replace('{zoneClass}', '');
          }

          labels.hoverLabel({
              title: p.name,
              details: details,
              url: p.url,
              trulia_url_path: p.trulia_url_path,
              width: expandedWidth ? '315px' : '280px',
              height: expandedWidth || expandedHeight ? '139px' : '100px'
          });
      },
      mouseout: function(event, feature, data) {
          feature.setOptions(schoolOptions.markerOptions(data.properties, false));

          if (schoolOptions.schoolZone) {
              schools.removeFeature(schoolOptions.schoolZone);
              schoolOptions.schoolZone = null;
          }

          schoolOptions.mouseOverId = null;

          labels.hide();
      },
      click: function(event, feature, data) {
          if (schoolOptions.clickedZone) {
              schools.removeFeature(schoolOptions.clickedZone);
              schoolOptions.clickedZone = null;
          }

          if (schoolOptions.schoolZone) {
              schoolOptions.clickedZone =  new google.maps.Polygon(schoolOptions.zoneOptions);
              schoolOptions.clickedZone.setPaths(schoolOptions.schoolZone.getPaths());
              schoolOptions.clickedZone.setMap(trulia.places.exploremap.map);
              schools.removeFeature(schoolOptions.schoolZone);
          } 

          o_track_ql_click('PlacesMarker|School');
          labels.openHover(event, feature, data);
      },
      idle: function() {
          if (!schools.currentFilter.empty) {
            schools.filter();
          }

          var pts = schools.featuresInBBox(),
              detail = {},
              sum = 0,
              num = 0,
              average = 0;

          for (var i = 0; i < pts.length; i++) {
            var rating = pts[i].properties.rating;
            sum += rating || 0;
            num += rating != null ? 1 : 0;
          }

          average = (Math.floor((sum / num) * 10) / 10);

          var suffix;
          if (num == 0) {
            suffix = '.';
          } else if (pts.length == 1 && num == 1) {
            suffix = ', rating <span class="bold">' + average + '/10</span>.';
          } else {
            suffix = ', average rating <span class="bold">' + average + '/10</span>.';
          }

          detail.details = pts.length == 1 ? '<span class="bold">1</span> school' + suffix : '<span class="bold">' + pts.length + '</span> schools' + suffix;
          detail.details = detail.details + schoolOptions.legendTemplate;

          labels.detailInfo(detail);
      },
      types: {
          Point: function(o, p) {
              var location = new google.maps.LatLng(o.coordinates[1], o.coordinates[0]),
                  options = schoolOptions.markerOptions(p);
              
              options.position = location;

              return new google.maps.Marker(options);
          }
      },
      markerOptions: function(data, hover) {
        var imgs = markerImages.schools,
          options = { shadow: markerImages.shadow };

        if (data.rating == null) {
          options.icon = hover ? imgs.black_hover : imgs.black;
        } else if (data.rating >= 7) {
          options.icon = hover ? imgs.green_hover : imgs.green;
        } else if (data.rating <= 4) {
          options.icon = hover ? imgs.red_hover : imgs.red;
        } else {
          options.icon = hover ? imgs.orange_hover : imgs.orange;
        }

        return options;
      }
  };
  var schools = new trulia.maps.overlays.ViewportGeoJson(map.getMap(), schoolOptions);

  // clear any school attendance zones if they are open   
  labels.onClear = function() {
      if (schoolOptions.clickedZone) {
          schools.removeFeature(schoolOptions.clickedZone);   
          schoolOptions.clickedZone = null;
          schoolOptions.schoolZone = null;
      }
  };

  // the json callback for schools jsonp loading
  explore.loadSchoolPoints = schools.json;

  var slider = $("#slider_schools_points");
  if (slider.length) {
    // set this selector in the config object
    $("#slider_schools_points").slider({
      value: 5,
      slide: function(e, ui) {
        var value = ui.value;
        schools.filter({
          rating: value
        });
        schools.idle()();
        $("#slider_schools_points_title").html("School Rating: " + (value / 10) + "+");
      }
    });

    $("#toggle_schools_unrated").change(function(e, ui) {
      schools.filter({
        unchecked: e.target.checked
      });
      schools.idle()();
    });

    schools.filter({ rating: 5 });
    $("#slider_schools_points_title").html("School Rating: 0+");

    schools.visibleInFilter = function(p, filter) {
      if (filter.unchecked && p.rating === null) {
        return true;
      } else if (filter.rating != undefined && p.rating != null) {
        return p.rating >= (filter.rating / 10); 
      } else {
        return false;
      }
    };
  }

  return schools;
};

/*
  Crimes Layer points
*/
explore.layerCreator.crimes = {};
explore.layerCreator.crimes.points = function(map, config, labels) {

  var spriteImage = _IMAGE_SERVER + '/images/flair/map_markers/map_marker_sheet_20120117.png';
  var markerImages = {
    crimes: new google.maps.MarkerImage(spriteImage,
        new google.maps.Size(14, 14),
        new google.maps.Point(0,0),
        new google.maps.Point(7,7)),
    crimes_hover: new google.maps.MarkerImage(spriteImage,
        new google.maps.Size(19, 19),
        new google.maps.Point(0,24),
        new google.maps.Point(9,9)),

    shadow: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(36, 36),
      new google.maps.Point(0, 842),
      new google.maps.Point(12, 38))
  };

  var styles = [];
  var sizes = [22, 32, 37, 46, 56]; // 16, 
  var pozes = ["0px -913px", "0px -945px", "0px -987px", "0px -1034px", "0px -1090px"]; // "0 -888", 
  for (var i = 0; i < 4; i++) {
      var size = sizes[i];
      var poze = pozes[i];

      styles[i] = {
          width: size,
          height: size,
          textColor: '#ffffff',
          textSize: 10 + i,
          url: spriteImage,
          backgroundPosition: poze
      };
  }

  var isViolent = function(category) {
    switch (category) {
      case 'Assault':
      case 'Shooting':
      case 'Burglary':
      case 'Robbery':
          return true;
      default:
      case 'Other':
      case 'Vandalism':
      case 'Theft':
      case 'Arrest':
          return false;
    }
  };

  var crimeOptions = {
      container: $(map.canvas), // &callback=explore.loadCrimePoints
      jsonpCallback: 'explore.loadCrimePoints',
      geohash: _MAPTILE_SERVER + 'crimes/?geohashes={hashes}&countyCap=500&limit=800&v=' + _release_version_tab,
      geohashPrecision: 10,
      styles: styles,
      htmlTemplate: '<div class="marl5 f12 grey">{date}</div>' + 
          '<div class="marl5 f12">{description}</div>',
      legendTemplate: '<div class="legend mart3"><div class="fleft mart1 grey">Low</div><div class="fleft mart3 marl5 marr5">' + 
          '<div class="legendBlock fleft lowmid"></div><div class="legendBlock fleft midmid"></div>' + 
          '<div class="legendBlock fleft bigmid"></div><div class="legendBlock fleft bigbig"></div>' + 
          '</div><div class="fleft mart1 grey">High</div></div>',
      mouseover: function(event, feature, data) {
          feature.setOptions({
            icon: markerImages.crimes_hover
          });

          if (feature == labels.infoWindowFeature) {
              return;
          }

          var p = data.properties,
              details = crimeOptions.htmlTemplate.replace('{date}', p.date);

          details = explore.batchReplace(details, p);

          if (p.category === '')
          {
            p.category = 'Incident';
          }

          var hover = {
              title: p.category,
              details: details
          };
      
          labels.hoverLabel(hover);
      },
      click: function(event, feature, data) {
        o_track_ql_click('PlacesMarker|Crime');
        labels.openHover(event, feature, data);
      },
      mouseout: function(event, feature, data) {
        labels.hide();
        feature.setOptions({
          icon: markerImages.crimes
        });
      },
      idle: function() {
          if (!crimePoints.currentFilter.empty) {
            crimePoints.filter();
          }

          var pts = crimePoints.featuresInBBox(),
              detail = {},
              violent = 0,
              nonviolent = 0;

          for (var i = 0; i < pts.length; i++) {
            if (isViolent(pts[i].properties.category)) {
              violent++;
            } else {
              nonviolent++;
            }
          }

          if (config.aggregate) {
            explore.aggregateData('crimes', _.map(pts, function (pt) {
              var d;

              // if we haven't processed the date for this crime
              if (!pt.properties.old_date)
              {
                // turn 2010-09-01 24:00:00 to 09/01/2010
                var dateString = pt.properties.date.split(' ')[0];
                var dates = dateString.split('-');

                // save the old date format in case
                pt.properties.old_date = pt.properties.date;
                pt.properties.date = dates[1] + '/' + dates[2] + '/' + dates[0];
              }

              return pt.properties;
            }), config.tableSize);
            trulia.places.populateTable('#crimes_container', 'crimes', trulia.places.tableFields['crimes'].items);  
          }

          if (pts.length == 1 && violent) {
            detail.details = '<span class="bold">1</span> violent crime.';
          }
          else if (pts.length == 1 && nonviolent) {
            detail.details = '<span class="bold">1</span> nonviolent crime.';
          } 
          else {
            detail.details = '<span class="bold">' + pts.length + 
                '</span> crimes: <span class="bold">' + violent + '</span> violent, ' + 
                '<span class="bold">' + nonviolent + '</span> nonviolent.';  
          }
          
          detail.details = detail.details + crimeOptions.legendTemplate;
          labels.detailInfo(detail);
      },
      types: {
          Point: function(o, p) {
              var location = new google.maps.LatLng(o.coordinates[1], o.coordinates[0]),
                  options = { 
                    position: location,
                    icon: markerImages.crimes
                  };

              return new google.maps.Marker(options);
          }
      }
  };
  var crimePoints = new trulia.maps.overlays.ClusterGeoJson(map.getMap(), crimeOptions);

  // bundle the categories into violent and nonviolent
  crimePoints.visibleInFilter = function(p, filters) {
    if (filters['all'] == true || filters.empty == true) {
        return true;
    } else if (filters['all'] === false) {
        return false;
    }

    var c = isViolent(p.category) ? 'violent' : 'nonviolent';
    if (filters[c]) {
        return true;
    } else {
        return false;
    }
  };

  // mouseover / out behavior for clustering
  var clusterHTML = '<div class="crime_details"><table><tbody>{lines}</tbody></table></div>' + 
    '<div class="fleft marl5 mart5 grey">Zoom in to see crime details.</div>';
  var clusterLineHTML = '<tr class="{evenodd}"><td>{date}</td><td class="crime_description">{description}</td></tr>';
  crimePoints.clusterOver = function(c) {
    var markers = c.getMarkers(),
        lines = [],
        details = clusterHTML;
    
    for (var i = 0; i < markers.length; i++) {
      var properties = markers[i].properties;

      var line = explore.batchReplace(clusterLineHTML, {
        evenodd: i % 2 == 0 ? 'even' : 'odd',
        description: properties.description.split(' Disposition')[0],
        date: properties.date
      });

      lines.push(line);
    }
    var hover = {
        title: markers.length + ' crimes in this area.',
        width: trulia.page_name == 'location_home' ? '320px' : '280px',
        details: details.replace('{lines}', lines.join(''))
    };

    labels.hoverLabel(hover);
  };

  crimePoints.clusterClick = function(c) {
    o_track_ql_click('PlacesMarker|CrimeCluster');
    labels.openHover(null, c);
  };

  crimePoints.clusterOut = labels.hide;

  // attach the jsonp callback to crimePoints.json
  explore.loadCrimePoints = crimePoints.json;
  return crimePoints;
};

explore.layerCreator.crimes.heatmap = function(map, config, labels) {

  // initializing crimes heatmap overlay
  var heatmap = new trulia.maps.overlays.ImageTiles(map.getMap());
  heatmap.baseURL = _MAPTILE_SERVER + 'tiles/crime_heatmap/{Z}/{X}/{Y}.png?v=' + _release_version_tab; // 'tiles/violent_crime_heatmap/{Z}/{X}/{Y}.png?v=' + _release_version_tab;
  return heatmap;
};

/*
    Comps layer points
*/
explore.layerCreator.comparables = {};
explore.layerCreator.comparables.points = function(map, config, labels) {

  var comps,
      compsOptions,
      detail = {};
  
  if (config.url)
  {
    compsOptions = {
      url: config.url,
      isProperties: true,
      // form with id below is serialized into request (MarkerSourceLayer only atm)
      extraParamForm: 'comps_filters',
      urlFormatter: config.urlFormatter
    };
  }
  else
  {
    compsOptions = {
      data: trulia.pdp.comps_markers,
      loadOnce: true,
      isProperties: true
    };
  }

  compsOptions.idle = function (response) {
    var properties = comps.featuresInBBox(),
        typeCounts = {},
        price,
        detailsText = [];

    // sum of the property prices and counts
    _.each(properties, function (property) {

      price = parseInt(property.data().p.replace(/[^0-9]/g, ''));
      if (price)
      {
        if (!typeCounts[property.data().t])
        {
          typeCounts[property.data().t] = {
            total: 0,
            count: 0
          };
        }
        typeCounts[property.data().t].total += price;
        typeCounts[property.data().t].count++;
      }
    });

    _.each(typeCounts, function (totals, type) {
      if (totals.count !== 0)
      {
        // capitalize first letter of every word
        // .replace(/^([a-z])|\s+([a-z])/g, function ($1) { return $1.toUpperCase(); })

        var numerical = (totals.count == 1 ? ' property' : ' properties');
        var prop = '<span class="bold">' + totals.count + '</span> <span class="bold ' + type.replace(/_/g, '') + '">' + type.replace(/_/g, ' ') + '</span>' + numerical;

        detailsText.push(prop +
            ', <span class="bold">$' + addCommas(Math.round(totals.total / totals.count)) + "</span> average price");
      }
    });

    // add zoom call to action
    // if (detailsText.length) {
    //   detailsText.push('<span class="cta" id="places_module_zoom">Zoom in to see more results</span>'); 
    // }

    if (trulia.location && response && response.nhid)
    {
      trulia.location.nhid = response.nhid;
      trulia.places.nhid = response.nhid;
      trulia.places.showPolygon('neighborhood', true);
      $('#local_info_button').show().find('a').get(0).href += trulia.location.nhid + '/';
    }

    if (detailsText.length)
    {
      labels.detailInfo({ details: detailsText.join('<br/>') });
    }
  };

  comps = new trulia.maps.overlays.MarkerSourceLayer(map, compsOptions, null, labels);
  return comps;
};

/*
  National layer points
  Options object defines the cities, the behavior on clicking on cities,
  mouseover behavior on city dots, etc
*/
explore.layerCreator.national = {};
explore.layerCreator.national.points = function(map, config, labels) {
  var national;
  var spriteImage = _IMAGE_SERVER + '/images/flair/map_markers/cities_marker_sheet_20120125.png';
  var spriteSize = new google.maps.Size(26, 36);
  var spriteAnchor = new google.maps.Point(13,36);

  var markerImages = {
    city: new google.maps.MarkerImage(spriteImage,
      spriteSize,
      new google.maps.Point(0,1580), // origin
      spriteAnchor),
    city_hover: new google.maps.MarkerImage(spriteImage,
      spriteSize,
      new google.maps.Point(0,1626), // origin
      spriteAnchor),
    albuquerque: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 0),
      null),
    atlanta: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(66, 41),
      new google.maps.Point(0, 51),
      null),
    austin: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(60, 41),
      new google.maps.Point(0, 102),
      null),
    boston: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(64, 41),
      new google.maps.Point(0, 153),
      null),
    charlotte: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(79, 41),
      new google.maps.Point(0, 204),
      null),
    chicago: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(72, 41),
      new google.maps.Point(0, 255),
      null),
    dallas: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(60, 41),
      new google.maps.Point(0, 306),
      null),
    denver: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(65, 41),
      new google.maps.Point(0, 357),
      null),
    detroit: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(64, 41),
      new google.maps.Point(0, 408),
      null),
    elpaso: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 459),
      null),
    houston: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 510),
      null),
    indianapolis: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 561),
      null),
    jacksonville: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 612),
      null),
    kansascity: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 663),
      null),
    lasvegas: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 714),
      null),
    losangeles: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 765),
      null),
    memphis: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 816),
      null),
    miami: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 867),
      null),
    minneapolis: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 918),
      null),
    nashville: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 969),
      null),
    newyork: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 1020),
      null),
    philadelphia: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(100, 41),
      new google.maps.Point(0, 1071),
      null),
    phoenix: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(70, 41),
      new google.maps.Point(0, 1122),
      null),
    portland: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(70, 41),
      new google.maps.Point(0, 1173),
      null),
    sandiego: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(85, 41),
      new google.maps.Point(0, 1224),
      null),
    sanfrancisco: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(106, 41),
      new google.maps.Point(0, 1275),
      null),
    sanjose: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(74, 41),
      new google.maps.Point(0, 1326),
      null),
    seattle: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(64, 41),
      new google.maps.Point(0, 1377),
      null),
    washingtondc: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(118, 41),
      new google.maps.Point(0, 1428),
      null),

    shadow: new google.maps.MarkerImage(spriteImage,
      new google.maps.Size(36, 36),
      new google.maps.Point(0, 842),
      new google.maps.Point(12, 38))
  };

  labels.addLabel('city', config.label);
  
  var nationalOptions = {
    // url for cities geojson
    url: _MAPTILE_SERVER + 'cities/',

    // mouse events for city markers
    click: function(event, feature, data) {
      o_track_ql_click('PlacesMarker|City');
      trulia.places.exploreui.selectLocation(data.properties.name); 

      // remove the national layer once a city is selected
      national.detach();
    },
    mouseover: function(event, feature, data) {
      try {
        var projection = national.getProjection();
        if (projection) {
          var pt = projection.fromLatLngToContainerPixel(event.latLng);

          labels.updateLabel('city', 'View local info in ' + data.properties.name, {
            'top': pt.y - 38,
            'left': pt.x + 30
          });
        } 
      } catch (e) {

      }
    },
    mouseout: function(event, feature, data) {
      labels.hide();
    },

    types: {
      Point: function(o, p) {
        var location = new google.maps.LatLng(o.coordinates[1], o.coordinates[0]),
          city = p.name.toLowerCase().split(' ').join(''),
          options = { 
            position: location,
            icon: markerImages[city]
            // shadow: markerImages.shadow
        };

        return new google.maps.Marker(options);
      }
    }
  }

  national = new trulia.maps.overlays.GeoJson(map, nationalOptions);
  national.setMap(map);

  // national.json = function(data) {        
  //   $.each(data.features, function(i, e) {
  //       setTimeout(function() {
  //         var f = e;
  //         return function() {
  //           var featureParser = national.types[f.geometry.type],
  //               feature = featureParser(f.geometry, f.properties);
  //           // automatically add it to the map for now
  //           if (feature && feature.setMap) {
  //               national.addFeature(feature, f);
  //           }
  //         };
  //       }(), i * 100);
  //   });
  //   return self;
  // };
  return national;
};
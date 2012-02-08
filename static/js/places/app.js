/*
Initialize the map, and initialize the UI
*/
$(document).ready(function() {

  var $placesMapModule = $('#places_map_module'),
      propertyCoords,
      isLocationPage = trulia.page_name && trulia.page_name.match(/^location_/);

  function initMap(options)
  {
    var mapOptions = {
      mapTypeControl: true,
      scrollwheel: false,
      maxZoom: 20,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.DEFAULT,
        style: google.maps.MapTypeControlStyle.DEFAULT,
        mapTypeIds: ['TruliaMap', google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID]
      },
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL,
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      mapTypeId: getCookie('rememberMapType') || 'TruliaMap',
      center: propertyCoords

    };

    // page specific zoom levels and map types
    switch (trulia.page_name) {
      case 'location_home':
        mapOptions.zoom = 4;
        mapOptions.scrollwheel = true;
        mapOptions.minZoom = 4;

        // add no labels option
        mapOptions.mapTypeId = 'TruliaMapNoLabels';
        break;

      case 'location_overview':
      case 'location_schools':
      case 'location_crime':
        var loc = trulia.location;
        mapOptions.zoom = loc && loc.version == 'city' ? 12 : 14;
        mapOptions.minZoom = 12;
        break;

      case 'details':
        mapOptions.zoom = 15;
        mapOptions.minZoom = 12;

        // add street view option
        if (options && options.streetview === true) {
          mapOptions.mapTypeControlOptions.mapTypeIds.splice(1, 0, 'TruliaStreet');
        }
        break;

      default:
        mapOptions.zoom = 14;
        mapOptions.minZoom = 12;
        break;
    }
      
    trulia.maps.loader.onload('core,markers,infobox,property-marker,overlays,overlay.home-values,home-markers,property-renderer,polygon,gis,polygon-adder', function() {
      var geocoder = new google.maps.Geocoder(); // Used to get default geocode

      // set center
      if (_CENLAT && _CENLONG) {
        mapOptions.center = trulia.maps.LatLng(_CENLAT, _CENLONG);  
      }
      else {
        mapOptions.center = trulia.maps.LatLng(-35, -100);  
      }

      if (trulia.page_name == 'location_home' && is_IE7()) 
      {
        // IE7 height:100% not working for liquid height
        var bodyHeight = $('body').height(),
            mapHeight = (bodyHeight - 125) + 'px';
        $('#places_module_map').css('height', mapHeight);
      }

      // create the map
      trulia.places.exploremap = new trulia.maps.Map('places_module_map', mapOptions, true);
      trulia.places.exploremap.config.navigationControl = false;
      trulia.places.exploremap.init();

      if (trulia.location && trulia.location.version === 'city')
      {
        geocoder.geocode(
          { address: the_city + ', ' + the_state },
          function(results, status)
          {
            trulia.places.exploremap.center(results[0].geometry.location);
          }
        );
      }

      if (typeof(_DETAILS_PROPERTY_ID) !== 'undefined' && typeof(_PROPERTY_TYPE) !== 'undefined')
      {
        trulia.places.exploremap.primaryMarker(new trulia.maps.PropertyMarker(trulia.places.exploremap, {
          id: _DETAILS_PROPERTY_ID,
          y: _CENLAT,
          x: _CENLONG,
          t: _PROPERTY_TYPE,
          s: the_state_code,
          u: '#'
        }, {
          dynamic: true,
          large: false,
          panda: true
        }));
      }
    

      /*
        Different Places Module map behaviors are here.
        How we handle StreetView, how we handle the Location Home page city dots, etc.
      */

      if (trulia.page_name == 'location_home') {
        var city_lowres = [
          { name:'Albuquerque', location:{ lat:35.08418, lng:-106.648639} },
          // { name:'Arlington', location:{ lat:32.7356, lng:-97.107719} },
          { name:'Atlanta', location:{ lat:33.748315, lng:-84.391109} },
          { name:'Austin', location:{ lat:30.267605, lng:-97.742984} },
          // { name:'Baltimore', location:{ lat:39.290555, lng:-76.609604} },
          { name:'Boston', location:{ lat:42.358635, lng:-71.056699} },
          { name:'Charlotte', location:{ lat:35.2225, lng:-80.837539} },
          { name:'Chicago', location:{ lat:41.88415, lng:-87.632409} },
          // { name:'Cleveland', location:{ lat:41.504365, lng:-81.690459} },
          // { name:'Colorado Springs', location:{ lat:38.83345, lng:-104.821814} },
          // { name:'Columbus', location:{ lat:39.96196, lng:-83.002984} },
          { name:'Dallas', location:{ lat:32.778155, lng:-96.795404} },
          { name:'Denver', location:{ lat:39.74001, lng:-104.992259} },
          { name:'Detroit', location:{ lat:42.331685, lng:-83.047924} },
          // { name:'El Paso', location:{ lat:31.759165, lng:-106.487494} },
          // { name:'Fort Worth', location:{ lat:32.74863, lng:-97.329249} },
          // { name:'Fresno', location:{ lat:36.740685, lng:-119.785734} },
          // { name:'Honolulu', location:{ lat:21.30477, lng:-157.857614} },
          // { name:'Houston', location:{ lat:29.76045, lng:-95.369784} },
          { name:'Indianapolis', location:{ lat:39.76691, lng:-86.149964} },
          { name:'Jacksonville', location:{ lat:30.33138, lng:-81.655799} },
          { name:'Kansas City', location:{ lat:39.10296, lng:-94.583062} },
          { name:'Las Vegas', location:{ lat:36.171915, lng:-115.139974} },
          // { name:'Long Beach', location:{ lat:33.766725, lng:-118.192399} },
          { name:'Los Angeles', location:{ lat:34.05349, lng:-118.245319} },
          // { name:'Louisville', location:{ lat:38.25486, lng:-85.766404} },
          { name:'Memphis', location:{ lat:35.14968, lng:-90.048929} },
          // { name:'Mesa', location:{ lat:33.417045, lng:-111.831459} },
          { name:'Miami', location:{ lat:25.728985, lng:-80.237419} },
          // { name:'Milwaukee', location:{ lat:43.04181, lng:-87.906844} },
          { name:'Minneapolis', location:{ lat:44.979035, lng:-93.264929} },
          // { name:'Nashville', location:{ lat:36.167783, lng:-86.778365} },
          { name:'New York', location:{ lat:40.71455, lng:-74.007124} },
          // { name:'Oakland', location:{ lat:37.805065, lng:-122.273024} },
          // { name:'Oklahoma City', location:{ lat:35.472015, lng:-97.520354} },
          // { name:'Omaha', location:{ lat:41.260675, lng:-95.940469} },
          // { name:'Philadelphia', location:{ lat:39.95227, lng:-75.162369} },
          { name:'Phoenix', location:{ lat:33.44826, lng:-112.075774} },
          { name:'Portland', location:{ lat:45.511795, lng:-122.675629} },
          // { name:'Raleigh', location:{ lat:35.78551, lng:-78.642669} },
          // { name:'Sacramento', location:{ lat:38.579065, lng:-121.491014} },
          // { name:'San Antonio', location:{ lat:29.42449, lng:-98.494624} },
          // { name:'San Diego', location:{ lat:32.715695, lng:-117.161719} },
          { name:'San Francisco', location:{ lat:37.777125, lng:-122.419644} },
          // { name:'San Jose', location:{ lat:37.038475, lng:-121.885794} },
          { name:'Seattle', location:{ lat:47.60356, lng:-122.329439} },
          // { name:'Tucson', location:{ lat:32.221553, lng:-110.969754} },
          // { name:'Tulsa', location:{ lat:36.149745, lng:-95.993334} },
          // { name:'Virginia Beach', location:{ lat:36.75502, lng:-76.059204} },
          { name:'Washington DC', location:{ lat:38.59037, lng:-77.031959} }
        ];

        trulia.places.exploremap.listen('tilesloaded', function () {
          var map = trulia.places.exploremap.getMap();
          if (map.getZoom() > 5) {
            return;
          }

          trulia.places.nationalLayer = explore.layerCreator.national.points(map, { label: '#places_city_label' }, trulia.places.explorelabels);

          var counties = { 
            type: 'FeatureCollection',
            features : []
          };

          for (var i = 0; i < city_lowres.length; i++) {
            var city = city_lowres[i];
            var cityPoint = {
              geometry: {
                type: 'Point',
                coordinates: [city.location.lng, city.location.lat]
              },
              type: 'Feature',
              properties: {
                name: city.name
              }
            };

            counties.features.push(cityPoint);
          }

          trulia.places.nationalLayer.json(counties);
        }, true);
      }

      // handle street view for certain places modules
      trulia.places.exploremap.listen('maptypeid_changed', function () {
        // TruliaStreet defined in maps.v3.core.js
        if (trulia.places.exploremap.getMap().getMapTypeId() === 'TruliaStreet')
        {
          trulia.maps.loader.onload('streetview', function () {
            var streetView = trulia.places.exploremap.getStreetView(),
                visibleListener;
    
            // invoke street view if available
            streetView.available(propertyCoords, 50, function () {
              $placesMapModule.find('.places_module_panel').fadeOut();
              streetView.position(propertyCoords);
              streetView.visible(true, true);
              setTimeout(function () {
                streetView.orientateToLatLng(propertyCoords);
              }, 1000);
              // debounced mousemove for smoother street view experience
              trulia.places.explorelabels.attachMouseMove(250);
              trulia.places.explorelabels.clearDetail();
  
              visibleListener = google.maps.event.addListener(streetView.getPanorama(), 'visible_changed', function () {
                if (!streetView.getPanorama().getVisible())
                {
                  trulia.places.exploremap.getMap().setMapTypeId(getCookie('rememberMapType') || 'TruliaMap');
                  google.maps.event.removeListener(visibleListener);
                  $placesMapModule.find('.places_module_panel').fadeIn();
                  // undebounced mousemove for smoother map info window experience
                  trulia.places.explorelabels.attachMouseMove();
  
                  // refresh the map view and show the detail window if we have one
                  google.maps.event.trigger(trulia.places.exploremap.getMap(), 'dragend');
                }
              });
            });
          }, true);
        }
        else if (trulia.places.exploremap.getMap().getMapTypeId())
        {
          // we don't remember street view
          setCookie("rememberMapType", trulia.places.exploremap.mapType());
        }
      });
  
      trulia.places.exploremap.listen('tilesloaded', function () {
        $(document).trigger('placesMapReady');
      }, true);
  
      $placesMapModule.find('.polygon_overlays').delegate('.overlay_checkbox', 'change', function () {
        if($(this).is(':checked'))
        {
          trulia.places.showPolygon($(this).val());
        }
        else
        {
          trulia.places.hidePolygon($(this).val());
        }
      });



      initLayers();

    }, true);
  }

  function initLayers(options) {
    // load all the layers, heatmaps, points, etc
    // hook them up to the tab interface
    var configLabels = {    
      // hover html template 
      hoverLabelTemplate: '<div class="infowindow_frame">' + 
          '<div class="f11 clearfix hoverwindow_titlebar">' + 
            '<div class="hoverwindow_address">{titletext}</div>' + 
          '</div><div class="pad5 clearfix infowindow_contents">{details}' + 
          '</div><span class="stem_border"></span><span class="stem"></span></div>',
      
      infoWindowTemplate: '<div class="infowindow_frame">' + 
          '<div class="f11 clearfix hoverwindow_titlebar">' + 
            '<div class="hoverwindow_address">{titletext}</div>' + 
            '<a id="iw_close" href="#" rel="nofollow" class="imgsheet popup_closer_iw" onclick="return false"></a>' + 
          '</div><div class="pad5 clearfix infowindow_contents">{details}' + 
          '</div><span class="stem_border"></span><span class="stem"></span></div>',
      
      detailInfoTemplate: '<div class="">{details}</div>',
      
      selectors: {
        infoWindowID: '#places_info_window',
        hoverLabelID: '#places_hover_label',
        detailInfoID: '#places_detail_info',
        detailInfoContainerID: '#places_detail_info_container',
        infoWindowCloseID: '#iw_close'
      }
    };
    
    var config = {
      // where the various ui elements are on the page
      selectors: {
        tabsContainerID: '#tabs_datasets',
        attributionID: '#places_map_module_attribution',
        dataPickerID: '#tabs_datasets .panel_selection',
        panelSelectionID: '#places_map_module .panel_selection',
        locationButtonID: '#local_info_button',
        mapContainerID: '#places_module_map_container',
        googleMapID: '#places_module_map',
        titleShuffleID: '.large_search_cta .shufflable',
        initialTab: '#' + $('#places_map_module .panel_selection').first().attr('id')
      }
    };

    // page specific selectors
    switch (trulia.page_name) {
      case 'location_home':
        config.selectors.locationSearchID = '#places_location_search';
        config.selectors.locationDropdownID = '#places_suggestion_dropdown';
        config.selectors.searchInputID = '#search';
        config.selectors.zoomCTAID = '#places_module_zoom';

        // set crimes as default tab for location home now
        config.selectors.initialTab = '#dataset_crimes';
        break;
    }

    // round the top and bottoms
    $("#tabs_datasets .panel_selection").first().addClass('panel_selection_top');
    $("#tabs_datasets .panel_selection").last().addClass('panel_selection_bottom');

    // ui.labels.js
    trulia.places.explorelabels = explore.labels(configLabels, trulia.places.exploremap.map);
    
    // flags for customizing layers on different pages
    var isLocationPage = trulia.page_name.match(/^location_/) || trulia.location;

    /*
        Binding the layers to the ui and labels
        Populating based on the options object
        If there is no options object, push all the layers
        If there is, go based on options.showCrimes, etc
    */
    var layers = {
      datasets: []
    };

    $(config.selectors.panelSelectionID).each(function(i, e) {
      var values = e.id.split('_');
      if (values[0] == 'dataset') {
        var dataset = values[1];

        // add the dataset
        layers.datasets.push(dataset);

        var layer = {};
        layer.name = dataset;
        layer.selector = '#' + e.id;

        // add the dataset layer object
        switch (dataset) {
          case 'comparables':
            layer.points = true;
            if (isLocationPage)
              layer.aggregate = !isLocationPage;

            if (isLocationPage)
            {
              layer.url = site_root + '_ajax/Location/LocalComps/get_comps/?b={bounds}';

              layer.urlFormatter = explore.urlFormatter;
            }
            break;

          case 'map':
            layer.name = null;
            break;

          case 'crimes':
            layer.heatmap = true;
            layer.points = true;

            // flag to update below the map table  
            layer.aggregate = true;

            // turning crime layers on and off
            layer.layersToggle = '#toggle_crimes_layers label';

            // filtering crimes by category
            layer.categoryToggle = '#toggle_crimes_categories label';

            layer.attribution = '<div class="fleft">Data provided by <a class="underline" rel="nofollow" href="http://SpotCrime.com">SpotCrime.com</a> and <a class="underline" rel="nofollow" href="http://CrimeReports.com">CrimeReports.com</a></div><div class="fright"><a href="http://crimereports.com" rel="nofollow" class="underline" >Provide Tips</a> to the police.</div>';
            break;

          case 'schools':
            layer.polygons = true;
            layer.points = true;

            // flag to update below the map table            
            layer.aggregate = !isLocationPage;

            // turning school layers on and off
            layer.layersToggle = '#toggle_schools_layers label';

            layer.attribution = 'School data provided by OnBoard Informatics. School boundaries provided by Maponics. Please read <a rel="nofollow" class="maponics_disclaimer underline" href="#">Disclaimer</a>.';
            break;

          case 'amenities':
            layer.points = true;

            // flag to update below the map table
            layer.aggregate = !isLocationPage;

            layer.categoryToggle = '#toggle_amenities_categories label';
            layer.attribution = '<div class="fleft">Amenity information provided by </div>' + 
              '<div class="fleft"><a href="http://yelp.com" target="new" class="pdp_imgsheet yelp38">&nbsp;</a></div>';
            break;
        }

        // larger table size for location pages
        if (isLocationPage)
        {
          layer.tableSize = 100;
        }

        layers[dataset] = layer;
      }

    });

    explore.createLayers(trulia.places.exploremap, layers, trulia.places.explorelabels);
          
    // ui.js
    trulia.places.exploreui = explore.ui(config.selectors, layers, trulia.places.exploremap.map);

    // set the initial tab
    if ($(config.selectors.panelSelectionID).length && trulia.page_name != 'location_home')
    {
      if (window.location.hash === '#details_nearby_schools_module')
      {
        trulia.places.exploreui.tab('#dataset_schools');
      }
      else
      {
        trulia.places.exploreui.tab(config.selectors.initialTab);
      }
    }

    // if there is a hash, try to geocode it
    if (trulia.page_name == 'location_home' && window.location.hash) {
      var slugs = window.location.hash.split('/'),
          locationSlug = slugs.pop();

      trulia.places.exploreui.selectLocation(locationSlug.split('-').join(' '), slugs[0].length > 1 ? slugs[0].replace('#', '#dataset_') : null); 
    }
    else if (trulia.page_name == 'location_home' && !window.location.hash) {
      explore.titleShuffler.initialize(config.selectors.titleShuffleID);
      explore.titleShuffler.start();
    }

    $('#places_module_map').removeClass('loading');
  }


  // only pdp has street view
  if (trulia.page_name == 'details')
  {
    trulia.maps.loader.onload('core,streetview', function () {
      propertyCoords = trulia.maps.LatLng(_CENLAT, _CENLONG);
      sv = new trulia.maps.StreetView(null, null);
      sv.available(propertyCoords, 50,
        function () {
          initMap({
            streetview: trulia.pdp.streetViewBlocked !== true
          });
        },
        function () {
          initMap();
        });
      }, true);
  }
  else
  {
    initMap({
      locationPage: isLocationPage
    });
  }

  $('.maponics_disclaimer').live('click', function (event) {
    show_generic_popup("Information about School Boundaries", 'Information regarding school boundaries, attendance and other demographics changes frequently. The school boundary, attendance and other demographic information provided on the Site is compiled from various sources and is for general informational purposes only. You should not use such information in determining the legal eligibility to attend any particular school or school system, or to use or benefit from any other services provided by or on behalf of any city, town, county, state or other governmental entity, or any other service dependent upon residence within a given geographical area.', 'Ok');
    event.preventDefault();
  });
});

explore = explore || {};

explore.titleShuffler = function() {
  var self = {};

  var places = ['San Francisco', 'Chicago', 'New York City', 'Miami', 'Albuquerque', 'Austin', 'Las Vegas', 'Houston', 'Atlanta', 'Los Angeles', 'Seattle', 'Philadelphia', 'Boston'];

  var datasets = [
    { 
      value: '#dataset_schools',
      text: 'Schools'
    },
    { 
      value: '#dataset_amenities',
      text: 'Groceries'
    },
    { 
      value: '#dataset_amenities',
      text: 'Restaurants'
    },
    { 
      value: '#dataset_crimes',
      text: 'Crimes'
    },
    { 
      value: '#dataset_amenities',
      text: 'Banks'
    }
  ];

  var placeIndex = null, datasetIndex = null, dataIndexCounter = -1;
  var interval = null, timeout = null;
  var selector = null;

  self.initialize = function(s) {
    selector = s;
    if (!selector) return;

    $(selector).click(function(e) {
      var html = e.target.innerHTML;
      var loc = places[placeIndex];
      var tab = datasets[datasetIndex].value;
      trulia.places.exploreui.selectLocation(loc, tab);

      // only have the title be clickable once
      self.kill();
    });

    // pause on mouseover, restart otherwise
    $(selector).mouseover(self.stop).mouseout(self.start);  
  };

  self.kill = function() {
    self.stop();
    $(selector).unbind("click");
    $(selector).unbind("mouseout");
    $(selector).unbind("mouseover");
    selector = null;
  };

  self.start = function() {
    if (!selector) return;
    
    interval = setInterval(self.shuffle, 5000);
  };

  self.stop = function() {
    clearInterval(interval);
    if (timeout) {
      clearTimeout(timeout); 
    }
  };

  self.shuffle = function() {
    if (!selector) return;

    $(selector).fadeOut();
    timeout = setTimeout(function() {
      placeIndex = Math.floor(Math.random() * .99 * places.length);

      dataIndexCounter += Math.floor(Math.random() * 1.5) + 1;
      datasetIndex = dataIndexCounter % datasets.length;

      var text = datasets[datasetIndex].text + ' in ' + places[placeIndex];
      $(selector).html(text).fadeIn();
    }, 600);
  };

  return self;
}();
/*jshint browser: true, jquery: true, indent: 2, white: true, curly: true, forin: true, noarg: true, immed: true, newcap: true, noempty: true, trailing: false */
/*globals trulia:true, google, _, site_root, _CENLONG, _CENLAT, explore:true, Mustache*/

// adding explore ui functions
explore = explore || {};

// explore.ui houses all of the view changing functions
explore.ui = function (selectors, layers, map) {
    var self = {},
        currentTab = '',
        currentLayer = '',
        $localModule = $('#local_info'),
        altCityMap = {
          'Manhattan,NY': 'New York'
        },
        $errorContainer,
        $locationButton = $(selectors.locationButtonID),
        country;

    // hook up the search button next to the address input
    if (selectors.searchInputID) {
      $(selectors.searchInputID).click(function () {
        var val = $(selectors.locationSearchID).val();
        self.selectLocation(val);
      });
    }

    // listen to pressing enter as well
    if (selectors.locationSearchID) {
      $(selectors.locationSearchID).keypress(function(e) {
        // enter
        if (e.keyCode == 13) {

          var val = $(selectors.locationSearchID)[0].value;
          self.selectLocation(val);
        }
      });
    }

    if (selectors.zoomCTAID) {
      $(selectors.zoomCTAID).live('click', function() {
        var map = trulia.places.exploremap.getMap();
        map.setZoom(map.getZoom() + 1);
      });
    }

    // show suggestions for place names
    if (selectors.locationDropdownID) {
      // suggestion dropdown behavior
      $(selectors.locationSearchID).focus(function(e) {
        $(this).closest('.search_main_background').toggleClass('places_soft_shadow', false);
        $(selectors.locationDropdownID).fadeIn();
        $(selectors.tabsContainerID).hide();
        hideSearchError();
      });

      $(selectors.locationSearchID).blur(function(e) {
        $(this).closest('.search_main_background').toggleClass('places_soft_shadow', true);
        $(selectors.locationDropdownID).fadeOut();
        if (trulia.location && trulia.location.version)
        {
          $(selectors.tabsContainerID).show();
        }
      });

      $(selectors.locationDropdownID + ' li').click(function(e) {
        var val = e.target.innerHTML;
        if (val.split(' in ').length > 1) {
          val = val.split(' in ').pop();
        }

        $(selectors.locationSearchID).val(val);
        self.selectLocation(val);
      });
    }

    function showSearchError (message) {
      if (!$errorContainer) {
        $errorContainer = $('<div class="searchErrorBubble"><div class="stem"></div><span></span></div>');
        $errorContainer.prependTo(selectors.searchInputID);
      }
      $errorContainer.find('span').text(message);
      $errorContainer.show();
      setTimeout(hideSearchError, 3000);
    };

    function hideSearchError () {
      if ($errorContainer)
      {
        $errorContainer.fadeOut();
      }
    };

    self.selectLocation = function(location, optionalTab) {
      $locationButton.hide();
      if (!location)
      {
        showSearchError('Sorry, please enter a city, zip, neighborhood, or address');
        return;
      }

      // clear the location since we're going to look it up
      trulia.location = {};

      // geocode the input value
      explore.geocode(location, function(r) {
        // center on the result
        var result,
            borough,
            i;

        for (i = 0; i < r.length; i++)
        {
          if (r[i].types[0] === 'postal_code')
          {
            trulia.location.version = 'zip';
            break;
          }
          else if (r[i].types[0] === 'neighborhood')
          {
            trulia.location.version = 'neighborhood';
            break;
          }
          else if (r[i].types[0] === 'locality' || r[i].types[0] === 'sublocality' || r[i].types[0] === 'street_address')
          {
            trulia.location.version = 'city';
            break;
          }
        }

        if (!trulia.location.version)
        {
          showSearchError('Sorry, please enter a city, zip, neighborhood, or address.');
          return;
        }
        result = r[i];

        // get location info from geocoder
        _.each(result.address_components, function (info) {
          if (!info.types)
          {
            return;
          }

          switch(info.types[0])
          {
            case 'locality':
              // city
              trulia.location.city = info.long_name;
              break;
            case 'administrative_area_level_1':
              // state
              trulia.location.state = info.short_name;
              break;
            case 'neighborhood':
              trulia.location.neighborhood = info.short_name;
              trulia.location.ll = result.geometry.location.toUrlValue();
              break;
            case 'postal_code':
              trulia.location.zip = info.short_name;
              break;
            case 'sublocality':
              // borough
              borough = info.long_name;
              break;
            case 'country':
              country = info.short_name;
              break;
          }
        });

        trulia.places.hidePolygon('zipcode');
        trulia.places.hidePolygon('neighborhood');

        if (trulia.location.version === 'zip')
        {
          trulia.places.zip = trulia.location.zip;
          trulia.places.showPolygon(trulia.location.version, true);
        }
        // ^ neighborhood version done in layers.config because we need to wait for the callback

        if (country !== 'US')
        {
          // we don't support other countries
          showSearchError('Sorry, please enter a US city, zip, neighborhood, or address');
          trulia.location = {};
          $locationButton.hide();
          return;
        }

        // Yay! we have a valid location at this point

        // to handle nyc boroughs that should be mapped to a city search (ie Manhattan -> NY)
        if (borough && altCityMap[borough + ',' + trulia.location.state])
        {
          trulia.location.city = altCityMap[borough + ',' + trulia.location.state];
        }
        else if (borough)
        {
          trulia.location.city = borough;
        }

        // on location home we hide labels in national view, so switch them back if we zoom in
        if (map.getMapTypeId() == 'TruliaMapNoLabels') 
        {
          map.setMapTypeId('TruliaMap');
        }

        if (map.getZoom() == 13) {
          map.panTo(result.geometry.location);
        } else {
          map.setOptions({
            center: result.geometry.location,
            zoom: 13,
            minZoom: 12
          });  
        }

        switch(trulia.location.version)
        {
          case 'city':
            $locationButton.show();
            $locationButton.find('a').attr('href', site_root + 'real_estate/' + encodeURIComponent(trulia.location.city.replace(/\s/g, '_')) + '-' + _STATES[trulia.location.state].replace(/\s/g, '_') + '/');
            // $locationButton.find('span').text(trulia.location.city + ' Local Info');
            $(selectors.locationSearchID).val(trulia.location.city + ', ' + trulia.location.state);
            break;
          case 'neighborhood':
            // this will be shown once we get a response from ajax. hacky, but geocoder doesn't give us a nhid
            $locationButton.find('a').attr('href', site_root + 'real_estate/' + encodeURIComponent(trulia.location.neighborhood.replace(/\s/g, '_')) + '-' + encodeURIComponent(trulia.location.city.replace(/\s/g, '_')) + '/');
            // $locationButton.find('span').text(trulia.location.neighborhood + ' Local Info');
            $(selectors.locationSearchID).val(trulia.location.neighborhood + ', ' + trulia.location.city);
            break;
          case 'zip':
            $locationButton.show();
            $locationButton.find('a').attr('href', site_root + 'real_estate/' + trulia.location.zip + '-' + encodeURIComponent(trulia.location.city.replace(/\s/g, '_')) + '/');
            // $locationButton.find('span').text(trulia.location.zip + ' Local Info');
            $(selectors.locationSearchID).val(trulia.location.zip);
            break;
          default:
            
            $locationButton.hide();
        }

        if (window.location.hash) {
          self.updateHash(); 
        }

        // set initial tab condition
        if (!$(selectors.tabsContainerID).is(":visible")) { 
          $(selectors.tabsContainerID).show(10, function () {
            self.tab(optionalTab || selectors.initialTab);
          });
        }

        $(selectors.locationDropdownID).hide();
        $(selectors.locationSearchID).blur();

        if (trulia.places.nationalLayer) {
          trulia.places.nationalLayer.detach();
          trulia.places.explorelabels.hide();
        }

        if (selectors.titleShuffleID) {
          $(selectors.titleShuffleID).html('Local Info in ' + trulia.location.city);
          explore.titleShuffler.kill();
        }
      });
    }

    /* 
      Clicking on different tabs, Crime Schools, etc
      Runs self.tab() to actually switch datasets
    */
    $(selectors.dataPickerID).click(function(e) {
        var id = e.currentTarget.id;
        o_track_ql_click('PlacesLayer|' + id, null, true);
        self.tab('#' + id);
    });

    /*
      Hook up Layers Toggles if there are any 
      That is, a check box that turns on and off a layer
    */
    var bindLayerToggles = function() {

      for (var i = 0; i < layers.datasets.length; i++) {
        var dataset = layers[layers.datasets[i]];

        if (dataset.layersToggle) {

          // bind the layersToggle id
          $(dataset.layersToggle).change(function(e) {
            
            var id = e.currentTarget.id;
  
            // grab the checkbox and flip it
            var checkbox = $('#' + id + ' input')[0];
  
            // assuming ids are in the format "#toggle_schools_points"
            // this is probably not a good assumption to make,
            // but allows us to generalize for all layers
            var layerProperties = id.split('_');
            if (layerProperties.length != 3) {
              return;
            }
  
            // if we have both of these, we can call layers.dataset.layer.toggle(true/false)
            // eg layers.schools.points.toggle(false)
            var dataset = layerProperties[1],
              layer = layerProperties[2];
            
            if (layers[dataset] && layers[dataset][layer]) {
              layers[dataset][layer].toggle(checkbox.checked);
            }
          });
        }
      }
    };
    bindLayerToggles();

    /* 
      Hook up Category Toggles if there are any
      That is, a check box to turn on and off features of a certain type

    */
    var bindCategoryToggles = function () {
      for (var i = 0; i < layers.datasets.length; i++) {
        var dataset = layers[layers.datasets[i]];

        // only do category toggling for points layers for now
        if (!dataset || !dataset.categoryToggle || !dataset.points) {
          continue;
        }

        $(dataset.categoryToggle).change(function() {          
          var points = dataset.points;
          var selector = dataset.categoryToggle;
          var inputSelector = selector + ' input';
          var dataName = dataset.name;

          return function(e) {
            var categories = {};
            var id = e.currentTarget.id;

            // grab the checkbox and flip it
            var checkbox = $('#' + id + ' input')[0];

            // handle the all checkbox
            if (id == 'toggle_' + dataset.name + '_all') {
              categories['all'] = checkbox.checked;
              $(inputSelector).each(function(i, e) {
                  e.checked = categories['all'];
              });
            } else {
              categories['all'] = null;
                  
              // populate the categories filter
              $(selector).each(function(i, e) {
                var layerProperties = e.id.split('_');
                if (layerProperties.length != 3) {
                  return;
                }
                
                var categoryBox = $('#' + e.id + ' input')[0];

                // edit the name, 'toggle_crimes_assault' to 'assault'
                // multiple word categories have to be concatted
                var category = layerProperties.pop().toLowerCase();
                categories[category] = categoryBox.checked;
              });
            }
            
            layers[dataName].points.filter(categories);  
            layers[dataName].points.idle()();
          };
        }());
      }
    };
    bindCategoryToggles();
    
    // exposed public function to manually flip to different tabs like: '#datasetCrimes'
    self.tab = function(t) {
      if (!arguments.length) {
          return currentTab;
      }

      // ignore if it's the current tab
      if (t == currentTab) {
          return;
      }

      $(selectors.dataPickerID).removeClass("data_selected").find('.sub_filter').hide();
      $(t).addClass("data_selected").find('.sub_filter').show();

      $(t + ' input')[0].checked = true;

      currentTab = t;
      
      for (var i = 0; i < layers.datasets.length; i++) {
        var layerName = layers.datasets[i];
        var dataset = layers[layerName];
        
        for (var p in dataset) {
          // toggle each dataset based on the currentTab
          if (dataset[p] && dataset[p].toggle) {
            var layer = dataset[p];
            
            layer.toggle( dataset.selector == currentTab );   

            // set the current layer
            if (dataset.selector == currentTab) {
              var attribution = dataset.attribution || '';

              $(selectors.attributionID).html(attribution).toggle(attribution !== '');
              $(selectors.mapContainerID).css('bottom', attribution === '' ? '0':'20px');

              if (trulia.page_name == 'location_home' && is_IE7()) 
              {
                // IE7 height:100% not working for liquid height
                var bodyHeight = $('body').height();
                var mapHeight = attribution ? (bodyHeight - 145) + 'px' : (bodyHeight - 125) + 'px';
                $(selectors.googleMapID).css('height', mapHeight);
              }
            }
          }
        }
      }

      // TODO - referencing out to explorelabels, not sure if that's good
      trulia.places.explorelabels.clear();

      // don't clear the detail legend unless it's comparables tab or map tab
      if (currentTab == '#dataset_map') {
        trulia.places.explorelabels.clearDetail();  
      }

      // offset the infowindow position
      trulia.places.explorelabels.verticalOffset = currentTab == '#dataset_crimes' ? 0 : 10;

      if (trulia.page_name == 'location_home') {
        self.updateHash();
        trulia.places.explorelabels.verticalOffset += 170;        
      }

      google.maps.event.trigger(trulia.places.exploremap.getMap().getDiv(), 'close_all_infowindows');

      // switch tabs on layer change
      if (trulia.pdp.changeLocationTab) {
        trulia.pdp.changeLocationTab(t.replace('#dataset_', '')); 
      }

      // the pdp local info table may be hidden if there are no comps or schools because we don't want to load this data onload
      if (dataset === 'dataset_amenities' || dataset === 'dataset_crimes')
      {
        $localModule.removeClass('hidden');
      }

      return self;
    };

    self.updateHash = function() {
        // update the hash based on the search result
        window.location.hash = self.tab().split('_').pop() + '/' + explore.slug($(selectors.locationSearchID).val());

        return self;
    };

    self.layer = function(l) {
        if (!arguments.length) {
            return currentLayer;
        }

        currentLayer = l;
        return self;
    };

    return self;
};

if (!trulia.pdp) {
  trulia.pdp = {};
}

trulia.places = (function () {
  var places = {},
      nhPoly = {},
      zipPoly = {},
      zoomBounds,
      tableContents = {},
      tableTemplates = {
        amenities: '<table cellspacing="0" cellpadding="0" border="0" width="100%" class="pdptable places_table">' +
          '<thead>' +
          '<tr>' +
            '<th class="first" width="170">Place Name</th>' +
            '<th class="first" width="110">Type</th>' +
            '<th class="first" width="200">Reviews</th>' +
            '<th class="first">Location</th>' +
          '</tr>' +
          '</thead>' +
          '{{#items}}<tr>' +
            '<td class="first"><div class="truncate place_name" title="{{name}}"><a href="{{url}}" target="_blank">{{name}}</a></div></td>' +
            '<td class="first"><div class="truncate place_type" title="{{categories}}">{{categories}}</div></td>' +
            '<td class="first"><img src="{{rating_img_url}}"/> <span class="f11 grey">{{review_count}} reviews</span></td>' +
            '<td class="first"><div class="truncate place_location" title="{{address1}} {{address2}}">{{address1}} {{address2}}</div></td>' +
          '</tr>{{/items}}' +
          '</table>',
        crimes: '<table cellspacing="0" cellpadding="0" border="0" width="100%" class="pdptable places_table">' +
        '<thead>' +
        '<tr>' +
          '<th class="first" width="80">When?</th>' +
          '<th class="first" width="80">Type</th>' +
          '<th class="first">Description</th>' +
          //'<th class="first">Location</th>' +
        '</tr>' +
        '</thead>' +
        '{{#items}}<tr>' +
          '<td class="first"><div class="truncate place_type">{{date}}</a></div></td>' +
          '<td class="first"><div class="truncate place_type" title="{{category}}">{{category}}</div></td>' +
          '<td class="first"><div class="truncate place_long" title="{{description}}">{{{description}}}</div></td>' +
          //'<td class="first"><div class="truncate place_location" title="{{intersection_id}}">{{intersection_id}}</div></td>' +
        '</tr>{{/items}}' +
        '</table>'
      };

  places.tableFields = {
      amenities: {},
      crimes: {}
    };

  places.nhid = '';
  places.zip = '';
  places.exploreui = {};
  places.explorelabels = {};

  function extendZoomBounds(latLngCoords)
  {
    _.each(latLngCoords, function (coord) {
      zoomBounds.extend(coord);
    });
  }

  places.showPolygon = function (type, fitMap)
  {
    var fitMap = fitMap === true;

    zoomBounds = new google.maps.LatLngBounds();

    if (type === 'neighborhood' && places.nhid !== '')
    {
      if (!nhPoly[places.nhid])
      {
        trulia.maps.GIS.neighborhood(places.nhid, extendZoomBounds, function(latLng) {
          nhPoly[places.nhid] = {
            bounds: zoomBounds,
            poly: new trulia.maps.Polygon(latLng, {strokeColor: '#666666', fillColor: '#666666', strokeWeight: 2}, trulia.places.exploremap)
          }

          if (fitMap)
          {
            trulia.places.exploremap.getMap().fitBounds(nhPoly[places.nhid].bounds);
          }
        });
      }
      else
      {
        trulia.places.exploremap.addPolygon(nhPoly[places.nhid].poly);

        if (fitMap)
        {
          trulia.places.exploremap.getMap().fitBounds(nhPoly[places.nhid].bounds);
        }
      }
    }
    else if (places.zip !== '')
    {
      if (!zipPoly[places.zip])
      {
        trulia.maps.GIS.zip(places.zip, extendZoomBounds, function(latLng) {
          zipPoly[places.zip] = {
            bounds: zoomBounds,
            poly: new trulia.maps.Polygon(latLng, {strokeColor: '#444444', fillColor: '#444444', strokeWeight: 2}, trulia.places.exploremap)
          }

          if (fitMap)
          {
            trulia.places.exploremap.getMap().fitBounds(zipPoly[places.zip].bounds);
          }
        });
      }
      else
      {
        trulia.places.exploremap.addPolygon(zipPoly[places.zip].poly);

        if (fitMap)
        {
          trulia.places.exploremap.getMap().fitBounds(zipPoly[places.zip].bounds);
        }
      }
    }
  };

  places.hidePolygon = function (type)
  {
    if (type === 'neighborhood' && nhPoly[places.nhid] && nhPoly[places.nhid].poly)
    {
      nhPoly[places.nhid].poly.remove();
    }
    else if (type === 'zipcode' && zipPoly[places.zip] && zipPoly[places.zip].poly)
    {
      zipPoly[places.zip].poly.remove();
    }
  };

  places.populateTable = _.debounce(function (selector, type, items, content) {
    var html = '',
        $container = $(selector);

    if ($container.length < 1)
    {
      return;
    }

    if (tableTemplates[type] && _.size(items) > 0)
    {
      html = Mustache.to_html(tableTemplates[type], { items : _.map(items, function (val) { return val; }) });
    }
    else if (typeof(content) !== 'undefined')
    {
      html = content;
    }
    else
    {
      html = '<div class="mart5 marb5 grey">No ' + type + ' found.</div>';
    }
    tableContents[type] = html;
    $container.html(html);
    delete trulia.places.tableFields[type].items;
  }, 1000);

  return places;
}());


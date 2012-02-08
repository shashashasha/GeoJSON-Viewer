// adding explore ui functions
explore = explore || {};

/*
    UI methods for hoverlabels and infowindows (clicked)
    showing, hiding, updating position
    
    options contains template strings for content html
    as well as selector ids for hoverLabel and infoWindow
*/
explore.labels = function(options, map) {
    var self = {},
        infoLayer = new google.maps.OverlayView(),
        mapTop = $(map.getDiv()).offset().top,
        titleURLTemplate = '<a target="_top" class="whitecolortxtlink fleft pad5 padl10 f14 bold" data-index="48" href="{url}">{title}</a>',
        titleTemplate = '<div class="ellipsized whitecolortxtlink fleft pad5 padl10 f14 bold" >{title}</div>';

    // default vertical offset of the infowindow
    self.verticalOffset = 0;
    
    self.hoverLabelData = null;
    self.infoWindowData = null;

    // the feature the infowindow is on
    self.infoWindowFeature = null;

    self.hover = $(options.selectors.hoverLabelID);
    self.info  = $(options.selectors.infoWindowID);
    self.detail  = $(options.selectors.detailInfoID);
    self.detailContainer  = $(options.selectors.detailInfoContainerID);
    
    self.hide = function() {
        self.hover.hide();

        if (otherLabels.length) {
            for (var name in otherLabels) {
                var label = otherLabels[name];
                if (label.hide) {
                    label.hide();
                }
            }
        }
        
        return self;
    };
    
    self.clear = function() {
        // clear data
        self.infoWindowData = null;
        self.info.hide();

        // clear feature
        self.infoWindowFeature = null;

        // call external onClear function
        if (self.onClear) {
            self.onClear();
        }
        
        return self;
    };

    self.clearDetail = function() {
        self.detail.hide();
        return self; 
    };

    self.openHover = function(event, feature, data) {
        // open the infowindow based on the current hoverlabel data
        var info = trulia.places.explorelabels.hoverLabelData;

        // and grab the position from the current feature
        info.location = feature.getPosition ? feature.getPosition() : feature.getCenter();

        self.infoWindow(info); 

        // store the feature to not open duplicate hoverlabels
        self.infoWindowFeature = feature;
    };

    self.attachMouseMove = function (delay) {
      $('#places_map_module').unbind('mousemove.places');

      var updateHover = function(e) {
        var top = e.pageY - self.hover.height() - self.verticalOffset - 20;
        var left = e.pageX - 40;

        if (top < mapTop)
        {
          top = e.pageY + 40 - self.verticalOffset;
          self.hover.addClass('invert_y');
        }
        else
        {
          self.hover.removeClass('invert_y');
        }

        if ((self.hover.width() + left) > $(map.getDiv()).width())
        {
          self.hover.addClass('invert_x').css({top: top, left: (left - self.hover.width() + 80) + 'px'});
        }
        else
        {
          self.hover.removeClass('invert_x').css({top: top, left: left});
        }
      };

      if (!delay)
      {
        $('#places_map_module').bind('mousemove.places', updateHover);
      }
      else
      {
        $('#places_map_module').bind('mousemove.places', _.debounce(updateHover, delay));
      }
    }

    self.attachMouseMove();

    // given a lat lon, place the div
    var place = function(location, label) {
        var container = $(map.getDiv()),
            offset = container.offset(),
            width = container.width(),
            height = container.height(),
            p = infoLayer.getProjection().fromLatLngToContainerPixel(location);
        
        // minus the height of the infowindow
        var cy = p.y + offset.top - label.height() - 20 - self.verticalOffset;
        var cx = p.x + offset.left - 40;

        if (cy < mapTop)
        {
          cy = p.y + mapTop + 30 - self.verticalOffset;
          label.addClass('invert_y');
        }
        else
        {
          label.removeClass('invert_y');
        }

        // hide the infowindow temporarily if it goes off of the map
        if (p.x < 0 || p.y < 0 || p.x > width || p.y > height) {
          label.hide();
        } else {
          if (label.width() + cx > width)
          {
            label.addClass('invert_x').css({ top: cy + 'px', left: (cx - label.width() + 80) + 'px'}).show();
          }
          else
          {
            label.removeClass('invert_x').css({ top: cy + 'px', left: cx + 'px'}).show();
          }
        }
    };

    var setUpInfoWindow = function() {
        infoLayer.setMap(map);

        infoLayer.draw = function() {
            if (self.infoWindowData && self.infoWindowData.location) {
                place(self.infoWindowData.location, self.info);
            }

            // reduce mouseover flickering
            self.hover.hide();
        };

        google.maps.event.addListener(map, 'bounds_changed', infoLayer.draw);
        google.maps.event.addListener(map, 'drag', infoLayer.draw);
        
        // clicking on the infowindow for now clears the infowindow
        $(options.selectors.infoWindowCloseID).live('click', self.clear);
    };

    setUpInfoWindow();
    
    self.hoverLabel = function(data) {
        var hoverHTML = options.hoverLabelTemplate.replace('{title}', data.title ? data.title : ''),
            titleURL = data.trulia_url_path ? site_root + data.trulia_url_path.replace(/^\//, '') : data.url,
            titleHTML = titleURL ? titleURLTemplate.replace('{url}', titleURL).replace('{title}', data.title) : titleTemplate.replace('{title}', data.title);

        hoverHTML = hoverHTML.replace('{details}', data.details ? data.details : '');
        hoverHTML = hoverHTML.replace('{titletext}', titleHTML);
        
        self.hover.show().html(hoverHTML);

        self.hover.css('width', data.width || '280px');
        var hoverHeight = $(options.selectors.hoverLabelID + ' .infowindow_contents').height();
        self.hover.css('height', data.height ||  hoverHeight + 40 + 'px');

        self.hoverLabelData = data;
        
        return self;
    };
    
    self.infoWindow = function(data) {
        var infoHTML = options.infoWindowTemplate.replace('{title}', data.title ? data.title : ''),
            titleURL = data.trulia_url_path ? site_root + data.trulia_url_path.replace(/^\//, '') : data.url,
            titleHTML = titleURL ? titleURLTemplate.replace('{url}', titleURL).replace('{title}', data.title) : titleTemplate.replace('{title}', data.title);
        infoHTML = infoHTML.replace('{details}', data.details ? data.details : '');
        infoHTML = infoHTML.replace('{titletext}', titleHTML);
        
        self.info.show().html(infoHTML);

        self.info.css('width', data.width || '280px');
        var hoverHeight = $(options.selectors.infoWindowID + ' .infowindow_contents').height();
        self.info.css('height', data.height || hoverHeight + 40 + 'px');

        self.infoWindowData = data;

        infoLayer.draw();

        self.hide();
        
        return self;
    };

    self.detailInfo = function(data) {
        self.detailContainer.show();
        
        var detailHTML = options.detailInfoTemplate.replace('{details}', data.details);
        self.detail.show().html(detailHTML);

        var container = $(map.getDiv());
        var height = container.height();
        var margin = height - 36 - self.detail.height();
        
        self.detailContainer.css({'margin-top': margin + 'px'});
        return self;
    };

    var otherLabels = {
        length: 0
    };
    self.addLabel = function(name, selector) {
        otherLabels[name] = $(selector);
        otherLabels.length ++;
        return self;
    };

    self.updateLabel = function(name, html, css) {
        var label = otherLabels[name];

        if (html) {
          label.show().html(html);  
        }

        if (css) {
          label.css(css);
        }

        return self;
    };
    
    return self;
};
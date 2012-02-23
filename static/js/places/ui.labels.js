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
        mapID = map.getDiv().id,
        titleURLTemplate = '<a target="_top" class="whitecolortxtlink fleft pad5 padl10 f14 bold" data-index="48" href="{url}">{title}</a>',
        titleTemplate = '<div class="ellipsized whitecolortxtlink fleft pad5 padl10 f14 bold" >{title}</div>';

    var otherLabels = {
        length: 0
    };

    // default vertical offset of the infowindow
    self.verticalOffset = 0;
    
    self.hoverLabelData = null;
    self.infoWindowData = null;

    // the feature the infowindow is on
    self.infoWindowFeature = null;

    self.hide = function() {
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
        // call external onClear function
        if (self.onClear) {
            self.onClear();
        }
        
        return self;
    };

    self.attachMouseMove = function (delay) {
      var updateHover = function(e) {
        if (otherLabels['hover']) {
            var hover = otherLabels['hover'];
            var top = e.pageY + 15;
            var left = e.pageX + 15;

            hover.css({top: top, left: left });
        }
      };

      $(document).mousemove(updateHover);
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

                // reduce mouseover flickering
                if (otherLabels['hover'])
                    otherLabels['hover'].hide();
            }
        };

        google.maps.event.addListener(map, 'bounds_changed', infoLayer.draw);
        google.maps.event.addListener(map, 'drag', infoLayer.draw);
        
        // clicking on the infowindow for now clears the infowindow
        if (options.selectors && options.selectors.infoWindowCloseID)
            $(options.selectors.infoWindowCloseID).live('click', self.clear);
    };

    setUpInfoWindow();
    
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

    self.hideLabel = function(name) {
        if (otherLabels[name])
            otherLabels[name].hide();

        return self;
    };
    
    return self;
};
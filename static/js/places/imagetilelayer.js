var trulia = trulia || {};

if (!trulia.maps) {
  trulia.maps = {};
}

if (!trulia.maps.overlays) {
  trulia.maps.overlays = {};
}

trulia.maps.overlays.ImageTiles = function (map, options, customDisplayOptions) {
    var self = this;
    
    self.tileSize = new google.maps.Size(256,256);
    self.maxZoom = 19;
    self.minZoom = 10;
    self.name = options && options.name ? options.name : "ImageTiles";
    self.alt = options && options.alt ? options.alt : "ImageTiles";
    
    self.baseURL = options.url || _MAPTILE_SERVER + 'tiles/crime_heatmap/{Z}/{X}/{Y}.png';
    
    self.getTile = function(coord, zoom, ownerDocument) {
      if (zoom < self.minZoom) {
          return null;
      }

      // create elements
      var div = ownerDocument.createElement('div'),
        img = ownerDocument.createElement('img');

      // assemble the strings
      var imgURL = self.baseURL.replace('{Z}', Math.floor(zoom))
                               .replace('{X}', coord.x)
                               .replace('{Y}', coord.y);
                               
      img.src = imgURL;
      img.setAttribute("class", "heatmap_tile");
      img.style.width = this.tileSize.width + 'px';
      img.style.height = this.tileSize.height + 'px';
      img.style.borderWidth = '0px';

      // cross browser opacity (moved from details.css)
      $(img).css('opacity', options.opacity || 0.75);

      // remove the image element if it 404s, no broken image icons
      $(img).error(function(e) {
        $(this).remove();
      });

      div.appendChild(img);

      return div;
    };

    // general explore overlay functions
    // is there a way to require an 'interface' in javascript?
    
    self.toggle = function(t) {
        if (t) {
            self.attach(map);
        } else {
            self.detach(map);
        }
        return self;
    };
    
    self.attach = function(map) {
        if (map) {
            map.overlayMapTypes.insertAt(0, self);
        }
        return self;
    };
    
    self.detach = function(map) {
        if (map && map.overlayMapTypes.length) {
            map.overlayMapTypes.removeAt(0);
        }
        return self;
    };

    return self;
};

trulia.maps.overlays.ImageTiles.prototype = {}; // new google.maps.ImageMapType();
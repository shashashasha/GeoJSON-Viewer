explore = explore || {};

// shortcuts for jquery syntax stuff like showing, hiding, updating html
// centralizes animation lengths ( ex: hide(200) )
// also caches jquery selectors so hopefully is more efficient
explore.selectorView = function() {
    var view = {},
        selectorCache = {},
        selector = {};
  
    view.showID = function(id, delay) {
        selector = selectorCache[id] ? selectorCache[id] : $(id);
        
        if (delay) {
            selector.delay(delay).show(); // slideDown(200);
        }
        else {
    	    selector.show(); // slideDown(200);
        }
        
        selectorCache[id] = selector;
        
        return view;
    };

    view.hideID = function(id, delay) {
        selector = selectorCache[id] ? selectorCache[id] : $(id);
        
        if (delay) {
            selector.delay(delay).hide(); //.slideUp(200);
        }
        else {
    	    selector.hide(); // slideUp();
        }

        selectorCache[id] = selector;

        return view;
    };

    view.htmlID = function(id, html) {
        selector = selectorCache[id] ? selectorCache[id] : $(id);
        
        selector.html(html);

        selectorCache[id] = selector;
        
        return view;
    };

    return view;  
};
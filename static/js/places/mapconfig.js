var defaultConfig = {
    start: { h: 210, s:1, v:.25 },
    end: { h: 60,  s:1, v:.9 },
    
    mapStyle: [
	{
        "featureType" : "administrative",
        "elementType" : "all",
        "stylers":[{"saturation":-100}]
    },
    {
        "featureType" : "landscape",
        "elementType" : "all",
        "stylers" : [{"saturation":-100}]
    },
    {
        "featureType" : "poi",
        "elementType" : "all",
        "stylers" : [{"saturation":-100},{"lightness":20}]
    },
    {
        "featureType" : "road",
        "elementType" : "all",
        "stylers" : [{"saturation":-20}]
    },
    {
        "featureType" : "road",
        "elementType" : "labels", 
        "stylers" : [{"lightness":10}]
    },
    {
        "featureType" : "transit", 
        "elementType" : "all",
        "stylers" : [{"saturation":-100}]
    },
    {
        "featureType" : "water", 
        "elementType" : "all", 
        "stylers" : [{"hue":"#0089CF"},{"saturation":-30},{"lightness":20}]
    },
    {
        "featureType" : "administrative.land_parcel",
        "elementType" : "all",
        "stylers" : [{"visibility":"off"}]
    },
    {
        "featureType" : "administrative",

        "elementType" : "labels",
        "stylers":[{"visibility":"off"}]
    },
    {
        "featureType" : "water",
        "elementType" : "labels",
        "stylers":[{"visibility":"off"}]
    }
      ]
};

var truliaMapStyle = 
    [
        {
            "featureType" : "administrative",
            "elementType" : "all",
            "stylers":[{"saturation":-100}]
        },
        {
            "featureType" : "landscape",
            "elementType" : "all",
            "stylers" : [{"saturation":-100}]
        },
        {
            "featureType" : "poi",
            "elementType" : "all",
            "stylers" : [{"saturation":-100},{"lightness":20}]
        },
        {
            "featureType" : "road",
            "elementType" : "all",
            "stylers" : [{"saturation":-100}]
        },
        {
            "featureType" : "road",
            "elementType" : "labels", 
            "stylers" : [{"lightness":20}]
        },
        {
            "featureType" : "transit", 
            "elementType" : "all",
            "stylers" : [{"saturation":-100}]
        },
        {
            "featureType" : "water", 
            "elementType" : "all", 
            "stylers" : [{"hue":"#0089CF"},{"saturation":-60},{"lightness":30}]
        },
        {
            "featureType" : "administrative.land_parcel",
            "elementType" : "all",
            "stylers" : [{"visibility":"off"}]
        },
        
        // added styles for explore
        {
            "featureType" : "administrative",

            "elementType" : "labels",
            "stylers":[{"visibility":"off"}]
        },
        {
            "featureType" : "water",
            "elementType" : "labels",
            "stylers":[{"visibility":"off"}]
        },
    ];
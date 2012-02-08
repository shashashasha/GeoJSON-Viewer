// explore object
var explore = {};

// maybe generalized helper functions go here?

// take a string and geocode it
explore.geocode = function(address, callback)
{
     var geocoder = new google.maps.Geocoder();
     geocoder.geocode( {
         address: address,
         region: 'us'
     }, callback);
};

explore.batchReplace = function(template, object, placeholder) {
	var replaced = template;
	if (typeof(placeholder) === 'undefined')
	{
	  placeholder = 'N/A';
	}
	for (var variable in object) {
		replaced = replaced.replace('{' + variable + '}', object[variable] || placeholder);
	}

	return replaced;
};

explore.phoneNumber = function(num) {
	var phone = "";
	if (num.length == 10) {
		phone = '(' + num.substr(0, 3) + ') ' + num.substr(3, 3) + '-' + num.substr(6, 4);
	}
	return phone;
};

explore.slug = function(string) {
	// remove commas, periods, dashes from the slug before we slug it
	return string.split(/[.,-]/).join('').split(' ').join('-').toLowerCase();
};

explore.urlFormatter = function (url)
{
	// if we have a location, let's add it to the request
	if (trulia.location)
	{
	  if (url.indexOf('?') === -1)
	  {
	    url += '?';
	  }
	  else
	  {
	    url += '&';
	  }

	  url = url + 'v=' + trulia.location.version;

	  if (typeof trulia.location.city !== 'undefined')
	  {
	    url += '&c=' + encodeURIComponent(trulia.location.city);
	  }

	  if (typeof trulia.location.state !== 'undefined')
	  {
	    url += '&s=' + trulia.location.state; 
	  }

	  if (typeof trulia.location.zip !== 'undefined')
	  {
	    url += '&z=' + trulia.location.zip;
	  }

	  if (typeof trulia.location.nhid !== 'undefined')
	  {
	    url += '&n=' + trulia.location.nhid;
	  }

	  if (typeof trulia.location.ll !== 'undefined')
	  {
	    url += '&ll=' + trulia.location.ll;
	  }
	}
	return url;
};
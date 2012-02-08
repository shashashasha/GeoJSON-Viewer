function Colorizer() {
	
}

Colorizer.prototype.start = { r: 0, g: 0, b: 0 };
Colorizer.prototype.end   = { r: 0, g: 0, b: 0 };

// interpolates between the start rgb and end rgb, given a value from 0 - 1
Colorizer.prototype.blend = function(value) {
	value = Math.max(0, Math.min(1, value));
	return {
		r: this.blender(this.start.r, this.end.r, value),
		g: this.blender(this.start.g, this.end.g, value),
		b: this.blender(this.start.b, this.end.b, value)
	};
};

Colorizer.prototype.blender = function(s, e, v) {
	return ((e - s) * v) + s;
};

// blends colors and returns an "rgb(255, 255, 255)" string
Colorizer.prototype.blendToRGB = function(value) {
	var rgb = this.blend(value);
	return "rgb(" + Math.floor(rgb.r) + ", " + Math.floor(rgb.g) + ", " + Math.floor(rgb.b) + ")";
};

Colorizer.prototype.blendHSV = function(value) {
	value = Math.max(0, Math.min(1, value));
	var hsv = {
		h: this.blender(this.start.h, this.end.h, value),
		s: this.blender(this.start.s, this.end.s, value),
		v: this.blender(this.start.v, this.end.v, value)
	};
	
	return this.HSVToRGB(hsv);
}

Colorizer.prototype.blendHSVToRGB = function(value) {
	var rgb = this.blendHSV(value);
	
	return "rgb(" + Math.floor(rgb.r) + ", " + Math.floor(rgb.g) + ", " + Math.floor(rgb.b) + ")";
}


Colorizer.prototype.HSVToRGB = function(hsv) {
	var r, g, b;

    if (hsv.s == 0) {
        r = g = b = hsv.v;
    } else {
        var hue = hsv.h / 360;
        hue = (hue * 6) % 6;

        var i = Math.floor(hue);
        var v1 = hsv.v * (1 - hsv.s);
        var v2 = hsv.v * (1 - hsv.s * (hue - i));
        var v3 = hsv.v * (1 - hsv.s * (1 - (hue - i)));

        switch (i)
        {
            case 0:
                r = hsv.v, g = v3, b = v1;
                break;

            case 1:
                r = v2, g = hsv.v, b = v1;
                break;

            case 2:
                r = v1, g = hsv.v, b = v3;
                break;

            case 3:
                r = v1, g = v2, b = hsv.v;
                break;

            case 4:
                r = v3, g = v1, b = hsv.v;
                break;

            default:
                r = hsv.v, g = v1, b = v2;
                break;
        }
    }

    r *= 255;
    g *= 255;
    b *= 255;

	return {
		r: r, 
		g: g, 
		b: b
	};
}

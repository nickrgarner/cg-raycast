/**
 * @file drawstuff.js
 * @author Nick Garner, Ben Watson
 * File defines rendering behavior of ellipsoids using raycasting
 * and lighting via Blinn-Phong illumination.
 */

/* classes */ 

// Color constructor
class Color {
    constructor(r,g,b,a) {
        try {
            if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
                throw "color component not a number";
            else if ((r<0) || (g<0) || (b<0) || (a<0)) 
                throw "color component less than 0";
            else if ((r>255) || (g>255) || (b>255) || (a>255)) 
                throw "color component bigger than 255";
            else {
                this.r = r; this.g = g; this.b = b; this.a = a; 
            }
        } // end try
        
        catch (e) {
            console.log(e);
        }
    } // end Color constructor

        // Color change method
    change(r,g,b,a) {
        try {
            if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
                throw "color component not a number";
            else if ((r<0) || (g<0) || (b<0) || (a<0)) 
                throw "color component less than 0";
            else if ((r>255) || (g>255) || (b>255) || (a>255)) 
                throw "color component bigger than 255";
            else {
                this.r = r; this.g = g; this.b = b; this.a = a; 
            }
        } // end throw
        
        catch (e) {
            console.log(e);
        }
    } // end Color change method
} // end color class


/* utility functions */

// draw a pixel at x,y using color
function drawPixel(imagedata,x,y,color) {
    try {
        if ((typeof(x) !== "number") || (typeof(y) !== "number"))
            throw "drawpixel location not a number";
        else if ((x<0) || (y<0) || (x>=imagedata.width) || (y>=imagedata.height))
            throw "drawpixel location outside of image";
        else if (color instanceof Color) {
            var pixelindex = (y*imagedata.width + x) * 4;
            imagedata.data[pixelindex] = color.r;
            imagedata.data[pixelindex+1] = color.g;
            imagedata.data[pixelindex+2] = color.b;
            imagedata.data[pixelindex+3] = color.a;
        } else 
            throw "drawpixel color is not a Color";
    } // end try
    
    catch(e) {
        console.log(e);
    }
} // end drawPixel

// get the input ellipsoids from the standard class URL
function getInputEllipsoids() {
    const INPUT_ELLIPSOIDS_URL = 
        "https://ncsucgclass.github.io/prog1/ellipsoids.json";
        
    // load the ellipsoids file
    var httpReq = new XMLHttpRequest(); // a new http request
    httpReq.open("GET",INPUT_ELLIPSOIDS_URL,false); // init the request
    httpReq.send(null); // send the request
    var startTime = Date.now();
    while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
        if ((Date.now()-startTime) > 3000)
            break;
    } // until its loaded or we time out after three seconds
    if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE)) {
        console.log*("Unable to open input ellipses file!");
        return String.null;
    } else
        return JSON.parse(httpReq.response);
} // end get input ellipsoids

// Checks for object intersection along eye-pixel ray and colors pixel
// with Blinn-Phong illumination of object if found.
function raycastEllipsoids(context) {
    // Get input, setup canvas
    var input = getInputEllipsoids();
    var wcanvas = context.canvas.width;
    var hcanvas = context.canvas.height;
    var imagedata = context.createImageData(wcanvas,hcanvas);
    const PIXEL_DENSITY = 0.1;
    var numCanvasPixels = (wcanvas * hcanvas) * PIXEL_DENSITY;

    // Eye/view/light coords
    var eye = {x:0.5, y:0.5, z:-0.5};
    var lookup = {x:0, y:1, z:0};
    var lookat = {x:0, y:0, z:1};
    var light = {x: -0.5, y: 1.5, z: -0.5};
    var lightColor = {ambient: 1, diffuse: 1, specular: 1};

    // Init color
    var color = new Color(0,0,0,0);

    // Check for empty input
    if (input != String.null) {
        // Iterate through pixels in canvas
        for ( var x = 0; x < wcanvas; x++ ) {
            for ( var y = 0; y < hcanvas; y++ ) {
                color.change( 0, 0, 0, 255 ); // Reset color
                var pixel = {x: x, y: y, z: 0}; // Set pixel
                
                var closestIntersection = null; // Point of intersection on closest ellipse
                var closestEll = null; // Closest intersecting ellipse
                var closestDist = null; // Distance to closest ellipse

                // Check each ellipse for intersection
                for ( var i = 0; i < input.length; i++ ) {
                    ellipse = input[ i ];
                    // Check intersection, update closest ellipse if appropriate
                    var t = checkIntersection( ellipse, pixel, eye, wcanvas, hcanvas );
                    if ( t != null && t > 0 ) {
                        var D = { 
                            x: (pixel.x / wcanvas) - eye.x,
                            y: (1 - pixel.y / hcanvas) - eye.y,
                            z: (pixel.z - eye.z) };
                        var intersection = { x: eye.x + D.x * t, y: eye.y + D.y * t, z: eye.z + D.z * t}
                        if ( closestDist == null || t < closestDist ) {
                                closestDist = t;
                                closestEll = ellipse;
                                closestIntersection = intersection
                        }
                    }
                }
                if ( closestEll == null ) { // No intersection, use default color
                    drawPixel( imagedata, x, y, color );
                } else { // Use color of closest ellipse
                    var BPcolor = getBPColor( closestEll, closestIntersection, eye, light, lightColor );
                    color.change (
                        BPcolor[0] * 255,
                        BPcolor[1] * 255,
                        BPcolor[2] * 255,
                        255);
                    // color.change (
                    //     closestEll.diffuse[0] * 255,
                    //     closestEll.diffuse[1] * 255,
                    //     closestEll.diffuse[2] * 255,
                    //     255); // Ellipsoid diffuse color
                    drawPixel( imagedata, x, y, color );
                }
            }
        }
        context.putImageData( imagedata, 0, 0 );
    }
}

// Returns t if ray intersects ellipse, null otherwise
function checkIntersection( ellipse, pixel, eye, wcanvas, hcanvas ) {
    // Calculate discriminant of quadratic equation: sqrt( b^2 - 4ac )
    // a = dot( D/A, D/A ), b = 2 * dot( D/A, E - C )
    // c = dot( (E-C)/A, (E-C)/A ) - 1

    // a term
    var D = { 
        x: (pixel.x / wcanvas) - eye.x,
        y: (1 - pixel.y / hcanvas) - eye.y,
        z: (pixel.z - eye.z) };
    var DdivA = { 
        x: D.x / ellipse.a,
        y: D.y / ellipse.b,
        z: D.z / ellipse.c };
    var quadraticA = dot( DdivA, DdivA );

    // b and c terms
    var cx = ellipse.x;
    var cy = ellipse.y;
    var cz = ellipse.z;
    var ElessCdivA = {
        x: ( eye.x - cx ) / ellipse.a,
        y: ( eye.y - cy ) / ellipse.b,
        z: ( eye.z - cz ) / ellipse.c };
    var doubleDdivA = { x: 2 * DdivA.x, y: 2 * DdivA.y, z: 2 * DdivA.z };
    var quadraticB = dot( doubleDdivA, ElessCdivA );
    var quadraticC = dot( ElessCdivA, ElessCdivA ) - 1;

    // discriminant
    var discriminant = Math.pow( quadraticB, 2 ) - 4 * quadraticA * quadraticC;
    var t = 0;

    if ( discriminant < 0 ) { // No intersection
        return null;
    } else if ( discriminant == 0 ) { // One intersection
        t = -1 * quadraticB / ( 2 * quadraticA );
    } else { // Two intersections
        var t1 = ( -1 * quadraticB - Math.sqrt( discriminant ) ) / ( 2 * quadraticA );
        var t2 = ( -1 * quadraticB + Math.sqrt( discriminant ) ) / ( 2 * quadraticA );
        // Use closest root greater than zero
        if ( t1 > 0 && t2 > 0 ) {
            t = Math.min( t1, t2 );
        } else if ( t1 < 0 ) {
            t = t2;
        } else {
            t = t1;
        }
    }

    return t;
}

// Calculate and return Blinn-Phong color
function getBPColor( ellipse, intersection, eye, light, lightColor ) {
    // Get normal vector, normalize
    var normal = norm ( {
        x: (2 * (intersection.x - ellipse.x)) / Math.pow(ellipse.a, 2),
        y: (2 * (intersection.y - ellipse.y)) / Math.pow(ellipse.b, 2),
        z: (2 * (intersection.z - ellipse.z)) / Math.pow(ellipse.c, 2) } );
    
    // Get half vector
    light = norm( {
        x: light.x - intersection.x,
        y: light.y - intersection.y,
        z: light.z - intersection.z} );
    var V = norm( {
        x: eye.x - intersection.x,
        y: eye.y - intersection.y,
        z: eye.z - intersection.z} );
    var half = norm( {
        x: light.x + V.x,
        y: light.y + V.y,
        z: light.z + V.z} );

    // Calculate RGB color components
    var color = [];
    for (var i = 0; i < 3; i++) {
        color[i] = ellipse.ambient[i] * lightColor.ambient; // ambient term
        color[i] += ellipse.diffuse[i] * lightColor.diffuse * dot( normal, light ); // diffuse term
        color[i] += ellipse.specular[i] * lightColor.specular * Math.pow( dot( normal, half ), ellipse.n ); // specular term
        
        // Clamp color bounds
        if ( color[i] > 1 ) {
            color[i] = 1;
        } 
        else if ( color[i] < 0 ) {
            color[i] = 0;
        }
    }

    return color;
}

// Returns dot product of two 3D vectors
function dot( vec1, vec2 ) {
    return vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z;
}

// Returns normalized copy of input vector
function norm( vec1 ) {
    var magnitude = Math.sqrt( Math.pow( vec1.x, 2 ) + Math.pow( vec1.y, 2 ) + Math.pow( vec1.z, 2 ) );
    return { x: vec1.x / magnitude, y: vec1.y / magnitude, z: vec1.z / magnitude };
}

/* main -- here is where execution begins after window load */

function main() {

    // Get the canvas and context
    var canvas = document.getElementById("viewport"); 
    var context = canvas.getContext("2d");
 
    // Create the image
    raycastEllipsoids( context );
}

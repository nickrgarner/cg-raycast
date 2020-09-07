// TODO: Check raycasting syntax, add illumination
// Notes: Unsure about intersection calculations, pixel interpolation.

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
    
// draw random pixels
function drawRandPixels(context) {
    var c = new Color(0,0,0,0); // the color at the pixel: black
    var w = context.canvas.width;
    var h = context.canvas.height;
    var imagedata = context.createImageData(w,h);
    const PIXEL_DENSITY = 0.01;
    var numPixels = (w*h)*PIXEL_DENSITY; 
    
    // Loop over 1% of the pixels in the image
    for (var x=0; x<numPixels; x++) {
        c.change(Math.random()*255,Math.random()*255,
            Math.random()*255,255); // rand color
        drawPixel(imagedata,
            Math.floor(Math.random()*w),
            Math.floor(Math.random()*h),
                c);
    } // end for x
    context.putImageData(imagedata, 0, 0);
} // end draw random pixels

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

function raycastEllipsoids(context) {
    // Get input, setup canvas
    var input = getInputEllipsoids();
    var wcanvas = context.canvas.width;
    var hcanvas = context.canvas.height;
    var imagedata = context.createImageData(wcanvas,hcanvas);
    const PIXEL_DENSITY = 0.1;
    var numCanvasPixels = (wcanvas * hcanvas) * PIXEL_DENSITY;

    // Eye/view coords
    var eye = {x:0.5, y:0.5, z:-0.5};
    var lookup = {x:0, y:1, z:0};
    var lookat = {x:0, y:0, z:1};

    // Init color
    var color = new Color(0,0,0,0);

    // Check for empty input
    if (input != String.null) {
        // Iterate through pixels in canvas
        for ( var x = 0; x < wcanvas; x++ ) {
            for ( var y = 0; y < hcanvas; y++ ) {
                color.change( 0, 0, 0, 255 ); // Reset color
                var pixel = {x: x, y: y, z: 0}; // Set pixel
                
                var closestEll = null; // Closest intersecting ellipse
                var closestDist = null; // Distance to closest ellipse

                // Check each ellipse for intersection
                for ( var i = 0; i < input.length; i++ ) {
                    ellipse = input[ i ];
                    // Check intersection, update closest ellipse if appropriate
                    var intersection = checkIntersection( ellipse, pixel, eye, wcanvas, hcanvas );
                    if ( intersection != null ) {
                        var distToEll = getDistance( pixel, intersection );
                        if ( distToEll > 0 &&
                            ( closestDist == null || distToEll < closestDist ) ) {
                                closestDist = distToEll;
                                closestEll = ellipse;
                        }
                    }
                }
                if ( closestEll == null ) { // No intersection, use default color
                    drawPixel( imagedata, x, y, color );
                } else { // Use color of closest ellipse
                    color.change (
                        closestEll.diffuse[0] * 255,
                        closestEll.diffuse[1] * 255,
                        closestEll.diffuse[2] * 255,
                        255); // Ellipsoid diffuse color
                    drawPixel( imagedata, x, y, color );
                }
            }
        }
        context.putImageData( imagedata, 0, 0 );
    }
}

// Returns distance if ray intersects ellipse, null otherwise
function checkIntersection( ellipse, pixel, eye, wcanvas, hcanvas ) {
    // Calculate discriminant of quadratic equation: sqrt( b^2 - 4ac )
    // a = dot( D/A, D/A ), b = 2 * dot( D/A, E - C )
    // c = dot( (E-C)/A, (E-C)/A ) - 1

    // a term
    var D = { 
        x: (pixel.x / wcanvas) - eye.x,
        y: (1 - pixel.y / hcanvas) - eye.y,
        z: (pixel.z - eye.z) };
    var DdivA = norm( { 
        x: D.x / ellipse.a,
        y: D.y / ellipse.b,
        z: D.z / ellipse.c } );
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
    var intersection = 0;

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

    // Calculate intersection point, return
    return { x: eye.x + D.x * t, y: eye.y + D.y * t, z: eye.z + D.z * t};
}

// Calculate and return Blinn-Phong color
function getBPColor( ellipse, intersection, light, wcanvas, hcanvas ) {
    // Get normal vector, normalize
    var normal = {
        x: 2 * (intersection.x - ellipse.x) / Math.pow(ellipse.a, 2),
        y: 2 * (intersection.y - ellipse.y) / Math.pow(ellipse.b, 2),
        z: 2 * (intersection.z - ellipse.z) / Math.pow(ellipse.c, 2) };
    var normal = norm( normal );
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

// Returns distance between pixel and intersection point
function getDistance( pixel, intersection ) {
    return Math.sqrt(
        Math.pow( intersection.x - pixel.x, 2 ) +
        Math.pow( intersection.y - pixel.y, 2 ) +
        Math.pow( intersection.z - pixel.z, 2 ) );
}

/* main -- here is where execution begins after window load */

function main() {

    // Get the canvas and context
    var canvas = document.getElementById("viewport"); 
    var context = canvas.getContext("2d");
 
    // Create the image
    raycastEllipsoids( context );
}

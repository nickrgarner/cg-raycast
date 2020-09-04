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
    var numCanvasPixels = (wcanvas*hcanvas)*PIXEL_DENSITY;

    // Eye/view coords
    var eye = {x:0.5, y:0.5, z:-0.5};
    var lookup = {x:0, y:1, z:0};
    var lookat = {x:0, y:0, z:1};

    // Check for empty input
    if (input != String.null) {
        // Iterate through pixels in canvas
        for ( var x = 0; x < wcanvas; x++ ) {
            for ( var y = 0; y < hcanvas; y++ ) {
                // Init color
                var color = new Color(0,0,0,0);

                // Calculate D = P - E
                var xWorld = x / wcanvas;
                var yWorld = y / hcanvas;
                var zWorld = 0;
                var D = {x:xWorld - eye.x, y:yWorld - eye.y, z:zWorld - eye.z};
                
                var closestEll = null; // Closest intersecting ellipse
                var closestDist = -1; // Distance to closest ellipse
                // Check each ellipse for intersection
                for ( var i = 0; i < input.length; i++ ) {
                    ellipse = input[ i ];
                    // Check intersection, update closest ellipse if appropriate
                    var distToEll = checkInteraction( ellipse, {x: x, y: y, z: 0 }, eye );
                    if ( distToEll != -1 && distToEll < closestDist ) {
                        closestDist = distToEll;
                        closestEll = ellipse;
                    }
                }
                if ( !closestEll ) { // No intersection
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

// Returns distance if ray intersects ellipse, -1 otherwise
function checkInteraction( ellipse, pixel, eye ) {
    // Get canvas pixel ranges
    wcanvas = context.canvas.width;
    hcanvas = context.canvas.height;

    // Calculate discriminant of quadratic equation
    var D = { x: pixel.x - eye.x, y: pixel.y - eye.y, z: pixel.z - eye.z };
    var DdivA = { x: D.x / ellipse.a, y: D.y / ellipse.b, z: D.z / ellipse.c };
    var quadraticA = dot( DdivA, DdivA );

    var cx = wcanvas * ellipse.x;
    var cy = hcanvas * ellipse.y;
    var cz = 0;
    var ElessCdivA = {
        x: ( eye.x - cx ) / ellipse.a,
        y: ( eye.y - cy ) / ellipse.b,
        z: ( eye.z - cz ) / ellipse.c };
    var quadraticB = dot( 2 * DdivA, ElessCdivA );
    var quadraticC = dot( ElessCdivA, ElessCdivA ) - 1;

    var discriminant = Math.pow( quadraticB, 2 ) - 4 * quadraticA * quadraticC;
    var t = 0;
    var intersection = 0;

    if ( discriminant < 0 ) { // No intersection
        return -1;
    } else if ( discriminant == 0 ) { // One intersection
        t = -1 * quadraticB / ( 2 * quadraticA );
        intersection = { x: eye.x + D.x * t, y: eye.y + D.y * t, z: eye.z + D.z * t }
    } else { // Two intersections
        t = ( -1 * quadraticB - Math.sqrt( discriminant ) ) / ( 2 * quadraticA );
        if ( t < 1 ) { // Behind eye, try other t
            t = ( -1 * quadraticB + Math.sqrt( discriminant ) ) / ( 2 * quadraticA );
        }
        intersection = { x: eye.x + D.x * t, y: eye.y + D.y * t, z: eye.z + D.z * t}
    }
    // Return distance from pixel to intersection
    return Math.sqrt(
        Math.pow( intersection.x - pixel.x, 2 ) +
        Math.pow( intersection.y - pixel.y, 2 ) +
        Math.pow( intersection.z - pixel.z, 2 ) );
}

// Returns dot product of two 3D vectors
function dot( vec1, vec2 ) {
    return vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z;
}

/* main -- here is where execution begins after window load */

function main() {

    // Get the canvas and context
    var canvas = document.getElementById("viewport"); 
    var context = canvas.getContext("2d");
 
    // Create the image
    //drawRandPixels(context);
      // shows how to draw pixels

    raycastEllipsoids( context );
    
    // drawRandPixelsInInputEllipsoids(context);
      // shows how to draw pixels and read input file
      
    //drawInputEllipsoidsUsingArcs(context);
      // shows how to read input file, but not how to draw pixels
    
    //drawRandPixelsInInputTriangles(context);
      // shows how to draw pixels and read input file
    
    //drawInputTrainglesUsingPaths(context);
      // shows how to read input file, but not how to draw pixels
    
    //drawRandPixelsInInputBoxes(context);
      // shows how to draw pixels and read input file
    
    //drawInputBoxesUsingPaths(context);
      // shows how to read input file, but not how to draw pixels
}

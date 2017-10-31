// This is the main code used for the prototype of the prevention code

var container, stats;
var camera, scene, renderer;
var geometryBox, group;
var mouseX = 0, mouseY = 0;



var dataLand;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var cylinderGeometry;
var cylinderArray;
var line;
var linesRisk;

var wireframe;
var projector,  INTERSECTED; // mouse = { x: 0, y: 0 },

var paramsCatastrophy, catastrophyType = "hurricane";
var maximumRiskGlobal;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
// document.addEventListener( 'mousemove', onDocumentMouseMove, false );

// Spline params 
var splineHelperObjects = [], splineOutline;
var splinePointsLength = 4; var positions = []; var options;
var geometry = new THREE.BoxGeometry( 20, 20, 20 ); var transformControl;
// var ARC_SEGMENTS = 200; var splineMesh; var splines = {};
// var params = { uniform: true, tension: 0.5, centripetal: true, chordal: true, addPoint: addPoint, removePoint: removePoint, exportSpline: exportSpline };

var hiding;

// Action code
d3.json("land-grid.json", function(error, loadedData) {
	console.log("loadedData: "); console.log(loadedData);
	dataLand = loadedData;

	init();
	animate();

})
// ----

function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	// Scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );

	// camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );	
	camera.position.z = 200;
	camera.position.y = 300;
	camera.lookAt(new THREE.Vector3(0,0,0));


	// My stuff
	paramsCatastrophy = { "catastrophyParamA":0.26, "catastrophyParamB":0.21, "catastrophyParamC": 0.11 }
	drawCylinder();
	calculatePosColor();
	drawGroundThree();
	drawPlane();
	drawLinesRisk();
	// --

	// Rendered
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	// Controls - boxes
	controls = new THREE.OrbitControls( camera, renderer.domElement );
	// Controls - cylinder
	controlsCylinder = new THREE.TrackballControls( camera );
	controlsCylinder.rotateSpeed = 1.0;
	controlsCylinder.zoomSpeed = 1.2;
	controlsCylinder.panSpeed = 0.8;
	controlsCylinder.noZoom = false;
	controlsCylinder.noPan = false;
	controlsCylinder.staticMoving = true;
	controlsCylinder.dynamicDampingFactor = 0.3;
	// transformControl
	transformControl = new THREE.TransformControls( camera, renderer.domElement );
	transformControl.addEventListener( 'change', render );
	scene.add( transformControl );
	// Hiding transform situation is a little in a mess :()
	transformControl.addEventListener( 'change', function( e ) { cancelHideTransorm(); } );
	transformControl.addEventListener( 'mouseDown', function( e ) { cancelHideTransorm(); } );
	transformControl.addEventListener( 'mouseUp', function( e ) { delayHideTransform(); } );
	transformControl.addEventListener( 'objectChange', function( e ) { updateSplineOutline(); } );
	// --

	// ---- light
    // add subtle ambient lighting
    var ambientLight = new THREE.AmbientLight(0xeeeeee);
    scene.add(ambientLight);
    // add spotlight for the shadows
    var spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.position.set( -40, 40, 50 );
    spotLight.castShadow = true;
    scene.add( spotLight );
    // ----

	container.appendChild( renderer.domElement );
	stats = new Stats();
	container.appendChild( stats.dom );
	window.addEventListener( 'resize', onWindowResize, false );

	var dragcontrols = new THREE.DragControls( splineHelperObjects, camera, renderer.domElement ); //
	dragcontrols.enabled = false;
	dragcontrols.addEventListener( 'hoveron', function ( event ) {
		transformControl.attach( event.object );
		cancelHideTransorm();
	} );

	dragcontrols.addEventListener( 'hoveroff', function ( event ) {
		delayHideTransform();
	} );

	cylinderArray = [cylinder];
	console.log("cylinderArray: "); console.log(cylinderArray);
	var dragControlsCylinder = new THREE.DragControls( cylinderArray, camera, renderer.domElement );
	dragControlsCylinder.addEventListener( 'dragstart', function ( event ) { 
		controlsCylinder.enabled = false;
		controls.enabled = false; 
	} );
	dragControlsCylinder.addEventListener( 'dragend', function ( event ) { 
		controlsCylinder.enabled = true; 
		controls.enabled=true;
		// Movement done, let's recalculate the colors
		calculatePosColor();
		console.log("dataLand: ");console.log(dataLand);
		colorGroundThree();
		// Update the length of the lines
		updateLinesRisk();
	} );

	console.log("wireframe");console.log(wireframe);
	console.log("cylinder");console.log(cylinder);
}

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

//
function animate() {
	requestAnimationFrame( animate );
	render();
	stats.update();
	transformControl.update();
}


function drawPlane(){
	var planeGeometry = new THREE.PlaneGeometry( 2000, 2000 );
	planeGeometry.rotateX( - Math.PI / 2 );
	var planeMaterial = new THREE.ShadowMaterial( { opacity: 0.2 } );
	var plane = new THREE.Mesh( planeGeometry, planeMaterial );
	plane.position.y = -200;
	plane.receiveShadow = true;
	plane.name="plane";
	scene.add( plane );

	var helper = new THREE.GridHelper( 2000, 500 );
	helper.position.y = - 1;
	helper.material.opacity = 0.5;
	helper.material.transparent = true;
	scene.add( helper );
	var axis = new THREE.AxisHelper();
	axis.position.set( -500, -500, -500 );
	scene.add( axis );
}


function drawGroundThree(){
	// Create a ground for each land
	console.log("dataLand: "); console.log(dataLand);
	for (var i =0; i < dataLand.states.length; i++) {
		var curState = dataLand.states[i];
	    // create the ground plane
	    var planeGeometry = new THREE.PlaneGeometry(10,10,1,1);
	    var planeMaterial = new THREE.MeshLambertMaterial({color: new THREE.Color("hsl(0, 0%,50%)")});
	    var plane = new THREE.Mesh(planeGeometry,planeMaterial);	
	    // rotate and position the plane
	    plane.rotation.x= -0.5*Math.PI;
	    plane.position.x= curState.x; plane.position.y= curState.y; plane.position.z= curState.z;
		// connect the global data with the plane geometry
		dataLand.states[i].plane = plane;
		// add the plane to the scene
		scene.add(plane);
	}
	colorGroundThree();
}

function drawLinesRisk(){

	// Let's draw 12 lines around the cylinder
	linesRisk = [];
	pointsRisks = [];

	for (var i = 0; i< 12; i++){
		var angleRotation = 2*Math.PI -  i*(2*Math.PI/12);
		var posXZ = polar2cartesian( Math.random() * 100, angleRotation );
		// console.log("posXZ: ");console.log(posXZ);
		pointsRisks.push(posXZ);
	}

	var geometry3 = new THREE.Geometry();
	var points = [];
	for (var i =0; i < pointsRisks.length;i++){
		points.push(new THREE.Vector3( pointsRisks[i].x , 100, pointsRisks[i].y ))
		points.push(new THREE.Vector3( 0 , 100, 0 ))
	}
	var colors3 = [];

	for ( i = 0; i < points.length; i ++ ) {
		geometry3.vertices.push( points[ i ] );
		colors3[ i ] = new THREE.Color( 0xffffff );
		colors3[ i ].setHSL( 0, 1.0, 0.5 );
	}

	geometry3.colors = colors3;
	// lines
	material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 20, vertexColors: THREE.VertexColors } );
	var p, scale = 0.3, d = 225;
	line = new THREE.Line(geometry3, material );
	line.scale.x = line.scale.y = line.scale.z =  scale*1.5;
	line.position.x = cylinder.position.x;
	line.position.y = 0;
	line.position.z = cylinder.position.z;

	scene.add( line );
}

function updateLinesRisk(){
	// NEW IDEA: WE REMOVE PREVIOUS LINES AND CREATE NEW ONES
	for(var i = 0; i < scene.children.length; i++){
		if (scene.children[i].type == "Line"){
	    	scene.remove(scene.children[i]);
		}
	}	

	linesRisk = [];
	pointsRisks = [];
	for (var i = 0; i< 12; i++){
		var angleRotation = 2*Math.PI -  i*(2*Math.PI/12);
		var posXZ = polar2cartesian( Math.random() * 100, angleRotation );
		// console.log("posXZ: ");console.log(posXZ);
		pointsRisks.push(posXZ);
	}

	var geometry3 = new THREE.Geometry();
	var points = [];
	for (var i =0; i < pointsRisks.length;i++){
		points.push(new THREE.Vector3( pointsRisks[i].x , 100, pointsRisks[i].y ))
		points.push(new THREE.Vector3( 0 , 100, 0 ))
	}
	var colors3 = [];

	for ( i = 0; i < points.length; i ++ ) {
		geometry3.vertices.push( points[ i ] );
		colors3[ i ] = new THREE.Color( 0xffffff );
		colors3[ i ].setHSL( 0, 1.0, 0.5 );
	}
	geometry3.colors = colors3;
	// lines
	material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 20, vertexColors: THREE.VertexColors } );
	var p, scale = 0.3, d = 225;
	line = new THREE.Line(geometry3, material );
	line.scale.x = line.scale.y = line.scale.z =  scale*1.5;
	line.position.x = cylinder.position.x;
	line.position.y = 0;
	line.position.z = cylinder.position.z;

	scene.add( line );

}


function colorGroundThree() {
	for (var i =0; i < dataLand.states.length; i++) {
		var curState = dataLand.states[i];
	    var typeMaxRisk = "none";
	    var valueMaxRisk = -1;
	    if (curState.riskAlpha > curState.riskBeta){
	    	if (curState.riskAlpha > curState.riskGamma){ 
	    		typeMaxRisk = "alpha"; valueMaxRisk = curState.riskAlpha; 
	    	}  else { 
	    		typeMaxRisk = "gamma"; valueMaxRisk = curState.riskGamma;  
	    	}
	    } else {
			if (curState.riskBeta > curState.riskGamma){ 
				typeMaxRisk = "beta"; valueMaxRisk = curState.riskBeta; 
			} else { 
				typeMaxRisk = "gamma"; valueMaxRisk = curState.riskGamma;  
			}
		}

		// Types of maximum risk = unique hue (from red to green, we will keep blue for sea I guess)
		var colorRisk = new THREE.Color("hsl(0,0%,80%)");
		var saturationTab = 100 * valueMaxRisk / (curState.distanceToCatastrophy*10);
		// console.log("valueMaxRisk: "+valueMaxRisk); console.log("saturationTab: "+saturationTab);

	    switch(typeMaxRisk) {
	    	case "alpha":
	    		colorRisk = new THREE.Color("hsl(0.1,"+ (1 + Math.round(saturationTab*90) ) +"% ,60%)");
    		break;
    		case "beta":
				colorRisk = new THREE.Color("hsl(50,"+ (1 + Math.round(saturationTab*90) ) +"%,60%)");
    		break;
    		case "gamma":
				colorRisk = new THREE.Color("hsl(100,"+ (1 + Math.round(saturationTab*90) ) +"%,60%)");
    		break;
	    }
	    var planeMaterial = new THREE.MeshLambertMaterial({color: colorRisk});	    
	    curState.plane.material = planeMaterial;
	}
}

function drawCylinder(){
    cylinderGeometry = new THREE.CylinderGeometry(20, 1, 50, 64,1);
    cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x0000CC, opacity: 0.4, transparent: true});
    cylinder = new THREE.Mesh( cylinderGeometry, cylinderMaterial );
    cylinder.castShadow = true;
    cylinder.receiveShadow = false;
    cylinder.position.x = 40;
    cylinder.position.z = 60;
    cylinder.position.y = 20;
    // Global parameters, we want them to be changeable
    cylinder.catastrophyType = catastrophyType;
    cylinder.paramsCatastrophy = paramsCatastrophy;

	var geo = new THREE.EdgesGeometry( cylinderGeometry ); // or WireframeGeometry( geometry )
	var mat = new THREE.LineBasicMaterial( { color: 0x0000ff, linewidth: 2 } );
	wireframe = new THREE.LineSegments( geo, mat );
    wireframe.position.x = 40;
    wireframe.position.z = 60;
    wireframe.position.y = 20;
	scene.add( wireframe );
	cylinder.children = wireframe;
    console.log("cylinder: "); console.log(cylinder);
    scene.add(cylinder);
}


function calculatePosColor(){
	// TODO change the parameters for the distance changes to have a bigger impact
	maximumRiskGlobal = 0.0;
	// This is made up, but probably the part that has crazy potential (potential use for machine learning and interaction here !)
	for(var i =0; i < dataLand.states.length;i++){		
		// Proper math would be calculation based on parameters from the hazard moving
		var distXSquare = ((cylinder.position.x - dataLand.states[i].x) * (cylinder.position.x - dataLand.states[i].x) );
		var distZSquare = ((cylinder.position.z - dataLand.states[i].z) * (cylinder.position.z - dataLand.states[i].z) );
		var distLandCylinder = Math.sqrt( distXSquare + distZSquare );

		// Added for results to be usable
		var localCalculRiskAlpha = (dataLand.states[i].paramA
			* cylinder.paramsCatastrophy.catastrophyParamA) ;
		var localCalculRiskBeta = (dataLand.states[i].paramB 
			* cylinder.paramsCatastrophy.catastrophyParamB) ;
		var localCalculRiskGamma = (dataLand.states[i].paramC
			* cylinder.paramsCatastrophy.catastrophyParamC) ;

		if (maximumRiskGlobal == 0.0){ maximumRiskGlobal = localCalculRiskGamma; }
		var maxLandRisks = Math.max(localCalculRiskAlpha,localCalculRiskBeta, localCalculRiskGamma);

		if ( maximumRiskGlobal < maxLandRisks ){ maximumRiskGlobal = maxLandRisks; }

		// console.log("maxLandRisks: "+maxLandRisks+", maximumRiskGlobal: "+maximumRiskGlobal);
		// What are the cases based on the calculus?
		if (typeof dataLand.states[i].riskAlpha == "undefined")
			{ dataLand.states[i].riskAlpha = 0; }
		if (typeof dataLand.states[i].riskBeta == "undefined")
			{ dataLand.states[i].riskBeta = 0; }
		if (typeof dataLand.states[i].riskGamma == "undefined")
			{ dataLand.states[i].riskGamma = 0; }
		dataLand.states[i].riskAlpha = localCalculRiskAlpha;
		dataLand.states[i].riskBeta = localCalculRiskBeta; 
		dataLand.states[i].riskGamma = localCalculRiskGamma;
		dataLand.states[i].distanceToCatastrophy = distLandCylinder;
	}

	for(var i =0; i < dataLand.states.length;i++){
		dataLand.states[i].riskAlpha = dataLand.states[i].riskAlpha; // /maximumRiskGlobal;
		dataLand.states[i].riskBeta = dataLand.states[i].riskBeta; // /maximumRiskGlobal;
		dataLand.states[i].riskGamma = dataLand.states[i].riskGamma; // /maximumRiskGlobal;
		// console.log("riskAlpha: "+dataLand.states[i].riskAlpha+", riskBeta: "+dataLand.states[i].riskBeta+", localCalculRiskGamma: "+dataLand.states[i].riskGamma+", dataLand.states[i].distanceToCatastrophy: "+dataLand.states[i].distanceToCatastrophy);
	}
}

function render() {
	var time = Date.now() * 0.001;
	// RAY CASTER
	// update the picking ray with the camera and mouse position
	raycaster.setFromCamera( mouse, camera );
	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects( scene.children );

	if ( intersects.length > 0 ) {
		if ( intersects[0].object.name != "plane" && INTERSECTED != intersects[ 0 ].object ) {
			if ( INTERSECTED && typeof INTERSECTED.material.emissive!= "undefined" ) 
				INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
			INTERSECTED = intersects[ 0 ].object;
			if (typeof INTERSECTED.material.emissive!= "undefined" ){
				INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
				INTERSECTED.material.emissive.setHex( 0xcccccc );
			}
		}
	} else {
		if ( INTERSECTED!=null && typeof INTERSECTED.material.emissive != "undefined"){
			if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
		}
		INTERSECTED = null;
	}
	// --

	// Dirty: TODO assign properly wireframe so that it sticks to the position of the cylinder
	cylinder.position.y = 20;
	wireframe.position.x = cylinder.position.x;
	wireframe.position.y = cylinder.position.y;
	wireframe.position.z = cylinder.position.z;
	line.position.x = cylinder.position.x;
	line.position.z = cylinder.position.z;


	renderer.render( scene, camera );
}

// Ray caster -> The mouse
window.addEventListener( 'mousemove', onMouseMove, false );
window.requestAnimationFrame(render);
function onMouseMove( event ) {
	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function polar2cartesian(rho,theta) {
	var rez = {};
	rez.x = rho * Math.cos(theta);
	rez.y = rho * Math.sin(theta);
	return rez;
}

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
var wireframe;
var projector,  INTERSECTED; // mouse = { x: 0, y: 0 },

var paramsCatastrophy, catastrophyType = "hurricane";

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
// document.addEventListener( 'mousemove', onDocumentMouseMove, false );

// Spline params 
var splineHelperObjects = [], splineOutline;
var splinePointsLength = 4; var positions = []; var options;
var geometry = new THREE.BoxGeometry( 20, 20, 20 ); var transformControl;
var ARC_SEGMENTS = 200; var splineMesh; var splines = {};
var params = { uniform: true, tension: 0.5, centripetal: true, chordal: true, addPoint: addPoint, removePoint: removePoint, exportSpline: exportSpline };

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

	// Gui
	var gui = new dat.GUI();
	gui.add( params, 'uniform' );
	gui.add( params, 'tension', 0, 1 ).step( 0.01 ).onChange( function( value ) {
		splines.uniform.tension = value; updateSplineOutline();
	});
	gui.add( params, 'centripetal' ); gui.add( params, 'chordal' );
	gui.add( params, 'addPoint' ); gui.add( params, 'removePoint' );
	gui.add( params, 'exportSpline' );
	gui.open();

	/*******
	 * Curves and boxes
	 *********/
	for ( var i = 0; i < splinePointsLength; i ++ ) { addSplineObject( positions[ i ] ); }
	positions = [];

	for ( var i = 0; i < splinePointsLength; i ++ ) { positions.push( splineHelperObjects[ i ].position ); }
	var geometry = new THREE.Geometry();
	for ( var i = 0; i < ARC_SEGMENTS; i ++ ) { geometry.vertices.push( new THREE.Vector3() ); }

	var curve = new THREE.CatmullRomCurve3( positions );
	curve.type = 'catmullrom';
	curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
		color: 0xff0000, opacity: 0.35, linewidth: 2
		} ) );
	curve.mesh.castShadow = true; splines.uniform = curve;

	curve = new THREE.CatmullRomCurve3( positions );
	curve.type = 'centripetal';
	curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
		color: 0x00ff00, opacity: 0.35, linewidth: 2
		} ) );
	curve.mesh.castShadow = true;
	splines.centripetal = curve;

	curve = new THREE.CatmullRomCurve3( positions );
	curve.type = 'chordal';
	curve.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
		color: 0x0000ff, opacity: 0.35, linewidth: 2
		} ) );
	curve.mesh.castShadow = true;
	splines.chordal = curve;

	for ( var k in splines ) {
		var spline = splines[ k ]; scene.add( spline.mesh );
	}

	load( [ new THREE.Vector3( 0, 500, 0 ),
			new THREE.Vector3( -53.56300074753207, 171.49711742836848, -14.495472686253045 ),
			new THREE.Vector3( -91.40118730204415, 176.4306956436485, -6.958271935582161 ),
			new THREE.Vector3( -383.785318791128, 491.1365363371675, 47.869296953772746 ) ] );
	// -- 


	// camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );	
	camera.position.z = 200;
	camera.position.y = 300;
	camera.lookAt(new THREE.Vector3(0,0,0));


	// My stuff
	paramsCatastrophy = { "catastrophyParamA":40, "catastrophyParamB":21, "catastrophyParamC": 11 }
	drawCylinder();
	calculatePosColor();
	console.log("Post calculatePosColor: "); console.log(dataLand);		
	drawGroundThree();
	drawPlane();
	
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
	transformControl.addEventListener( 'change', function( e ) {
		cancelHideTransorm();
	} );
	transformControl.addEventListener( 'mouseDown', function( e ) {
		cancelHideTransorm();
	} );
	transformControl.addEventListener( 'mouseUp', function( e ) {
		delayHideTransform();
	} );
	transformControl.addEventListener( 'objectChange', function( e ) {
		updateSplineOutline();
	} );
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

function onDocumentMouseMove(event) {
	// mouseX = ( event.clientX - windowHalfX ) * 10;
	// mouseY = ( event.clientY - windowHalfY ) * 10;
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
	    var maxRisk = "none";
	    var valueRisk = -1;
	    if (curState.riskAlpha > curState.riskBeta){
	    	if (curState.riskAlpha > curState.riskGamma){ maxRisk = "alpha"; valueRisk = curState.riskAlpha; } 
	    	else { maxRisk = "gamma"; valueRisk = curState.riskGamma;  }
	    } else {
			if (curState.riskBeta > curState.riskGamma){ maxRisk = "beta"; valueRisk = curState.riskBeta; }
	    	else { maxRisk = "gamma"; valueRisk = curState.riskGamma;  }	    	
	    }
	    // Types of maximum risk = unique hue (from red to green, we will keep blue for sea I guess)
	    var colorRisk = new THREE.Color("hsl(0,50%,50%)");
	    // Level of risk = higher saturation
	    
    	console.log("valueRisk: "+valueRisk);

	    switch(maxRisk){
	    	case "alpha":
	    		colorRisk = new THREE.Color("hsl(0.1,"+ Math.round(valueRisk*100) +"% ,50%)");
    		break;	
    		case "beta":
				colorRisk = new THREE.Color("hsl(50,"+ Math.round(valueRisk*100) +"%,50%)");
    		break;
    		case "gamma":
				colorRisk = new THREE.Color("hsl(100,"+ Math.round(valueRisk*100) +"%,50%)");
    		break;
	    }

	    var planeMaterial = new THREE.MeshLambertMaterial({color: colorRisk});
	    var plane = new THREE.Mesh(planeGeometry,planeMaterial);
	    // plane.receiveShadow  = true;
	
	    // rotate and position the plane
	    plane.rotation.x= -0.5*Math.PI;
	    plane.position.x= curState.x;
	    plane.position.y= curState.y;
	    plane.position.z= curState.z;
	    // add the plane to the scene
	    scene.add(plane);
	}

}

function drawCylinder(){
    cylinderGeometry	= new THREE.CylinderGeometry(20, 1, 50, 64,1);
    cylinderMaterial	= new THREE.MeshLambertMaterial({ color: 0x0000CC, opacity: 0.4, transparent: true});
    cylinder	= new THREE.Mesh( cylinderGeometry, cylinderMaterial );
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

	var maximumRiskGlobal = 0.0;
	// This is made up, but probably the part that has crazy potential (potential use for machine learning and interaction here !)
	for(var i =0; i < dataLand.states.length;i++){		
		// Proper math would be calculation based on parameters from the hazard moving
		var distXSquare = ((cylinder.position.x - dataLand.states[i].x) * (cylinder.position.x - dataLand.states[i].x) );
		var distZSquare = ((cylinder.position.z - dataLand.states[i].z) * (cylinder.position.z - dataLand.states[i].z) );
		var distLandCylinder = Math.sqrt( distXSquare 
			// +  (cylinder.position.y-dataLand.states[i].y)^2 
			+ distZSquare );
		console.log("distLandCylinder: "+distLandCylinder+", i: "+i);

		// Added for results to be usable
		var localCalculRiskAlpha = dataLand.states[i].paramA * cylinder.paramsCatastrophy.catastrophyParamA
		*distLandCylinder;
		var localCalculRiskBeta = dataLand.states[i].paramB * cylinder.paramsCatastrophy.catastrophyParamB
		*distLandCylinder;
		var localCalculRiskGamma = dataLand.states[i].paramC * cylinder.paramsCatastrophy.catastrophyParamC
		*distLandCylinder;

		if (localCalculRiskGamma == 0.0){ maximumRiskGlobal = localCalculRiskGamma; }
		var maxLandRisks = Math.max(localCalculRiskAlpha,localCalculRiskBeta, localCalculRiskGamma);
		if ( maximumRiskGlobal < maxLandRisks ){ maximumRiskGlobal = maxLandRisks; }

		// What are the cases based on the calculus?
		if (typeof dataLand.states[i].riskAlpha == "undefined"){ dataLand.states[i].riskAlpha = 0; } 
		if (typeof dataLand.states[i].riskBeta == "undefined"){ dataLand.states[i].riskBeta = 0; }
		if (typeof dataLand.states[i].riskGamma == "undefined"){ dataLand.states[i].riskGamma = 0; }
		dataLand.states[i].riskAlpha = localCalculRiskAlpha;
		dataLand.states[i].riskBeta = localCalculRiskBeta; 
		dataLand.states[i].riskGamma = localCalculRiskGamma; 
	}

	for(var i =0; i < dataLand.states.length;i++){		
		dataLand.states[i].riskAlpha = dataLand.states[i].riskAlpha/maximumRiskGlobal;
		dataLand.states[i].riskBeta = dataLand.states[i].riskBeta/maximumRiskGlobal;
		dataLand.states[i].riskGamma = dataLand.states[i].riskGamma/maximumRiskGlobal;
	}

}



function render() {
	var time = Date.now() * 0.001;
	var rx = Math.sin( time * 0.7 ) * 0.5,
		ry = Math.sin( time * 0.3 ) * 0.5,
		rz = Math.sin( time * 0.2 ) * 0.5;

	// Render code from the webgl_geometry_splines
	splines.uniform.mesh.visible = params.uniform;
	splines.centripetal.mesh.visible = params.centripetal;
	splines.chordal.mesh.visible = params.chordal;

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


	renderer.render( scene, camera );
}

function addPoint() {
	splinePointsLength ++;
	positions.push( addSplineObject().position );
	updateSplineOutline();
}

function removePoint() {
	if ( splinePointsLength <= 4 ) {
		return;
	}
	splinePointsLength --;
	positions.pop();
	scene.remove( splineHelperObjects.pop() );
	updateSplineOutline();
}

function updateSplineOutline() {
	for ( var k in splines ) {
		var spline = splines[ k ];
		splineMesh = spline.mesh;
		for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
			var p = splineMesh.geometry.vertices[ i ];
			p.copy( spline.getPoint( i /  ( ARC_SEGMENTS - 1 ) ) );
		}
		splineMesh.geometry.verticesNeedUpdate = true;
	}
}

function exportSpline() {
	var strplace = [];
	for ( var i = 0; i < splinePointsLength; i ++ ) {
		var p = splineHelperObjects[ i ].position;
		strplace.push( 'new THREE.Vector3({0}, {1}, {2})'.format( p.x, p.y, p.z ) )
	}
	console.log( strplace.join( ',\n' ) );
	var code = '[' + ( strplace.join( ',\n\t' ) ) + ']';
	prompt( 'copy and paste code', code );
}

function addSplineObject( position ) {
	var material = new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } );
	var object = new THREE.Mesh( geometry, material );
	if ( position ) {
		object.position.copy( position );
	} else {
		object.position.x = Math.random() * 1000 - 500;
		object.position.y = Math.random() * 600;
		object.position.z = Math.random() * 800 - 400;
	}

	object.castShadow = true;
	object.receiveShadow = true;
	scene.add( object );
	splineHelperObjects.push( object );
	return object;
}

function addPoint() {
	splinePointsLength ++;
	positions.push( addSplineObject().position );
	updateSplineOutline();
}

function removePoint() {
	if ( splinePointsLength <= 4 ) { return; }
	splinePointsLength --;
	positions.pop();
	scene.remove( splineHelperObjects.pop() );
	updateSplineOutline();
}

function load( new_positions ) {
	while ( new_positions.length > positions.length ) { addPoint(); }
	while ( new_positions.length < positions.length ) { removePoint(); }
	for ( var i = 0; i < positions.length; i ++ ) {
		positions[ i ].copy( new_positions[ i ] );
	}
	updateSplineOutline();
}

function cancelHideTransorm() {
	if ( hiding ) clearTimeout( hiding );
}

function delayHideTransform() {
	cancelHideTransorm();
	hideTransform();
}

function hideTransform() {
	hiding = setTimeout( function() {
		transformControl.detach( transformControl.object );
	}, 2500 )
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
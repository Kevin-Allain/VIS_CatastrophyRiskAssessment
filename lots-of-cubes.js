var container, stats;
var camera, scene, renderer;
var geometry, group;
var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;
// document.addEventListener( 'mousemove', onDocumentMouseMove, false );

// Action code
d3.json("land-grid.json", function(error, graph) {
  	console.log(error);
  	console.log(graph);
	init();
	animate();

})
// ----

function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	// camera
	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );	
	camera.position.z = 500;

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xffffff );
	scene.fog = new THREE.Fog( 0xffffff, 1, 10000 );

	var geometry = new THREE.BoxGeometry( 100, 100, 100 );
	var material = new THREE.MeshNormalMaterial();
	group = new THREE.Group();
	for ( var i = 0; i < 10; i ++ ) {
		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.x = Math.random() * 2500 - 1500;
		mesh.position.y = Math.random() * 2500 - 1500;
		mesh.position.z = Math.random() * 2500 - 1500;
		
		mesh.rotation.x = Math.random() * 2 * Math.PI;
		mesh.rotation.y = Math.random() * 2 * Math.PI;
		mesh.matrixAutoUpdate = false;
		mesh.updateMatrix();
		group.add( mesh );
	}
	scene.add( group );
	// Rendered
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );

	// controls
	// controls = new THREE.FirstPersonControls( camera, renderer.domElement );
	controls = new THREE.OrbitControls( camera, renderer.domElement );


	container.appendChild( renderer.domElement );
	stats = new Stats();
	container.appendChild( stats.dom );
	//
	window.addEventListener( 'resize', onWindowResize, false );
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
}

function render() {
	var time = Date.now() * 0.001;
	var rx = Math.sin( time * 0.7 ) * 0.5,
		ry = Math.sin( time * 0.3 ) * 0.5,
		rz = Math.sin( time * 0.2 ) * 0.5;
	// camera.position.x += ( mouseX - camera.position.x ) * .05;
	// camera.position.y += ( - mouseY - camera.position.y ) * .05;
	// camera.lookAt( scene.position );

	// group.rotation.x = rx;
	// group.rotation.y = ry;
	// group.rotation.z = rz;
	renderer.render( scene, camera );
}
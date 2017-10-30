<!DOCTYPE html>
<html lang="en">
	<head>
		<title>three.js webgl - lines - cubes - colors</title>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
		<style>
			body {
				background-color: #000000;
				margin: 0px;
				overflow: hidden;
			}
			a {
				color:#0078ff;
			}
			#info {
				position: absolute;
				top: 10px; width: 100%;
				color: #ffffff;
				padding: 5px;
				font-family: Monospace;
				font-size: 13px;
				text-align: center;
				z-index:100;
			}
			a {
				color: orange;
				text-decoration: none;
			}
			a:hover {
				color: #0080ff;
			}
		</style>
	</head>
	<body>

		<div id="info">
			<a href="http://threejs.org" target="_blank" rel="noopener">three.js</a> - color lines WebGL demo
			[<a href="http://en.wikipedia.org/wiki/Hilbert_curve">Hilbert curve</a> thanks to <a href="http://www.openprocessing.org/visuals/?visualID=15599">Thomas Diewald</a>]
		</div>

		<script src="../build/three.js"></script>

		<script src="js/geometries/hilbert3D.js"></script>

		<script src="js/shaders/ConvolutionShader.js"></script>
		<script src="js/shaders/CopyShader.js"></script>
		<script src="js/shaders/FXAAShader.js"></script>

		<script src="js/postprocessing/EffectComposer.js"></script>
		<script src="js/postprocessing/MaskPass.js"></script>
		<script src="js/postprocessing/RenderPass.js"></script>
		<script src="js/postprocessing/ShaderPass.js"></script>
		<script src="js/postprocessing/BloomPass.js"></script>

		<script src="js/Detector.js"></script>
		<script src="js/libs/stats.min.js"></script>

		<script>
			if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
			var effectFXAA;
			var mouseX = 0, mouseY = 0,
			windowHalfX = window.innerWidth / 2,
			windowHalfY = window.innerHeight / 2,
			camera, scene, renderer, material, composer;
			init();
			animate();
			function init() {
				var i, container;
				container = document.createElement( 'div' );
				document.body.appendChild( container );
				camera = new THREE.PerspectiveCamera( 33, window.innerWidth / window.innerHeight, 1, 10000 );
				camera.position.z = 700;
				scene = new THREE.Scene();
				renderer = new THREE.WebGLRenderer( { antialias: false } );
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				renderer.autoClear = false;
				container.appendChild( renderer.domElement );
				var geometry = new THREE.Geometry(),
					geometry2 = new THREE.Geometry(),
					geometry3 = new THREE.Geometry(),
					points = hilbert3D( new THREE.Vector3( 0,0,0 ), 200.0, 2, 0, 1, 2, 3, 4, 5, 6, 7 ),
					colors = [], colors2 = [], colors3 = [];
				for ( i = 0; i < points.length; i ++ ) {
					geometry.vertices.push( points[ i ] );
					colors[ i ] = new THREE.Color( 0xffffff );
					colors[ i ].setHSL( 0.6, 1.0, Math.max( 0, ( 200 - points[ i ].x ) / 400 ) * 0.5 + 0.5 );
					colors2[ i ] = new THREE.Color( 0xffffff );
					colors2[ i ].setHSL( 0.3, 1.0, Math.max( 0, ( 200 + points[ i ].x ) / 400 ) * 0.5 );
					colors3[ i ] = new THREE.Color( 0xffffff );
					colors3[ i ].setHSL( i / points.length, 1.0, 0.5 );
				}
				geometry2.vertices = geometry3.vertices = geometry.vertices;
				geometry.colors = colors;
				geometry2.colors = colors2;
				geometry3.colors = colors3;
				// lines
				material = new THREE.LineBasicMaterial( { color: 0xffffff, opacity: 1, linewidth: 3, vertexColors: THREE.VertexColors } );
				var line, p, scale = 0.3, d = 225;
				var parameters =  [
					[ material, scale*1.5, [-d,0,0],  geometry ],
					[ material, scale*1.5, [0,0,0],  geometry2 ],
					[ material, scale*1.5, [d,0,0],  geometry3 ]
				];
				for ( i = 0; i < parameters.length; ++i ) {
					p = parameters[ i ];
					line = new THREE.Line( p[ 3 ],  p[ 0 ] );
					line.scale.x = line.scale.y = line.scale.z =  p[ 1 ];
					line.position.x = p[ 2 ][ 0 ];
					line.position.y = p[ 2 ][ 1 ];
					line.position.z = p[ 2 ][ 2 ];
					scene.add( line );
				}
				//
				stats = new Stats();
				//container.appendChild( stats.dom );
				//
				document.addEventListener( 'mousemove', onDocumentMouseMove, false );
				document.addEventListener( 'touchstart', onDocumentTouchStart, false );
				document.addEventListener( 'touchmove', onDocumentTouchMove, false );
				//
				var renderModel = new THREE.RenderPass( scene, camera );
				var effectBloom = new THREE.BloomPass( 1.3 );
				var effectCopy = new THREE.ShaderPass( THREE.CopyShader );
				effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
				var width = window.innerWidth || 2;
				var height = window.innerHeight || 2;
				effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width, 1 / height );
				effectCopy.renderToScreen = true;
				composer = new THREE.EffectComposer( renderer );
				composer.addPass( renderModel );
				composer.addPass( effectFXAA );
				composer.addPass( effectBloom );
				composer.addPass( effectCopy );
				//
				window.addEventListener( 'resize', onWindowResize, false );
			}
			function onWindowResize() {
				windowHalfX = window.innerWidth / 2;
				windowHalfY = window.innerHeight / 2;
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize( window.innerWidth, window.innerHeight );
				effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
				composer.reset();
			}
			//
			function onDocumentMouseMove( event ) {
				mouseX = event.clientX - windowHalfX;
				mouseY = event.clientY - windowHalfY;
			}
			function onDocumentTouchStart( event ) {
				if ( event.touches.length > 1 ) {
					event.preventDefault();
					mouseX = event.touches[ 0 ].pageX - windowHalfX;
					mouseY = event.touches[ 0 ].pageY - windowHalfY;
				}
			}
			function onDocumentTouchMove( event ) {
				if ( event.touches.length == 1 ) {
					event.preventDefault();
					mouseX = event.touches[ 0 ].pageX - windowHalfX;
					mouseY = event.touches[ 0 ].pageY - windowHalfY;
				}
			}
			//
			function animate() {
				requestAnimationFrame( animate );
				render();
				stats.update();
			}
			function render() {
				camera.position.x += ( mouseX - camera.position.x ) * .05;
				camera.position.y += ( - mouseY + 200 - camera.position.y ) * .05;
				camera.lookAt( scene.position );
				var time = Date.now() * 0.0005;
				for ( var i = 0; i < scene.children.length; i ++ ) {
					var object = scene.children[ i ];
					if ( object instanceof THREE.Line ) object.rotation.y = time * ( i % 2 ? 1 : -1 );
				}
				renderer.clear();
				composer.render();
			}
		</script>
	</body>
</html>
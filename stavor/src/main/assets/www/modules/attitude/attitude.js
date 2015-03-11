// RENDERER
var att_renderer, att_container;
if ( Detector.webgl ){
	att_renderer = new THREE.WebGLRenderer( { antialias:true } );
	//att_renderer.autoClear = true;
	//att_renderer.autoClearColor = true;
	//att_renderer.setClearColor(0xff0000, 1);
	/*if(config.performance_level<=2)
		canvasMode(config.performance_level);*/
}else{
	att_renderer = new THREE.CanvasRenderer();
	alert('WebGL not supported in this device');
	//canvasMode(1);
}
//att_renderer.setClearColor(0xff0000, 1);
att_renderer.setSize(window.innerWidth, window.innerHeight);
att_container = document.getElementById( 'attitude' );
att_container.innerHTML = "";
att_container.appendChild( att_renderer.domElement );
att_renderer.context.canvas.addEventListener("webglcontextlost", function(event) {
	event.preventDefault();
	// animationID would have been set by your call to requestAnimationFrame
	cancelAnimationFrame(requestId); 
}, false);

att_renderer.context.canvas.addEventListener("webglcontextrestored", function(event) {
   // Do something 
	alert("WebGL Context Lost");
}, false);

var textureAttitudeSky = THREE.ImageUtils.loadTexture('modules/attitude/textures/sky/stars.jpg');
var noiseTexture = new THREE.ImageUtils.loadTexture( 'modules/attitude/textures/lava/cloud.png' );
noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;	
var waterTexture = new THREE.ImageUtils.loadTexture( 'modules/attitude/textures/water/engine.jpg' );
waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping; 



var Attitude = function () 
{
	// Global pointers
	var global = global_simulation.config.global;
	var config = global_simulation.config.attitude;
	var results = global_simulation.results.spacecraft;
	var segments = global_3d_segments.attitude;
	
	
	var selected_view = global_cameras.attitude.view_mode;
	// MAIN
	//***********************************************************************************************************************
	//		GLOBAL VARIABLES
	//***********************************************************************************************************************
	//setLoadingProgress(5);
	var scene, camera, controls, stats, light, delta;
	//Ref objects
	var objRefAxis, objRefAxisLabelX, objRefAxisLabelY, objRefAxisLabelZ, objRefSphere, objRefCircleX, objRefCircleY, objRefCircleZ, objRefSphere;
	var miniSphereX,miniSphereXX,miniSphereY,miniSphereYY,miniSphereZ,miniSphereZZ;
	var objSky;
	var sun, sunSurface, sunGlow, sunLight, lineSun, spriteSun, contextSun;
	var earth, earthSurface, lineEarth, spriteEarth, contextEarth;
	var plane_orb, plane_xy, incl_arc, spriteInclination, contextInclination;
	//var keyboard = new THREEx.KeyboardState();
	var clock = new THREE.Clock();
	var spacecraft, spacecraftAxis, engSurfaceLeft, engSurfaceRight, engBasicLeft, engBasicRight;
	var	arrow_vel, arrow_accel, arrow_momentum, target_a, vector_a, direction_a;
	var long_arc, lat_arc, long_sprite, lat_sprite, lineAngle, lineSpheric, lineSpheric2;
	var vectors_arc, vectors_sprite;
	var origin = new THREE.Vector3(0,0,0);

	var fontsizeSun, borderColorSun, borderThicknessSun, backgroundColorSun, fontColorSun;
	var fontsizeEarth, borderColorEarth, borderThicknessEarth, backgroundColorEarth, fontColorEarth;
	var fontsizeInclination, borderColorInclination, borderThicknessInclination, backgroundColorInclination, fontColorInclination;
	var fontsizeLongitude, borderColorLongitude, borderThicknessLongitude, backgroundColorLongitude, fontColorLongitude;
	var fontsizeLatitude, borderColorLatitude, borderThicknessLatitude, backgroundColorLatitude, fontColorLatitude;
	var fontsizeAngles, borderColorAngles, borderThicknessAngles, backgroundColorAngles, fontColorAngles;

	var fps_update_counter = 0;
	var gui, parameters;
	var axis_x = new THREE.Vector3(1,0,0);
	var axis_z = new THREE.Vector3(0,0,1);

	var textureEarth, textureSun, textureSun2, textureSun3, textureSun4;
	//-----------------------------------------------------------------------------------------------------------------------
	//			SCENE PARAMS (Hard-coded parameters)
	//-----------------------------------------------------------------------------------------------------------------------
	//var cam_init_pos  = new THREE.Vector3(300,300,300);
	var cam_view_angle = 25;
	var cam_rend_near = 0.1;
	var cam_rend_far = 20000;
	
	var sphere_radius = 100;
	var miniSphere_radius = 5;
	var miniSphere_margin = 4;
	var torus_radius = sphere_radius;
	var torus_tube = 0.5;
	
	var sc_scale = 1.5;

	var init_sc_dir_xyz = new THREE.Vector3(0.577350269,0.577350269,0.577350269);
	var init_sc_up_xyz = new THREE.Vector3(-0.577350269,-0.577350269,0.577350269);
	var init_sc_dir_rear = new THREE.Vector3(0,0,-1);
	var init_sc_up_rear = new THREE.Vector3(0,1,0);
	var init_sc_dir_front = new THREE.Vector3(0,0,1);
	var init_sc_up_front = new THREE.Vector3(0,1,0);
	var init_sc_dir_top = new THREE.Vector3(0,1,0);
	var init_sc_up_top = new THREE.Vector3(0,0,1);
	var init_sc_dir_bottom = new THREE.Vector3(0,-1,0);
	var init_sc_up_bottom = new THREE.Vector3(0,0,1);
	var init_sc_dir_left = new THREE.Vector3(1,0,0);
	var init_sc_up_left = new THREE.Vector3(0,1,0);
	var init_sc_dir_right = new THREE.Vector3(-1,0,0);
	var init_sc_up_right = new THREE.Vector3(0,1,0);

	var sc_axis_lenght = sphere_radius*0.4;
	var sc_body_color = 0xDDDDDD;
	var sc_window_color = 0x00d4ff;
	var sc_engine_color = 0x545454;
	var sc_eng_solid_color = 0x5d00ff;//For when not using texture

	var sun_radius = 5;
	var sun_solid_color = 0xffb600 ;//For when not using textures
	var sun_obj_dist = sphere_radius + 10;
	
	var earth_radius = 8;
	var earth_solid_color = 0x00bfff ;//For when not using textures
	var earth_obj_dist = sphere_radius + earth_radius;

	var planes_width = sphere_radius+earth_radius*2;
	//var plane_theta_seg = 30;
	//var plane_phi_seg = 10;

	var arc_inclination_radius = sphere_radius + torus_tube +1;
	var arc_radius = sphere_radius+earth_radius*2;
	var arc_sphcoord_radius = 3*sphere_radius/4;
	var arc_vectors_radius = 3*sphere_radius/4;
	var arc_sprite_radius = arc_radius+3;
	var arc_tube = 0.5;
	var arc_color = 0xFFFF00;
	
	var arrow_head_length = 9;
	var arrow_head_width = 5;
	var arrow_max_length = sphere_radius;
	var target_head_length = 2;
	var target_head_width = 1;
	var target_length = sphere_radius + target_head_width;
	var momentum_length = sphere_radius/3;
	var momentum_head_length = 8;
	var momentum_head_width = 7;	

//-----------------------------------------------------------------------------------------------------------------------
//			DEBUG OPTIONS
//-----------------------------------------------------------------------------------------------------------------------

	var auto_rotate_sc = false;// If true, it ignores the simulator attitude and rotates the spacecraft.
		
//-----------------------------------------------------------------------------------------------------------------------

	init();
	//setLoadingProgress(100);
	animate();

// FUNCTIONS 		

	
	var requestId;
	function animate() 
	{
		requestId = requestAnimationFrame( animate );
		render();		
		update();
	}
	function render() 
	{
		att_renderer.render( scene, camera );
	}
	function update()
	{	
		if(global_current_visualization == enum_visualizations.ATTITUDE ||
			!global_renderers_preloaded.attitude){
			if(!global_renderers_preloaded.attitude){
				global_renderers_preloaded.attitude = true;
			}
			delta = clock.getDelta();
			//console.log("UPDATE ATTITUDE");
			//Controls
			controls.update();
			//View
			updateView();
			
			updateSky();
			updateReference();
			updateSpacecraft();
			updateScene();
			
			updateAngles();
			updateSun();
			updateEarth();
			updateIndicators();
		}
	}
	function init() 
	{
		//***********************************************************************************************************************
		//		SCENE ELEMENTS
		//***********************************************************************************************************************
		initScene();
		initSky();
		initReference();
		initSpacecraft();
		//***********************************************************************************************************************
		//		DYNAMIC ELEMENTS
		//***********************************************************************************************************************
		initAngles();
		initIndicators();
		initSun();
		initEarth();
		changeView(selected_view);
		
		global_delayed_loading.visualization.attitude = true;
		setLoadingText("Attitude module loaded!");
		hideSplash();
	}
	
	function initSky(){
		// create the geometry sphere
		var sky_geometry  = new THREE.SphereGeometry(1000, 32, 32);
		// create the material, using a texture of startfield
		var sky_material  = new THREE.MeshBasicMaterial();
		sky_material.map   = textureAttitudeSky;
		sky_material.map.wrapS = sky_material.map.wrapT = THREE.RepeatWrapping;
		sky_material.map.repeat.set( 8, 8 ); 
		sky_material.side  = THREE.BackSide;
		// create the mesh based on geometry and material
		objSky  = new THREE.Mesh(sky_geometry, sky_material);
		objSky.name = "SKY";
		scene.add(objSky);
	}
	function updateSky(){
		objSky.visible = config.show_sky;
	}
	
//***********************************************************************************************************************
//		                                                ANGLES
//***********************************************************************************************************************
	function initAngles(){
		//-----------------------------------------------------------------------------------------------------------------------
		//			REFERENCE PLANES
		//-----------------------------------------------------------------------------------------------------------------------
//Show Planes: config.show_orbital_plane

		// points that define shape
		var pts = [], hls = [];
		var radius = sphere_radius;
		var radius_ext = planes_width;

		for ( i = 0; i < segments.plane_resolution; i ++ ) {
			var a = 2*Math.PI * i / segments.plane_resolution;
			pts.push( new THREE.Vector2 ( Math.cos( a ) * radius_ext, Math.sin( a ) * radius_ext ) );
			hls.push( new THREE.Vector2 ( Math.cos( a ) * radius, Math.sin( a ) * radius ) );
		}

		// shape to extrude
		var shape = new THREE.Shape( pts );
		var holesPath = new THREE.Path(hls);
		shape.holes.push(holesPath);

		// extrude options
		var options = { 
			amount: 1,              // default 100, only used when path is null
			bevelEnabled: false, 
			bevelSegments: 2, 
			steps: 1,                // default 1, try 3 if path defined
			extrudePath: null        // or path
		};

		// geometry
		var geometry = new THREE.ExtrudeGeometry( shape, options );

		// mesh
		plane_xy = new THREE.Mesh( 
			geometry, 
			new THREE.MeshBasicMaterial( { color: config.plane_xy_color, transparent: true, opacity: 0.2 } )
		);
		scene.add( plane_xy );

		// mesh
		plane_orb = new THREE.Mesh( 
			geometry, 
			new THREE.MeshBasicMaterial( { color: config.plane_orb_color, transparent: true, opacity: 0.2 } )
		);
		scene.add( plane_orb );

		//Compute inclination quaternion
		var norm_orbital_plane = results.velocity.clone().normalize().cross(results.earth_direction.clone().normalize());
		var norm_rotation_earth = new THREE.Vector3(0,0,1);
		var incl_quat = new THREE.Quaternion().setFromUnitVectors( norm_rotation_earth, norm_orbital_plane );

		//Rotate orbital plane
		plane_orb.quaternion.copy(incl_quat);
		plane_orb.matrixWorldNeedsUpdate = true;
		plane_orb.updateMatrix();

//Planes-Inclination: config.show_inclination
		//Compute instant inclination angle
		var inclination = Math.asin(results.earth_direction.z/results.earth_direction.length());
		//console.debug(inclination);

		//Compute arc angle clip points
		var clip1 = results.earth_direction.clone().normalize().multiplyScalar(sphere_radius);
		var clip2 = results.earth_direction.clone().setZ(0).normalize().multiplyScalar(sphere_radius);
		var clip_mid = clip1.clone().add(clip2.clone());

		//Draw Arc
		var spline = new THREE.QuadraticBezierCurve3(clip1.clone(),
		   clip_mid.clone(),
		   clip2.clone());

		var material = new THREE.LineBasicMaterial({
			color: arc_color,
		});

		var geometry = new THREE.Geometry();
		var splinePoints = spline.getPoints(segments.arc_resolution);

		for(var i = 0; i < splinePoints.length; i++){
			geometry.vertices.push(splinePoints[i]);  
		}

		incl_arc = new THREE.Line(geometry, material);
		scene.add( incl_arc );

		//Sprite
		spriteInclination = makeTextSprite( 4, " i=0º ",
			{ fontsize: 50, borderColor: {r:0, g:0, b:0, a:1.0}, borderThickness: 1, backgroundColor: {r:0, g:0, b:0, a:0.5}, fontColor: {r:255, g:255, b:0, a:1.0} } );
		spriteInclination.position = clip_mid.clone();
		scene.add(spriteInclination);

		scene.add( incl_arc );

		//plane_orb.rotation.x += 0.3;
		scene.add( plane_orb );

//Spheric coordinates: config.show_spheric_coords

		var sphcoord_target = results.earth_direction.clone().normalize().multiplyScalar(arc_sphcoord_radius);
		var sphcoord_cross = sphcoord_target.clone().setZ(0).normalize().multiplyScalar(arc_sphcoord_radius);
		var sphcoord_ref = axis_x.clone().multiplyScalar(arc_sphcoord_radius);
		var sphcoord_long_mid = sphcoord_ref.clone().add(sphcoord_cross.clone());
		var sphcoord_lat_mid = sphcoord_cross.clone().add(sphcoord_target.clone());  

		var lat=Math.atan2(sphcoord_target.z,1);
		var lng=Math.atan2(sphcoord_target.y,sphcoord_target.x);

		//Set discontinued lines
		var lineGeometry = new THREE.Geometry();
		var vertArray = lineGeometry.vertices;
		vertArray.push( sphcoord_target.clone(), new THREE.Vector3(0, 0, 0) );
		lineGeometry.computeLineDistances();
		var lineMaterial = new THREE.LineDashedMaterial( { color: arc_color, dashSize: 1, gapSize: 3 } );
		lineSpheric = new THREE.Line( lineGeometry, lineMaterial );
		scene.add(lineSpheric);
		//Set discontinued lines
		var lineGeometry = new THREE.Geometry();
		var vertArray = lineGeometry.vertices;
		vertArray.push( sphcoord_cross.clone(), new THREE.Vector3(0, 0, 0) );
		lineGeometry.computeLineDistances();
		var lineMaterial = new THREE.LineDashedMaterial( { color: arc_color, dashSize: 1, gapSize: 3 } );
		lineSpheric2 = new THREE.Line( lineGeometry, lineMaterial );
		scene.add(lineSpheric2);

		//create longitude arc

		var spline = new THREE.QuadraticBezierCurve3(sphcoord_cross.clone(),
		   sphcoord_long_mid.clone(),
		   sphcoord_ref.clone());

		var material = new THREE.LineBasicMaterial({
			color: arc_color,
		});

		var geometry = new THREE.Geometry();
		var splinePoints = spline.getPoints(segments.arc_resolution);

		for(var i = 0; i < splinePoints.length; i++){
			geometry.vertices.push(splinePoints[i]);  
		}

		long_arc = new THREE.Line(geometry, material);
		scene.add( long_arc );

		//Set longitude arc sprite
		long_sprite = makeTextSprite( 5, " "+parseFloat(Math.round(lng * 180) / Math.PI).toFixed(1)+"º ",
				{ fontsize: 50, borderColor: {r:0, g:0, b:0, a:1.0}, borderThickness: 1, backgroundColor: {r:0, g:0, b:0, a:0.5}, fontColor: {r:255, g:255, b:0, a:1.0} } );
		long_sprite.position.set( sphcoord_long_mid.x, sphcoord_long_mid.y, sphcoord_long_mid.z);
		scene.add(long_sprite);

		//create latittude arc
		var spline = new THREE.QuadraticBezierCurve3(sphcoord_target.clone(),
		   sphcoord_lat_mid.clone(),
		   sphcoord_cross.clone());

		var material = new THREE.LineBasicMaterial({
			color: arc_color,
		});

		var geometry = new THREE.Geometry();
		var splinePoints = spline.getPoints(segments.arc_resolution);

		for(var i = 0; i < splinePoints.length; i++){
			geometry.vertices.push(splinePoints[i]);  
		}

		lat_arc = new THREE.Line(geometry, material);
		scene.add( lat_arc );

		//Set latittude arc sprite
		lat_sprite = makeTextSprite( 6, " "+parseFloat(Math.round(lat * 180) / Math.PI).toFixed(1)+"º ",
				{ fontsize: 50, borderColor: {r:0, g:0, b:0, a:1.0}, borderThickness: 1, backgroundColor: {r:0, g:0, b:0, a:0.5}, fontColor: {r:255, g:255, b:0, a:1.0} } );
		lat_sprite.position = sphcoord_lat_mid.clone();
		scene.add(lat_sprite);

//Angles vectors: config.show_vectors_angle
			
		var angle_vector_start = results.earth_direction.clone().normalize().multiplyScalar(arc_vectors_radius);
		var angle_vector_end = results.momentum.clone().normalize().multiplyScalar(arc_vectors_radius);
		var angle_vector_mid = angle_vector_start.clone().add(angle_vector_end.clone());

		var dist_angle = angle_vector_start.clone().angleTo(angle_vector_end);

		//Set discontinued lines
		var lineGeometry = new THREE.Geometry();
		var vertArray = lineGeometry.vertices;
		vertArray.push( angle_vector_start.clone(), new THREE.Vector3(0, 0, 0) );
		lineGeometry.computeLineDistances();
		var lineMaterial = new THREE.LineDashedMaterial( { color: arc_color, dashSize: 1, gapSize: 3 } );
		lineAngle = new THREE.Line( lineGeometry, lineMaterial );
		scene.add(lineAngle);

		var lineGeometry2 = new THREE.Geometry();
		var vertArray2 = lineGeometry2.vertices;
		vertArray2.push( angle_vector_end.clone(), new THREE.Vector3(0, 0, 0) );
		lineGeometry2.computeLineDistances();
		var lineMaterial2 = new THREE.LineDashedMaterial( { color: arc_color, dashSize: 1, gapSize: 3 } );
		lineAngle2 = new THREE.Line( lineGeometry2, lineMaterial2 );
		scene.add(lineAngle2);

		var spline = new THREE.QuadraticBezierCurve3(angle_vector_start.clone(),
		   angle_vector_mid.clone(),
		   angle_vector_end.clone());

		var material = new THREE.LineBasicMaterial({
			color: arc_color,
		});

		var geometry = new THREE.Geometry();
		var splinePoints = spline.getPoints(segments.arc_resolution);

		for(var i = 0; i < splinePoints.length; i++){
			geometry.vertices.push(splinePoints[i]);  
		}

		vectors_arc = new THREE.Line(geometry, material);
		scene.add( vectors_arc );

		//Set angles arc sprite
		vectors_sprite = makeTextSprite( 7, " "+parseFloat(Math.round(dist_angle * 180) / Math.PI).toFixed(1)+"º ",
				{ fontsize: 50, borderColor: {r:0, g:0, b:0, a:1.0}, borderThickness: 1, backgroundColor: {r:0, g:0, b:0, a:0.5}, fontColor: {r:255, g:255, b:0, a:1.0} } );
		vectors_sprite.position = angle_vector_mid.clone().multiplyScalar(0.7);
		scene.add(vectors_sprite);
	}
	function updateAngles(){
		//-----------------------------------------------------------------------------------------------------------------------
		//			PLANES UPDATE
		//-----------------------------------------------------------------------------------------------------------------------

		plane_orb.visible = config.show_orbital_plane;
		plane_xy.visible = config.show_orbital_plane;
		incl_arc.visible = config.show_inclination;
		spriteInclination.visible = config.show_inclination;
		if(config.show_orbital_plane){
			if("#"+plane_orb.material.color.getHexString() != config.plane_orb_color){
				plane_orb.material.color.setHex(parseInt("0x"+config.plane_orb_color.substr(1,config.plane_orb_color.length)));
			}
			if("#"+plane_xy.material.color.getHexString() != config.plane_xy_color){
				plane_xy.material.color.setHex(parseInt("0x"+config.plane_xy_color.substr(1,config.plane_xy_color.length)));
			}
		
			//Compute inclination quaternion
			var norm_orbital_plane = results.velocity.clone().normalize().cross(results.earth_direction.clone().normalize());
			var norm_rotation_earth = new THREE.Vector3(0,0,1);
			var incl_quat = new THREE.Quaternion().setFromUnitVectors( norm_rotation_earth, norm_orbital_plane );

			//Rotate orbital plane
			plane_orb.quaternion.copy(incl_quat);

			if(config.show_inclination){
				//Compute instant inclination angle
				var inclination = Math.asin(results.earth_direction.z/results.earth_direction.length());
				
				//ReDraw Arc
				scene.remove(incl_arc);

				
				//Compute arc angle clip points
				var clip1 = results.earth_direction.clone().normalize().multiplyScalar(arc_inclination_radius);
				var clip2 = results.earth_direction.clone().setZ(0).normalize().multiplyScalar(arc_inclination_radius);
				var clip_mid = clip1.clone().add(clip2.clone()).normalize().multiplyScalar(arc_inclination_radius);


				var clip_pre = clip1.clone().add(clip_mid.clone()).normalize().multiplyScalar(arc_inclination_radius); 
				var clip_post = clip_mid.clone().add(clip2.clone()).normalize().multiplyScalar(arc_inclination_radius); 
				var clip_preA = clip1.clone().add(clip_pre.clone()).normalize().multiplyScalar(arc_inclination_radius); 
				var clip_preB = clip_pre.clone().add(clip_mid.clone()).normalize().multiplyScalar(arc_inclination_radius);
				var clip_postA = clip_mid.clone().add(clip_post.clone()).normalize().multiplyScalar(arc_inclination_radius); 
				var clip_postB = clip_post.clone().add(clip2.clone()).normalize().multiplyScalar(arc_inclination_radius);

				//Draw Arc
				var spline = new THREE.SplineCurve3([
					clip1.clone(),
					clip_preA.clone(),
					clip_pre.clone(),
					clip_preB.clone(),
					clip_mid.clone(),
					clip_postA.clone(),
					clip_post.clone(),
					clip_postB.clone(),
					clip2.clone()]
				);

				var material = new THREE.LineBasicMaterial({
					color: arc_color,
				});

				var geometry = new THREE.Geometry();
				var splinePoints = spline.getPoints(segments.arc_resolution);

				for(var i = 0; i < splinePoints.length; i++){
					geometry.vertices.push(splinePoints[i]);  
				}

				incl_arc = new THREE.Line(geometry, material);
				scene.add( incl_arc );

				updateInclinationSprite(inclination);
				spriteInclination.position = clip_mid.clone().normalize().multiplyScalar(arc_radius);
			}
		}
		long_arc.visible = config.show_spheric_coords;
		long_sprite.visible = config.show_spheric_coords;
		lat_arc.visible = config.show_spheric_coords;
		lat_sprite.visible = config.show_spheric_coords;
		lineSpheric.visible = config.show_spheric_coords;
		lineSpheric2.visible = config.show_spheric_coords;
		if(config.show_spheric_coords){
			
			var sphcoord_target;
			switch(config.spheric_coords_selection){
				case enum_basic_indicators.EARTH:
					sphcoord_target = results.earth_direction.clone().normalize().multiplyScalar(arc_sphcoord_radius);
					break;
				case enum_basic_indicators.SUN:
					sphcoord_target = results.sun_direction.clone().normalize().multiplyScalar(arc_sphcoord_radius);
					break;
				case enum_basic_indicators.VELOCITY:
					sphcoord_target = results.velocity.clone().normalize().multiplyScalar(arc_sphcoord_radius);
					break;
				case enum_basic_indicators.ACCELERATION:
					sphcoord_target = results.acceleration.clone().normalize().multiplyScalar(arc_sphcoord_radius);
					break;
				case enum_basic_indicators.MOMENTUM:
					sphcoord_target = results.momentum.clone().normalize().multiplyScalar(arc_sphcoord_radius);
					break;
				default:
					sphcoord_target = results.velocity.clone().normalize().multiplyScalar(arc_sphcoord_radius);
					break;
			}


			var sphcoord_cross = sphcoord_target.clone().setZ(0).normalize().multiplyScalar(arc_sphcoord_radius);
			var sphcoord_ref = axis_x.clone().multiplyScalar(arc_sphcoord_radius);
			var sphcoord_long_mid = sphcoord_ref.clone().add(sphcoord_cross.clone()).normalize().multiplyScalar(arc_sphcoord_radius);
			var sphcoord_lat_mid = sphcoord_cross.clone().add(sphcoord_target.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 

			var sphcoord_long_pre = sphcoord_ref.clone().add(sphcoord_long_mid.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var sphcoord_long_post = sphcoord_long_mid.clone().add(sphcoord_cross.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var sphcoord_long_preA = sphcoord_ref.clone().add(sphcoord_long_pre.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var sphcoord_long_preB = sphcoord_long_pre.clone().add(sphcoord_long_mid.clone()).normalize().multiplyScalar(arc_sphcoord_radius);
			var sphcoord_long_postA = sphcoord_long_mid.clone().add(sphcoord_long_post.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var sphcoord_long_postB = sphcoord_long_post.clone().add(sphcoord_cross.clone()).normalize().multiplyScalar(arc_sphcoord_radius);

			var sphcoord_lat_pre = sphcoord_cross.clone().add(sphcoord_lat_mid.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var sphcoord_lat_post = sphcoord_lat_mid.clone().add(sphcoord_target.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var sphcoord_lat_preA = sphcoord_cross.clone().add(sphcoord_lat_pre.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var sphcoord_lat_preB = sphcoord_lat_pre.clone().add(sphcoord_lat_mid.clone()).normalize().multiplyScalar(arc_sphcoord_radius);
			var sphcoord_lat_postA = sphcoord_lat_mid.clone().add(sphcoord_lat_post.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var sphcoord_lat_postB = sphcoord_lat_post.clone().add(sphcoord_target.clone()).normalize().multiplyScalar(arc_sphcoord_radius);

			var lat=Math.atan2(sphcoord_target.z,1);
			var lng=Math.atan2(sphcoord_target.y,sphcoord_target.x);

			// LINES
			lineSpheric.geometry.vertices[0].set(sphcoord_target.x,sphcoord_target.y,sphcoord_target.z);
			lineSpheric.geometry.computeLineDistances();
			lineSpheric.geometry.verticesNeedUpdate = true;

			lineSpheric2.geometry.vertices[0].set(sphcoord_cross.x,sphcoord_cross.y,sphcoord_cross.z);
			lineSpheric2.geometry.computeLineDistances();
			lineSpheric2.geometry.verticesNeedUpdate = true;

			//update longitude arc
			scene.remove( long_arc );
			var spline = new THREE.SplineCurve3([
				sphcoord_cross.clone(),
				sphcoord_long_postB.clone(),
				sphcoord_long_post.clone(),
				sphcoord_long_postA.clone(),
				sphcoord_long_mid.clone(),
				sphcoord_long_preB.clone(),
				sphcoord_long_pre.clone(),
				sphcoord_long_preA.clone(),
				sphcoord_ref.clone()
			]);

			var material = new THREE.LineBasicMaterial({
				color: arc_color,
			});

			var geometry = new THREE.Geometry();
			var splinePoints = spline.getPoints(segments.arc_resolution);

			for(var i = 0; i < splinePoints.length; i++){
				geometry.vertices.push(splinePoints[i]);  
			}

			long_arc = new THREE.Line(geometry, material);
			scene.add( long_arc );

			updateLongitudeSprite(lng);
			long_sprite.position = sphcoord_long_mid.clone();

			//create latittude arc
			scene.remove( lat_arc );
			var spline = new THREE.SplineCurve3([
				sphcoord_target.clone(),
				sphcoord_lat_postB.clone(),
				sphcoord_lat_post.clone(),
				sphcoord_lat_postA.clone(),
				sphcoord_lat_mid.clone(),
				sphcoord_lat_preB.clone(),
				sphcoord_lat_pre.clone(),
				sphcoord_lat_preA.clone(),
				sphcoord_cross.clone()
			]);

			var material = new THREE.LineBasicMaterial({
				color: arc_color,
			});

			var geometry = new THREE.Geometry();
			var splinePoints = spline.getPoints(segments.arc_resolution);

			for(var i = 0; i < splinePoints.length; i++){
				geometry.vertices.push(splinePoints[i]);  
			}

			lat_arc = new THREE.Line(geometry, material);
			scene.add( lat_arc );

			updateLatitudeSprite(lat);
			lat_sprite.position = sphcoord_lat_mid.clone();
		}
		vectors_arc.visible = config.show_vectors_angle;
		vectors_sprite.visible = config.show_vectors_angle;
		lineAngle.visible = config.show_vectors_angle;
		lineAngle2.visible = config.show_vectors_angle;
		if(config.show_vectors_angle){
			var angle_vector_start;
			switch(config.vectors_angle_sel1){
				case enum_basic_indicators.EARTH:
					angle_vector_start = results.earth_direction.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
				case enum_basic_indicators.SUN:
					angle_vector_start = results.sun_direction.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
				case enum_basic_indicators.VELOCITY:
					angle_vector_start = results.velocity.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
				case enum_basic_indicators.ACCELERATION:
					angle_vector_start = results.acceleration.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
				case enum_basic_indicators.MOMENTUM:
					angle_vector_start = results.momentum.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
				default:
					angle_vector_start = results.earth_direction.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
			}
			var angle_vector_end;
			switch(config.vectors_angle_sel2){
				case enum_basic_indicators.EARTH:
					angle_vector_end = results.earth_direction.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
				case enum_basic_indicators.SUN:
					angle_vector_end = results.sun_direction.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
				case enum_basic_indicators.VELOCITY:
					angle_vector_end = results.velocity.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
				case enum_basic_indicators.ACCELERATION:
					angle_vector_end = results.acceleration.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
				case enum_basic_indicators.MOMENTUM:
					angle_vector_end = results.momentum.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
				default:
					angle_vector_end = results.earth_direction.clone().normalize().multiplyScalar(arc_vectors_radius);
					break;
			}
			var angle_vector_mid = angle_vector_start.clone().add(angle_vector_end.clone()).normalize().multiplyScalar(arc_vectors_radius);

			var angle_vector_pre = angle_vector_start.clone().add(angle_vector_mid.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var angle_vector_post = angle_vector_mid.clone().add(angle_vector_end.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var angle_vector_preA = angle_vector_start.clone().add(angle_vector_pre.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var angle_vector_preB = angle_vector_pre.clone().add(angle_vector_mid.clone()).normalize().multiplyScalar(arc_sphcoord_radius);
			var angle_vector_postA = angle_vector_mid.clone().add(angle_vector_post.clone()).normalize().multiplyScalar(arc_sphcoord_radius); 
			var angle_vector_postB = angle_vector_post.clone().add(angle_vector_end.clone()).normalize().multiplyScalar(arc_sphcoord_radius);


			var dist_angle = angle_vector_start.clone().angleTo(angle_vector_end);

			// LINES
			lineAngle.geometry.vertices[0].set(angle_vector_start.x,angle_vector_start.y,angle_vector_start.z);
			lineAngle.geometry.computeLineDistances();
			lineAngle.geometry.verticesNeedUpdate = true;

			lineAngle2.geometry.vertices[0].set(angle_vector_end.x,angle_vector_end.y,angle_vector_end.z);
			lineAngle2.geometry.computeLineDistances();
			lineAngle2.geometry.verticesNeedUpdate = true;

			scene.remove( vectors_arc );
			var spline = new THREE.SplineCurve3([
				angle_vector_start.clone(),
				angle_vector_preA.clone(),
				angle_vector_pre.clone(),
				angle_vector_preB.clone(),
				angle_vector_mid.clone(),
				angle_vector_postA.clone(),
				angle_vector_post.clone(),
				angle_vector_postB.clone(),
				angle_vector_end.clone()
			]);

			var material = new THREE.LineBasicMaterial({
				color: arc_color,
			});

			var geometry = new THREE.Geometry();
			var splinePoints = spline.getPoints(segments.arc_resolution);

			for(var i = 0; i < splinePoints.length; i++){
				geometry.vertices.push(splinePoints[i]);  
			}

			vectors_arc = new THREE.Line(geometry, material);
			scene.add( vectors_arc );

			updateAnglesSprite(dist_angle);
			vectors_sprite.position = angle_vector_mid.clone();

		}

	}

//***********************************************************************************************************************
//		                                                EARTH
//***********************************************************************************************************************
	function initEarth(){
		//-----------------------------------------------------------------------------------------------------------------------
		//			EARTH
		//-----------------------------------------------------------------------------------------------------------------------
		var earth_geometry = new THREE.SphereGeometry( earth_radius, segments.earth_seg, segments.earth_seg ) ;
		var earth_geometry_surface = new THREE.SphereGeometry( earth_radius+1, segments.earth_seg, segments.earth_seg ) ;
		
		if(typeof textureEarth === 'undefined'){
		   // your code here.
			textureEarth = new THREE.ImageUtils.loadTexture( 'modules/attitude/textures/earth/Land_ocean_ice_cloud_2048.jpg' );
		};
		var earth_material_surface = new THREE.MeshBasicMaterial( { map: textureEarth, overdraw: true } );
		var earth_material = new THREE.MeshPhongMaterial( { color: earth_solid_color, metal: true } );
		
		earth = new THREE.Mesh( earth_geometry, earth_material ) ;
		earth.position.set(75, 0, 75);//Don't remove or the dashed material is not created
		scene.add( earth );
		
		earthSurface = new THREE.Mesh( earth_geometry_surface, earth_material_surface ) ;
		earthSurface.position.set(75, 0, 75);//Don't remove or the dashed material is not created
		scene.add( earthSurface );
		
		// EARTH LINE
		var lineGeometryEarth = new THREE.Geometry();
		var vertArrayEarth = lineGeometryEarth.vertices;
		vertArrayEarth.push( new THREE.Vector3(earth.position.x,earth.position.y,earth.position.z), new THREE.Vector3(0, 0, 0) );
		lineGeometryEarth.computeLineDistances();
		var lineMaterialEarth = new THREE.LineDashedMaterial( { color: 0x0099ff, dashSize: 2, gapSize: 2 } );
		lineEarth = new THREE.Line( lineGeometryEarth, lineMaterialEarth );
		scene.add(lineEarth);
		
		// Earth Sprite
		spriteEarth = makeTextSprite( 2, " 36150 Km ", 
			{ fontsize: 20, borderColor: {r:0, g:0, b:0, a:1.0}, borderThickness: 1, backgroundColor: {r:0, g:0, b:0, a:0.5}, fontColor: {r:95, g:247, b:252, a:1.0} } );
		earth.add( spriteEarth );
		
	}
	function updateEarth(){
		//-----------------------------------------------------------------------------------------------------------------------
		//			EARTH UPDATE
		//-----------------------------------------------------------------------------------------------------------------------
		earth.visible = config.show_earth;
		earthSurface.visible = config.show_earth_texture;
		lineEarth.visible = config.earth_show_line;
		spriteEarth.visible = config.earth_show_dist;
		if(config.show_earth){
			var earth_obj_pos = results.earth_direction.clone().normalize().multiplyScalar(earth_obj_dist);
			earth.position = earth_obj_pos;
			earthSurface.position = earth_obj_pos;
			//XGGDEBUG: maybe it does not need to update the line after updating the object position since it is link to its coordinates.
			if(config.earth_show_line){
				// EARTH LINE
				lineEarth.geometry.vertices[0].set(earth.position.x,earth.position.y,earth.position.z);
				lineEarth.geometry.computeLineDistances();
				lineEarth.geometry.verticesNeedUpdate = true;
				//lineEarth.material.attributes.lineDistances.needsUpdate = true;
			}
			if(config.earth_show_dist){
				var earth_label_distance = results.earth_direction.length();//Km
				var messageEarth = " "+parseFloat(Math.round(earth_label_distance * 1) / 1).toFixed(0)+" Km ";
				contextEarth.fillStyle = "rgba(0, 0, 0, 1.0)"; // CLEAR WITH COLOR BLACK (new BG color)
				contextEarth.fill(); // FILL THE CONTEXT
				// get size data (height depends only on font size)
				var metricsEarth = contextEarth.measureText( messageEarth );
				var textWidthEarth = metricsEarth.width;
				// background color
				contextEarth.fillStyle   = "rgba(" + backgroundColorEarth.r + "," + backgroundColorEarth.g + ","
											  + backgroundColorEarth.b + "," + backgroundColorEarth.a + ")";
				// border color
				contextEarth.strokeStyle = "rgba(" + borderColorEarth.r + "," + borderColorEarth.g + ","
											  + borderColorEarth.b + "," + borderColorEarth.a + ")";
				contextEarth.lineWidth = borderThicknessEarth;
				roundRect(contextEarth, borderThicknessEarth/2, borderThicknessEarth/2, textWidthEarth + borderThicknessEarth, fontsizeEarth * 1.4 + borderThicknessEarth, 6);
				// 1.4 is extra height factor for text below baseline: g,j,p,q.
				// text color
				contextEarth.fillStyle   = "rgba(" + fontColorEarth.r + "," + fontColorEarth.g + ","
											  + fontColorEarth.b + "," + fontColorEarth.a + ")";
				contextEarth.fillText( messageEarth, borderThicknessEarth, fontsizeEarth + borderThicknessEarth);
				spriteEarth.material.map._needsUpdate = true; // AND UPDATE THE IMAGE..
			}
			if(config.earth_rotates){
				earthSurface.rotation.y += 0.001*config.earth_rotation_speed;
			}
		}

	}

//***********************************************************************************************************************
//		                                                INDICATORS
//***********************************************************************************************************************
	function initIndicators() {
			//-----------------------------------------------------------------------------------------------------------------------
		//			ARROWS
		//-----------------------------------------------------------------------------------------------------------------------
		
		// ARROWS
		var direction;
		
		// BASIC
		direction = new THREE.Vector3().subVectors(results.velocity, origin).normalize();		
		arrow_vel = new THREE.VectorHelper(direction, origin, arrow_max_length, config.color_velocity, arrow_head_length, arrow_head_width, segments.arrow_segments);
		scene.add(arrow_vel);
		
		direction = new THREE.Vector3().subVectors(results.acceleration, origin).normalize();
		arrow_accel = new THREE.VectorHelper(direction, origin, arrow_max_length, config.color_acceleration, arrow_head_length, arrow_head_width, segments.arrow_segments);
		scene.add(arrow_accel);
		
		direction = new THREE.Vector3().subVectors(results.momentum, origin).normalize();
		arrow_momentum = new THREE.MomentumHelper(direction, origin, momentum_length, config.color_momentum, momentum_head_length, momentum_head_width, segments.momentum_segments);
		scene.add(arrow_momentum);
		
		// EXTRA
		direction = new THREE.Vector3().subVectors(config.value_target_a, origin).normalize();
		target_a = new THREE.TargetHelper(direction, origin, target_length, config.color_target_a, target_head_length, target_head_width, segments.target_segments);
		scene.add(target_a);
		
		direction = new THREE.Vector3().subVectors(config.value_vector_a, origin).normalize();
		vector_a = new THREE.VectorHelper(direction, origin, arrow_max_length, config.color_vector_a, arrow_head_length, arrow_head_width, segments.arrow_segments);
		scene.add(vector_a);
		
		direction = new THREE.Vector3().subVectors(config.value_direction_a, origin).normalize();
		direction_a = new THREE.MomentumHelper(direction, origin, momentum_length, config.color_direction_a, momentum_head_length, momentum_head_width, segments.momentum_segments);
		scene.add(direction_a);

	}
	function updateIndicators() {
		//-----------------------------------------------------------------------------------------------------------------------
		//			ARROWS UPDATE
		//-----------------------------------------------------------------------------------------------------------------------
		var new_direction;
		
		//THREE.SceneUtils.traverseHierarchy( arrow_vel, function( node ) { node.__visible = config.show_velocity; } )
		arrow_vel.visible = config.show_velocity;
		arrow_vel.children[0].visible = config.show_velocity;
		arrow_vel.children[1].visible = config.show_velocity;
		if(config.show_velocity){
			new_direction = new THREE.Vector3().subVectors(results.velocity, origin).normalize();
			arrow_vel.setDirection(new_direction);
			arrow_vel.setLength(results.velocity.length()*arrow_max_length/config.limit_velocity, arrow_head_length, arrow_head_width);
			arrow_vel.setColor(parseInt("0x"+config.color_velocity.substr(1,config.color_velocity.length)));
		}
		
		arrow_accel.visible = config.show_acceleration;
		arrow_accel.children[0].visible = config.show_acceleration;
		arrow_accel.children[1].visible = config.show_acceleration;
		if(config.show_acceleration){
			new_direction = new THREE.Vector3().subVectors(results.acceleration, origin).normalize();
			arrow_accel.setDirection(new_direction);
			arrow_accel.setLength(results.acceleration.length()*arrow_max_length/config.limit_acceleration, arrow_head_length, arrow_head_width);
			arrow_accel.setColor(parseInt("0x"+config.color_acceleration.substr(1,config.color_acceleration.length)));
		}
		
		arrow_momentum.visible = config.show_momentum;
		arrow_momentum.children[0].visible = config.show_momentum;
		arrow_momentum.children[1].visible = config.show_momentum;
		if(config.show_momentum){			
			new_direction = new THREE.Vector3().subVectors(results.momentum, origin).normalize();
			arrow_momentum.setDirection(new_direction);
			arrow_momentum.setColor(parseInt("0x"+config.color_momentum.substr(1,config.color_momentum.length)));
		}
		
		target_a.visible = config.show_target_a;
		target_a.children[0].visible = config.show_target_a;
		target_a.children[1].visible = config.show_target_a;
		if(config.show_target_a){
			new_direction = new THREE.Vector3().subVectors(config.value_target_a, origin).normalize();
			target_a.setDirection(new_direction);
			target_a.setColor(parseInt("0x"+config.color_target_a.substr(1,config.color_target_a.length)));
		}
		
		vector_a.visible = config.show_vector_a;
		vector_a.children[0].visible = config.show_vector_a;
		vector_a.children[1].visible = config.show_vector_a;
		if(config.show_vector_a){
			new_direction = new THREE.Vector3().subVectors(config.value_vector_a, origin).normalize();
			vector_a.setDirection(new_direction);
			var length = new THREE.Vector3(config.value_vector_a.x,config.value_vector_a.y,config.value_vector_a.z).length();
			vector_a.setLength(length*arrow_max_length/config.limit_vector_a, arrow_head_length, arrow_head_width);
			vector_a.setColor(parseInt("0x"+config.color_vector_a.substr(1,config.color_vector_a.length)));
		}
		
		direction_a.visible = config.show_direction_a;
		direction_a.children[0].visible = config.show_direction_a;
		direction_a.children[1].visible = config.show_direction_a;
		if(config.show_direction_a){
			new_direction = new THREE.Vector3().subVectors(config.value_direction_a, origin).normalize();
			direction_a.setDirection(new_direction);
			direction_a.setColor(parseInt("0x"+config.color_direction_a.substr(1,config.color_direction_a.length)));
		}

	}

//***********************************************************************************************************************
//		                                                REFERENCE
//***********************************************************************************************************************
	function initReference() {
		//-----------------------------------------------------------------------------------------------------------------------
		//			REFERENCE SPHERE
		//-----------------------------------------------------------------------------------------------------------------------
		var mat_sphere = new THREE.MeshPhongMaterial( { 
			color: 0x282400,
			transparent: true,
			side: THREE.FrontSide,
			metal: true,
			depthWrite: false, depthTest: false, alphaTest: 0.1,
			opacity: 0.4,
			} );	
		var mat_sphere2 = new THREE.MeshBasicMaterial( { 
			color: 0xBBBBBB,
			transparent: true,
			side: THREE.FrontSide,
			metal: true,
			depthWrite: false, depthTest: false, alphaTest: 0.1,
			opacity: 0.11,
			} );
		var mats_sphere = [mat_sphere, mat_sphere2];
		objRefSphere = THREE.SceneUtils.createMultiMaterialObject(new THREE.SphereGeometry( sphere_radius, segments.sphere_segments, segments.sphere_segments ), mats_sphere);
		
		
		objRefSphere.position.set( 0, 0, 0 );
		objRefSphere.renderDepth = -0.1;
		scene.add( objRefSphere );
		
		//-----------------------------------------------------------------------------------------------------------------------
		//			MINI SPHERES
		//-----------------------------------------------------------------------------------------------------------------------
		//if(!canvas_mode)
			var mat_mini = new THREE.MeshPhongMaterial( { color: 0xAAAAAA, metal: true } );
		//else
			//var mat_mini = new THREE.MeshBasicMaterial( { color: 0xAAAAAA } );
		var miniSphere = new THREE.Mesh(new THREE.SphereGeometry( miniSphere_radius, segments.miniSphere_seg, segments.miniSphere_seg ), mat_mini);
		miniSphere.position.set( 0, 0, 0 );
		//if(!show_spacecraft){
			//scene.add( miniSphere );
		//}
		
		miniSphereX = miniSphere.clone();
		miniSphereX.position.set( sphere_radius+miniSphere_margin, 0, 0 );
		scene.add( miniSphereX );
		
		miniSphereXX = miniSphere.clone();
		miniSphereXX.position.set( -sphere_radius-miniSphere_margin, 0, 0 );
		scene.add( miniSphereXX );
		
		miniSphereY = miniSphere.clone();
		miniSphereY.position.set( 0, sphere_radius+miniSphere_margin, 0 );
		scene.add( miniSphereY );
		
		miniSphereYY = miniSphere.clone();
		miniSphereYY.position.set( 0, -sphere_radius-miniSphere_margin, 0 );
		scene.add( miniSphereYY );
		
		miniSphereZ = miniSphere.clone();
		miniSphereZ.position.set( 0, 0, sphere_radius+miniSphere_margin);
		scene.add( miniSphereZ );
		
		miniSphereZZ = miniSphere.clone();
		miniSphereZZ.position.set( 0, 0, -sphere_radius-miniSphere_margin);
		scene.add( miniSphereZZ );
		
		//-----------------------------------------------------------------------------------------------------------------------
		//			SPHERE CIRCLES
		//-----------------------------------------------------------------------------------------------------------------------
		//if(!canvas_mode)
			var mat_torus = new THREE.MeshPhongMaterial( { color: 0xAAAAAA, metal: true, transparent: false, opacity: 1.0, side: THREE.BackSide } );
		//else
			//var mat_torus = new THREE.MeshBasicMaterial( { color: 0xAAAAAA,  side: THREE.BackSide } );
	
		objRefCircleY = new THREE.Mesh( new THREE.TorusGeometry( torus_radius, torus_tube, segments.torus_seg_r, segments.torus_seg_t ), mat_torus );
		objRefCircleY.position.set( 0, 0, 0 );
		scene.add( objRefCircleY );
		
		objRefCircleZ = new THREE.Mesh( new THREE.TorusGeometry( torus_radius, torus_tube, segments.torus_seg_r, segments.torus_seg_t ), mat_torus );
		objRefCircleZ.position.set( 0, 0, 0 );
		objRefCircleZ.rotation.x = Math.PI/2;
		scene.add( objRefCircleZ );
		
		objRefCircleX = new THREE.Mesh( new THREE.TorusGeometry( torus_radius, torus_tube, segments.torus_seg_r, segments.torus_seg_t ), mat_torus );
		objRefCircleX.position.set( 0, 0, 0 );
		objRefCircleX.rotation.y = Math.PI/2;
		scene.add( objRefCircleX );
		
		//-----------------------------------------------------------------------------------------------------------------------
		//			REFERENCE AXIS
		//-----------------------------------------------------------------------------------------------------------------------
		//Axis
		objRefAxis = new THREE.AxisHelper( sphere_radius );
		objRefAxis.position.set( 0, 0, 0 );
		scene.add( objRefAxis );
		
		objRefAxisLabelX = makeTextSprite( 0, " X ", 
		{ fontsize: 48, borderColor: {r:0, g:0, b:0, a:1.0}, borderThickness: 1, backgroundColor: {r:0, g:0, b:0, a:0.5}, fontColor: {r:255, g:174, b:0, a:1.0} } );
		objRefAxisLabelX.position.set( sphere_radius+miniSphere_margin, 0, 0 );
		scene.add( objRefAxisLabelX );
		
		//Axis labels
		objRefAxisLabelY = makeTextSprite( 0, " Y ", 
		{ fontsize: 48, borderColor: {r:0, g:0, b:0, a:1.0}, borderThickness: 1, backgroundColor: {r:0, g:0, b:0, a:0.5}, fontColor: {r:16, g:219, b:2, a:1.0} } );
		objRefAxisLabelY.position.set( 0, sphere_radius+miniSphere_margin, 0 );
		scene.add( objRefAxisLabelY );
		
		objRefAxisLabelZ = makeTextSprite( 0, " Z ", 
		{ fontsize: 48, borderColor: {r:0, g:0, b:0, a:1.0}, borderThickness: 1, backgroundColor: {r:0, g:0, b:0, a:0.5}, fontColor: {r:50, g:119, b:255, a:1.0} } );
		objRefAxisLabelZ.position.set( 0, 0, sphere_radius+miniSphere_margin );
		scene.add( objRefAxisLabelZ );
	}
	
	function updateReference(){
		//Reference sphere
		objRefSphere.visible = config.show_sphere;
		objRefSphere.children[0].visible = config.show_sphere;
		objRefSphere.children[1].visible = config.show_sphere;
		//Mini spheres
		miniSphereX.visible = config.show_mini_spheres;
		miniSphereXX.visible = config.show_mini_spheres;
		miniSphereY.visible = config.show_mini_spheres;
		miniSphereYY.visible = config.show_mini_spheres;
		miniSphereZ.visible = config.show_mini_spheres;
		miniSphereZZ.visible = config.show_mini_spheres;
		//Spacecraft
		//Ref circles
		objRefCircleX.visible = config.show_circles;
		objRefCircleY.visible = config.show_circles;
		objRefCircleZ.visible = config.show_circles;
		//Axis
		objRefAxis.visible = config.show_axis;
		//Axis labels
		objRefAxisLabelX.visible = config.show_axis_labels;
		objRefAxisLabelY.visible = config.show_axis_labels;
		objRefAxisLabelZ.visible = config.show_axis_labels;
	}


//***********************************************************************************************************************
//		                                                SCENE
//***********************************************************************************************************************
	function initScene(){
		// SCENE
		scene = new THREE.Scene();
		// CAMERA
		var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
		var VIEW_ANGLE = cam_view_angle, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = cam_rend_near, FAR = cam_rend_far;
		camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
		scene.add(camera);
		camera.position = global_cameras.attitude.position;
		camera.lookAt(scene.position);	
		
		
		// EVENTS
		//THREEx.WindowResize(att_renderer, camera);
		//THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });
		
		//window.addEventListener( 'resize', onWindowResize, false );
		//att_container.addEventListener("resize", onWindowResize, false);

		// CONTROLS
		//controls = new THREE.OrbitControls( camera, att_renderer.domElement );
		controls = new THREE.TrackballControls( camera, att_renderer.domElement );
		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.noZoom = false;
		controls.maxDistance = 2000;
		controls.minDistance = 25;
		controls.noPan = true;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;
		controls.keys = [ 65, 83, 68 ];
		controls.addEventListener( 'change', render );

		// STATS
		stats = new Stats();
		stats.domElement.id = 'statsOfAttitude';
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '50px';
		stats.domElement.style.zIndex = 100;
		if(global.show_fps){
			stats.domElement.style.webkitTransform = 0;
			att_container.appendChild( stats.domElement );
		}else{
			var stats_old = document.getElementById("statsOfAttitude");
			if(stats_old){
				att_container.removeChild(stats_old);
			}
		}
		// LIGHT
		light = new THREE.PointLight(0xE0E0E0);
		//light.position.set(200,200,200);
		scene.add(light);
		
		//if(!canvas_mode){
			sunLight = new THREE.PointLight(0xffef7a);
			//sunLight.position.set(200,200,200);
			scene.add(sunLight);
		//}
		// ambient
		var ambient = new THREE.AmbientLight( 0xFFFFFF );
		//scene.add( ambient );
	}
	function updateScene(){
		//Ligts
		light.position.set(camera.position.x,camera.position.y,camera.position.z);

		//-----------------------------------------------------------------------------------------------------------------------
		//			ANDROID STATS UPDATE
		//-----------------------------------------------------------------------------------------------------------------------
		if(global.show_fps){
			stats.update();
			/*fps_update_counter=fps_update_counter+1;
			if(fps_update_counter>config.fps_update_skips){
				fps_update_counter=0;	
				//updateFPS();
			}*/
		}
	}
//***********************************************************************************************************************
//		                                                SPACECRAFT
//***********************************************************************************************************************
	function initSpacecraft(){
		//-----------------------------------------------------------------------------------------------------------------------
		//			SPACECRAFT
		//-----------------------------------------------------------------------------------------------------------------------
		spacecraft = new THREE.Object3D();
		
		spacecraftAxis = new THREE.AxisHelper( sc_axis_lenght );
		spacecraftAxis.position.set( 0, 0, 0 );
		spacecraft.add( spacecraftAxis );
		
		var sc_material = new THREE.MeshLambertMaterial( { color: sc_body_color, metal: true, shading: THREE.SmoothShading, blending: THREE.AdditiveBlending, vertexColors: THREE.VertexColors } );

		var sc_geometry = new THREE.CylinderGeometry( 6, 1, 15, segments.sc_body_segments );
		var sc = new THREE.Mesh( sc_geometry, sc_material );
		sc.position.set( 0, 0, 0 );
		sc.rotation.x = -Math.PI/2;
		spacecraft.add(sc);
		
		var mat_window = new THREE.MeshPhongMaterial( { color: sc_window_color, metal: true, side: THREE.FrontSide } );
			
		var sc_window = new THREE.Mesh(new THREE.SphereGeometry( 3, segments.sc_window_segments, segments.sc_window_segments ), mat_window);
		sc_window.position.set( 0, 1.5, -2 );
		spacecraft.add(sc_window);
		
		var eng_geometry = new THREE.CylinderGeometry( 2, 2.5, 2, segments.sc_engine_segments );
		var eng_material = new THREE.MeshPhongMaterial( { color: sc_engine_color, metal: true, side: THREE.FrontSide } );
			
		var eng = new THREE.Mesh( eng_geometry, eng_material );
		eng.rotation.x = -Math.PI/2;
		eng.position.set( -2.5, 0, -8 );
		spacecraft.add(eng);
		
		var eng2 = eng.clone();
		eng2.rotation.x = -Math.PI/2;
		eng2.position.set( 2.5, 0, -8 );
		spacecraft.add(eng2);
		
		//Engine surface
		customUniforms2 = {
			baseTexture: 	{ type: "t", value: waterTexture },
			baseSpeed: 		{ type: "f", value: 1.15 },
			noiseTexture: 	{ type: "t", value: noiseTexture },
			noiseScale:		{ type: "f", value: 0.5 },
			alpha: 			{ type: "f", value: 0.8 },
			time: 			{ type: "f", value: 1.0 }
		};

		// create custom material from the shader code above
		//   that is within specially labeled script tags
		var customMaterialEngineSurface = new THREE.ShaderMaterial( 
		{
			uniforms: customUniforms2,
			vertexShader:   THREE.ShaderEngine.vertexShader,
			fragmentShader: THREE.ShaderEngine.fragmentShader
		}   );
		customMaterialEngineSurface.side = THREE.BackSide;
		
		var customMaterialEngineBasic = new THREE.MeshPhongMaterial( { color: sc_eng_solid_color, metal: true } );
		customMaterialEngineBasic.side = THREE.BackSide;
		
		// apply the material to a surface    innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength)
		var flatGeometry = new THREE.RingGeometry( 0.5, 2, 15 );
		var flatGeometrySurface = new THREE.RingGeometry( 0.5, 2, 15 );
		engBasicLeft = new THREE.Mesh( flatGeometry, customMaterialEngineBasic );
		engSurfaceLeft = new THREE.Mesh( flatGeometrySurface, customMaterialEngineSurface );
		//surface.rotation.z = -Math.PI/2;
		engBasicLeft.position.set( 2.5, 0, -9.1 );
		engSurfaceLeft.position.set( 2.5, 0, -9.1 );
		spacecraft.add(engBasicLeft);
		spacecraft.add(engSurfaceLeft);
		
		engBasicRight = engBasicLeft.clone(); 
		engSurfaceRight = engSurfaceLeft.clone();
		engBasicRight.position.set( -2.5, 0, -9.1 );
		engSurfaceRight.position.set( -2.5, 0, -9.1 );
		spacecraft.add(engBasicRight);
		spacecraft.add(engSurfaceRight);

		spacecraft.scale.multiplyScalar(sc_scale);
		scene.add(spacecraft);
	}
	function updateSpacecraft(){
		//-----------------------------------------------------------------------------------------------------------------------
		//			SPACECRAFT UPDATE
		//-----------------------------------------------------------------------------------------------------------------------
		spacecraftAxis.visible = config.show_sc_axis;
		
		engBasicRight.visible = !config.sc_show_eng_texture;
		engBasicLeft.visible = !config.sc_show_eng_texture;
		engSurfaceRight.visible = config.sc_show_eng_texture;
		engSurfaceLeft.visible = config.sc_show_eng_texture;
		if(config.sc_show_eng_texture){
			customUniforms2.time.value += delta;
		}
		
		if(!auto_rotate_sc){		
			spacecraft.quaternion.copy(results.attitude);
			spacecraft.matrixWorldNeedsUpdate = true;
			spacecraft.updateMatrix();
		}else{
			spacecraft.rotation.x += 0.01;
			spacecraft.rotation.y += 0.01;
		}
	}
//***********************************************************************************************************************
//		                                                SUN
//***********************************************************************************************************************
	function initSun(){
		//-----------------------------------------------------------------------------------------------------------------------
		//			SUN
		//-----------------------------------------------------------------------------------------------------------------------
			
		if(typeof textureSun === 'undefined'){
		   // your code here.
			textureSun= new THREE.ImageUtils.loadTexture( 'modules/attitude/textures/lava/lava.jpg' );
		};
		if(typeof textureSun2 === 'undefined'){
		   // your code here.
			textureSun2= new THREE.ImageUtils.loadTexture( 'modules/attitude/textures/lava/cloud.png' );
		};
		// base image texture for mesh
		var lavaTexture = textureSun;
		lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping; 
		// multiplier for distortion speed 		
		var baseSpeed = 0.02;
		// number of times to repeat texture in each direction
		var repeatS = repeatT = 2.0;
		// texture used to generate "randomness", distort all other textures
		var noiseTexture = textureSun2;
		noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
		// magnitude of noise effect
		var noiseScale = 0.5;
		// texture to additively blend with base image texture
		var blendTexture = textureSun;
		blendTexture.wrapS = blendTexture.wrapT = THREE.RepeatWrapping; 
		// multiplier for distortion speed 
		var blendSpeed = 0.08;
		// adjust lightness/darkness of blended texture
		var blendOffset = 0.45;
		// texture to determine normal displacement
		var bumpTexture = noiseTexture;
		bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping; 
		// multiplier for distortion speed 		
		var bumpSpeed   = 0.5;
		// magnitude of normal displacement
		var bumpScale   = 2.0;
		
		// use "this." to create global object
		this.customUniforms = {
			baseTexture: 	{ type: "t", value: lavaTexture },
			baseSpeed:		{ type: "f", value: baseSpeed },
			repeatS:		{ type: "f", value: repeatS },
			repeatT:		{ type: "f", value: repeatT },
			noiseTexture:	{ type: "t", value: noiseTexture },
			noiseScale:		{ type: "f", value: noiseScale },
			blendTexture:	{ type: "t", value: blendTexture },
			blendSpeed: 	{ type: "f", value: blendSpeed },
			blendOffset: 	{ type: "f", value: blendOffset },
			bumpTexture:	{ type: "t", value: bumpTexture },
			bumpSpeed: 		{ type: "f", value: bumpSpeed },
			bumpScale: 		{ type: "f", value: bumpScale },
			alpha: 			{ type: "f", value: 1.0 },
			time: 			{ type: "f", value: 1.0 }
		};
			
		// create custom material from the shader code above
		//   that is within specially labeled script tags
		var customMaterialSun = new THREE.ShaderMaterial( 
		{
			uniforms: customUniforms,
			vertexShader:   THREE.ShaderEngine.vertexShader,
			fragmentShader: THREE.ShaderSun.fragmentShader
		}   );
		
		var customMaterialSunBasic = new THREE.MeshPhongMaterial( { color: sun_solid_color, metal: true } );
		
		var sunGeometry = new THREE.SphereGeometry( sun_radius, segments.sun_seg, segments.sun_seg );
		sun = new THREE.Mesh( sunGeometry, customMaterialSunBasic );
		sun.position.set(0, 85, 85);//Don't remove or the dashed material is not created
		scene.add( sun );
		
		//Sun surface
		var sunSurfaceGeometry = new THREE.SphereGeometry( sun_radius+1, segments.sun_seg, segments.sun_seg );
		sunSurface = new THREE.Mesh( sunSurfaceGeometry, customMaterialSun );
		sunSurface.position.set(0, 85, 85);//Don't remove or the dashed material is not created
		scene.add( sunSurface );
		
		// Sun Glow
		if(typeof textureSun4 === 'undefined'){
			textureSun4= new THREE.ImageUtils.loadTexture( 'modules/attitude/textures/lava/glow.png' );
		};
		var spriteMaterial = new THREE.SpriteMaterial( 
		{ 
			map: textureSun4, 
			useScreenCoordinates: false,// alignment: THREE.SpriteAlignment.center,
			color: 0xf79216, transparent: false, blending: THREE.AdditiveBlending
		});
		sunGlow = new THREE.Sprite( spriteMaterial );
		sunGlow.scale.set(20, 20, 1.0);
		sun.add(sunGlow); // this centers the glow at the mesh
		
		// Sun Line
		var lineGeometrySun = new THREE.Geometry();
		lineGeometrySun.dynamic = true;
		var vertArraySun = lineGeometrySun.vertices;
		vertArraySun.push( new THREE.Vector3(sun.position.x,sun.position.y,sun.position.z), new THREE.Vector3(0, 0, 0) );
		lineGeometrySun.computeLineDistances();
		var lineMaterialSun = new THREE.LineDashedMaterial( { color: 0xffa100, dashSize: 2, gapSize: 2 } );
		lineSun = new THREE.Line( lineGeometrySun, lineMaterialSun );
		scene.add(lineSun);
		
		// Sun Sprite
		spriteSun = makeTextSprite( 1, " 1.05 AU ", 
			{ fontsize: 24, borderColor: {r:0, g:0, b:0, a:1.0}, borderThickness: 1, backgroundColor: {r:0, g:0, b:0, a:1.5}, fontColor: {r:252, g:186, b:45, a:1.0} } );
		sun.add( spriteSun );
		
	}
	function updateSun() {
		//-----------------------------------------------------------------------------------------------------------------------
		//			SUN UPDATE
		//-----------------------------------------------------------------------------------------------------------------------
		sun.visible = config.show_sun;
		sunGlow.visible = config.show_sun;
		sunSurface.visible = config.show_sun_texture;
		if(sun.visible){
			if(sunSurface.visible){
				customUniforms.time.value += delta;
			}
			var sun_obj_pos = results.sun_direction.clone().normalize().multiplyScalar(sun_obj_dist);
			sun.position = sun_obj_pos;
			sunSurface.position = sun_obj_pos;
			// change the direction this spotlight is facing
			//if(!canvas_mode)
				sunLight.position.set(sun.position.x,sun.position.y,sun.position.z);
				
			lineSun.visible = config.sun_show_line;
			if(lineSun.visible){
				// SUN LINE
				lineSun.geometry.vertices[0] = new THREE.Vector3(sun.position.x,sun.position.y,sun.position.z);
				lineSun.geometry.computeLineDistances();
				lineSun.geometry.verticesNeedUpdate = true;
				//lineSun.material.attributes.lineDistances.needsUpdate = true;
			}
			
			spriteSun.visible = config.sun_show_dist;
			if(spriteSun.visible){
				var sun_label_distance = results.sun_direction.length()/149597871;//convert Km to AU
				var messageSun = " "+parseFloat(Math.round(sun_label_distance * 1000) / 1000).toFixed(3)+" AU ";
				contextSun.fillStyle = "rgba(0, 0, 0, 1.0)"; // CLEAR WITH COLOR BLACK (new BG color)
				contextSun.fill(); // FILL THE CONTEXT
				// get size data (height depends only on font size)
				var metrics = contextSun.measureText( messageSun );
				var textWidthSun = metrics.width;
				// background color
				contextSun.fillStyle   = "rgba(" + backgroundColorSun.r + "," + backgroundColorSun.g + ","
											  + backgroundColorSun.b + "," + backgroundColorSun.a + ")";
				// border color
				contextSun.strokeStyle = "rgba(" + borderColorSun.r + "," + borderColorSun.g + ","
											  + borderColorSun.b + "," + borderColorSun.a + ")";
				contextSun.lineWidth = borderThicknessSun;
				roundRect(contextSun, borderThicknessSun/2, borderThicknessSun/2, textWidthSun + borderThicknessSun, fontsizeSun * 1.4 + borderThicknessSun, 6);
				// 1.4 is extra height factor for text below baseline: g,j,p,q.
				// text color
				contextSun.fillStyle   = "rgba(" + fontColorSun.r + "," + fontColorSun.g + ","
											  + fontColorSun.b + "," + fontColorSun.a + ")";
				contextSun.fillText( messageSun, borderThicknessSun, fontsizeSun + borderThicknessSun);
				spriteSun.material.map._needsUpdate = true; // AND UPDATE THE IMAGE..
			}
				
			if(config.sun_rotates){
				//sun.rotation.x += 0.005;
				sunSurface.rotation.y += 0.001*config.sun_rotation_speed;
			}
		}
	}


//***********************************************************************************************************************
//		                                                VIEW
//***********************************************************************************************************************
	function getCamDistance(){
		return Math.sqrt(camera.position.x*camera.position.x+camera.position.y*camera.position.y+camera.position.z*camera.position.z);
	}
	function getCamEquilater(){
		return getCamDistance()/Math.sqrt(3);
	}
	function restoreMiniSpheres(){
		if(config.show_mini_spheres){
			miniSphereX.visible=true;
			miniSphereXX.visible=true;
			miniSphereY.visible=true;
			miniSphereYY.visible=true;
			miniSphereZ.visible=true;
			miniSphereZZ.visible=true;
		}
	}
	function restorePlanets(){
		if(config.show_earth){
			earth.material.opacity = 1;
			earth.material.transparent = false;
			earthSurface.material.opacity = 1;
			earthSurface.material.transparent = false;
			//earth.visible=true;
		}
		if(config.show_sun){
			//sun.visible=true;
			sunGlow.visible=true;
			sun.material.opacity = 1;
			sun.material.transparent = false;
			sunSurface.material.opacity = 1;
			sunSurface.material.transparent = false;
			customUniforms.alpha.value = 1.0;
		}
	}
	function changeView(view_mode){
		restoreMiniSpheres();
		restorePlanets();
		switch(view_mode){
			case "FREE":
				camera.position = global_cameras.attitude.position;
				camera.up = global_cameras.attitude.up;
				break;
			case "XYZ"://xyz
				camera.position = new THREE.Vector3(getCamEquilater(),getCamEquilater(),getCamEquilater());
				camera.up = new THREE.Vector3(-0.577,-0.577,0.577);
				break;
			case "X"://+X
				miniSphereX.visible=false;
				camera.position = new THREE.Vector3(getCamDistance(),0,0);
				camera.up = new THREE.Vector3(0,0,1);
				break;
			case "-X"://-X
				miniSphereXX.visible=false;
				camera.position = new THREE.Vector3(-getCamDistance(),0,0);
				camera.up = new THREE.Vector3(0,0,1);
				break;
			case "Y"://+Y
				miniSphereY.visible=false;
				camera.position = new THREE.Vector3(0,getCamDistance(),0);
				camera.up = new THREE.Vector3(0,0,1);
				break;
			case "-Y"://-Y
				miniSphereYY.visible=false;
				camera.position = new THREE.Vector3(0,-getCamDistance(),0);
				camera.up = new THREE.Vector3(0,0,1);
				break;
			case "Z"://+Z
				miniSphereZ.visible=false;
				camera.position = new THREE.Vector3(0,0,getCamDistance());
				camera.up = new THREE.Vector3(0,1,0);
				break;
			case "-Z"://-Z
				miniSphereZZ.visible=false;
				camera.position = new THREE.Vector3(0,0,-getCamDistance());
				camera.up = new THREE.Vector3(0,1,0);
				break;
			case "Earth"://Earth
				//if(config.show_earth){
					//earth.visible = false;
					earth.material.opacity = 0.2;
					earth.material.transparent = true;
					earthSurface.material.opacity = 0.2;
					earthSurface.material.transparent = true;
				//}
				camera.up = new THREE.Vector3(0,0,1);
				camera.position = results.earth_direction.clone().normalize().multiplyScalar(getCamDistance());
				break;
			case "Sun"://Sun
				//if(config.show_sun){
					//sun.visible = false;
					sunGlow.visible=false;
					sun.material.opacity = 0.2;
					sun.material.transparent = true;
					sunSurface.material.opacity = 0.2;
					sunSurface.material.transparent = true;
					customUniforms.alpha.value = 0.2;
				//}
				camera.up = new THREE.Vector3(0,0,1);
				camera.position = results.sun_direction.clone().normalize().multiplyScalar(getCamDistance());
				break;
			case "S/C-XYZ"://Spacecraft
				camera.position = init_sc_dir_xyz.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_xyz.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Rear"://Spacecraft
				camera.position = init_sc_dir_rear.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_rear.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Front"://Spacecraft
				camera.position = init_sc_dir_front.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_front.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Top"://Spacecraft
				camera.position = init_sc_dir_top.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_top.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Bottom"://Spacecraft
				camera.position = init_sc_dir_bottom.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_bottom.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Left"://Spacecraft
				camera.position = init_sc_dir_left.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_left.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Right"://Spacecraft
				camera.position = init_sc_dir_right.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_right.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			default: //free
				camera.position = global_cameras.attitude.position;
				camera.up = global_cameras.attitude.up;
				break;
		}
		selected_view = view_mode;
		global_cameras.attitude.view_mode = view_mode;
		camera.lookAt(scene.position);
	}
	function onWindowResize(){
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();

		att_renderer.setSize( window.innerWidth, window.innerHeight );

		controls.handleResize();

		render();
	}
	
	Attitude.prototype.resizeCanvas = function(){
		onWindowResize();
	}
	Attitude.prototype.stopAnimation = function(){
		cancelAnimationFrame(requestId); 
		global_cameras.attitude.position = camera.position;
		global_cameras.attitude.up = camera.up;
	}
	Attitude.prototype.selectView = function(view){
		changeView(view);
	}
	
	function updateView() {
		switch(selected_view){
			case "Earth"://Earth
				camera.position = results.earth_direction.clone().normalize().multiplyScalar(getCamDistance());	
				break;
			case "Sun"://Sun
				camera.position = results.sun_direction.clone().normalize().multiplyScalar(getCamDistance());
				break;
			case "S/C-XYZ"://Spacecraft
				camera.position = init_sc_dir_xyz.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_xyz.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Rear"://Spacecraft
				camera.position = init_sc_dir_rear.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_rear.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Front"://Spacecraft
				camera.position = init_sc_dir_front.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_front.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Top"://Spacecraft
				camera.position = init_sc_dir_top.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_top.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Bottom"://Spacecraft
				camera.position = init_sc_dir_bottom.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_bottom.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Left"://Spacecraft
				camera.position = init_sc_dir_left.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_left.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			case "S/C-Right"://Spacecraft
				camera.position = init_sc_dir_right.clone().applyQuaternion(spacecraft.quaternion.clone().normalize()).multiplyScalar(getCamDistance());
				camera.up = init_sc_up_right.clone().applyQuaternion(spacecraft.quaternion.clone().normalize());
				break;
			default:
				break;
		}
		camera.lookAt(scene.position);

	}
//***********************************************************************************************************************
//		                                                SPRITES
//***********************************************************************************************************************
	//element 0: others | 1: sun | 2: earth | 3: GUI view | 4: inclination
	function makeTextSprite(element, message, parameters )
	{
		if ( parameters === undefined ) parameters = {};
		
		var fontface = parameters.hasOwnProperty("fontface") ? 
			parameters["fontface"] : "Arial";
		
		var fontsize = parameters.hasOwnProperty("fontsize") ? 
			parameters["fontsize"] : 12;
		
		var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
			parameters["borderThickness"] : 4;
		
		var borderColor = parameters.hasOwnProperty("borderColor") ?
			parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
			
		var fontColor = parameters.hasOwnProperty("fontColor") ?
			parameters["fontColor"] : { r:255, g:255, b:255, a:1.0 };
		
		var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
			parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

		//var spriteAlignment = THREE.SpriteAlignment.topLeft;
			
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.font = "Normal " + fontsize + "px " + fontface;
		
		
		// get size data (height depends only on font size)
		var metrics = context.measureText( message );
		var textWidth = metrics.width;
		
		// background color
		context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
									  + backgroundColor.b + "," + backgroundColor.a + ")";
		// border color
		context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
									  + borderColor.b + "," + borderColor.a + ")";

		context.lineWidth = borderThickness;
		roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
		
		// text color
		context.fillStyle   = "rgba(" + fontColor.r + "," + fontColor.g + ","
									  + fontColor.b + "," + fontColor.a + ")";

		context.fillText( message, borderThickness, fontsize + borderThickness);
		
		
		
		// canvas contents will be used for a texture
		var texture = new THREE.Texture(canvas) 
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.SpriteMaterial( 
			{ map: texture, useScreenCoordinates: false/*, alignment: spriteAlignment*/ } );
		var sprite = new THREE.Sprite( spriteMaterial );
		
		if(element==1){//Sun
			contextSun = context;
			fontsizeSun = fontsize;
			borderColorSun = borderColor;
			borderThicknessSun = borderThickness; 
			backgroundColorSun = backgroundColor;
			fontColorSun = fontColor;
			sprite.scale.set(40,20,1.0);
		}else if(element==2){//Earth
			contextEarth = context;
			fontsizeEarth = fontsize;
			borderColorEarth = borderColor;
			borderThicknessEarth = borderThickness; 
			backgroundColorEarth = backgroundColor;
			fontColorEarth = fontColor;
			sprite.scale.set(50,25,1.0);
		}else if(element==3){//GUI view
			spriteMaterial = new THREE.SpriteMaterial( 
				{ map: texture, useScreenCoordinates: true, alignment: THREE.SpriteAlignment.bottomRight } );
			sprite = new THREE.Sprite( spriteMaterial );
			sprite.scale.set(64,64,1.0);
		}else if(element==4){//Inclination
			contextInclination = context;
			fontsizeInclination = fontsize;
			borderColorInclination = borderColor;
			borderThicknessInclination = borderThickness; 
			backgroundColorInclination = backgroundColor;
			fontColorInclination = fontColor;
			sprite.scale.set(20,10,1.0);
		}else if(element==5){//Longitude
			contextLongitude = context;
			fontsizeLongitude = fontsize;
			borderColorLongitude = borderColor;
			borderThicknessLongitude = borderThickness; 
			backgroundColorLongitude = backgroundColor;
			fontColorLongitude = fontColor;
			sprite.scale.set(20,10,1.0);
		}else if(element==6){//Latitude
			contextLatitude = context;
			fontsizeLatitude = fontsize;
			borderColorLatitude = borderColor;
			borderThicknessLatitude = borderThickness; 
			backgroundColorLatitude = backgroundColor;
			fontColorLatitude = fontColor;
			sprite.scale.set(20,10,1.0);
		}else if(element==7){//Angles between vectors
			contextAngles = context;
			fontsizeAngles = fontsize;
			borderColorAngles = borderColor;
			borderThicknessAngles = borderThickness; 
			backgroundColorAngles = backgroundColor;
			fontColorAngles = fontColor;
			sprite.scale.set(20,10,1.0);
		}else{//Axis labels
			sprite.scale.set(20,10,1.0);
		}
		
		return sprite;	
	}

	// function for drawing rounded rectangles
	function roundRect(ctx, x, y, w, h, r) 
	{
		ctx.beginPath();
		ctx.moveTo(x+r, y);
		ctx.lineTo(x+w-r, y);
		ctx.quadraticCurveTo(x+w, y, x+w, y+r);
		ctx.lineTo(x+w, y+h-r);
		ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
		ctx.lineTo(x+r, y+h);
		ctx.quadraticCurveTo(x, y+h, x, y+h-r);
		ctx.lineTo(x, y+r);
		ctx.quadraticCurveTo(x, y, x+r, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();   
	}
	function updateInclinationSprite(inclination){
		//Update Sprite
		var messageInclination = " i="+parseFloat((inclination * 180) / Math.PI).toFixed(1)+"º ";
		contextInclination.fillStyle = "rgba(0, 0, 0, 1.0)"; // CLEAR WITH COLOR BLACK (new BG color)
		contextInclination.fill(); // FILL THE CONTEXT
		// get size data (height depends only on font size)
		var metricsInclination = contextInclination.measureText( messageInclination );
		var textWidthInclination = metricsInclination.width;
		// background color
		contextInclination.fillStyle   = "rgba(" + backgroundColorInclination.r + "," + backgroundColorInclination.g + ","
									  + backgroundColorInclination.b + "," + backgroundColorInclination.a + ")";
		// border color
		contextInclination.strokeStyle = "rgba(" + borderColorInclination.r + "," + borderColorInclination.g + ","
									  + borderColorInclination.b + "," + borderColorInclination.a + ")";
		contextInclination.lineWidth = borderThicknessInclination;
		roundRect(contextInclination, borderThicknessInclination/2, borderThicknessInclination/2, textWidthInclination + borderThicknessInclination, fontsizeInclination * 1.4 + borderThicknessInclination, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
		// text color
		contextInclination.fillStyle   = "rgba(" + fontColorInclination.r + "," + fontColorInclination.g + ","
									  + fontColorInclination.b + "," + fontColorInclination.a + ")";
		contextInclination.fillText( messageInclination, borderThicknessInclination, fontsizeInclination + borderThicknessInclination);
		spriteInclination.material.map._needsUpdate = true; // AND UPDATE THE IMAGE..
	}
	function updateLatitudeSprite(lat){
		//Update Sprite
		var messageLatitude = " φ="+parseFloat((lat * 180) / Math.PI).toFixed(1)+"º ";
		contextLatitude.fillStyle = "rgba(0, 0, 0, 1.0)"; // CLEAR WITH COLOR BLACK (new BG color)
		contextLatitude.fill(); // FILL THE CONTEXT
		// get size data (height depends only on font size)
		var metricsLatitude = contextLatitude.measureText( messageLatitude );
		var textWidthLatitude = metricsLatitude.width;
		// background color
		contextLatitude.fillStyle   = "rgba(" + backgroundColorLatitude.r + "," + backgroundColorLatitude.g + ","
									  + backgroundColorLatitude.b + "," + backgroundColorLatitude.a + ")";
		// border color
		contextLatitude.strokeStyle = "rgba(" + borderColorLatitude.r + "," + borderColorLatitude.g + ","
									  + borderColorLatitude.b + "," + borderColorLatitude.a + ")";
		contextLatitude.lineWidth = borderThicknessLatitude;
		roundRect(contextLatitude, borderThicknessLatitude/2, borderThicknessLatitude/2, textWidthLatitude + borderThicknessLatitude, fontsizeLatitude * 1.4 + borderThicknessLatitude, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
		// text color
		contextLatitude.fillStyle   = "rgba(" + fontColorLatitude.r + "," + fontColorLatitude.g + ","
									  + fontColorLatitude.b + "," + fontColorLatitude.a + ")";
		contextLatitude.fillText( messageLatitude, borderThicknessLatitude, fontsizeLatitude + borderThicknessLatitude);
		lat_sprite.material.map._needsUpdate = true; // AND UPDATE THE IMAGE..
	}
	function updateLongitudeSprite(lng){
		//Update Sprite
		var messageLongitude = " λ="+parseFloat((lng * 180) / Math.PI).toFixed(1)+"º ";
		contextLongitude.fillStyle = "rgba(0, 0, 0, 1.0)"; // CLEAR WITH COLOR BLACK (new BG color)
		contextLongitude.fill(); // FILL THE CONTEXT
		// get size data (height depends only on font size)
		var metricsLongitude = contextLongitude.measureText( messageLongitude );
		var textWidthLongitude = metricsLongitude.width;
		// background color
		contextLongitude.fillStyle   = "rgba(" + backgroundColorLongitude.r + "," + backgroundColorLongitude.g + ","
									  + backgroundColorLongitude.b + "," + backgroundColorLongitude.a + ")";
		// border color
		contextLongitude.strokeStyle = "rgba(" + borderColorLongitude.r + "," + borderColorLongitude.g + ","
									  + borderColorLongitude.b + "," + borderColorLongitude.a + ")";
		contextLongitude.lineWidth = borderThicknessLongitude;
		roundRect(contextLongitude, borderThicknessLongitude/2, borderThicknessLongitude/2, textWidthLongitude + borderThicknessLongitude, fontsizeLongitude * 1.4 + borderThicknessLongitude, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
		// text color
		contextLongitude.fillStyle   = "rgba(" + fontColorLongitude.r + "," + fontColorLongitude.g + ","
									  + fontColorLongitude.b + "," + fontColorLongitude.a + ")";
		contextLongitude.fillText( messageLongitude, borderThicknessLongitude, fontsizeLongitude + borderThicknessLongitude);
		long_sprite.material.map._needsUpdate = true; // AND UPDATE THE IMAGE..
	}
	function updateAnglesSprite(angle){
		//Update Sprite
		var messageAngles = " α="+parseFloat((angle * 180) / Math.PI).toFixed(1)+"º ";
		contextAngles.fillStyle = "rgba(0, 0, 0, 1.0)"; // CLEAR WITH COLOR BLACK (new BG color)
		contextAngles.fill(); // FILL THE CONTEXT
		// get size data (height depends only on font size)
		var metricsAngles = contextAngles.measureText( messageAngles );
		var textWidthAngles = metricsAngles.width;
		// background color
		contextAngles.fillStyle   = "rgba(" + backgroundColorAngles.r + "," + backgroundColorAngles.g + ","
									  + backgroundColorAngles.b + "," + backgroundColorAngles.a + ")";

		// border color
		contextAngles.strokeStyle = "rgba(" + borderColorAngles.r + "," + borderColorAngles.g + ","
									  + borderColorAngles.b + "," + borderColorAngles.a + ")";
		contextAngles.lineWidth = borderThicknessAngles;
		roundRect(contextAngles, borderThicknessAngles/2, borderThicknessAngles/2, textWidthAngles + borderThicknessAngles, fontsizeAngles * 1.4 + borderThicknessAngles, 6);
		// 1.4 is extra height factor for text below baseline: g,j,p,q.
		// text color
		contextAngles.fillStyle   = "rgba(" + fontColorAngles.r + "," + fontColorAngles.g + ","
									  + fontColorAngles.b + "," + fontColorAngles.a + ")";
		contextAngles.fillText( messageAngles, borderThicknessAngles, fontsizeAngles + borderThicknessAngles);
		vectors_sprite.material.map._needsUpdate = true; // AND UPDATE THE IMAGE..
	}
}
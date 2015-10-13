var scene, renderer, camera, rectangleMaterial, textMaterial;
var container, stats;
var controls;
var objects = [], links = [], plane;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(),
    offset = new THREE.Vector3(),
    INTERSECTED, SELECTED;

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xcccccc, 0.001 );
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.sortObjects = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
    renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );

    container = document.getElementById('content');
    container.appendChild( renderer.domElement );
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
    controls = new THREE.TrackballControls( camera );
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    camera.position.z = 100;
    plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 500, 500, 8, 8 ),
        new THREE.MeshBasicMaterial( { visible: false } )
    );
    scene.add( plane );
    window.addEventListener('resize', onWindowResize, false);
    light();
    materials();
}

function materials() {
    rectangleMaterial = new THREE.MeshPhongMaterial( { color: 0x119955, shading: THREE.FlatShading } );
    textMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.FlatShading } );
}
function light() {
    dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.position.set( 0.2, 0.2, 1 );
    dirLight.castShadow = true;
    dirLight.shadowMapWidth = 2048;
    dirLight.shadowMapHeight = 2048;
    var d = 50;
    dirLight.shadowCameraLeft = -d;
    dirLight.shadowCameraRight = d;
    dirLight.shadowCameraTop = d;
    dirLight.shadowCameraBottom = -d;
    dirLight.shadowCameraFar = 3500;
    dirLight.shadowBias = -0.0001;
    dirLight.shadowDarkness = 1;
    scene.add( dirLight );
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function addForm(args, position, name, outputs) {
    if (!outputs) outputs = ['out'];
    var argsScale = 20;
    var padding = 10;
    var textMesh = makeText(name, true);
    var nameWidth = textMesh.geometry.boundingBox.max.x - textMesh.geometry.boundingBox.min.x;
    var argWidth = args.length * argsScale;
    var height = textMesh.geometry.boundingBox.max.y - textMesh.geometry.boundingBox.min.y;
    var extrudeMesh = makeFrame(Math.max(nameWidth, argWidth) + padding, height + padding);
    var form = compose([extrudeMesh, textMesh]);
    form.position.set(position[0], position[1], position[2]);
    var sgeometry = new THREE.SphereGeometry( 5 );
    var smaterial = new THREE.MeshPhongMaterial( {color: 0xffffff, shading: THREE.FlatShading} );
    var input;
    for (var i = 0; i < args.length; i++) {
        input = new THREE.Mesh( sgeometry, smaterial );
        scene.add(input);
        THREE.SceneUtils.attach(input, scene, form);
        input.position.set(20 * (i - (args.length / 2)), 10, 5);
    }
    var addInput = new THREE.Mesh(sgeometry, rectangleMaterial);
    scene.add(addInput);
    THREE.SceneUtils.attach(addInput, scene, form);
    addInput.position.set(20 * (args.length / 2), 10, 5);
    for (var j = 0; i < outputs.length; i++) {
        var sphere = new THREE.Mesh(sgeometry, rectangleMaterial);
        scene.add(sphere);
        THREE.SceneUtils.attach(sphere, scene, form);
        console.log(outputs.length / 2.0);
        sphere.position.set(20 * (j - ((outputs.length - 1) / 2.0)), -10, 5);
    }

    scene.add(form);
    objects.push(form);
    return form;

}

function makeText(text, shift) {
    var textGeometry = new THREE.TextGeometry(text, {font: "droid sans", height: 10, size: 10, style: "normal"});
    if (shift) {
        textGeometry.computeBoundingBox();
        width = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
        height = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
        textGeometry.applyMatrix( new THREE.Matrix4().makeTranslation(- width / 2.0, - height / 2.0, 0));
    }
    return new THREE.Mesh(textGeometry, textMaterial);
}

function makeFrame(width, height) {
    var points = [];
    points.push(new THREE.Vector2(- width / 2.0, - height / 2.0));
    points.push(new THREE.Vector2(- width / 2.0, height / 2.0));
    points.push(new THREE.Vector2(width / 2.0, height / 2.0));
    points.push(new THREE.Vector2(width / 2.0, - height / 2.0));
    var extrudeShape = new THREE.Shape(points);
    var extrudeSettings = { amount: 8, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };
    var extrudeGeometry = new THREE.ExtrudeGeometry(extrudeShape, extrudeSettings);
    return new THREE.Mesh(extrudeGeometry, rectangleMaterial);
}

function distance(v1, v2) {
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;
    return Math.sqrt(dx*dx+dy*dy+dz*dz);
}


function addFancyLink(startNode, endNode) {
    var start = startNode.position, end = endNode.position;
    var dir = new THREE.Vector3().subVectors(end, start).normalize();
    var origin = start;
    var length = distance(end, start);
    var hex = 0x000000;
    var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
    arrowHelper.startNode = startNode;
    arrowHelper.endNode = endNode;
    scene.add(arrowHelper);
    links.push(arrowHelper);
    return arrowHelper;
}

function compose(meshes) {
    var geometry = new THREE.Geometry();
    var materials = [];
    for (var i = 0; i < meshes.length; i++) {
        materials.push(meshes[i].material);
        geometry.merge(meshes[i].geometry, meshes[i].matrix, i);
    }
    return new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
}

init();

var cube = addForm([4, 2, 1], [60, 60, 0], "hi");
var cube2 = addForm([4, 2, 1], [0, 0, 0], "two");
var cube3 = addForm([], [-60, -60, 0], "three");
var cube4 = addForm([4, 2, 1], [-120, -120, 0], "four");
var cube5 = addForm([4, 2, 1], [120, 120, 0], "five");

var link = addFancyLink(cube2, cube3);
console.log(link);

function updateLinks() {
    var direction, origin, length, start, end;

    for (var i = 0; i < links.length ; i++) {
        start = links[i].startNode.position;
        end = links[i].endNode.position;

        origin = start;
        direction = new THREE.Vector3().subVectors(end, start).normalize();
        length = distance(start, end);

        links[i].position.set(origin);
        links[i].setDirection(direction);
        links[i].setLength(length);
    }

}

function render() {
    requestAnimationFrame( render );
    updateLinks();
    controls.update();
    renderer.render(scene, camera);
}

function onDocumentMouseMove( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    //

    raycaster.setFromCamera( mouse, camera );

    if ( SELECTED ) {

        var intersects = raycaster.intersectObject( plane );

        if ( intersects.length > 0 ) {

            SELECTED.position.copy( intersects[ 0 ].point.sub( offset ) );

        }

        return;

    }

    var intersects = raycaster.intersectObjects( objects );

    if ( intersects.length > 0 ) {

        if ( INTERSECTED != intersects[ 0 ].object ) {
            INTERSECTED = intersects[ 0 ].object;
            plane.position.copy( INTERSECTED.position );
        }

        container.style.cursor = 'pointer';

    } else {
        INTERSECTED = null;
        container.style.cursor = 'auto';

    }

}

function onDocumentMouseDown( event ) {

    event.preventDefault();

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( objects );

    if ( intersects.length > 0 ) {

        controls.enabled = false;

        SELECTED = intersects[ 0 ].object;

        var intersects = raycaster.intersectObject( plane );

        if ( intersects.length > 0 ) {

            offset.copy( intersects[ 0 ].point ).sub( plane.position );

        }

        container.style.cursor = 'move';

    }

}

function onDocumentMouseUp( event ) {

    event.preventDefault();

    controls.enabled = true;

    if ( INTERSECTED ) {

        plane.position.copy( INTERSECTED.position );

        SELECTED = null;

    }

    container.style.cursor = 'auto';

}


render();
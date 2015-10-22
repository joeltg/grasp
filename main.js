var scene, renderer, camera, rectangleMaterial, textMaterial;
var container, stats;
var controls;
var objects = [], links = [], plane;
var parens;

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
    camera = new THREE.PerspectiveCamera( 60, (window.innerWidth) / window.innerHeight, 1, 10000 );
    controls = new THREE.TrackballControls( camera );
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    camera.position.z = 100;
    plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 1000, 1000, 8, 8 ),
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

function addForm(numArgs, position, name, outputs) {
    if (!outputs) outputs = ['out'];
    var argsScale = 20;
    var padding = 10;
    var textMesh = makeText(name, true);
    var nameWidth = textMesh.geometry.boundingBox.max.x - textMesh.geometry.boundingBox.min.x;
    var argWidth = numArgs * argsScale;
    var height = 10;
    var extrudeMesh = makeFrame(Math.max(nameWidth, argWidth) + padding, height + padding);
    var form = compose([extrudeMesh, textMesh]);
    form.position.set(position[0], position[1], position[2]);
    var sgeometry = new THREE.SphereGeometry( 5 );
    var smaterial = new THREE.MeshPhongMaterial( {color: 0xffffff, shading: THREE.FlatShading} );
    var input;
    for (var i = 0; i < numArgs; i++) {
        input = new THREE.Mesh( sgeometry, smaterial );
        scene.add(input);
        THREE.SceneUtils.attach(input, scene, form);
        input.position.set(20 * (i - (numArgs / 2)), 10, 5);
    }

    if (numArgs != -1) {
        var addInput = new THREE.Mesh(sgeometry, rectangleMaterial);
        scene.add(addInput);
        THREE.SceneUtils.attach(addInput, scene, form);
        addInput.position.set(20 * (numArgs / 2), 10, 5);
    }

    for (var j = 0; j < outputs.length; j++) {
        var sphere = new THREE.Mesh(sgeometry, rectangleMaterial);
        scene.add(sphere);
        THREE.SceneUtils.attach(sphere, scene, form);
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

var getCurve = THREE.Curve.create(
    function ( ) { },
    function ( t ) { return new THREE.Vector3(0, t, 0);  }
);

function addLink(startNode, endNode) {

    var path = new getCurve(length);
    var tubeGeometry = new THREE.TubeGeometry(path, 8, 2, 8, true);
    var link = new THREE.Mesh(tubeGeometry, rectangleMaterial);
    link.startNode = startNode;
    link.endNode = endNode;
    updateLink(link);
    scene.add(link);
    links.push(link);
    return link;
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
/*
var cube1 = addForm(0, [30, 60, 0], "one");
var cube2 = addForm(2, [0, 0, 0], "add");
var cube3 = addForm(1, [-60, -90, 0], "print");
var cube5 = addForm(0, [-60, 60, 0], "three");

var link1 = addLink(getOutputPort(cube2), cube3.children[0]);
var link2 = addLink(getOutputPort(cube1), cube2.children[1]);
var link3 = addLink(getOutputPort(cube5), cube2.children[0]);
*/
function getOutputPort(form) {
    return form.children[form.children.length - 1];
}

function updateLinks() {

    for (var i = 0; i < links.length ; i++) {
        updateLink(links[i]);
    }
}

function updateLink(link) {
    var start = new THREE.Vector3().addVectors(link.startNode.position, link.startNode.parent.position);
    var end = new THREE.Vector3().addVectors(link.endNode.position, link.endNode.parent.position);
    var direction = new THREE.Vector3().subVectors(end, start);
    var length = distance(start, end);
    link.position.set(start.x, start.y, start.z);
    link.rotation.z = 0;
    link.scale.set(1, length * 1.15, 1);
    link.rotation.z = ((start.x > end.x) ? 1 : -1) * link.up.angleTo(direction);
}

function render() {
    requestAnimationFrame( render );
    updateLinks();
    controls.update();
    renderer.render(scene, camera);
}

function parse(code) {
    // (function arg1 arg2 (function2 etc etc) arg4)
    var marker = "|";
    while (code.indexOf(marker) >= 0)
        marker += "|";
    marker = ' ' + marker + ' ';
    if (code.substring(0, 1) == '(' && code.substring(code.length - 1, code.length) == ')')
        code = code.substring(1, code.length - 1);
    else return code;
    code = code.split('');
    var parens = 0;
    var quote = false;
    for (var i = 0; i < code.length; i++) {
        if (code[i] == '(') parens++;
        else if (code[i] == ')') parens--;
        else if (code[i] == '"') quote = !quote;
        else if (code[i] == ' ' && parens == 0 && !quote)
            code[i] = marker;
    }
    code = code.join('');
    code = code.split(marker);
    for (var j = 0; j < code.length; j++)
        code[j] = parse(code[j]);
    return code;
}

function sanitize(text) {
    var t = text.replace(/\n(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, " ");
    while (t != text) { t = text.replace(/\n(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, " "); }
    t = text.replace(/\s\s(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, " ");
    while (t != text) { text = t.replace(/\s\s(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, " "); }
    t = text.replace(/\s\s(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, " ");
    while (t != text) { text = text.replace(/\(\s(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, "("); }
    t = text = text.replace(/\s\)(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, ")");
    while (t != text) { text = text.replace(/\s\)(?=([^\"']*[\"'][^\"']*[\"'])*[^\"']*$)/, ")"); }
    return text;
}

function load(text, splits) {
    clear();
    if (text.indexOf('(') < 0 && text.indexOf(')') < 0) text = '(' + text + ')';
    var code;
    for (var i = 0; i < splits.length; i++) {
        code = text.substring(splits[i][0], splits[i][1]);
        makeNode(code);
    }
}

function clear() {
    for (var i = 0; i < objects.length; i++) {
        scene.remove(objects[i]);
    }
    for (var j = 0; j < links.length; j++) {
        scene.remove(links[j]);
    }
    plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 1000, 1000, 8, 8 ),
        new THREE.MeshBasicMaterial( { visible: false } )
    );
    scene.add( plane );
    renderer.render(scene, camera);
}

function countParens(text) {
    var c = 0;
    var q = true
    var splits = [];
    for (var i = 0; i < text.length; i++) {
        if (text[i] == '"') q = !q;
        else if (text[i] == '(' && q) {
            c += 1;
            if (c == 1) splits.push([i]);
        }
        else if (text[i] == ')' && q) {
            c -= 1;
            if (c == 0 && splits.length > 0) splits[splits.length - 1].push(i + 1);
        }
    }
    return [c, splits];
}

editor.getSession().on('change', function(e) {
    var text = editor.getValue();
    var newParens = countParens(text);
    console.log(newParens);
    if (!parens) parens = [];
    if (!(parens.toString() == newParens.toString())) {
        parens = newParens;
        if (parens[0] == 0 && text.length > 0) load(text.trim(), parens[1]);
    };
});

function makeNode(args) {
    console.log(args);
    if (typeof args == "string") {args = parse(sanitize(args)); }

    var node = addForm(args.length - 1, [0, 0, 0], args[0]);

    var arg, link;
    for (var i = 1; i < args.length; i++) {
        arg = args[i];
        if (typeof arg == "object" && arg.constructor === Array) {
            arg = makeNode(arg);
            link = addLink(getOutputPort(arg), node.children[i - 1]);
        }
        else {
            arg = addForm(-1, [0, 0, 0], arg);
            link = addLink(getOutputPort(arg), node.children[i - 1]);
        }
    }
    return node;
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
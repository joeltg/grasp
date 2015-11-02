var scene, renderer, camera, rectangleMaterial, textMaterial;
var container, stats;
var controls, plane;
var OBJECTS = [], NODES = [], EDGES = [], ARGS = [], OUTPUTS = [];
var parens;
var ARG_PADDING = 20;
var ARG_ELEVATION = 1;
var FRAME_PADDING = 10;
var EDITOR_WIDTH = 400;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var offset = new THREE.Vector3();
var INTERSECTED, SELECTED, DRAG_SOURCE, DRAG_TARGET, DRAG_EDGE, DRAG_TYPE;

var materials = {
    frame: new THREE.MeshPhongMaterial( { color: 0x119955, shading: THREE.FlatShading } ),
    text:  new THREE.MeshPhongMaterial( { color: 0xffffff, shading: THREE.FlatShading } ),
    input: new THREE.MeshPhongMaterial( {color: 0xffffff, shading: THREE.FlatShading} ),
    output: new THREE.MeshPhongMaterial( {color: 0x119955, shading: THREE.FlatShading} )
};

var geometries = {
    text: function(name) {
        var g = new THREE.TextGeometry(name, {font: "droid sans", height: 6, size: 10, style: "normal"});
        g.computeBoundingBox();
        g.width = g.boundingBox.max.x - g.boundingBox.min.x;
        g.height = g.boundingBox.max.y - g.boundingBox.min.y;
        g.applyMatrix(new THREE.Matrix4().makeTranslation(- g.width / 2.0, - g.height / 2.0, 0));
        g.dynamic = true;
        g.verticesNeedUpdate = true;
        return g;
    },
    frame: function(w, h) {
        var points = [];
        points.push(new THREE.Vector2(- 0.5 * w, - 0.5 * h));
        points.push(new THREE.Vector2(- 0.5 * w, 0.5 * h));
        points.push(new THREE.Vector2(0.5 * w, 0.5 * h));
        points.push(new THREE.Vector2(0.5 * w, - 0.5 * h));
        var shape = new THREE.Shape(points);
        var settings = {amount: 5, bevelEnabled: false, steps: 1};
        var g = new THREE.ExtrudeGeometry(shape, settings);
        g.width = w;
        g.height = h;
        return g;
    },
    input: new THREE.SphereGeometry(5),
    output: new THREE.SphereGeometry(5),
    edge: function() {
        var getCurve = THREE.Curve.create(
            function () {},
            function (t) {return new THREE.Vector3(0, t, 0);}
        );
        return new THREE.TubeGeometry(new getCurve(), 8, 2, 8, true);
    }
};

function Node(name, numArgs) {
    if (!numArgs) numArgs = 0;
    if (!name) name = " ";
    this.name = name;
    this.numArgs = numArgs;
    var args = [];
    this.args = args;

    // make text
    if (name) {
        var textGeometry = geometries.text(name);
        var text = new THREE.Mesh(textGeometry, materials.text);
        this.text = text;
        scene.add(text);
    }

    // make frame
    var argWidth = numArgs * ARG_PADDING;
    var frameWidth = Math.max(textGeometry.width, argWidth) + FRAME_PADDING;
    var frameHeight = 10 + FRAME_PADDING;
    this.width = frameWidth;
    this.height = frameHeight;

    var frameGeometry = geometries.frame(frameWidth, frameHeight);
    var frame = new THREE.Mesh(frameGeometry, materials.frame);
    this.frame = frame;
    scene.add(frame);

    THREE.SceneUtils.attach(text, scene, frame);
    OBJECTS.push(frame);

    // inputs
    for (var i = 0; i < numArgs; i++) {
        var input = new THREE.Mesh(geometries.input, materials.input);
        scene.add(input);
        THREE.SceneUtils.attach(input, scene, this.frame);
        input.position.set(ARG_PADDING * (i - (numArgs / 2.0)), frameHeight / 2.0, ARG_ELEVATION);
        args.push(input);
        ARGS.push(input);
    }

    // add input
    var addInput = new THREE.Mesh(geometries.output, materials.output);
    scene.add(addInput);
    ARGS.push(addInput);
    THREE.SceneUtils.attach(addInput, scene, frame);
    addInput.position.set(ARG_PADDING * (numArgs / 2.0), frameHeight / 2.0, ARG_ELEVATION);
    this.addInput = addInput;

    // output
    var output = new THREE.Mesh(geometries.output, materials.output);
    scene.add(output);
    ARGS.push(output);
    OUTPUTS.push(output);
    THREE.SceneUtils.attach(output, scene, frame);
    output.position.set(0, -frameHeight / 2.0, ARG_ELEVATION);
    this.output = output;
    this.position = frame.position;

    this.setName = function(name) {
        var text = new THREE.Mesh(geometries.text(name), materials.text);
        THREE.SceneUtils.detach(this.text, this.frame, scene);
        this.text.geometry.dispose();
        scene.remove(this.text);
        scene.add(text);
        this.text = text;
        THREE.SceneUtils.attach(text, scene, this.frame);
        if (text.geometry.width > this.args * ARG_PADDING) this.resizeFrame();
    };
    this.addArg = function(index) {
        if (!index) index = this.numArgs;
        this.numArgs += 1;
        var input = new THREE.Mesh(geometries.input, materials.input);
        scene.add(input);
        ARGS.push(input);
        this.args.splice(index, 0, input);
        THREE.SceneUtils.attach(input, scene, this.frame);
        for (var i = 0; i < this.numArgs; i++)
            this.args[i].position.set(ARG_PADDING * (i - (this.numArgs / 2.0)), frameHeight / 2.0, ARG_ELEVATION);
        this.addInput.position.set(ARG_PADDING * (this.numArgs / 2.0), frameHeight / 2.0, ARG_ELEVATION);
        // resize frame if necessary
        if (this.width < (ARG_PADDING * this.numArgs) + FRAME_PADDING) this.resizeFrame();
    };
    this.removeArg = function(index) {
        if (!index) index = this.numArgs - 1;
        this.numArgs -= 1;
        var input = this.args[index];
        scene.remove(input);
        this.args.splice(index, 1);
        if (ARGS.indexOf(this.args[index]) > -1) ARGS.splice(ARGS.indexOf(this.args[index]), 1);
        else console.log("ARG DOES NOT EXIST");
        THREE.SceneUtils.detach(input, this.frame, scene);
        input.geometry.dispose();
        scene.remove(input);
        for (var i = 0; i < this.numArgs; i++)
            this.args[i].position.set(ARG_PADDING * (i - (this.numArgs / 2.0)), frameHeight / 2.0, ARG_ELEVATION);
        this.addInput.position.set(ARG_PADDING * (this.numArgs / 2.0), frameHeight / 2.0, ARG_ELEVATION);
        // resize frame if necessary
        if (this.width < ARG_PADDING * this.args) this.resizeFrame();
    };
    this.resizeFrame  = function() {
        var argWidth = this.numArgs * ARG_PADDING;
        var frameWidth = Math.max(this.text.geometry.width, argWidth) + FRAME_PADDING;
        var frameHeight = 10 + FRAME_PADDING;
        this.width = frameWidth;
        this.height = frameHeight;
        for (var i = 0; i < this.frame.geometry.vertices.length; i++) {
            var vertex = this.frame.geometry.vertices[i];
            vertex.x = (vertex.x < 0 ? -1 : 1) * frameWidth / 2.0;
            vertex.y = (vertex.y < 0 ? -1 : 1) * frameHeight / 2.0;
        }
        this.frame.geometry.verticesNeedUpdate = true;
    };
    this.setPosition = function(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        this.frame.position.set(this.position);
    };
    this.remove = function() {
        for (var i = 0; i < this.args.length; i++) this.removeArg(i);
        this.frame.geometry.dispose();
        scene.remove(this.frame);
        console.log(NODES.indexOf(this));
        NODES.splice(NODES.indexOf(this), 1);
    };
    NODES.push(this);
}

function Edge(startNode, endNode) {
    if (startNode.link) startNode.link.remove();
    if (endNode.link) endNode.link.remove();
    this.startNode = startNode;
    this.endNode = endNode;
    var tube = new THREE.Mesh(geometries.edge(), materials.frame);
    this.tube = tube;
    this.update = function() {
        var start = new THREE.Vector3().addVectors(startNode.position, startNode.parent.position);
        var end = new THREE.Vector3().addVectors(endNode.position, endNode.parent.position);
        var direction = new THREE.Vector3().subVectors(end, start);
        var length = distance(start, end);
        this.tube.position.set(start.x, start.y, start.z);
        this.tube.rotation.z = 0;
        this.tube.scale.set(1, length * 1.15, 1);
        this.tube.rotation.z = ((start.x > end.x) ? 1 : -1) * this.tube.up.angleTo(direction);
    };
    this.remove = function() {
        this.tube.geometry.dispose();
        scene.remove(this.tube);
        EDGES.splice(EDGES.indexOf(this), 1);
    };

    this.update();
    scene.add(tube);
    startNode.link = this;
    endNode.link = this;
    EDGES.push(this);
}

function distance(v1, v2) {
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;
    return Math.sqrt(dx*dx+dy*dy+dz*dz);
}

function render() {
    requestAnimationFrame( render );
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

function remove(object) {
    console.log("REMOVING");
    while (object.children.length > 0) remove(object.children[0]);
    THREE.SceneUtils.detach(object, object.parent, scene);
    object.geometry.dispose();
    scene.remove(object);
}

function clear() {
    for (var i = 0; i < OBJECTS.length; i++) remove(OBJECTS[i]);
    for (i = 0; i < EDGES.length; i++) remove(EDGES[i].tube);
    OBJECTS = [];
    EDGES = [];
    ARGS = [];
    OUTPUTS = [];
    console.log(scene);
}

function countParens(text) {
    var c = 0;
    var q = true;
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
    if (!parens) parens = [];
    if (!(parens.toString() == newParens.toString())) {
        parens = newParens;
        if (parens[0] == 0 && text.length > 0) load(text.trim(), parens[1]);
    }
});

function makeNode(args) {
    if (typeof args == "string") {args = parse(sanitize(args)); }
    var node = new Node(args[0], args.length - 1);
    var arg, link;
    for (var i = 1; i < args.length; i++) {
        arg = args[i];
        if (typeof arg == "object" && arg.constructor === Array) {
            arg = makeNode(arg);
            link = new Edge(arg.output, node.args[i - 1]);
        }
        else {
            arg = new Node(arg, 0);
            link = new Edge(arg.output, node.args[i - 1]);
        }
    }
    return node;
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = ((event.clientX - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH)) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var intersects;
    if (SELECTED) {
        if (DRAG_EDGE) {
            DRAG_EDGE.update();
            return;
        }
        intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0)
            SELECTED.position.copy(intersects[0].point.sub(offset));
        for (var i = 0; i < SELECTED.children.length; i++)
            if (SELECTED.children[i].link) SELECTED.children[i].link.update();
        return;
    }
    intersects = raycaster.intersectObjects(OBJECTS);
    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            INTERSECTED = intersects[0].object;
            plane.position.copy(INTERSECTED.position);
        }
        container.style.cursor = 'pointer';
        return;
    }
    intersects = raycaster.intersectObjects(ARGS);
    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            INTERSECTED = intersects[0].object;
            if (DRAG_SOURCE) {
                DRAG_TARGET.position.copy(intersects[0].object.position);
                DRAG_TARGET.position.add(intersects[0].object.parent.position);
                DRAG_EDGE.update();
            }
            plane.position.copy(INTERSECTED.position);
        }
        container.style.cursor = 'pointer';
        return;
    }
    intersects = raycaster.intersectObjects(OUTPUTS);
    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            INTERSECTED = intersects[0].object;
            if (DRAG_SOURCE) {
                DRAG_TARGET.position.copy(intersects[0].object.position);
                DRAG_TARGET.position.add(intersects[0].object.parent.position);
                DRAG_EDGE.update();
            }
            plane.position.copy(INTERSECTED.position);
        }
        container.style.cursor = 'pointer';
        return;
    }
    intersects = raycaster.intersectObjects([plane]);
    if (DRAG_SOURCE && intersects.length > 0) {
        DRAG_TARGET.position = intersects[0].point;
        DRAG_EDGE.update();
    }
    INTERSECTED = null;
    container.style.cursor = 'auto';
}

function onDocumentMouseDown(event) {
    event.preventDefault();
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(OBJECTS);
    if (intersects.length > 0) {
        controls.enabled = false;
        SELECTED = intersects[0].object;
        intersects = raycaster.intersectObject(plane);
        if (intersects.length > 0) offset.copy(intersects[0].point).sub(plane.position);
        container.style.cursor = 'move';
        return;
    }
    intersects = raycaster.intersectObjects(ARGS);
    if (intersects.length > 0) {
        controls.enabled = false;
        DRAG_SOURCE = intersects[0].object;
        if (DRAG_SOURCE.link) {
            DRAG_SOURCE.link.remove();
            DRAG_SOURCE.link = null;
        }
        DRAG_TARGET = {position: intersects[0].point, parent: {position: new THREE.Vector3(0, 0, 0)}};
        DRAG_EDGE = new Edge(DRAG_SOURCE, DRAG_TARGET);
        DRAG_TYPE = 'arg';
        container.style.cursor = 'move';
        return;
    }
    intersects = raycaster.intersectObjects(OUTPUTS);
    if (intersects.length > 0) {
        controls.enabled = false;
        DRAG_SOURCE = intersects[0].object;
        if (DRAG_SOURCE.link) {
            DRAG_SOURCE.link.remove();
            DRAG_SOURCE.link = null;
        }
        DRAG_TARGET = {position: intersects[0].point, parent: {position: new THREE.Vector3(0, 0, 0)}};
        DRAG_EDGE = new Edge(DRAG_SOURCE, DRAG_TARGET);
        DRAG_TYPE = 'output';
        container.style.cursor = 'move';
    }
}

function onDocumentMouseUp(event) {
    event.preventDefault();
    controls.enabled = true;
    if (INTERSECTED) {
        plane.position.copy(INTERSECTED.position);
        SELECTED = null;
    }
    container.style.cursor = 'auto';
    if (DRAG_EDGE) {
        DRAG_EDGE.remove();
        raycaster.setFromCamera(mouse, camera);
        var intersects;
        if (DRAG_TYPE == 'arg') {
            intersects = raycaster.intersectObjects(ARGS);
            if (intersects.length > 0) new Edge(DRAG_SOURCE, intersects[0].object);
        }
        if (DRAG_TYPE == 'output') {
            intersects = raycaster.intersectObjects(OUTPUTS);
            if (intersects.length > 0) new Edge(DRAG_SOURCE, intersects[0].object);
        }
    }
    DRAG_SOURCE = null;
    DRAG_TARGET = null;
    DRAG_EDGE = null;
}

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xcccccc, 0.001);
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio((window.innerWidth - EDITOR_WIDTH) / window.innerHeight);
    renderer.setSize((window.innerWidth - EDITOR_WIDTH), window.innerHeight);
    renderer.sortObjects = false;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container = document.getElementById('content');
    container.appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(60, (window.innerWidth - EDITOR_WIDTH) / window.innerHeight, 1, 10000);
    controls = new THREE.TrackballControls(camera);
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    camera.position.z = 100;

    plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1000, 1000, 8, 8),
        new THREE.MeshBasicMaterial({visible: false})
    );
    scene.add(plane);

    // mouse and resize listeners
    window.addEventListener('resize',
        function () {
            camera.aspect = (window.innerWidth - EDITOR_WIDTH) / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize((window.innerWidth - EDITOR_WIDTH), window.innerHeight);
        },
        false);
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
    renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);

    // light
    var dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(0.2, 0.2, 1);
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
    scene.add(dirLight);
}

init();

render();

var n = new Node("name", 4);
//var s = new Node("hi", 2);
//var e = new Edge(n.output, s.args[0]);
//clear();
clear();
console.log(scene);
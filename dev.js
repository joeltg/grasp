var SCENE, CAMERA, RENDERER, CONTROLS, CONTAINER;
var RAYCASTER, MOUSE, OFFSET;
var HOVER_OBJECT, SELECTED_OBJECT, CLICKED_OBJECT, DRAG_EDGE, DRAG_TARGET, ENDPOINTS = [];
var HOVER_OPACITY = 0.7;
var OBJECTS = [], SCOPES = [], NODES = [], EDGES = [], INPUTS = [], OUTPUTS = [], ADD_INPUTS = [];
var NODE_HEIGHT = 20, NODE_WIDTH = 10, NODE_PADDING = 10, INPUT_PADDING = 20, INPUT_ELEVATION = 1;
var SCOPE_COLOR = '#ffffff', NODE_COLOR = '#119955', EDGE_COLOR = '#119955', TEXT_COLOR = '#ffffff';
var OUTPUT_COLOR = '#119955', INPUT_COLOR = '#ffffff', ADD_INPUT_COLOR = '#119955', HIGHLIGHT_COLOR = '#ffff00';
var EDITOR_WIDTH = 400;

var materials = {
    scope: function() {return new THREE.MeshBasicMaterial({color: SCOPE_COLOR, visible: true, transparent: true, opacity: 0.5});},
    node: function() {return new THREE.MeshPhongMaterial({color: NODE_COLOR, shading: THREE.FlatShading, transparent: true, opacity: 1});},
    edge: function() {return new THREE.MeshPhongMaterial({color: EDGE_COLOR, shading: THREE.FlatShading,transparent: true, opacity: 1})},
    text:  function() {return new THREE.MeshPhongMaterial({color: TEXT_COLOR, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    input: function() {return new THREE.MeshPhongMaterial({color: INPUT_COLOR, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    addInput: function() {return new THREE.MeshPhongMaterial({color: ADD_INPUT_COLOR, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    output: function() {return new THREE.MeshPhongMaterial({color: OUTPUT_COLOR, shading: THREE.FlatShading, transparent: true, opacity: 1})}
};
var geometries = {
    scope: function() {return new THREE.PlaneBufferGeometry(100, 100, 1, 1)},
    node: function(w, h) {
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
    edge: function() {
        var getCurve = THREE.Curve.create(
            function () {},
            function (t) {return new THREE.Vector3(0, t, 0);}
        );
        return new THREE.TubeGeometry(new getCurve(), 8, 2, 8, true);
    },
    text: function(name) {
        var g = new THREE.TextGeometry(name, {font: "droid sans", height: 6, size: 10, style: "normal"});
        g.computeBoundingBox();
        g.width = g.boundingBox.max.x - g.boundingBox.min.x;
        g.applyMatrix(new THREE.Matrix4().makeTranslation(- g.width / 2.0, - 5, 0));
        g.dynamic = true;
        g.verticesNeedUpdate = true;
        return g;
    },
    input: function() {return new THREE.SphereGeometry(5)},
    output: function() {return new THREE.SphereGeometry(5)}
};

function Scope() {
    this.addNode = function(node) {
        this.nodes.push(node);
        this.mesh.add(node.mesh);
    };
    this.addEdge = function(edge) {
        this.edges.push(edge);
        this.mesh.add(edge.mesh);
    };
    this.remove = function() {
        var index = OBJECTS.indexOf(this.mesh);
        if (index > -1) OBJECTS.splice(index, 1);
        else console.error("Could not remove Scope.mesh from OBJECTS");
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].remove();
        }
        removeMesh(this.mesh);
    };
    this.type = 'scope';
    this.nodes = [];
    this.edges = [];
    this.mesh = new THREE.Mesh(geometries.scope(), materials.scope());
    this.mesh.object = this;
    OBJECTS.push(this.mesh);
    return this;
}

function Node(name, numberOfInputs) {
    this.setName = function(name) {
        if (this.text) removeMesh(this.text);
        this.name = name;
        this.text = new THREE.Mesh(geometries.text(name), materials.text());
        this.mesh.add(this.text);
        if (this.text.geometry.width > this.inputs.length * INPUT_PADDING) this.resize();
    };
    this.resize = function() {
        this.width = Math.max(this.text.geometry.width, this.inputs.length * INPUT_PADDING) + NODE_PADDING;
        for (var i = 0; i < this.mesh.geometry.vertices.length; i++) {
            var vertex = this.mesh.geometry.vertices[i];
            vertex.x = (vertex.x < 0 ? -1 : 1) * this.width / 2.0;
            vertex.y = (vertex.y < 0 ? -1 : 1) * NODE_HEIGHT / 2.0;
        }
        this.mesh.geometry.verticesNeedUpdate = true;
    };
    this.addInput = function(index) {
        if (!index && index != 0) index = this.inputs.length;
        var input = new THREE.Mesh(geometries.input(), materials.input());
        input.type = 'input';
        input.index = index;
        this.inputs.splice(index, 0, input);
        for (var i = 0; i < this.inputs.length; i++) {
            this.inputs[i].position.set(
                INPUT_PADDING * (i - (this.inputs.length / 2.0)), NODE_HEIGHT / 2.0, INPUT_ELEVATION
            );
            if (this.inputs[i].edge) this.inputs[i].edge.update();
        }
        this.input.position.set(INPUT_PADDING * (this.inputs.length / 2.0), NODE_HEIGHT / 2.0, INPUT_ELEVATION);
        this.mesh.add(input);
        INPUTS.push(input);
        if (this.width < (INPUT_PADDING * this.inputs.length) + NODE_PADDING) this.resize();
        return input;
    };
    this.removeInput = function(index) {
        if (!index && index != 0) index = this.inputs.length - 1;
        var input = this.inputs[index];
        this.inputs.splice(index, 1);
        var globalIndex = INPUTS.indexOf(input);
        if (globalIndex > -1) INPUTS.splice(globalIndex, 1);
        else console.error("Could not remove input from INPUTS");
        removeMesh(input);
        for (i = index; i < this.inputs.length; i++) this.inputs[i].index = i;
        for (var i = 0; i < this.inputs.length; i++) {
            this.inputs[i].position.set(
                INPUT_PADDING * (i - (this.inputs.length / 2.0)), NODE_HEIGHT / 2.0, INPUT_ELEVATION
            );
            if (this.inputs[i].edge) this.inputs[i].edge.update();
        }
        this.input.position.set(INPUT_PADDING * (this.inputs.length / 2.0), NODE_HEIGHT / 2.0, INPUT_ELEVATION);
        if (this.width < INPUT_PADDING * this.inputs.length) this.resize();
        this.resize();
    };
    this.setPosition = function(x, y, z) {
        this.mesh.position.set(x, y, z);
    };
    this.remove = function() {
        while (this.inputs.length > 0) {
            var input = this.inputs.pop();
            input.index = -1;
            if (input.edge) input.edge.remove();
        }
        if (this.output.edge) this.output.edge.remove();
        var index = OBJECTS.indexOf(this.mesh);
        if (index > -1) OBJECTS.splice(index, 1);
        else console.error("Could not remove Node.mesh from OBJECTS");
        index = NODES.indexOf(this.mesh);
        if (index > -1) NODES.splice(index, 1);
        else console.error("Could not remove Node.mesh from NODES");
        index = ADD_INPUTS.indexOf(this.input);
        if (index > -1) ADD_INPUTS.splice(index, 1);
        else console.error("Could not remove this.input from ADD_INPUT");
        index = OUTPUTS.indexOf(this.output);
        if (index > -1) OUTPUTS.splice(index, 1);
        else console.error("Could not remove this.output from OUTPUTS");
        index = this.mesh.parent.object.nodes.indexOf(this);
        if (index > -1) this.mesh.parent.object.nodes.splice(index, 1);
        else console.error("Could not remove this from parent.object.nodes");
        removeMesh(this.mesh);
    };
    this.type = 'node';
    this.width = NODE_WIDTH;
    this.mesh = new THREE.Mesh(geometries.node(NODE_HEIGHT, NODE_WIDTH), materials.node());
    OBJECTS.push(this.mesh);
    NODES.push(this.mesh);
    this.mesh.object = this;
    this.name = null;
    this.text = null;
    this.inputs = [];
    this.input = new THREE.Mesh(geometries.input(), materials.output());
    this.input.type = 'addInput';
    this.mesh.add(this.input);
    this.input.position.set(0, NODE_HEIGHT / 2.0, INPUT_ELEVATION);
    ADD_INPUTS.push(this.input);
    this.output = new THREE.Mesh(geometries.output(), materials.output());
    this.output.type = 'output';
    this.mesh.add(this.output);
    this.output.position.set(0, -NODE_HEIGHT / 2.0, INPUT_ELEVATION);
    OUTPUTS.push(this.output);
    if (name) this.setName(name);
    if (numberOfInputs) for (var i = 0; i < numberOfInputs; i++) this.addInput();
    return this;
}

function Edge(start, end) {
    this.remove = function() {
        var index = OBJECTS.indexOf(this.mesh);
        if (index > -1) OBJECTS.splice(index, 1);
        else console.error("Could not remove Edge.mesh from OBJECTS");
        index = EDGES.indexOf(this.mesh);
        if (index > -1) EDGES.splice(index, 1);
        else console.error("Could not remove Edge.mesh from EDGES");
        this.end.edge = null;
        this.start.edge = null;
        if (this.start.type == 'input')
            if (this.start.index > -1) this.start.parent.object.removeInput(this.start.index);
        if (this.end.type == 'input')
            if (this.end.index > -1) this.end.parent.object.removeInput(this.end.index);
        removeMesh(this.mesh);
    };
    this.update = function() {
        var start = new THREE.Vector3().addVectors(this.start.position, this.start.parent.position);
        var end = new THREE.Vector3().addVectors(this.end.position, this.end.parent.position);
        var direction = new THREE.Vector3().subVectors(end, start);
        var length = distance(start, end);
        this.mesh.position.set(start.x, start.y, start.z);
        this.mesh.rotation.z = 0;
        this.mesh.scale.set(1, length * 1.15, 1);
        this.mesh.rotation.z = ((start.x > end.x) ? 1 : -1) * this.mesh.up.angleTo(direction);
    };
    this.start = start;
    this.end = end;
    start.edge = this;
    end.edge = this;
    this.type = 'edge';
    this.mesh = new THREE.Mesh(geometries.edge(), materials.edge());
    this.mesh.object = this;
    this.update();
    OBJECTS.push(this.mesh);
    EDGES.push(this.mesh);
    return this;
}

function init() {
    RAYCASTER = new THREE.Raycaster();
    MOUSE = new THREE.Vector3(0, 0, 0);
    OFFSET = new THREE.Vector3();

    SCENE = new THREE.Scene();
    SCENE.fog = new THREE.FogExp2(0xcccccc, 0.001);
    RENDERER = new THREE.WebGLRenderer();
    RENDERER.setClearColor(SCENE.fog.color);
    RENDERER.setPixelRatio((window.innerWidth - EDITOR_WIDTH) / window.innerHeight);
    RENDERER.setSize(window.innerWidth - EDITOR_WIDTH, window.innerHeight);
    CONTAINER = document.getElementById('content');
    CONTAINER.appendChild(RENDERER.domElement);
    CAMERA = new THREE.PerspectiveCamera(60, (window.innerWidth - EDITOR_WIDTH) / window.innerHeight, 1, 10000);
    CAMERA.position.z = 100;
    CONTROLS = new THREE.TrackballControls(CAMERA);
    CONTROLS.noZoom = false;
    CONTROLS.noPan = false;

    // mouse and resize listeners
    window.addEventListener('resize', function () {
            CAMERA.aspect = (window.innerWidth - EDITOR_WIDTH) / window.innerHeight;
            CAMERA.updateProjectionMatrix();
            RENDERER.setSize(window.innerWidth - EDITOR_WIDTH, window.innerHeight);
        }, false);
    document.getElementById('center').addEventListener('click', center, false);
    document.getElementById('clear').addEventListener('click', clear, false);
    RENDERER.domElement.addEventListener("touchstart", onTouchStart, false);
    RENDERER.domElement.addEventListener("touchend", onTouchEnd, false);
    RENDERER.domElement.addEventListener("touchcancel", onTouchCancel, false);
    RENDERER.domElement.addEventListener("touchmove", onTouchMove, false);
    RENDERER.domElement.addEventListener('mouseup', onMouseUp, false);
    RENDERER.domElement.addEventListener('mousemove', onMouseMove, false);
    RENDERER.domElement.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('keyup', onKeyUp, false);

    // light
    var light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0.2, 0.2, 1);
    light.castShadow = true;
    light.shadowMapWidth = 2048;
    light.shadowMapHeight = 2048;
    var d = 50;
    light.shadowCameraLeft = -d;
    light.shadowCameraRight = d;
    light.shadowCameraTop = d;
    light.shadowCameraBottom = -d;
    light.shadowCameraFar = 3500;
    light.shadowBias = -0.0001;
    light.shadowDarkness = 1;
    SCENE.add(light);
}

function clear(event) {
    console.log('clearing');
    while (NODES.length > 0)
        NODES[0].object.remove();
    while (EDGES.length > 0)
        EDGES[0].object.remove();
    while (OBJECTS.length > 0)
        OBJECTS[0].object.remove();
}

function center(event) {
    CAMERA.position.set(0, 0, 100);
    CAMERA.up = new THREE.Vector3(0,1,0);
    CAMERA.lookAt(new THREE.Vector3(0,0,0));
    CONTROLS.target.set(0, 0, 0);
}

function removeMesh(mesh) {
    var children = mesh.children.length;
    for (var i = children; i > 0; i--) removeMesh(mesh.children[i - 1]);
    mesh.geometry.dispose();
    mesh.parent.remove(mesh);
}

function setOpacity(mesh, opacity) {
    mesh.material.opacity = opacity;
    for (var i = 0; i < mesh.children.length; i++) setOpacity(mesh.children[i], opacity);
}

function distance(v1, v2) {
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;
    return Math.sqrt(dx*dx+dy*dy+dz*dz);
}

function render() {
    requestAnimationFrame( render );
    CONTROLS.update();
    RENDERER.render(SCENE, CAMERA);
}

function onTouchStart(event) {

}

function onTouchMove(event) {

}

function onTouchEnd(event) {

}

function onTouchCancel(event) {

}

function onMouseDown(event) {
    if (CLICKED_OBJECT) setOpacity(CLICKED_OBJECT, 1);
    event.preventDefault();
    CLICKED_OBJECT = null;
    if (event.clientX < EDITOR_WIDTH) return;
    if (event.buttons == 2) return;
    MOUSE.x = ((event.clientX - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH)) * 2 - 1;
    MOUSE.y = - (event.clientY / window.innerHeight) * 2 + 1;
    RAYCASTER.setFromCamera(MOUSE, CAMERA);
    var intersects = RAYCASTER.intersectObjects(NODES);
    if (intersects.length > 0) {
        CONTROLS.enabled = false;
        SELECTED_OBJECT = intersects[0].object;
        MOUSE.z = SELECTED_OBJECT.position.z;
        intersects = RAYCASTER.intersectObject(SELECTED_OBJECT.parent);
        if (intersects.length > 0) OFFSET.copy(intersects[0].point).sub(SELECTED_OBJECT.position);
        CONTAINER.style.cursor = 'move';
        return;
    }
    intersects = RAYCASTER.intersectObjects(INPUTS.concat(ADD_INPUTS).concat(OUTPUTS));
    if (intersects.length > 0) {
        CONTROLS.enabled = false;
        SELECTED_OBJECT = intersects[0].object;
        MOUSE.z = SELECTED_OBJECT.position.z;
        DRAG_TARGET = {temp: true, position: intersects[0].point, parent: {position: new THREE.Vector3(0, 0, 0)}};
        if (SELECTED_OBJECT.edge) {
            if (SELECTED_OBJECT.edge.start == SELECTED_OBJECT)
                SELECTED_OBJECT.edge.end.parent.object.removeInput(SELECTED_OBJECT.edge.end.index);
            SELECTED_OBJECT.edge.remove();
        }
        if (SELECTED_OBJECT.type == 'addInput') SELECTED_OBJECT = SELECTED_OBJECT.parent.object.addInput();
        DRAG_EDGE = new Edge(SELECTED_OBJECT, DRAG_TARGET);
        SELECTED_OBJECT.parent.parent.object.addEdge(DRAG_EDGE);
        var port = SELECTED_OBJECT.type == 'input' ? 'output' : 'input';
        for (var i = 0; i < SELECTED_OBJECT.parent.parent.object.nodes.length; i++) {
            var node = SELECTED_OBJECT.parent.parent.object.nodes[i];
            if (node != SELECTED_OBJECT.parent.object) {
                var endpoint = node[port];
                endpoint.material.color.set(HIGHLIGHT_COLOR);
                ENDPOINTS.push(endpoint);
            }
        }
        CONTAINER.style.cursor = 'move';
        return;
    }
    intersects = RAYCASTER.intersectObjects(EDGES);
    if (intersects.length > 0) {
        SELECTED_OBJECT = intersects[0].object;
    }
}

function onMouseMove(event) {
    if (event.clientX < EDITOR_WIDTH) return;
    event.preventDefault();
    MOUSE.x = ((event.clientX - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH)) * 2 - 1;
    MOUSE.y = - (event.clientY / window.innerHeight) * 2 + 1;
    RAYCASTER.setFromCamera(MOUSE, CAMERA);
    if (event.buttons == 1 && SELECTED_OBJECT && SELECTED_OBJECT.type != 'edge') {
        // we're dragging something
        var intersect;
        if (DRAG_EDGE) {
            intersect = RAYCASTER.intersectObject(SELECTED_OBJECT.parent.parent);
            if (intersect.length > 0) {
                DRAG_TARGET.position.copy(intersect[0].point);
                DRAG_EDGE.update();
                return;
            }
        }
        else {
            intersect = RAYCASTER.intersectObject(SELECTED_OBJECT.parent);
            if (intersect.length > 0) {
                SELECTED_OBJECT.position.copy(intersect[0].point.sub(OFFSET));
                var object = SELECTED_OBJECT.object;
                for (var i = 0; i < object.inputs.length; i++)
                    if (object.inputs[i].edge) object.inputs[i].edge.update();
                if (object.output.edge) object.output.edge.update();
            }
        }
    }
    var intersects = RAYCASTER.intersectObjects(NODES.concat(INPUTS).concat(ADD_INPUTS).concat(OUTPUTS).concat(EDGES));
    if (intersects.length > 0) {
        if (HOVER_OBJECT && HOVER_OBJECT != intersects[0].object) setOpacity(HOVER_OBJECT, 1);
        HOVER_OBJECT = intersects[0].object;
        setOpacity(HOVER_OBJECT, HOVER_OPACITY);
        CONTAINER.style.cursor = 'pointer';
    }
    else {
        if (HOVER_OBJECT && HOVER_OBJECT != CLICKED_OBJECT) setOpacity(HOVER_OBJECT, 1);
        HOVER_OBJECT = null;
        CONTAINER.style.cursor = 'auto';
    }
}

function onMouseUp(event) {
    if (event.clientX < EDITOR_WIDTH) return;
    event.preventDefault();
    MOUSE.x = ((event.clientX - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH)) * 2 - 1;
    MOUSE.y = - (event.clientY / window.innerHeight) * 2 + 1;
    RAYCASTER.setFromCamera(MOUSE, CAMERA);
    CONTROLS.enabled = true;
    var intersects;
    if (DRAG_EDGE) {
        for (var i = 0; i < ENDPOINTS.length; i++)
            ENDPOINTS[i].material.color.set(ENDPOINTS[i].type == 'output' ? OUTPUT_COLOR : ADD_INPUT_COLOR);
        intersects = RAYCASTER.intersectObjects(ENDPOINTS);
        if (intersects.length > 0) {
            var endpoint = intersects[0].object;
            if (endpoint.edge) endpoint.edge.remove();
            if (endpoint.type == 'addInput') endpoint = endpoint.parent.object.addInput();
            DRAG_EDGE.end = endpoint;
            endpoint.edge = DRAG_EDGE;
            DRAG_EDGE.update();
        }
        else {
            if (DRAG_EDGE.start.type == 'input') DRAG_EDGE.start.parent.object.removeInput(DRAG_EDGE.start.index);
            DRAG_EDGE.remove();
        }
    }
    else {
        intersects = RAYCASTER.intersectObjects(NODES.concat(EDGES));
        if (intersects.length > 0) {
            if (intersects[0].object == SELECTED_OBJECT) {
                CLICKED_OBJECT = SELECTED_OBJECT;
                setOpacity(CLICKED_OBJECT, HOVER_OPACITY);
            }
        }
    }
    ENDPOINTS = [];
    SELECTED_OBJECT = null;
    DRAG_EDGE = null;
    DRAG_TARGET = null;
    CONTAINER.style.cursor = 'auto';
}

function onKeyUp(event) {
    var key = event.keyCode ? event.keyCode : event.which;
    if ((key == 8 || key == 46) && CLICKED_OBJECT) {
        CLICKED_OBJECT.object.remove();
        CLICKED_OBJECT = null;
    }
}

init();

render();

var s = new Scope();

var n = new Node("name");
var n2 = new Node("name2");
var n3 = new Node('name3');
s.addNode(n);
s.addNode(n2);
s.addNode(n3);
SCENE.add(s.mesh);
n2.setPosition(0, 20, 0);
n.setPosition(0, -20, 0);
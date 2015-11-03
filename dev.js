var SCENE, CAMERA, RENDERER, CONTROLS, CONTAINER;
var RAYCASTER, MOUSE, OFFSET;
var HOVER_OBJECT, SELECTED_OBJECT, CLICKED_OBJECT, DRAG_EDGE, DRAG_TARGET, ENDPOINTS = [];
var HOVER_OPACITY = 0.7;
var OBJECTS = [], SCOPES = [], NODES = [], EDGES = [], INPUTS = [], OUTPUTS = [], ADD_INPUTS = [];
var NODE_HEIGHT = 20, NODE_WIDTH = 10, NODE_PADDING = 10, INPUT_PADDING = 20, INPUT_ELEVATION = 1;
var COLORS = {
    scope: '#ffffff',
    node: '#119955',
    edge: '#119955',
    text: '#ffffff',
    output: '#119955',
    input: '#ffffff',
    addInput: '#119955',
    highlight: '#ffff00'
};
var SCOPE_COLOR = '#ffffff', NODE_COLOR = '#119955', EDGE_COLOR = '#119955', TEXT_COLOR = '#ffffff';
var OUTPUT_COLOR = '#119955', INPUT_COLOR = '#ffffff', ADD_INPUT_COLOR = '#119955', HIGHLIGHT_COLOR = '#ffff00';
var EDITOR_WIDTH = 400;
var SCOPE_ELEVATION_PADDING = 50;
var PARENS;

var materials = {
    scope: function() {return new THREE.MeshBasicMaterial({color: COLORS.scope, visible: true, transparent: true, opacity: 0.5});},
    node: function() {return new THREE.MeshPhongMaterial({color: COLORS.node, shading: THREE.FlatShading, transparent: true, opacity: 1});},
    edge: function() {return new THREE.MeshPhongMaterial({color: COLORS.edge, shading: THREE.FlatShading,transparent: true, opacity: 1})},
    text:  function() {return new THREE.MeshPhongMaterial({color: COLORS.text, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    input: function() {return new THREE.MeshPhongMaterial({color: COLORS.input, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    addInput: function() {return new THREE.MeshPhongMaterial({color: COLORS.addInput, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    output: function() {return new THREE.MeshPhongMaterial({color: COLORS.output, shading: THREE.FlatShading, transparent: true, opacity: 1})}
};
var geometries = {
    scope: function() {
        var g = new THREE.PlaneGeometry(100, 100, 1, 1);
        g.dynamic = true;
        return g;
    },
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

function Scope(level) {
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
        index = SCOPES.indexOf(this.mesh);
        if (index > -1) SCOPES.splice(index, 1);
        else console.error("Could not remove Scope.mesh from SCOPES");
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].remove();
        }
        removeMesh(this.mesh);
    };
    this.setSize = function(width, height) {
        this.width = width;
        this.height = height;
        var g = this.mesh.geometry;
        g.vertices[0].set(-width / 2.0, -height / 2.0, 0);
        g.vertices[1].set(-width / 2.0, height / 2.0, 0);
        g.vertices[2].set(width / 2.0, -height / 2.0, 0);
        g.vertices[3].set(width / 2.0, height / 2.0, 0);
        g.verticesNeedUpdate = true;
    };
    this.type = 'scope';
    this.level = level;
    this.nodes = [];
    this.edges = [];
    this.mesh = new THREE.Mesh(geometries.scope(), materials.scope());
    this.mesh.position.set(0, 0, level * SCOPE_ELEVATION_PADDING);
    this.width = 1000;
    this.height = 1000;
    this.setSize(this.width, this.height);
    this.mesh.object = this;
    OBJECTS.push(this.mesh);
    SCOPES.push(this.mesh);
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
            this.inputs[i].index = i;
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
            this.inputs[i].index = i;
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
    if (start.type == 'output') {
        this.output = start;
        this.input = end;
    }
    else {
        this.output = end;
        this.input = start;
    }

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
    CAMERA.position.z = 500;
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
    document.getElementById('layout').addEventListener('click', layout, false);
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

function treeify(node) {
    var inputs = node.inputs;
    var input_trees = [];
    for (var i = 0; i < inputs.length; i++) {
        var parent_node = inputs[i].edge.start.parent.object;
        input_trees.push(treeify(parent_node));
    }
    return [node, input_trees];
}

function layout() {
    for (var i = 0; i < SCOPES.length; i++) {
        var scope = SCOPES[i].object;
        var nodes = scope.nodes.slice();
        var bases = [];
        var sorted = [];
        for (var j = 0; j < nodes.length; j++) if (!nodes[j].output.edge) bases.push(nodes[j]);
        for (var k = 0; k < bases.length; k++) sorted.push(treeify(bases[k]));
        var layers = [];
        while (sorted.length > 0) {
            var layer = [];
            var new_sorted = [];
            for (var l = 0; l < sorted.length; l++) {
                layer.push(sorted[l][0]);
                for (var a = 0; a < sorted[l][1].length; a++) new_sorted.push(sorted[l][1][a]);
            }
            sorted = new_sorted;
            layers.push(layer);
        }

        var x_padding = 80;
        var y_padding = 50;

        var width = 100;
        var height = layers.length * y_padding;
        for (var b = 0; b < layers.length; b++)
            if (layers[b].length * x_padding > width)
                width = layers[b].length * x_padding;
        //scope.setSize(width, 2 * height);

        for (var m = 0; m < layers.length; m++) {
            if (layers[m].length * x_padding > width) {
                width = layers[m].length * x_padding;
                scope.setSize(width, height);
            }
            for (var n = 0; n < layers[m].length; n++) {
                var node = layers[m][n];
                node.setPosition(x_padding * (n - (layers[m].length / 2.0)), y_padding * (m), scope.level * SCOPE_ELEVATION_PADDING);
                if (node.output.edge) node.output.edge.update();
            }
        }
    }
}

function clear() {
    while (NODES.length > 0)
        NODES[0].object.remove();
    while (EDGES.length > 0)
        EDGES[0].object.remove();
    //while (OBJECTS.length > 0)
        //OBJECTS[0].object.remove();
}

function center() {
    CAMERA.position.set(0, 0, 500);
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
    layout();
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

editor.getSession().on('change', function() {
    var text = editor.getValue();
    var newParens = countParens(text);
    if (!PARENS) PARENS = [];
    if (!(PARENS.toString() == newParens.toString())) {
        PARENS = newParens;
        if (PARENS[0] == 0 && text.length > 0) load(text.trim(), PARENS[1]);
    }
});

function makeNode(args) {
    if (typeof args == "string")
        args = parse(sanitize(args));
    var node = new Node(args[0]);
    SCOPES[0].object.addNode(node);
    var arg, link;
    for (var i = 1; i < args.length; i++) {
        arg = args[i];
        if (typeof arg == "object" && arg.constructor === Array) {
            arg = makeNode(arg);
            link = new Edge(arg.output, node.addInput());
            SCOPES[0].object.addEdge(link);
        }
        else {
            arg = new Node(arg);
            SCOPES[0].object.addNode(arg);
            link = new Edge(arg.output, node.addInput());
            SCOPES[0].object.addEdge(link);
        }
    }
    return node;
}

function render() {
    requestAnimationFrame( render );
    CONTROLS.update();
    RENDERER.render(SCENE, CAMERA);
}

function down(x, y) {
    if (CLICKED_OBJECT) setOpacity(CLICKED_OBJECT, 1);
    CLICKED_OBJECT = null;
    if (x < EDITOR_WIDTH) return;
    MOUSE.x = ((x - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH)) * 2 - 1;
    MOUSE.y = - (y / window.innerHeight) * 2 + 1;
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

        DRAG_TARGET = {position: intersects[0].point, parent: {position: new THREE.Vector3(0, 0, 0)}};
        var port;
        if (SELECTED_OBJECT.type == 'addInput') {
            SELECTED_OBJECT = SELECTED_OBJECT.parent.object.addInput();
            DRAG_EDGE = new Edge(DRAG_TARGET, SELECTED_OBJECT);
            SELECTED_OBJECT.parent.parent.object.addEdge(DRAG_EDGE);
            port = 'output'
        }
        else if (SELECTED_OBJECT.type == 'input') {
            if (SELECTED_OBJECT.edge) SELECTED_OBJECT.edge.remove();
            DRAG_EDGE = new Edge(DRAG_TARGET, SELECTED_OBJECT);
            SELECTED_OBJECT.parent.parent.object.addEdge(DRAG_EDGE);
            port = 'output'
        }
        else if (SELECTED_OBJECT.type == 'output') {
            if (SELECTED_OBJECT.edge) {
                SELECTED_OBJECT.edge.end.parent.object.removeInput(SELECTED_OBJECT.edge.end.index);
                SELECTED_OBJECT.edge.remove();
            }
            DRAG_EDGE = new Edge(SELECTED_OBJECT, DRAG_TARGET);
            SELECTED_OBJECT.parent.parent.object.addEdge(DRAG_EDGE);
            port = 'input'
        }
        for (var i = 0; i < SELECTED_OBJECT.parent.parent.object.nodes.length; i++) {
            var node = SELECTED_OBJECT.parent.parent.object.nodes[i];
            if (node != SELECTED_OBJECT.parent.object) {
                var endpoint = node[port];
                endpoint.material.color.set(COLORS.highlight);
                ENDPOINTS.push(endpoint);
                ENDPOINTS = ENDPOINTS.concat(node.inputs);
            }
        }
        CONTAINER.style.cursor = 'move';
    }
    intersects = RAYCASTER.intersectObjects(EDGES);
    if (intersects.length > 0) {
        SELECTED_OBJECT = intersects[0].object;
    }
}

function move(x, y, dragging) {
    if (x < EDITOR_WIDTH) return;
    MOUSE.x = ((x - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH)) * 2 - 1;
    MOUSE.y = - (y / window.innerHeight) * 2 + 1;
    RAYCASTER.setFromCamera(MOUSE, CAMERA);
    if (dragging && SELECTED_OBJECT && SELECTED_OBJECT.type != 'edge') {
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

function up(x, y) {
    if (x < EDITOR_WIDTH) return;
    MOUSE.x = ((x - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH)) * 2 - 1;
    MOUSE.y = - (y / window.innerHeight) * 2 + 1;
    RAYCASTER.setFromCamera(MOUSE, CAMERA);
    CONTROLS.enabled = true;
    var intersects;
    if (DRAG_EDGE) {
        for (var i = 0; i < ENDPOINTS.length; i++)
            ENDPOINTS[i].material.color.set(COLORS[ENDPOINTS[i].type]);
        intersects = RAYCASTER.intersectObjects(ENDPOINTS);
        if (intersects.length > 0) {
            var endpoint = intersects[0].object;
            if (endpoint == SELECTED_OBJECT) {
                DRAG_EDGE.remove();
                if (endpoint.type == 'input') endpoint.parent.object.removeInput(endpoint.index);
                return;
            }
            if (endpoint.edge) {
                if (endpoint.type == 'output') endpoint.edge.end.parent.object.removeInput(endpoint.edge.end.index);
                endpoint.edge.remove();
            }
            if (endpoint.type == 'addInput') {
                endpoint = endpoint.parent.object.addInput();
                DRAG_EDGE.end = endpoint;
            }
            else if (endpoint.type == 'input') DRAG_EDGE.end = endpoint;
            else if (endpoint.type == 'output') DRAG_EDGE.start = endpoint;
            endpoint.edge = DRAG_EDGE;
            DRAG_EDGE.update();
        }
        else {
            if (SELECTED_OBJECT.type == 'input') SELECTED_OBJECT.parent.object.removeInput(SELECTED_OBJECT.index);
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

function onTouchStart(event) {
    event.preventDefault();
    if (event.touches.length == 1) down(event.touches[0].clientX, event.touches[0].clientY);
}

function onTouchMove(event) {
    event.preventDefault();
    if (event.touches.length == 1) move(event.touches[0].clientX, event.touches[0].clientY, true);
}

function onTouchEnd(event) {
    event.preventDefault();
    up(event.touches[0].clientX, event.touches[0].clientY);
}

function onTouchCancel(event) {
    event.preventDefault();
    up(0, 0);
}

function onMouseDown(event) {
    event.preventDefault();
    if (event.buttons == 2) return;
    down(event.clientX, event.clientY);
}

function onMouseMove(event) {
    event.preventDefault();
    move(event.clientX, event.clientY, event.buttons == 1);
}

function onMouseUp(event) {
    event.preventDefault();
    up(event.clientX, event.clientY);
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

var s = new Scope(0);

var n = new Node("name");
var n2 = new Node("name2");
var n3 = new Node('name3');
s.addNode(n);
s.addNode(n2);
s.addNode(n3);
SCENE.add(s.mesh);
//n2.setPosition(0, 20, 0);
//n.setPosition(0, -20, 0);

layout();
"use strict";
var SCENE, CAMERA, RENDERER, CONTROLS, CONTAINER, RAYCASTER, MOUSE, OFFSET = new THREE.Vector3();
var ATOM_HEIGHT = 8, NODE_HEIGHT = 20, NODE_WIDTH = 10, NODE_PADDING = 10, INPUT_PADDING = 20, INPUT_ELEVATION = 1;
var EDITOR_WIDTH = 400, LEVEL_SPACING = 50;

var DRAG_OBJECT, DRAG_EDGE, DRAG_SOURCE, DRAG_TARGET, DRAG_INPUT, DRAG_OUTPUT;

var OBJECTS = ['plane', 'scope', 'node', 'edge', 'output', 'input', 'text', 'atom'];

var COLORS = {
    plane: '#ffffff',
    scope: '#ffffff',
    node: '#119955',
    edge: '#119955',
    text: '#ffffff',
    output: '#119955',
    input: '#ffffff',
    atom: '#113355',
    highlight: '#ffff00'
};
var MATERIALS = {
    plane: function() {return new THREE.MeshBasicMaterial({visible: false, color: COLORS.plane});},
    scope: function() {return new THREE.MeshPhongMaterial({color: COLORS.scope, shading: THREE.FlatShading, transparent: true, opacity: 0.5});},
    node: function() {return new THREE.MeshPhongMaterial({color: COLORS.node, shading: THREE.FlatShading, transparent: true, opacity: 1});},
    edge: function() {return new THREE.MeshPhongMaterial({color: COLORS.edge, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    text:  function() {return new THREE.MeshPhongMaterial({color: COLORS.text, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    input: function() {return new THREE.MeshPhongMaterial({color: COLORS.input, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    output: function() {return new THREE.MeshPhongMaterial({color: COLORS.output, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    atom:  function() {return new THREE.MeshPhongMaterial({color: COLORS.atom, shading: THREE.FlatShading, transparent: true, opacity: 1})}
};
var GEOMETRIES = {
    plane: function(params) {
        params = params || {};
        var g = new THREE.PlaneGeometry(params.width || 1000, params.height || 1000, 1, 1);
        g.dynamic = true;
        return g;
    },
    scope: function(params) {
        params = params || {};
        var points = [];
        var w = params.width || 100;
        var h = params.height || 100;
        points.push(new THREE.Vector2(- 0.5 * w, - 0.5 * h));
        points.push(new THREE.Vector2(- 0.5 * w, 0.5 * h));
        points.push(new THREE.Vector2(0.5 * w, 0.5 * h));
        points.push(new THREE.Vector2(0.5 * w, - 0.5 * h));
        var shape = new THREE.Shape(points);
        var settings = {amount: 1, bevelEnabled: false, steps: 1};
        var g = new THREE.ExtrudeGeometry(shape, settings);
        g.width = w;
        g.height = h;
        g.dynamic = true;
        return g;
    },
    node: function(params) {
        var points = [];
        params = params || {};
        var w = params.width || NODE_HEIGHT;
        var h = params.height || NODE_HEIGHT;
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
    text: function(params) {
        params = params || {};
        var size = params.size || 10;
        var g = new THREE.TextGeometry(params.name || " ", {font: "droid sans", height: 6, size: size, style: "normal"});
        g.computeBoundingBox();
        g.width = g.boundingBox.max.x - g.boundingBox.min.x;
        g.applyMatrix(new THREE.Matrix4().makeTranslation(- g.width / 2.0, - size / 2.0, 0));
        g.dynamic = true;
        g.verticesNeedUpdate = true;
        return g;
    },
    input: function(params) {params = params || {radius: 5}; return new THREE.SphereGeometry(params.radius); },
    output: function(params) {params = params || {radius: 5}; return new THREE.SphereGeometry(params.radius);},
    atom: function(params) {
        params = params || {};
        var w = params.width || 10;
        var h = params.height || ATOM_HEIGHT;

        var shape = new THREE.Shape();

        w = w / 2.0;
        h = h / 2.0;

        shape.moveTo(-w, h);
        shape.lineTo(w, h);
        shape.absarc(w, 0, h, 5 * Math.PI / 2.0, 3 * Math.PI / 2.0, true);
        shape.lineTo(-w, -h);
        shape.absarc(-w, 0, h, 3 * Math.PI / 2, Math.PI / 2.0, true);

        var settings = {amount: 5, bevelEnabled: false, steps: 1};
        var geometry = new THREE.ExtrudeGeometry( shape, settings );

        geometry.dynamic = true;

        return geometry;
    }
};

function GRASPObject() {
    this.remove = function(object) {
        if (object) {
            this.meshes[object.type].splice(this.meshes[object.type].indexOf(object.mesh), 1);
            if (this.parent) this.parent.remove(object);
            return;
        }
        this.parent.remove(this);
        var siblings = this.parent.children[this.type];
        siblings.splice(this.local_index, 1);
        for (i = this.local_index; i < siblings.length; i++) siblings[i].local_index = i;
        while (this.mesh.children.length > 0) this.mesh.children[0].object.remove();
        this.mesh.geometry.dispose();
        this.mesh.parent.remove(this.mesh);
    };
    this.add = function(object, local_index, deep) {
        this.meshes[object.type].push(object.mesh);
        for (var i = 0; i < OBJECTS.length; i++)
            this.meshes[OBJECTS[i]].push.apply(this.meshes[OBJECTS[i]], object.meshes[OBJECTS[i]]);
        if (this.parent) this.parent.add(object, null, true);
        if (deep == true) return;
        object.parent = this;
        var siblings = this.children[object.type];
        if (local_index != 0 && (!local_index || local_index < 0)) local_index = siblings.length;
        local_index = Math.max(siblings.length, local_index);
        siblings.splice(local_index, 0, object);
        for (i = local_index; i < siblings.length; i++) siblings[i].local_index = i;
        this.mesh.add(object.mesh);
        return object;
    };
    this.setPosition = function(x, y, z) {
        this.mesh.position.set(x, y, z);
    };
    if (this.type != 'scene') {
        this.mesh = new THREE.Mesh(GEOMETRIES[this.type](this.params), MATERIALS[this.type]());
        this.mesh.object = this;
    }
    this.children = {};
    this.meshes = {};
    for (var i = 0; i < OBJECTS.length; i++) {
        this.children[OBJECTS[i]] = [];
        this.meshes[OBJECTS[i]] = [];
    }
    return this;
}

function Scene() {
    this.addPlane = function(level) {
        var plane = new Plane(level);
        this.add(plane);
        return plane;
    };
    this.addEdge = function(start, end) {
        var edge = new Edge(start, end, true);
        edge.trans_plane = true;
        this.add(edge);
        edge.update();
        return edge;
    };
    this.type = 'scene';
    GRASPObject.apply(this);

    this.mesh = new THREE.Scene();
    this.mesh.fog = new THREE.FogExp2(0xcccccc, 0.001);
    RENDERER = new THREE.WebGLRenderer();
    RENDERER.setClearColor(this.mesh.fog.color);
    var width = window.innerWidth;
    var height = window.innerHeight;
    width -= 3;
    height -= 3;
    RENDERER.setPixelRatio((width - EDITOR_WIDTH) / height);
    RENDERER.setSize(width - EDITOR_WIDTH, height);
    CONTAINER = document.getElementById('content');
    CONTAINER.appendChild(RENDERER.domElement);
    CAMERA = new THREE.PerspectiveCamera(60, (window.innerWidth - EDITOR_WIDTH) / window.innerHeight, 1, 10000);
    CAMERA.position.z = 500;
    CONTROLS = new THREE.TrackballControls(CAMERA);
    CONTROLS.noZoom = false;
    CONTROLS.noPan = false;

    RAYCASTER = new THREE.Raycaster();
    MOUSE = new THREE.Vector3(0, 0, 0);
    OFFSET = new THREE.Vector3();

    // mouse and resize listeners
    window.addEventListener('resize', function () {
        CAMERA.aspect = (window.innerWidth - EDITOR_WIDTH) / window.innerHeight;
        CAMERA.updateProjectionMatrix();
        RENDERER.setSize(window.innerWidth - EDITOR_WIDTH, window.innerHeight);
    }, false);
    RENDERER.domElement.addEventListener("touchstart", onTouchStart, false);
    RENDERER.domElement.addEventListener("touchend", onTouchEnd, false);
    RENDERER.domElement.addEventListener("touchcancel", onTouchCancel, false);
    RENDERER.domElement.addEventListener("touchmove", onTouchMove, false);
    RENDERER.domElement.addEventListener('mouseup', onMouseUp, false);
    RENDERER.domElement.addEventListener('mousemove', onMouseMove, false);
    RENDERER.domElement.addEventListener('mousedown', onMouseDown, false);

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
    this.mesh.add(light);
    return this;
}

function Plane(level) {
    this.addScope = function() {
        var scope = new Scope();
        this.add(scope);
        return scope;
    };
    this.setSize = function(width, height) {
        var g = this.mesh.geometry;
        for (var i = 0; i < this.mesh.geometry.vertices.length; i++) {
            var vertex = this.mesh.geometry.vertices[i];
            vertex.x = (vertex.x < 0 ? -1 : 1) * width / 2.0;
            vertex.y = (vertex.y < 0 ? -1 : 1) * height / 2.0;
        }
        g.verticesNeedUpdate = true;
        g.normalsNeedUpdate = true;
        g.computeFaceNormals();
        g.computeVertexNormals();
        g.computeBoundingSphere();
        this.width = width;
        this.height = height;
    };
    this.type = 'plane';
    this.width = 1000;
    this.height = 1000;
    this.min_width = 1000;
    this.min_height = 1000;
    GRASPObject.apply(this);
    this.setPosition(0, 0, LEVEL_SPACING * level);
    return this;
}

function Scope() {
    this.type = 'scope';
    GRASPObject.apply(this);
    this.addNode = function(name) { return this.add(new Node(name)); };
    this.addEdge = function(start, end) { return this.add(new Edge(start, end)); };
    this.addInput = function(index) {
        if (!index && index != 0) index = this.children.input.length;
        var input = new Input();
        this.add(input, index);
        this.updateSize();
        this.updateInputs();
        return input;
    };
    this.removeInput = function(index, input) {
        if (!input) {
            if (!index && index != 0) index = this.children.input.length - 1;
            if (index == -1) return false;
            input = this.children.input[index];
        }
        input.remove();
        this.updateSize();
        this.updateInputs();
        return true;
    };
    this.addOutput = function(index) {
        if (!index && index != 0) index = this.children.output.length;
        var output = new Output();
        this.add(output, index);
        this.updateSize();
        this.updateOutputs();
        return output;
    };
    this.removeOutput = function(index, output) {
        if (!output) {
            if (!index) index = this.children.output.length - 1;
            if (index == -1) return false;
            output = this.children.output[index];
        }
        output.remove();
        this.updateSize();
        this.updateOutputs();
        return true;
    };
    this.updateInputs = function() {
        var length = this.children.input.length;
        for (var i = 0; i < length; i++) {
            var input = this.children.input[i];
            input.setPosition((this.width / length) * (i - ((length - 1) / 2.0)), this.height / 2.0, INPUT_ELEVATION);
            for (var j = 0; j < input.edge.length; j++) input.edge[j].update();
        }
    };
    this.updateOutputs = function() {
        var length = this.children.output.length;
        for (var i = 0; i < length; i++) {
            var output = this.children.output[i];
            output.setPosition(INPUT_PADDING * (i - ((length - 1) / 2.0)), - this.height / 2.0, INPUT_ELEVATION);
            for (var j = 0; j < output.edge.length; j++) output.edge[j].update();
        }
    };
    this.updateLinks = function() {
        for (var i = 0; i < this.children.node.length; i++)
            for (var j = 0; j < this.children.node[i].edge.length; j++) this.children.node[i].edge[j].update();
        for (i = 0; i < this.children.output.length; i++)
            for (j = 0; j < this.children.output[i].edge.length; j++) this.children.output[i].edge[j].update();
    };
    this.updateSize = function() {
        var min = this.children.node.length * 50;
        this.min_height = min;
        this.min_width = min;

        this.output_width = ((this.children.output.length || 1) - 1) * INPUT_PADDING;
        this.input_width = ((this.children.input.length || 1) - 1) * INPUT_PADDING;

        var width = Math.max(this.width, this.min_width, this.input_width, this.output_width);
        var height = Math.max(this.height, this.min_height);

        this.setSize(width, height);
    };
    this.setSize = function(width, height) {
        var g = this.mesh.geometry;
        for (var i = 0; i < this.mesh.geometry.vertices.length; i++) {
            var vertex = this.mesh.geometry.vertices[i];
            vertex.x = (vertex.x < 0 ? -1 : 1) * width / 2.0;
            vertex.y = (vertex.y < 0 ? -1 : 1) * height / 2.0;
        }
        g.verticesNeedUpdate = true;
        g.normalsNeedUpdate = true;
        g.computeFaceNormals();
        g.computeVertexNormals();
        g.computeBoundingSphere();
        this.width = width;
        this.height = height;
    };
    this.height = this.mesh.geometry.height;
    this.width = this.mesh.geometry.width;

    this.input_width = 0;
    this.output_width = 0;

    this.min_height = this.height;
    this.min_width = this.width;

    return this;
}

function Node(name) {
    this.setName = function(name) {
        this.name = name;
        if (this.children.text.length > 0) {
            this.children.text[0].setText(String(name));
        }
        else {
            var text = new Text(String(name));
            this.add(text);
            this.text_width = text.width;
        }
        this.text_width = this.children.text[0].width;
        this.updateSize(null, 5);
    };
    this.addArg = function(index, value) {
        var local_index, arg;
        if (value) {
            local_index = this.children.atom.length;
            arg = this.add(new Atom(value), local_index);
        }
        else {
            local_index = this.children.input.length;
            arg = this.add(new Input(), local_index);
        }
        if ((!index && index != 0) || index > this.args.length) index = this.args.length;
        arg.arg_index = index;
        arg.local_index = local_index;
        this.args.splice(index, 0, arg);
        for (var i = local_index; i < this.args.length; i++) this.args[i].arg_index = i;
        this.updateSize();
        this.updateArgs();
        return arg;
    };
    this.removeArg = function(index) {
        if (!index && index != 0) index = this.args.length - 1;
        if (index < 0) return false;
        var arg = this.args[index];
        this.args.splice(index, 1);
        for (var i = index; i < this.args.length; i++) this.args[i].arg_index = i;
        arg.remove();
        this.updateSize();
        this.updateArgs();
        return true;
    };
    this.addOutput = function(index) {
        var output = new Output();
        this.add(output, index);
        this.updateSize();
        this.updateOutputs();
        return output;
    };
    this.removeOutput = function(index, output) {
        if (!output) {
            if (!index) index = this.children.output.length - 1;
            if (index == -1) return false;
            output = this.children.output[index];
        }
        output.remove();
        this.updateSize();
        this.updateOutputs();
        return true;
    };
    this.updateSize = function(width, height) {
        this.output_width = ((this.children.output.length || 1) - 1) * INPUT_PADDING;
        this.input_width = ((this.args.length || 1) - 1) * INPUT_PADDING;
        for (var i = 0; i < this.children.atom.length; i++) this.input_width += this.children.atom[i].width;
        if (!width && width != 0) width = Math.max(this.text_width, this.input_width, this.output_width, 10);
        if (!height && height != 0) height = NODE_HEIGHT;
        width = width + NODE_PADDING;
        if ((width != this.width) || (height != this.height)) for (i = 0; i < this.mesh.geometry.vertices.length; i++) {
            var vertex = this.mesh.geometry.vertices[i];
            vertex.x = (vertex.x < 0 ? -1 : 1) * width / 2.0;
            vertex.y = (vertex.y < 0 ? -1 : 1) * height / 2.0;
            vertex.z = width == 0 ? (vertex.z == 0 ? 0 : 1) : (vertex.z == 0 ? 0 : 5);
        }
        this.mesh.geometry.verticesNeedUpdate = true;
        this.width = width;
        this.height = height;
    };
    this.updateArgs = function() {
        var position = -this.input_width / 2.0;
        for (var i = 0; i < this.args.length; i++) {
            var arg = this.args[i];
            position += (arg.width || 0) / 2.0;
            arg.setPosition(position, this.height / 2.0, INPUT_ELEVATION);
            position += INPUT_PADDING + ((arg.width || 0) / 2.0);
            for (var j = 0; j < arg.edge.length; j++) arg.edge[j].update();
        }
    };
    this.updateOutputs = function() {
        var length = this.children.output.length;
        for (var i = 0; i < length; i++) {
            var output = this.children.output[i];
            output.setPosition(INPUT_PADDING * (i - ((length - 1) / 2.0)), - this.height / 2.0, INPUT_ELEVATION);
            for (var j = 0; j < output.edge.length; j++) output.edge[j].update();
        }
    };
    this.updateLinks = function() {
        for (var i = 0; i < this.children.input.length; i++)
            for (var j = 0; j < this.children.input[i].edge.length; j++) this.children.input[i].edge[j].update();
        for (i = 0; i < this.children.output.length; i++)
            for (j = 0; j < this.children.output[i].edge.length; j++) this.children.output[i].edge[j].update();
    };
    this.type = 'node';
    GRASPObject.apply(this);
    this.edge = [];
    this.input_width = 10;
    this.output_width = 10;
    this.width = 10;
    this.height = NODE_HEIGHT;
    this.args = [];

    if (!name) {
        this.text_width = 0;
        this.updateSize(0, 0, true);
    }
    else {
        this.name = name;
        var text = new Text(String(name));
        this.add(text);
        this.text_width = text.width;
    }

    this.addOutput();
    return this;
}

function Variable(name) {
    this.type = 'variable';
    GRASPObject.apply(this);

}

function Edge(start, end, trans_plane) {
    this.update = function() {
        var direction, length;
        var start, end;
        var axis, angle;
        if (this.parent && this.parent.type == 'scene') {
            start = this.start.mesh.position.clone(); // arg
            start.add(this.start.mesh.parent.position); // node or scope
            start.add(this.start.mesh.parent.parent.position); // scope or plane
            start.add(this.start.mesh.parent.parent.parent.position); // plane or scene

            end = this.end.mesh.position.clone();
            end.add(this.end.mesh.parent.position); // node or scope
            end.add(this.end.mesh.parent.parent.position); // scope or plane
            end.add(this.end.mesh.parent.parent.parent.position); // plane or scene

            this.mesh.position.set(start.x, start.y, start.z);

            this.mesh.rotation.z = 0;
            this.mesh.rotation.y = 0;
            this.mesh.rotation.x = 0;
            length = distance(start, end);
            this.mesh.scale.set(1, length * 1.15, 1);

            var yaxis = new THREE.Vector3(0, 1, 0);
            axis = end.clone().sub(start);
            angle = yaxis.angleTo(axis);
            axis.cross(yaxis).normalize();

            this.mesh.rotateOnAxis(axis, -angle);

        }
        else {
            if (this.start.parent.type == 'scope') start = this.start.mesh.position.clone();
            else start = new THREE.Vector3().addVectors(this.start.mesh.position, this.start.mesh.parent.position);
            if (this.end.parent.type == 'scope') end = this.end.mesh.position.clone();
            else end = new THREE.Vector3().addVectors(this.end.mesh.position, this.end.mesh.parent.position);

            direction = new THREE.Vector3().subVectors(end, start);
            length = distance(start, end);
            this.mesh.position.set(start.x, start.y, start.z);
            this.mesh.rotation.z = 0;
            this.mesh.scale.set(1, length * 1.15, 1);
            this.mesh.rotation.z = ((start.x > end.x) ? 1 : -1) * this.mesh.up.angleTo(direction);
        }
    };
    this.type = 'edge';
    GRASPObject.apply(this);
    this.start = start;
    this.end = end;
    this.trans_plane = false;

    start.edge = [this];
    end.edge = [this];
    this.update();
    return this;
}

function Input(radius) {
    this.type = 'input';
    this.radius = radius || 5;
    this.params = {radius: this.radius};
    //this.width = radius * 2;
    GRASPObject.apply(this);
    this.edge = [];
    return this;
}

function Output(radius) {
    this.type = 'output';
    this.radius = radius || 5;
    this.params = {radius: this.radius};
    //this.width = radius * 2;
    GRASPObject.apply(this);
    this.edge = [];
    return this;
}

function Atom(value) {
    this.setValue = function(value) {
        this.value = value;
        this.children.text[0].setText(String(value));
        this.width = this.children.text[0].width;
        this.updateSize();
    };
    this.updateSize = function(w, h) {
        if (!h) h = this.height;
        if (!w) w = this.width;
    };
    this.type = 'atom';
    this.edge = [];
    var text = new Text(String(value), 6);
    this.width = text.width;
    this.height = ATOM_HEIGHT;
    this.params = {width: this.width};
    GRASPObject.apply(this);
    this.value = String(value);
    this.add(text);
    this.updateSize();
    return this;
}

function Text(text, size) {
    this.setText = function(text) {
        if (text) this.value = text;
        this.mesh.geometry.dispose();
        this.mesh.geometry = GEOMETRIES.text(text);
        this.width = this.mesh.geometry.width;
    };
    this.type = 'text';
    if (!text) text = '';
    this.params = {name: text, size: size || 10};
    GRASPObject.apply(this);
    this.width = this.mesh.geometry.width;
    return this;
}

// TODO: add event handler for exception

function down(x, y) {
    var intersects, intersect;
    var plane, scope;
    /*
    intersects = RAYCASTER.intersectObjects(SCENE.meshes.input);
    if (intersects.length > 0) {
        intersect = intersects[0];

        DRAG_SOURCE = intersect.object.object;

        if (DRAG_SOURCE.edge) {
            DRAG_SOURCE.edge.start.edge = [];
            DRAG_SOURCE.edge.remove();
            DRAG_SOURCE.edge = [];
        }
        if (DRAG_SOURCE.parent.type == 'node') {
            // node input
            plane = intersect.object.parent.parent.parent;
            scope = intersect.object.parent.parent;
        }
        else if (DRAG_SOURCE.parent.type == 'scope') {
            // scope input
            plane = intersect.object.parent.parent;
            scope = intersect.object.parent;
        }

        intersect.point.sub(plane.position);
        intersect.point.sub(scope.position);
        if (DRAG_SOURCE.parent.type == 'scope') DRAG_TARGET = new Input(2.5);
        else DRAG_TARGET = new Output(2.5);

        scope.object.add(DRAG_TARGET);
        DRAG_TARGET.mesh.position.set(intersect.point.x, intersect.point.y, INPUT_ELEVATION);

        DRAG_EDGE = scope.object.addEdge(DRAG_TARGET, DRAG_SOURCE);
        DRAG_EDGE.update(false);

        CONTAINER.style.cursor = 'move';
        CONTROLS.enabled = false;
        return;
    }
    intersects = RAYCASTER.intersectObjects(SCENE.meshes.output);
    if (intersects.length > 0) {
        intersect = intersects[0];

        DRAG_SOURCE = intersect.object.object;

        if (DRAG_SOURCE.edge) {
            DRAG_SOURCE.edge.end.parent.removeArg(DRAG_SOURCE.edge.end.arg_index);
            DRAG_SOURCE.edge.remove();
            DRAG_SOURCE.edge = [];
        }
        if (DRAG_SOURCE.parent.type == 'node') {
            // node input
            plane = intersect.object.parent.parent.parent;
            scope = intersect.object.parent.parent;
        }
        else if (DRAG_SOURCE.parent.type == 'scope') {
            // scope input
            plane = intersect.object.parent.parent;
            scope = intersect.object.parent;
        }

        intersect.point.sub(plane.position);
        intersect.point.sub(scope.position);

        if (DRAG_SOURCE.parent.type == 'scope') DRAG_TARGET = new Output(2.5);
        else DRAG_TARGET = new Input(2.5);

        scope.object.add(DRAG_TARGET);
        DRAG_TARGET.mesh.position.set(intersect.point.x, intersect.point.y, INPUT_ELEVATION);

        DRAG_EDGE = scope.object.addEdge(DRAG_SOURCE, DRAG_TARGET);
        DRAG_EDGE.update(false);

        CONTAINER.style.cursor = 'move';
        CONTROLS.enabled = false;
        return;
    }
    */
    intersects = RAYCASTER.intersectObjects(SCENE.meshes.node);
    if (intersects.length > 0) {
        intersect = intersects[0];
        DRAG_OBJECT = intersect.object.object;
        intersects = RAYCASTER.intersectObject(DRAG_OBJECT.parent.mesh);
        if (intersects.length > 0) OFFSET.copy(intersects[0].point).sub(DRAG_OBJECT.mesh.position);
        CONTAINER.style.cursor = 'move';
        CONTROLS.enabled = false;
        return;
    }
    intersects = RAYCASTER.intersectObjects(SCENE.meshes.scope);
    if (intersects.length > 0) {
        intersect = intersects[0];
        DRAG_OBJECT = intersect.object.object;
        intersects = RAYCASTER.intersectObject(DRAG_OBJECT.parent.mesh);
        if (intersects.length > 0) OFFSET.copy(intersects[0].point).sub(DRAG_OBJECT.mesh.position);
        CONTAINER.style.cursor = 'move';
        CONTROLS.enabled = false;
    }
}

function move(x, y, dragging) {
    MOUSE.x = ((x - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH)) * 2 - 1;
    MOUSE.y = - (y / window.innerHeight) * 2 + 1;
    RAYCASTER.setFromCamera(MOUSE, CAMERA);
    var intersects, intersect;
    var i, j;
    if (dragging && DRAG_OBJECT) {
        intersects = RAYCASTER.intersectObject(DRAG_OBJECT.parent.mesh);
        if (intersects.length > 0) {
            intersect = intersects[0];
            DRAG_OBJECT.mesh.position.copy(intersect.point.sub(OFFSET));
            DRAG_OBJECT.mesh.position.z = 0;

            x = 0;
            y = 0;
            var compensation;

            if (DRAG_OBJECT.mesh.position.x + (DRAG_OBJECT.width / 2.0) > DRAG_OBJECT.parent.width / 2.0) x = 1;
            else if (DRAG_OBJECT.mesh.position.x - (DRAG_OBJECT.width / 2.0) < -DRAG_OBJECT.parent.width / 2.0) x = -1;

            if (x != 0) {
                // increase size
                compensation = Math.abs(DRAG_OBJECT.mesh.position.x + (x * DRAG_OBJECT.width / 2.0) - (x * DRAG_OBJECT.parent.width / 2.0));
                DRAG_OBJECT.parent.setSize(DRAG_OBJECT.parent.width + compensation, DRAG_OBJECT.parent.height);
                compensation *= x / 2.0;
                DRAG_OBJECT.parent.mesh.position.x += compensation;
                OFFSET.x += compensation;
                for (i = 0; i < OBJECTS.length; i++) for (j = 0; j < DRAG_OBJECT.parent.children[OBJECTS[i]].length; j++)
                    DRAG_OBJECT.parent.children[OBJECTS[i]][j].mesh.position.x -= compensation;
            }
            else {
                // should we reduce size?
            }

            if (DRAG_OBJECT.mesh.position.y + (DRAG_OBJECT.height / 2.0) > DRAG_OBJECT.parent.height / 2.0) y = 1;
            else if (DRAG_OBJECT.mesh.position.y - (DRAG_OBJECT.height / 2.0) < -DRAG_OBJECT.parent.height / 2.0) y = -1;

            if (y != 0) {
                // increase size
                compensation = Math.abs(DRAG_OBJECT.mesh.position.y + (y * DRAG_OBJECT.height / 2.0) - (y * DRAG_OBJECT.parent.height / 2.0));
                DRAG_OBJECT.parent.setSize(DRAG_OBJECT.parent.width, DRAG_OBJECT.parent.height + compensation);
                compensation *= y / 2.0;
                DRAG_OBJECT.parent.mesh.position.y += compensation;
                OFFSET.y += compensation;
                for (i = 0; i < OBJECTS.length; i++) for (j = 0; j < DRAG_OBJECT.parent.children[OBJECTS[i]].length; j++)
                        DRAG_OBJECT.parent.children[OBJECTS[i]][j].mesh.position.y -= compensation;
            }
            else {
                // should we reduce size?
            }

            if ((x != 0 || y != 0) && DRAG_OBJECT.type == 'node') {
                DRAG_OBJECT.parent.updateInputs();
                DRAG_OBJECT.parent.updateOutputs();
            }
            DRAG_OBJECT.updateLinks()
        }
        else if (DRAG_OBJECT.type == 'node') {
            // dragging node outside scope
            // TODO: handle this shit
        }
        else if (DRAG_OBJECT.type == 'scope') {
            // dragging scope outside plane
            // wut
        }
        return;
    }
    /*
    if (dragging && DRAG_EDGE) {

        if ((DRAG_SOURCE.parent.type == 'node' && DRAG_SOURCE.type == 'output') || (DRAG_SOURCE.parent.type == 'scope' && DRAG_SOURCE.type == 'input')) {
            // seeking input
            intersects = RAYCASTER.intersectObjects(DRAG_TARGET.parent.meshes.node);
            if (intersects.length > 0 && intersects[0].object.object != DRAG_SOURCE.parent) {
                intersect = intersects[0];
                if (!DRAG_INPUT) {
                    DRAG_INPUT = intersect.object.object.addArg();
                    DRAG_TARGET.mesh.position.addVectors(DRAG_INPUT.mesh.position, DRAG_INPUT.parent.mesh.position);
                    DRAG_TARGET.mesh.position.z = INPUT_ELEVATION;
                    DRAG_EDGE.update(false);
                }
                return;
            }
            else if (DRAG_INPUT) {
                DRAG_INPUT.parent.removeArg(DRAG_INPUT.arg_index);
                DRAG_INPUT = null;
            }
        }
        else if ((DRAG_SOURCE.parent.type == 'node' && DRAG_SOURCE.type == 'input') || (DRAG_SOURCE.parent.type == 'scope' && DRAG_SOURCE.type == 'output')) {
            // seeking output
            intersects = RAYCASTER.intersectObjects(DRAG_TARGET.parent.meshes.node);
            if (intersects.length > 0 && intersects[0].object.object != DRAG_SOURCE.parent) {
                intersect = intersects[0];
                var output = intersect.object.object.children.output[0];
                DRAG_TARGET.mesh.position.addVectors(output.mesh.position, output.parent.mesh.position);
                DRAG_EDGE.update(false);
                return;
            }
        }
        intersects = RAYCASTER.intersectObject(DRAG_TARGET.parent.mesh);
        if (intersects.length > 0) {
            intersect = intersects[0];
            DRAG_TARGET.mesh.position.copy(intersect.point.sub(DRAG_TARGET.mesh.parent.position));
            DRAG_TARGET.mesh.position.z = INPUT_ELEVATION;
            if (DRAG_SOURCE.type == 'input') DRAG_EDGE.update(false);
            else DRAG_EDGE.update(false);
        }
    }
    */
}

function up(x, y) {
    /*
    if (DRAG_EDGE) {
        var intersects, intersect, edge;

        if (DRAG_TARGET.type == 'input') {
            var end;
            intersects = RAYCASTER.intersectObjects(DRAG_TARGET.parent.meshes.input);
            if (intersects.length > 1 && intersects[0].object.object.parent != DRAG_SOURCE.parent) {
                intersect = intersects[0].object.object == DRAG_TARGET ? intersects[1] : intersects[0];
                end = intersect.object.object;
                if (end.edge) {
                    end.edge.start.edge = [];
                    end.edge.remove();
                    end.edge = [];
                }
                DRAG_TARGET.parent.addEdge(DRAG_SOURCE, end);
            }
            if (DRAG_INPUT) {
                DRAG_TARGET.parent.addEdge(DRAG_SOURCE, DRAG_INPUT);
                DRAG_INPUT = null;
            }
            else DRAG_SOURCE.edge = [];
        }
        else if (DRAG_TARGET.type == 'output') {
            var start;
            intersects = RAYCASTER.intersectObjects(DRAG_TARGET.parent.meshes.output);
            if (intersects.length > 1 && intersects[0].object.object.parent != DRAG_SOURCE.parent) {
                intersect = intersects[0].object.object == DRAG_TARGET ? intersects[1] : intersects[0];
                start = intersect.object.object;
                if (start.edge) {
                    start.edge.end.edge = [];
                    start.edge.end.parent.removeArg(start.edge.end.arg_index);
                    start.edge.remove();
                    start.edge = [];
                }
                edge = DRAG_TARGET.parent.addEdge(start, DRAG_SOURCE);
            }
            intersects = RAYCASTER.intersectObjects(DRAG_TARGET.parent.meshes.node);
            if (intersects.length > 0 && intersects[0].object.object.children.output.length == 1
                    && (intersects[0].object.object.parent != DRAG_SOURCE.parent || DRAG_SOURCE.parent.type == 'scope')) {
                intersect = intersects[0];
                start = intersect.object.object.children.output[0];
                if (start.edge) {
                    start.edge.end.edge = [];
                    if (start.edge.end.parent != start.edge.end.parent.parent.outputs
                        && start.edge.end.parent != start.edge.end.parent.parent.outputs)
                        start.edge.end.parent.removeArg(start.edge.end.arg_index);
                    start.edge.remove();
                    start.edge = [];
                }
                edge = DRAG_TARGET.parent.addEdge(start, DRAG_SOURCE);
            }
            else {
                DRAG_SOURCE.edge = [];
                if (DRAG_SOURCE.parent.type == 'node') DRAG_SOURCE.parent.removeArg(DRAG_SOURCE.arg_index);
            }
        }
        DRAG_TARGET.edge = [];
        DRAG_TARGET.remove();
        DRAG_EDGE.remove();
    }
    */

    CONTAINER.style.cursor = 'auto';
    CONTROLS.enabled = true;
    DRAG_OBJECT = null;
    DRAG_EDGE = null;
    DRAG_SOURCE = null;
    DRAG_TARGET = null;
}

function center() {
    CAMERA.position.set(0, 0, 500);
    CAMERA.up = new THREE.Vector3(0,1,0);
    CAMERA.lookAt(new THREE.Vector3(0,0,0));
    CONTROLS.target.set(0, 0, 0);
}
function distance(v1, v2) {
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;
    return Math.sqrt(dx*dx+dy*dy+dz*dz);
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
function onMouseMove(event){
    event.preventDefault();
    move(event.clientX, event.clientY, event.buttons == 1);
}
function onMouseUp(event) {
    event.preventDefault();
    up(event.clientX, event.clientY);
}

function render() {
    requestAnimationFrame(render);
    CONTROLS.update();
    RENDERER.render(SCENE.mesh, CAMERA);
}

SCENE = new Scene();

render();


var PLANE = SCENE.addPlane(0);


var SCOPE = PLANE.addScope();
SCOPE.setSize(200, 200);

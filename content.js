"use strict";
let SCENE, CAMERA, RENDERER, CONTROLS, CONTAINER, RAYCASTER, MOUSE, OFFSET = new THREE.Vector3();
let ATOM_HEIGHT = 8, NODE_HEIGHT = 20, NODE_WIDTH = 10, NODE_PADDING = 10, INPUT_PADDING = 20, INPUT_ELEVATION = 1;
let EDITOR_WIDTH = 400, LEVEL_SPACING = 128;

let DRAG_OBJECT, DRAG_EDGE, DRAG_SOURCE, DRAG_TARGET, DRAG_INPUT, DRAG_OUTPUT;
let MIN_SCROLL = 64;

let OBJECTS = ['plane', 'scope', 'node', 'edge', 'output', 'input', 'text', 'atom'];

let COLORS = {
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
let MATERIALS = {
    plane: function() {return new THREE.MeshBasicMaterial({visible: false, color: COLORS.plane});},
    scope: function() {return new THREE.MeshPhongMaterial({color: COLORS.scope, shading: THREE.FlatShading, transparent: true, opacity: 0.5});},
    node: function() {return new THREE.MeshPhongMaterial({color: COLORS.node, shading: THREE.FlatShading, transparent: true, opacity: 1});},
    edge: function() {return new THREE.MeshPhongMaterial({color: COLORS.edge, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    text:  function() {return new THREE.MeshPhongMaterial({color: COLORS.text, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    input: function() {return new THREE.MeshPhongMaterial({color: COLORS.input, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    output: function() {return new THREE.MeshPhongMaterial({color: COLORS.output, shading: THREE.FlatShading, transparent: true, opacity: 1})},
    atom:  function() {return new THREE.MeshPhongMaterial({color: COLORS.atom, shading: THREE.FlatShading, transparent: true, opacity: 1})}
};
let GEOMETRIES = {
    plane: function(params) {
        params = params || {};
        let g = new THREE.PlaneGeometry(params.width || 1000, params.height || 1000, 1, 1);
        g.dynamic = true;
        return g;
    },
    scope: function(params) {
        params = params || {};
        let points = [];
        let w = params.width || 100;
        let h = params.height || 100;
        points.push(new THREE.Vector2(- 0.5 * w, - 0.5 * h));
        points.push(new THREE.Vector2(- 0.5 * w, 0.5 * h));
        points.push(new THREE.Vector2(0.5 * w, 0.5 * h));
        points.push(new THREE.Vector2(0.5 * w, - 0.5 * h));
        let shape = new THREE.Shape(points);
        let settings = {amount: 1, bevelEnabled: false, steps: 1};
        let g = new THREE.ExtrudeGeometry(shape, settings);
        g.width = w;
        g.height = h;
        g.dynamic = true;
        return g;
    },
    node: function(params) {
        let points = [];
        params = params || {};
        let w = params.width || NODE_HEIGHT;
        let h = params.height || NODE_HEIGHT;
        points.push(new THREE.Vector2(- 0.5 * w, - 0.5 * h));
        points.push(new THREE.Vector2(- 0.5 * w, 0.5 * h));
        points.push(new THREE.Vector2(0.5 * w, 0.5 * h));
        points.push(new THREE.Vector2(0.5 * w, - 0.5 * h));
        let shape = new THREE.Shape(points);
        let settings = {amount: 5, bevelEnabled: false, steps: 1};
        let g = new THREE.ExtrudeGeometry(shape, settings);
        g.width = w;
        g.height = h;
        return g;
    },
    edge: function() {
        let getCurve = THREE.Curve.create(
            function () {},
            function (t) {return new THREE.Vector3(0, t, 0);}
        );
        return new THREE.TubeGeometry(new getCurve(), 8, 2, 8, true);
    },
    text: function(params) {
        params = params || {};
        let size = params.size || 10;
        let g = new THREE.TextGeometry(params.name || " ", {font: "droid sans", height: 6, size: size, style: "normal"});
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
        let w = params.width || 10;
        let h = params.height || ATOM_HEIGHT;

        let shape = new THREE.Shape();

        w = w / 2.0;
        h = h / 2.0;

        shape.moveTo(-w, h);
        shape.lineTo(w, h);
        shape.absarc(w, 0, h, 5 * Math.PI / 2.0, 3 * Math.PI / 2.0, true);
        shape.lineTo(-w, -h);
        shape.absarc(-w, 0, h, 3 * Math.PI / 2, Math.PI / 2.0, true);

        let settings = {amount: 5, bevelEnabled: false, steps: 1};
        let geometry = new THREE.ExtrudeGeometry( shape, settings );

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
        let siblings = this.parent.children[this.type];
        siblings.splice(this.local_index, 1);
        for (let i = this.local_index; i < siblings.length; i++) siblings[i].local_index = i;
        while (this.mesh.children.length > 0) this.mesh.children[0].object.remove();
        this.mesh.geometry.dispose();
        this.mesh.parent.remove(this.mesh);
    };
    this.add = function(object, local_index, deep) {
        this.meshes[object.type].push(object.mesh);
        for (let i = 0; i < OBJECTS.length; i++)
            this.meshes[OBJECTS[i]].push.apply(this.meshes[OBJECTS[i]], object.meshes[OBJECTS[i]]);
        if (this.parent) this.parent.add(object, null, true);
        if (deep == true) return;
        object.parent = this;
        let siblings = this.children[object.type];
        if (local_index != 0 && (!local_index || local_index < 0)) local_index = siblings.length;
        local_index = Math.max(siblings.length, local_index);
        siblings.splice(local_index, 0, object);
        for (let i = local_index; i < siblings.length; i++) siblings[i].local_index = i;
        this.mesh.add(object.mesh);
        return object;
    };
    this.setPosition = function(x, y, z) {
        if (!z) z = 0;
        this.mesh.position.set(x, y, z);
    };
    if (this.type != 'scene') {
        this.mesh = new THREE.Mesh(GEOMETRIES[this.type](this.params), MATERIALS[this.type]());
        this.mesh.object = this;
    }
    this.children = {};
    this.meshes = {};
    for (let i = 0; i < OBJECTS.length; i++) {
        this.children[OBJECTS[i]] = [];
        this.meshes[OBJECTS[i]] = [];
    }
    return this;
}

function Scene() {
    this.addPlane = function(level) {
        let plane = new Plane(level);
        this.add(plane);
        return plane;
    };
    this.addEdge = function(start, end) {
        let edge = new Edge(start, end, true);
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
    let width = window.innerWidth;
    let height = window.innerHeight;
    width -= 3;
    height -= 3;
    RENDERER.setPixelRatio((width - EDITOR_WIDTH) / height);
    RENDERER.setSize(width - EDITOR_WIDTH, height);
    CONTAINER = document.getElementById('content');
    CONTAINER.appendChild(RENDERER.domElement);
    CAMERA = new THREE.PerspectiveCamera(60, (window.innerWidth - EDITOR_WIDTH) / window.innerHeight, 1, 10000);
    CAMERA.position.z = 500;
    //CONTROLS = new THREE.TrackballControls(CAMERA);
    CONTROLS = {update() {}};
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
    RENDERER.domElement.addEventListener( 'mousewheel', onMouseScroll, false );

    // light
    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0.2, 0.2, 1);
    light.castShadow = true;
    light.shadowMapWidth = 2048;
    light.shadowMapHeight = 2048;
    let d = 50;
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
        let scope = new Scope();
        this.add(scope);
        return scope;
    };
    this.setSize = function(width, height) {
        let g = this.mesh.geometry;
        for (let i = 0; i < this.mesh.geometry.vertices.length; i++) {
            let vertex = this.mesh.geometry.vertices[i];
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
    this.updateLinks = function() {
        //for (let i = 0; i < this.children.node.length; i++)
        //    for (let j = 0; j < this.children.node[i].edge.length; j++)
        //        this.children.node[i].edge[j].update();
        //    //if (this.children.node[i].edge) this.children.node[i].edge.update();
        // TODO: implement cross-scope link updating here
    };
    this.updateSize = function() {
        let min = this.children.node.length * 50;
        this.min_height = min;
        this.min_width = min;

        let width = Math.max(this.width, this.min_width);
        let height = Math.max(this.height, this.min_height);

        this.setSize(width, height);
    };
    this.setSize = function(width, height) {
        let g = this.mesh.geometry;
        for (let i = 0; i < this.mesh.geometry.vertices.length; i++) {
            let vertex = this.mesh.geometry.vertices[i];
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

    this.min_height = this.height;
    this.min_width = this.width;

    return this;
}

function Node(name) {
    this.setName = function(name) {
        this.name = name;
        if (name == '' || !name) return null;
        if (this.children.text.length > 0) {
            this.children.text[0].remove();
            //this.children.text[0].setText(String(name));
        }
        this.add(new Text(String(name)));
        this.text_width = this.children.text[0].width;
        this.updateSize(null, NODE_HEIGHT);
    };
    this.addArg = function(index, value) {
        let local_index, arg;
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
        for (let i = local_index; i < this.args.length; i++) this.args[i].arg_index = i;
        this.updateSize();
        this.updateArgs();
        return arg;
    };
    this.removeArg = function(index) {
        if (!index && index != 0) index = this.args.length - 1;
        if (index < 0) return false;
        let arg = this.args[index];
        this.args.splice(index, 1);
        for (let i = index; i < this.args.length; i++) this.args[i].arg_index = i;
        arg.remove();
        this.updateSize();
        this.updateArgs();
        return true;
    };
    this.addOutput = function(index) {
        let output = new Output();
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
        for (let i = 0; i < this.children.atom.length; i++) this.input_width += this.children.atom[i].width;
        if (!width && width != 0) width = Math.max(this.text_width, this.input_width, this.output_width, 10);
        if (!height && height != 0) height = NODE_HEIGHT;
        width = width + NODE_PADDING;
        if ((width != this.width) || (height != this.height)) for (let i = 0; i < this.mesh.geometry.vertices.length; i++) {
            let vertex = this.mesh.geometry.vertices[i];
            vertex.x = (vertex.x < 0 ? -1 : 1) * width / 2.0;
            vertex.y = (vertex.y < 0 ? -1 : 1) * height / 2.0;
            vertex.z = width == 0 ? (vertex.z == 0 ? 0 : 1) : (vertex.z == 0 ? 0 : 5);
        }
        this.mesh.geometry.verticesNeedUpdate = true;
        this.width = width;
        this.height = height;
    };
    this.updateArgs = function() {
        let position = -this.input_width / 2.0;
        for (let i = 0; i < this.args.length; i++) {
            let arg = this.args[i];
            position += (arg.width || 0) / 2.0;
            arg.setPosition(position, this.height / 2.0, INPUT_ELEVATION);
            position += INPUT_PADDING + ((arg.width || 0) / 2.0);
            if (arg.edge) for (let j = 0; j < arg.edge.length; j++)
                arg.edge[j].update();
            //if (arg.edge) arg.edge.update();
        }
    };
    this.updateOutputs = function() {
        let length = this.children.output.length;
        for (let i = 0; i < length; i++) {
            let output = this.children.output[i];
            output.setPosition(INPUT_PADDING * (i - ((length - 1) / 2.0)), - this.height / 2.0, INPUT_ELEVATION);
            for (let j = 0; j < output.edge.length; j++)
                output.edge[j].update();
            //if (output.edge) output.edge.update();
        }
    };
    this.updateLinks = function() {
        for (let i = 0; i < this.children.input.length; i++)
            for (let j = 0; j < this.children.input[i].edge.length; j++)
                this.children.input[i].edge[j].update();
            //if (this.children.input[i].edge) this.children.input[i].edge.update();
        for (let i = 0; i < this.children.output.length; i++)
            for (let j = 0; j < this.children.output[i].edge.length; j++)
                this.children.output[i].edge[j].update();
            //if (this.children.output[i].edge) this.children.output[i].edge.update();
    };
    this.type = 'node';
    GRASPObject.apply(this);
    this.input_width = 10;
    this.output_width = 10;
    this.width = 10;
    this.height = NODE_HEIGHT;
    this.args = [];

    if (!name) {
        this.text_width = 0;
    }
    else {
        this.name = name;
        let text = new Text(String(name));
        this.add(text);
        this.text_width = text.width;
    }

    this.addOutput();
    return this;
}

function Edge(start, end) {
    this.update = function() {
        let direction, length;
        let start, end;
        let axis, angle;
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
            this.length = length;
            this.mesh.scale.set(1, length * 1.15, 1);

            let yaxis = new THREE.Vector3(0, 1, 0);
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
            this.length = length;
            this.direction = direction;
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

    start.edge.push(this);
    end.edge.push(this);
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
    let text = new Text(String(value), 6);
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
        console.log('setting text to', text);
        if (text) this.value = text;
        this.mesh.geometry.dispose();
        let geo = GEOMETRIES.text(text);
        geo.verticesNeedUpdate = true;
        console.log(geo);
        this.mesh.geometry = geo;
        this.width = this.mesh.geometry.width;
    };
    this.type = 'text';
    if (!text) text = '';
    this.params = {name: text, size: size || 10};
    GRASPObject.apply(this);
    this.width = this.mesh.geometry.width;
    return this;
}

function Label(name) {
    // TODO: implement this
}

// TODO: add event handler for exception

function down(x, y) {
    let intersects, intersect;
    let plane, scope;
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
    let intersects, intersect;
    let i, j;
    if (dragging && DRAG_OBJECT) {
        intersects = RAYCASTER.intersectObject(DRAG_OBJECT.parent.mesh);
        if (intersects.length > 0) {
            intersect = intersects[0];
            DRAG_OBJECT.mesh.position.copy(intersect.point.sub(OFFSET));
            DRAG_OBJECT.mesh.position.z = 0;

            x = 0;
            y = 0;
            let compensation;

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

            if (DRAG_OBJECT.type == 'node') DRAG_OBJECT.updateLinks();
            else for (i = 0; i < SCENE.children.edge.length; i++)
                if ((SCENE.children.edge[i].start.parent.parent == DRAG_OBJECT) || (SCENE.children.edge[i].end.parent.parent == DRAG_OBJECT))
                    SCENE.children.edge[i].update();
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
                let output = intersect.object.object.children.output[0];
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
        let intersects, intersect, edge;

        if (DRAG_TARGET.type == 'input') {
            let end;
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
            let start;
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

function scroll(y) {
    if (CAMERA.position.z + y > MIN_SCROLL) CAMERA.position.z += y / 4.0;
}

function center() {
    CAMERA.position.set(0, 0, 500);
    CAMERA.up = new THREE.Vector3(0,1,0);
    CAMERA.lookAt(new THREE.Vector3(0,0,0));
    CONTROLS.target.set(0, 0, 0);
}
function distance(v1, v2) {
    let dx = v1.x - v2.x;
    let dy = v1.y - v2.y;
    let dz = v1.z - v2.z;
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
function onMouseScroll(event) {
    event.preventDefault();
    scroll(event.deltaY);
}

function updateForces(scene) {
  let k = 0.01;
  let repellent = -1000;
  let dx, dy, start, end, startNode, endNode, scale, v, distance;
  if (SCENE) for (let i = 0; i < SCENE.meshes.scope.length; i++) {
    let scope = SCENE.meshes.scope[i].object;
    for (let j = 0; j < scope.children.node.length; j++)
      scope.children.node[j].force = new THREE.Vector2();
    for (let j = 0; j < scope.children.edge.length; j++) {
      let edge = scope.children.edge[j];
      edge.update();
      if (edge.start && edge.end) {
        start = null; end = null;
        if (edge.start.parent.type == 'node') {
          startNode = edge.start.parent;
          start = edge.start.parent.mesh.position.clone().add(edge.start.mesh.position);
        }
        else if (edge.start.type == 'node') {
          startNode = edge.start;
          start = edge.start.mesh.position.clone();
        }
        if (edge.end.parent.type == 'node') {
          endNode = edge.end.parent;
          end = edge.end.parent.mesh.position.clone().add(edge.end.mesh.position);
        }
        else if (edge.end.type == 'node') {
          endNode = edge.end;
          end = edge.end.mesh.position.clone();
        }
        if (start && end) {
          // edge spring
          v = new THREE.Vector2(end.x - start.x, end.y - start.y);
          v.multiplyScalar(k);
          if (startNode != DRAG_OBJECT) startNode.force.add(v);
          v.multiplyScalar(-1);
          if (endNode != DRAG_OBJECT) endNode.force.add(v);
        }
      }
    }
    let node, sibling;
    // node repellent
    for (let j = 0; j < scope.children.node.length; j++) {
      node = scope.children.node[j];
      if (node != DRAG_OBJECT) for (let l = 0; l < scope.children.node.length; l++) if (l != j) {
        sibling = scope.children.node[l];
        dx = sibling.mesh.position.x - node.mesh.position.x;
        dy = sibling.mesh.position.y - node.mesh.position.y;
        if (dx == 0) dx = -1;
        if (dy == 0) dy = -1;
        distance = (dx * dx) + (dy * dy);
        if (distance < 10) scale = .1;
        else scale = repellent / distance;
        v = new THREE.Vector2(dx, dy);
        v.setLength(scale);
        node.force.add(v);
      }
    }
    for (let j = 0; j < scope.children.node.length; j++) {
      node = scope.children.node[j];
      if (Math.abs(node.mesh.position.x) + (node.width / 2.0) < scope.width / 2.0)
        node.mesh.position.x += node.force.x;
      if (Math.abs(node.mesh.position.y) + (node.height / 2.0) < scope.height / 2.0)
        node.mesh.position.y += node.force.y
    }
  }
}

function updateRealForces(scene) {
    let spring_constant = 0.01;
    let node_repellent = -1000;
    let node, sibling;
    let dx, dy, start, end, startNode, endNode, scale, v, distance;
    if (scene) for (let i = 0; i < SCENE.meshes.scope.length; i++) {
        let scope = SCENE.meshes.scope[i].object;
        for (let j = 0; j < scope.children.node.length; j++)
            scope.children.node[j].force = new THREE.Vector2(0, 0);
        for (let j = 0; j < scope.children.node.length; j++) {
            if (scope.children.node[j] != DRAG_OBJECT) {
                for (let k = 0; k < scope.children.node.length; k++) {
                    if (scope.children.node[k] != DRAG_OBJECT) {
                        if (k != j) {
                            node = scope.children.node[j];
                            sibling = scope.children.node[k];

                            dx = sibling.mesh.position.x - node.mesh.position.x;
                            dy = sibling.mesh.position.y - node.mesh.position.y;
                            if (dx == 0) dx = -1;
                            if (dy == 0) dy = -1;
                            distance = (dx * dx) + (dy * dy);
                            if (distance < 10) scale = .1;
                            else scale = node_repellent / distance;
                            v = new THREE.Vector2(dx, dy);
                            v.setLength(scale);
                            node.force.add(v);

                            for (let l = 0; l < node.children.output; l++) {
                                for (let m = 0; m < node.children.output[l].edge.length; m++)
                                    node.children.output[l].edge[m].update();
                                //if (node.children.output[l].edge) {
                                //    node.children.output[l].edge.update();
                                //}
                            }
                            for (let l = 0; l < node.args; l++) {
                                for (let m = 0; m < node.args[l].edge.length; m++)
                                    node.args[l].edge[m].update();
                                //if (node.args[l].edge) {
                                //    node.args[l].edge.update();
                                //}
                            }
                        }
                    }
                }
            }
        }
    }
}

function render(scene) {
  //updateForces(scene);
  requestAnimationFrame(render);
  CONTROLS.update();
  RENDERER.render(SCENE.mesh, CAMERA);
}

SCENE = new Scene();

render(SCENE);


let PLANE = SCENE.addPlane(0);


let SCOPE = PLANE.addScope();
SCOPE.setSize(200, 200);

//let plane2 = SCENE.addPlane(2);
//
//let scope2 = plane2.addScope();
//
//let lambda = SCOPE.addNode('lambda');
//lambda.addArg(null, 'arg1');
//lambda.addArg(null, 'arg2');
//
//let arg1 = scope2.addNode('arg1');
//arg1.addArg();
//let arg2 = scope2.addNode('arg2');
//arg2.addArg();
//SCENE.addEdge(lambda.args[0], arg1.args[0]);
//SCENE.addEdge(lambda.args[1], arg2.args[0]);
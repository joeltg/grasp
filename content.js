"use strict";

var MOUSE = new THREE.Vector3(0, 0, 0), OFFSET = new THREE.Vector2(0, 0);
var EDITOR_WIDTH = 400 + 3, NAVBAR_HEIGHT = 64 + 3;
var LEVEL_SPACING = 256, ARG_ELEVATION = 1, ARG_SPACING = 20, INPUT_RADIUS = 5, OUTPUT_RADIUS = 5;
var DRAG_OBJECT;

var COLORS = {
    green: 0x119955,
    white: 0xffffff,
    blue: 0x113355,
    highlight: 0xffff00
};

class GRASPObject {
    constructor(geometry, material) {
        this.local_index = null;
        this.meshes = {};
        this.children = {};
        if (geometry && material) {
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.object = this;
        }
        this.parent = null;
    }
    add(object, local_index) {
        this.mesh.add(object.mesh);
        object.parent = this;
        let first = true;
        for (let proto = object.__proto__; proto; proto = proto.__proto__) {
            let type = proto.constructor.name;
            if (this.children[type]) {
                if (first) {
                    local_index = local_index || this.children[type].length;
                    this.children[type].splice(local_index, 0, object);
                    for (let j = local_index; j < this.children[type].length; j++) this.children[type][j].local_index = j;
                }
                else this.children[type].push(object);
            }
            else {
                this.children[type] = [object];
                if (first) object.local_index = 0;
            }
            object.mesh.traverseAncestors(function(mesh) {
                if (mesh.object.meshes[type]) mesh.object.meshes[type].push(object.mesh);
                else mesh.object.meshes[type] = [object.mesh];
            });
            first = false;
        }
        object.mesh.traverseAncestors(function(mesh) {
            for (let type in object.meshes) if (object.meshes.hasOwnProperty(type)) {
                //if (mesh.object.meshes[type]) mesh.object.meshes[type] = [...object.meshes[type]];
                if (mesh.object.meshes[type]) mesh.object.meshes[type] = mesh.object.meshes[type].concat(object.meshes[type]);
                else mesh.object.meshes[type] = object.meshes[type].slice();
            }
        });
        return object;
    }
    remove() {
        // remove children
        for (let type in this.children) if (this.children.hasOwnProperty(type))
            this.children[type].forEach(function(object) {object.remove();});
        for (let proto = this.__proto__; proto; proto = proto.__proto__) {
            let type = proto.constructor.name;
            // update parent's .children[type] list
            let siblings = this.parent.children[type];
            siblings.splice(this.local_index, 1);
            // update siblings' indices
            for (let j = this.local_index; j < siblings.length; j++) siblings[j].local_index = j;
            // update all ancestor's .meshes[type] lists
            let m = this.mesh;
            this.mesh.traverseAncestors(function(mesh) {
                let index = mesh.object.meshes[type].indexOf(m);
                if (index > -1) mesh.object.meshes[type].splice(index, 1);
            });
        }
        // remove self
        this.mesh.geometry.dispose();
        if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
        // return parent for easy chaining
        return this.parent;
    }
    getAbsolutePosition() {
        let position = new THREE.Vector3(0, 0, 0);
        let current = this;
        while (current.parent) {
            position.add(current.position);
            current = current.parent;
        }
        return position;
    }
    setColor(hex) { this.mesh.material.color.setHex(hex); }
    setPosition(x, y, z) { this.mesh.position.set(x, y, z); }
    set position(v) { this.setPosition(v.x, v.y, v.z); }
    get position() { return this.mesh.position; }
    get type() {return this.constructor.name; }
}

class Scene extends GRASPObject {
    constructor() {
        super();
        //this.type = 'Scene';
        this.mesh = new THREE.Scene();
        this.mesh.object = this;
        this.mesh.fog = new THREE.FogExp2(0xcccccc, 0.001);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(this.mesh.fog.color);
        this.width = window.innerWidth - EDITOR_WIDTH;
        this.height = window.innerHeight - NAVBAR_HEIGHT;
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(this.width / this.height);
        this.container = document.getElementById('content');
        this.container.appendChild(this.renderer.domElement);
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 50, 10000);
        this.camera.position.z = 500;

        this.controls = new THREE.TrackballControls(this.camera);
        this.controls.noZoom = false;
        this.controls.noPan = false;

        this.raycaster = new THREE.Raycaster();

        let scene = this;

        // mouse and resize listeners
        window.addEventListener('resize', function () {
            scene.width = window.innerWidth - EDITOR_WIDTH;
            scene.height = window.innerHeight - NAVBAR_HEIGHT;
            scene.camera.aspect = scene.width / scene.height;
            scene.camera.updateProjectionMatrix();
            scene.renderer.setSize(scene.width, scene.height);
        }, false);
        this.container.addEventListener("touchstart", onTouchStart, false);
        this.container.addEventListener("touchend", onTouchEnd, false);
        this.container.addEventListener("touchcancel", onTouchCancel, false);
        this.container.addEventListener("touchmove", onTouchMove, false);
        this.container.addEventListener('mouseup', onMouseUp, false);
        this.container.addEventListener('mousemove', onMouseMove, false);
        this.container.addEventListener('mousedown', onMouseDown, false);
        this.container.addEventListener('mousewheel', onMouseScroll, false );

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
    remove() {
        // remove everything
        while (this.mesh.children.length > 1) this.mesh.children[this.mesh.children.length - 1].object.remove();
        delete this.meshes;
        this.meshes = [];
        delete this.children;
        this.children = [];
    }
    addPlane(index) {
        let plane = this.add(new Plane(), index);
        this.children.Plane.forEach(function(plane) { plane.setPosition(0, 0, LEVEL_SPACING * plane.local_index); });
        return plane;
    }
    addEdge(start, end) {
        let edge = this.add(new Edge(start, end));
        start.parent.parent.edges.push(edge);
        end.parent.parent.edges.push(edge);
        return edge;
    }
}

class Plane extends GRASPObject {
    constructor(width, height) {
        width = width || 1000;
        height = height || 1000;
        let geometry = new THREE.PlaneGeometry(width, height, 1, 1);
        geometry.dynamic = true;
        let material =  new THREE.MeshBasicMaterial({visible: false});

        super(geometry, material);
        //this.type = 'Plane';
        this.width = width;
        this.height = height;
        return this;
    }
    setSize(width, height) {
        let g = this.mesh.geometry;
        geometry.vertices.forEach(function(vertex) {
            vertex.x = (vertex.x < 0 ? -1 : 1) * width / 2;
            vertex.y = (vertex.y < 0 ? -1 : 1) * height / 2;
        });
        g.verticesNeedUpdate = true;
        g.normalsNeedUpdate = true;
        g.computeFaceNormals();
        g.computeVertexNormals();
        g.computeBoundingSphere();
        this.width = width;
        this.height = height;
    }
    extend(top, right, bottom, left) {
        this.setSize(this.width + left + right, this.height + top + bottom);
        for (let i = 0; i < this.mesh.children.length; i++) {
            let child = this.mesh.children[i];
            let shiftX = (left - right) / 2;
            let shiftY = (bottom - top) / 2;
            child.position.x += shiftX;
            child.position.y += shiftY;
        }
    }
}

class Scope extends GRASPObject {
    constructor(level, width, height) {
        level = level || 0;
        width = width || 200;
        height = height || 200;
        let points = [
            new THREE.Vector2(- 0.5 * width, - 0.5 * height),
            new THREE.Vector2(- 0.5 * width, 0.5 * height),
            new THREE.Vector2(0.5 * width, 0.5 * height),
            new THREE.Vector2(0.5 * width, - 0.5 * height)
        ];
        let geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), {amount: 1, bevelEnabled: false, steps: 1});
        geometry.dynamic = true;
        let material = new THREE.MeshPhongMaterial({color: COLORS.white, shading: THREE.FlatShading, transparent: true, opacity: 0.5});
        super(geometry, material);
        //this.type = 'Scope';
        this.width = width;
        this.height = height;
        this.level = level;
        this.setSize(200, 200);
        this.scope = {};
        this.parent_scope = null;
        this.edges = [];
        return this;
    }
    setSize(width, height) {
        let g = this.mesh.geometry;
        g.vertices.forEach(function(vertex) {
            vertex.x = (vertex.x < 0 ? -1 : 1) * width / 2;
            vertex.y = (vertex.y < 0 ? -1 : 1) * height / 2;
        });
        g.verticesNeedUpdate = true;
        g.normalsNeedUpdate = true;
        g.computeFaceNormals();
        g.computeVertexNormals();
        g.computeBoundingSphere();
        this.width = width;
        this.height = height;
    }
    extend(top, right, bottom, left) {
        this.setSize(this.width + left + right, this.height + top + bottom);
        let position = this.position;
        this.setPosition(position.x + ((right - left) / 2), position.y + ((top - bottom) / 2), 0);
        for (let i = 0; i < this.mesh.children.length; i++) {
            let child = this.mesh.children[i];
            let shiftX = (left - right) / 2;
            let shiftY = (bottom - top) / 2;
            child.position.x += shiftX;
            child.position.y += shiftY;
        }
    }
    addScope() {
        let plane = this.parent;
        if (plane) {
            let level = plane.local_index;
            if (level == this.level) {
                let new_plane = SCENE.children.Plane[level + 1] || SCENE.addPlane();
                let new_scope = new_plane.add(new Scope(level + 1));
                new_scope.parent_scope = this;
                return new_scope;
            }
            else console.error('levels don\'t match', level, this.level);
        }
        else console.error('scope does not have parent');
    }
    addEdge(start, end) {
        return this.add(new Edge(start, end));
    }
    updateEdges() {
        for (let i = 0; i < this.edges.length; i++) this.edges[i].update();
    }
    findBinding(label) {
        for (let scope = this; scope; scope = scope.parent_scope)
            if (scope.scope[label]) return scope.scope[label];
        return null;
    }
    addVariable(name) {
        let variable = this.add(new Variable(name));
        this.scope[name] = variable;
        return variable;
    }
    addForm(name) {
        let form = this.add(new Form());
        if (name) form.addInput(name, COLORS.blue);
        return form;
    }
}

class Node extends GRASPObject {
    constructor() {
        let width = 20;
        let height = 25;
        let points = [
            new THREE.Vector2(- 0.5 * width, - 0.5 * height),
            new THREE.Vector2(- 0.5 * width, 0.5 * height),
            new THREE.Vector2(0.5 * width, 0.5 * height),
            new THREE.Vector2(0.5 * width, - 0.5 * height)
        ];
        let geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), {amount: 5, bevelEnabled: false, steps: 1});
        geometry.dynamic = true;
        let material = new THREE.MeshPhongMaterial({shading: THREE.FlatShading});
        super(geometry, material);
        //this.type = 'Node';
        this.width = width;
        this.height = height;
        return this;
    }
    setSize(width, height) {
        let g = this.mesh.geometry;
        g.vertices.forEach(function(vertex) {
            vertex.x = (vertex.x < 0 ? -1 : 1) * width / 2;
            vertex.y = (vertex.y < 0 ? -1 : 1) * height / 2;
        });
        g.verticesNeedUpdate = true;
        g.normalsNeedUpdate = true;
        g.computeFaceNormals();
        g.computeVertexNormals();
        g.computeBoundingSphere();
        this.width = width;
        this.height = height;
    }
    updateEdges() {
        if (this.children.Input) this.children.Input.forEach(function(input) { if (input.edge) input.edge.update(); });
        if (this.children.Output) this.children.Output.forEach(function(output) { if (output.edge) output.edge.update(); });
    }
    addInput(label, color, radius, index) {
        radius = radius || INPUT_RADIUS;
        let scope = this.parent;
        let input;
        if (label && scope) {
            let value = scope.findBinding(label);
            if (value) {
                let real_label = null;
                if (document.getElementById('labels').checked) real_label = label;
                input = this.add(new Input(real_label, color, radius), index);
                if (scope.scope[label]) scope.addEdge(value.addOutput(), input, COLORS.blue).update();
                else SCENE.addEdge(value.addOutput(), input, COLORS.blue).update();
            }
            else input = this.add(new Input(label, color, radius), index);
        }
        else input = this.add(new Input(null, color, radius), index);
        if (this.updateSize) this.updateSize();
        return input;
    }
    addOutput(index) {
        let output = new Output();
        this.add(output, index);
        if (this.updateSize) this.updateSize();
        if (this.type == 'Variable') output.setColor(COLORS.blue);
        return output;
    }
}

class Form extends Node {
    constructor() {
        super();
        //this.type = 'Form';
        this.setColor(COLORS.green);
        this.output = this.add(new Output());
        this.output.setPosition(0, - this.height / 2, ARG_ELEVATION);
        return this;
    }
    updateSize() {
        if (this.children.Input) {
            let input_width = 0;
            let length = this.children.Input.length;
            for (let i = 1; i < length; i++) input_width += this.children.Input[i].width + ARG_SPACING + this.children.Input[i].radius;
            let first = this.children.Input[0];
            let width = Math.max(this.height, first.width + ARG_SPACING, input_width);
            // position function reference
            first.setPosition(-width / 2, 0, ARG_ELEVATION);
            // position function args
            let position = - (width / 2) - INPUT_RADIUS;
            for (let i = 1; i < length; i++) {
                let input = this.children.Input[i];
                input.setPosition(position + ((ARG_SPACING + input.radius) / 2), this.height / 2, ARG_ELEVATION);
                position += ARG_SPACING + input.width + input.radius;
            }
            this.setSize(width, this.height);
        }
        else console.error('form has no inputs');
        // position return output if it exists
        if (this.children.Output && this.children.Output.length > 1)
            this.children.Output[1].setPosition(this.width / 2, 0, ARG_ELEVATION);
    }
}

class Variable extends Node {
    constructor(name) {
        super();
        //this.type = 'Variable';
        this.setColor(COLORS.blue);
        this.name = name;
        this.label = this.add(new Text(name, 10, 5.1));
        this.updateSize();
        return this;
    }
    setName(name) {
        if (this.parent && this.parent.scope) {
            this.parent.scope[this.name] = null;
            this.parent.scope[name] = this;
        }
        this.label.remove();
        this.label = this.add(new Text(name));
        this.name = name;
        this.updateSize();
    }
    updateSize() {
        let text_width = this.label ? this.label.width : 0;
        let input_width = 0;
        if (this.children.Input) for (let i = 0; i < this.children.Input.length; i++)
            input_width += this.children.Input[i].width + ARG_SPACING;
        let output_length = this.children.Output ? this.children.Output.length : 0;
        let output_width = ARG_SPACING * output_length;
        let width = Math.max(this.height, output_width, input_width, text_width);
        let position = - width / 2;
        // position variable inputs
        if (this.children.Input) for (let i = 0; i < this.children.Input.length; i++) {
            let input = this.children.Input[i];
            input.setPosition(position + (ARG_SPACING / 2), this.height / 2, ARG_ELEVATION);
            if (input.edge) input.edge.update();
            position += ARG_SPACING + input.width;
        }
        let output_spacing = width / output_length;
        // position variable outputs
        if (this.children.Output) for (let i = 0; i < this.children.Output.length; i++) {
            let output = this.children.Output[i];
            output.setPosition((i * output_spacing) - (width / 2) + (output_spacing / 2), - this.height / 2, ARG_ELEVATION);
            if (output.edge) output.edge.update();
        }
        this.setSize(width, this.height);
    }
}

class Edge extends GRASPObject {
    constructor(start, end, color) {
        color = color || COLORS.green;
        let getCurve = THREE.Curve.create(function () { }, function (t) { return new THREE.Vector3(0, t, 0); });
        let geometry = new THREE.TubeGeometry(new getCurve(), 8, 2, 8, true);
        let material = new THREE.MeshPhongMaterial({shading: THREE.FlatShading, color: color});
        super(geometry, material);
        //this.type = 'Edge';
        if (start.edge) console.error('start.edge already exists');
        if (end.edge) console.error('end.edge already exists');
        this.start = start;
        this.end = end;
        start.edge = this;
        end.edge = this;
        this.update();
        return this;
    }
    update() {
        let direction, length, start, end, axis, angle;
        if (this.parent && this.parent.type == 'Scene') {
            start = this.start.getAbsolutePosition();
            end = this.end.getAbsolutePosition();
            this.setPosition(start.x, start.y, start.z);
            this.mesh.rotation.z = 0;
            this.mesh.rotation.y = 0;
            this.mesh.rotation.x = 0;
            length = start.distanceTo(end);
            this.length = length;
            this.mesh.scale.set(1, length * 1.15, 1);
            let yaxis = new THREE.Vector3(0, 1, 0);
            axis = new THREE.Vector3().subVectors(end, start);
            angle = yaxis.angleTo(axis);
            axis.cross(yaxis).normalize();
            this.mesh.rotateOnAxis(axis, -angle);
        }
        else {
            start = new THREE.Vector3().addVectors(this.start.position, this.start.parent.position);
            end = new THREE.Vector3().addVectors(this.end.position, this.end.parent.position);
            direction = new THREE.Vector3().subVectors(end, start);
            length = start.distanceTo(end);
            this.length = length;
            this.direction = direction;
            this.setPosition(start.x, start.y, start.z);
            this.mesh.rotation.z = 0;
            this.mesh.scale.set(1, length * 1.15, 1);
            this.mesh.rotation.z = ((start.x > end.x) ? 1 : -1) * this.mesh.up.angleTo(direction);
        }
    }
}

class Arg extends GRASPObject {
    constructor(radius) {
        let geometry = new THREE.SphereGeometry(radius);
        let material = new THREE.MeshPhongMaterial({shading: THREE.FlatShading});
        super(geometry, material);
        //this.type = 'Arg';
        this.radius = radius;
        this.edge = null;
        this.width = 0;
        return this;
    }
}

class Input extends Arg {
    constructor(label, color, radius) {
        radius = radius || INPUT_RADIUS;
        super(radius);
        //this.type = 'Input';
        color = color || COLORS.white;
        this.setColor(color);
        this.label_text = label;
        this.label = null;
        this.width = 0;
        if (label) {
            this.label = this.add(new Label(label, 2 * radius));
            this.width = this.label.width;
        }
        return this;
    }
}

class Output extends Arg {
    constructor(radius, color) {
        radius = radius || OUTPUT_RADIUS;
        super(radius);
        //this.type = 'Output';
        color = color || COLORS.green;
        this.setColor(color);
        return this;
    }
}

class Label extends GRASPObject {
    constructor(name, height) {
        let text = new Text(name, height - 2, 4.2);

        let w = text.width + height;
        let h = height || 10;
        let shape = new THREE.Shape();

        shape.moveTo(0, h / 2);
        shape.lineTo(w, h / 2);
        shape.absarc(w, 0, h / 2, 5 * Math.PI / 2.0, 3 * Math.PI / 2.0, true);
        shape.lineTo(0, - h / 2);
        shape.lineTo(0, h / 2);

        let settings = {amount: 4.1, bevelEnabled: false, steps: 1};
        let geometry = new THREE.ExtrudeGeometry( shape, settings );

        geometry.dynamic = true;

        let material = new THREE.MeshPhongMaterial({color: COLORS.blue, shading: THREE.FlatShading});
        super(geometry, material);
        this.width = text.width;
        this.add(text);
        text.setPosition(w / 2, 0, 0);
        return this;
    }
}

class Text extends GRASPObject {
    constructor(text, size, height) {
        text = text || ' ';
        size = size || 10;
        height = height || 6;
        let geometry = new THREE.TextGeometry(text, {font: "droid sans mono", height: height, size: size, style: "normal"});
        geometry.computeBoundingBox();
        let width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(- width / 2, - size / 2, 0));
        geometry.dynamic = true;
        geometry.verticesNeedUpdate = true;
        let material = new THREE.MeshPhongMaterial({color: COLORS.white, shading: THREE.FlatShading});
        super(geometry, material);
        //this.type = 'Text';
        this.width = width;
        this.text = text;
        return this;
    }
}

function down(x, y) {
    MOUSE.x = ((x - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH)) * 2 - 1;
    MOUSE.y = - ((y - NAVBAR_HEIGHT) / (window.innerHeight - NAVBAR_HEIGHT)) * 2 + 1;
    SCENE.raycaster.setFromCamera(MOUSE, SCENE.camera);
    
    let intersects = SCENE.raycaster.intersectObjects(SCENE.meshes.GRASPObject || []);
    for (let i = 0; i < intersects.length; i++) {
        let intersect = intersects[i].object.object;
        if (intersect.type == 'Scope' || intersect.type == 'Variable' || intersect.type == 'Form') {
            DRAG_OBJECT = intersect;
            SCENE.controls.enabled = false;
            OFFSET.copy(intersects[i].point).sub(DRAG_OBJECT.position);
            SCENE.container.style.cursor = 'move';
            break;
        }
    }
}

function move(x, y) {
    MOUSE.x = ((x - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH)) * 2 - 1;
    MOUSE.y = - ((y - NAVBAR_HEIGHT) / (window.innerHeight - NAVBAR_HEIGHT)) * 2 + 1;
    SCENE.raycaster.setFromCamera(MOUSE, SCENE.camera);

    if (DRAG_OBJECT) {
        let intersects = SCENE.raycaster.intersectObject(DRAG_OBJECT.parent.mesh);
        if (intersects.length > 0) {
            let intersect = intersects[0];

            DRAG_OBJECT.mesh.position.copy(intersect.point.sub(OFFSET));
            DRAG_OBJECT.mesh.position.z = 0;
            DRAG_OBJECT.updateEdges();
        }
        else if (DRAG_OBJECT instanceof Node) {
            // dragging off the scope
            intersects = SCENE.raycaster.intersectObject(DRAG_OBJECT.parent.parent.mesh);
            if (intersects.length > 0) {
                let intersect = intersects[0];

                DRAG_OBJECT.mesh.position.copy(intersect.point.sub(OFFSET));
                DRAG_OBJECT.mesh.position.z = 0;
                x = DRAG_OBJECT.mesh.position.x;
                y = DRAG_OBJECT.mesh.position.y;

                let top = 0, bottom = 0, right = 0, left = 0;
                if (x > DRAG_OBJECT.parent.width / 2) right = x - DRAG_OBJECT.parent.width / 2;
                else if (-x > DRAG_OBJECT.parent.width / 2) left = -x - DRAG_OBJECT.parent.width / 2;
                if (y > DRAG_OBJECT.parent.height / 2) top = y - DRAG_OBJECT.parent.height / 2;
                else if (-y > DRAG_OBJECT.parent.height / 2) bottom = -y - DRAG_OBJECT.parent.height / 2;

                OFFSET.x += (right - left) / 2;
                OFFSET.y += (top - bottom) / 2;
                DRAG_OBJECT.parent.extend(top, right, bottom, left);
                DRAG_OBJECT.updateEdges();
            }
        }
    }
}

function up() {
    if (DRAG_OBJECT) DRAG_OBJECT.drag_coordinates = null;
    DRAG_OBJECT = null;
    SCENE.controls.enabled = true;
    SCENE.container.style.cursor = 'default';
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
    up();
}
function onTouchCancel(event) {
    event.preventDefault();
    up();
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
function onMouseScroll(event) {}

function updateForces() {
    let node_constant = 10000;
    let scope_constant = 100000;
    let edge_constant = 0.1;
    let max_force = 100;
    let min_force = 1;
    let extension_threshold = 1;
    if (SCENE.children.Plane) for (let a = 0; a < SCENE.children.Plane.length; a++) {
        let plane = SCENE.children.Plane[a];
        if (plane.children.Scope) for (let b = 0; b < plane.children.Scope.length; b++) {
            let scope = plane.children.Scope[b];
            let scope_force = new THREE.Vector2(0, 0);

            if (scope.children.Node) for (let c = 0; c < scope.children.Node.length; c++) {
                let node = scope.children.Node[c];
                if (node != DRAG_OBJECT) {
                    // node repellent
                    let node_force = new THREE.Vector2(0, 0);

                    for (let d = 0; d < scope.children.Node.length; d++) if (c != d) {
                        let sibling = scope.children.Node[d];
                        let force = new THREE.Vector2().subVectors(node.position, sibling.position);
                        let length = force.lengthSq();
                        if (length < 0.001) force.x = 1;
                        if (length < 1) length = 1;
                        force.setLength(node_constant).divideScalar(length);
                        node_force.add(force);
                    }

                    // edge spring
                    if (node.children.Arg) for (let d = 0; d < node.children.Arg.length; d++) {
                        let arg = node.children.Arg[d];
                        if (arg.edge && arg.edge.parent == node.parent) {
                            let sibling_arg = arg.edge.end == arg ? arg.edge.start : arg.edge.end;
                            let sibling = sibling_arg.parent;
                            let force = new THREE.Vector2().subVectors(sibling.position.clone().add(sibling_arg.position), node.position.clone().add(arg.position));
                            node_force.add(force.multiplyScalar(edge_constant));
                        }
                    }

                    if (node_force.length() > max_force) node_force.setLength(max_force);
                    if (node_force.length() > min_force) {
                        let new_x = node.mesh.position.x + node_force.x;
                        let new_y = node.mesh.position.y + node_force.y;
                        let border_x = node.parent.width / 2;
                        let border_y = node.parent.height / 2;


                        if (new_x > border_x) {
                            // right overflow
                            let overflow = new_x - border_x;
                            if (overflow > extension_threshold) {
                                node.parent.extend(0, overflow, 0, 0);
                                node.mesh.position.x = new_x;
                                if (DRAG_OBJECT) OFFSET.x += overflow / 2;
                            }
                        }
                        else if (new_x < -border_x) {
                            let overflow = -border_x - new_x;
                            if (overflow > extension_threshold) {
                                node.parent.extend(0, 0, 0, overflow);
                                node.mesh.position.x = new_x;
                                if (DRAG_OBJECT) OFFSET.x -= overflow / 2;
                            }
                            // left overflow
                        }
                        else node.mesh.position.x = new_x;
                        if (new_y > border_y) {
                            // top overflow
                            let overflow = new_y - border_y;
                            if (overflow > extension_threshold) {
                                node.parent.extend(overflow, 0, 0, 0);
                                node.mesh.position.y = new_y;
                                if (DRAG_OBJECT) OFFSET.y += overflow / 2;
                            }
                        }
                        else if (new_y < -border_y) {
                            // bottom overflow
                            let overflow = -border_y - new_y;
                            if (overflow > extension_threshold) {
                                node.parent.extend(0, 0, overflow, 0);
                                node.mesh.position.y = new_y;
                                if (DRAG_OBJECT) OFFSET.y -= overflow / 2;
                            }
                        }
                        else node.mesh.position.y = new_y;

                        node.updateEdges();
                    }
                }
            }

            // scope repellent
            if (scope != DRAG_OBJECT)  for (let c = 0; c < plane.children.Scope.length; c++) if (b != c) {
                let sibling = plane.children.Scope[c];
                let force = new THREE.Vector2().subVectors(scope.position, sibling.position);
                let length = force.lengthSq();
                if (length < 0.001) force.x = 10;
                if (length < 10) length = 10;
                force.setLength(scope_constant).divideScalar(length);
                scope_force.add(force);
            }

            if (scope_force.length() > max_force) scope_force.setLength(max_force);
            if (scope_force.length() > min_force) {
                scope.mesh.position.x += scope_force.x;
                scope.mesh.position.y += scope_force.y;

                scope.updateEdges();
            }
        }
    }
}

function render() {
    updateForces();
    requestAnimationFrame(render);
    SCENE.controls.update();
    SCENE.renderer.render(SCENE.mesh, SCENE.camera);
}

var SCENE = new Scene();

render();

var PLANE = SCENE.add(new Plane());
var SCOPE = PLANE.add(new Scope(0));
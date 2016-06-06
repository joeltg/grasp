"use strict";

const MOUSE = new THREE.Vector3(0, 0, 0), OFFSET = new THREE.Vector2(0, 0);
const LEVEL_SPACING = 256, ARG_ELEVATION = 1, ARG_SPACING = 20, INPUT_RADIUS = 5, OUTPUT_RADIUS = 5;
let DRAG_OBJECT;

// const LABELS = document.getElementById('labels').checked;
const LABELS = true;

const COLORS = {
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
        for (let proto = object.__proto__, first = true; proto; proto = proto.__proto__, first = false) {
            const type = proto.constructor.name;
            if (this.children[type]) {
                if (first) {
                    local_index = local_index || this.children[type].length;
                    this.children[type].splice(local_index, 0, object);
                    this.children[type].forEach((child, index) => child.local_index = index);
                }
                else this.children[type].push(object);
            }
            else {
                this.children[type] = [object];
                if (first) object.local_index = 0;
            }
            object.mesh.traverseAncestors(mesh => {
                if (mesh.object.meshes[type]) mesh.object.meshes[type].push(object.mesh);
                else mesh.object.meshes[type] = [object.mesh];
            });
        }
        object.mesh.traverseAncestors(mesh => {
            for (let type in object.meshes) if (object.meshes.hasOwnProperty(type)) {
                //if (mesh.object.meshes[type]) mesh.object.meshes[type] = [...object.meshes[type]];
                if (mesh.object.meshes[type])
                    mesh.object.meshes[type] = mesh.object.meshes[type].concat(object.meshes[type]);
                else
                    mesh.object.meshes[type] = object.meshes[type].slice();
            }
        });
        return object;
    }
    remove() {
        // remove children
        for (let type in this.children) if (this.children.hasOwnProperty(type))
            this.children[type].forEach(object => object.remove());
        for (let proto = this.__proto__; proto; proto = proto.__proto__) {
            const type = proto.constructor.name;
            // update parent's .children[type] list
            const siblings = this.parent.children[type];
            siblings.splice(this.local_index, 1);
            // update siblings' indices
            siblings.forEach((sibling, index) => sibling.local_index = index);
            // update all ancestor's .meshes[type] lists
            const m = this.mesh;
            this.mesh.traverseAncestors(mesh => {
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
        const position = new THREE.Vector3(0, 0, 0);
        for (let current = this; current; current = current.parent)
            position.add(current.position);
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
        this.width = getWidth();
        this.height = getHeight();
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
        window.addEventListener('resize', () => {
            scene.width = getWidth();
            scene.height = getHeight();
            scene.camera.aspect = scene.width / scene.height;
            scene.camera.updateProjectionMatrix();
            scene.renderer.setSize(scene.width, scene.height);
        }, false);

        attachListeners(this.container);


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
        const newPlane = this.add(new Plane(), index);
        this.children.Plane.forEach(plane => plane.setPosition(0, 0, LEVEL_SPACING * plane.local_index));
        return newPlane;
    }
    addEdge(start, end) {
        const edge = this.add(new Edge(start, end));
        start.parent.parent.edges.push(edge);
        end.parent.parent.edges.push(edge);
        return edge;
    }
}

class Plane extends GRASPObject {
    constructor(width, height) {
        width = width || 1000;
        height = height || 1000;
        const geometry = new THREE.PlaneGeometry(width, height, 1, 1);
        geometry.dynamic = true;
        const material =  new THREE.MeshBasicMaterial({visible: false});

        super(geometry, material);
        //this.type = 'Plane';
        this.width = width;
        this.height = height;
        return this;
    }
    setSize(width, height) {
        const g = this.mesh.geometry;
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
        const shiftX = (left - right) / 2;
        const shiftY = (bottom - top) / 2;
        this.mesh.children.forEach(child => {
            child.position.x += shiftX;
            child.position.y += shiftY;
        });
    }
}

class Scope extends GRASPObject {
    constructor(level, width, height) {
        level = level || 0;
        width = width || 200;
        height = height || 200;
        const points = [
            new THREE.Vector2(- 0.5 * width, - 0.5 * height),
            new THREE.Vector2(- 0.5 * width, 0.5 * height),
            new THREE.Vector2(0.5 * width, 0.5 * height),
            new THREE.Vector2(0.5 * width, - 0.5 * height)
        ];
        const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), {amount: 1, bevelEnabled: false, steps: 1});
        geometry.dynamic = true;
        const material = new THREE.MeshPhongMaterial({
            color: COLORS.white,
            shading: THREE.FlatShading,
            transparent: true,
            opacity: 0.5
        });
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
        const g = this.mesh.geometry;
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
        const shiftX = (left - right) / 2;
        const shiftY = (bottom - top) / 2;
        this.mesh.children.forEach(child => {
            child.position.x += shiftX;
            child.position.y += shiftY;
        });
    }
    addScope() {
        const plane = this.parent;
        if (plane) {
            const level = plane.local_index;
            if (level === this.level) {
                const new_plane = SCENE.children.Plane[level + 1] || SCENE.addPlane();
                const new_scope = new_plane.add(new Scope(level + 1));
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
        this.edges.forEach(edge => edge.update());
    }
    findBinding(label) {
        for (let scope = this; scope; scope = scope.parent_scope)
            if (scope.scope[label]) return scope.scope[label];
        return null;
    }
    addVariable(name, show_label) {
        const variable = this.add(new Variable(name, show_label));
        this.scope[name] = variable;
        return variable;
    }
    addForm(name) {
        const form = this.add(new Form());
        if (name) form.addInput(name, COLORS.blue);
        return form;
    }
}

class Node extends GRASPObject {
    constructor() {
        const width = 20;
        const height = 25;
        const points = [
            new THREE.Vector2(- 0.5 * width, - 0.5 * height),
            new THREE.Vector2(- 0.5 * width, 0.5 * height),
            new THREE.Vector2(0.5 * width, 0.5 * height),
            new THREE.Vector2(0.5 * width, - 0.5 * height)
        ];
        const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), {amount: 5, bevelEnabled: false, steps: 1});
        geometry.dynamic = true;
        const material = new THREE.MeshPhongMaterial({shading: THREE.FlatShading});
        super(geometry, material);
        //this.type = 'Node';
        this.width = width;
        this.height = height;
        return this;
    }
    setSize(width, height) {
        const g = this.mesh.geometry;
        g.vertices.forEach(vertex => {
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
        if (this.children.Input) this.children.Input.forEach(input => { if (input.edge) input.edge.update(); });
        if (this.children.Output) this.children.Output.forEach(output => { if (output.edge) output.edge.update(); });
    }
    addInput(label, color, radius, index) {
        radius = radius || INPUT_RADIUS;
        const scope = this.parent;
        let input;
        if (label && scope) {
            const value = scope.findBinding(label);
            if (value) {
                let real_label = null;
                if (LABELS) real_label = label;
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
        const output = new Output();
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
            this.children.Input.slice(1).forEach(input => input_width += input.width + ARG_SPACING + input.radius);
            const first = this.children.Input[0];
            const width = Math.max(this.height, first.width + ARG_SPACING, input_width);
            // position function reference
            first.setPosition(-width / 2, 0, ARG_ELEVATION);
            // position function args
            let position = - (width / 2) - INPUT_RADIUS;
            this.children.Input.slice(1).forEach(input => {
                input.setPosition(position + ((ARG_SPACING + input.radius) / 2), this.height / 2, ARG_ELEVATION);
                position += ARG_SPACING + input.width + input.radius;
            });
            this.setSize(width, this.height);
        }
        else console.error('form has no inputs');
        // position return output if it exists
        if (this.children.Output && this.children.Output.length > 1)
            this.children.Output[1].setPosition(this.width / 2, 0, ARG_ELEVATION);
        this.updateEdges();
    }
}

class Variable extends Node {
    constructor(name, show_label) {
        super();
        //this.type = 'Variable';
        this.setColor(COLORS.blue);
        this.name = name;
        if (show_label) this.label = this.add(new Text(name, 10, 5.1));
        else this.label = null;
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
        const text_width = this.label ? this.label.width : 0;
        let input_width = 0;
        if (this.children.Input)
            this.children.Input.forEach(input => input_width += input.width + ARG_SPACING);
        const output_length = this.children.Output ? this.children.Output.length : 0;
        const output_width = ARG_SPACING * output_length;
        const width = Math.max(this.height, output_width, input_width, text_width);
        let position = - width / 2;
        // position variable inputs
        if (this.children.Input)
            this.children.Input.forEach(input => {
                input.setPosition(position + (ARG_SPACING / 2), this.height / 2, ARG_ELEVATION);
                if (input.edge) input.edge.update();
                position += ARG_SPACING + input.width;
            });
        const output_spacing = width / output_length;
        // position variable outputs
        if (this.children.Output)
            this.children.Output.forEach((output, i) => {
                output.setPosition(
                    (i * output_spacing) - (width / 2) + (output_spacing / 2),
                    - this.height / 2,
                    ARG_ELEVATION
                );
                if (output.edge) output.edge.update();
            });
        this.setSize(width, this.height);
        this.updateEdges();
    }
}

class Edge extends GRASPObject {
    constructor(start, end, color) {
        color = color || COLORS.green;
        const getCurve = THREE.Curve.create(function () { }, t => new THREE.Vector3(0, t, 0));
        const geometry = new THREE.TubeGeometry(new getCurve(), 8, 2, 8, true);
        const material = new THREE.MeshPhongMaterial({shading: THREE.FlatShading, color: color});
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
            const yaxis = new THREE.Vector3(0, 1, 0);
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
        const geometry = new THREE.SphereGeometry(radius);
        const material = new THREE.MeshPhongMaterial({shading: THREE.FlatShading});
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
        const text = new Text(name, height - 2, 4.2);

        const w = text.width + height;
        const h = height || 10;
        const shape = new THREE.Shape();

        shape.moveTo(0, h / 2);
        shape.lineTo(w, h / 2);
        shape.absarc(w, 0, h / 2, 5 * Math.PI / 2.0, 3 * Math.PI / 2.0, true);
        shape.lineTo(0, - h / 2);
        shape.lineTo(0, h / 2);

        const settings = {amount: 4.1, bevelEnabled: false, steps: 1};
        const geometry = new THREE.ExtrudeGeometry( shape, settings );

        geometry.dynamic = true;

        const material = new THREE.MeshPhongMaterial({color: COLORS.blue, shading: THREE.FlatShading});
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
        const geometry = new THREE.TextGeometry(text, {font: "droid sans mono", height: height, size: size, style: "normal"});
        geometry.computeBoundingBox();
        const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(- width / 2, - size / 2, 0));
        geometry.dynamic = true;
        geometry.verticesNeedUpdate = true;
        const material = new THREE.MeshPhongMaterial({color: COLORS.white, shading: THREE.FlatShading});
        super(geometry, material);
        //this.type = 'Text';
        this.width = width;
        this.text = text;
        return this;
    }
}

function render() {
    updateForces();
    requestAnimationFrame(render);
    SCENE.controls.update();
    SCENE.renderer.render(SCENE.mesh, SCENE.camera);
}

const SCENE = new Scene();

render();

let PLANE = SCENE.add(new Plane());
let SCOPE = PLANE.add(new Scope(0));
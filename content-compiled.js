"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MOUSE = new THREE.Vector3(0, 0, 0),
    OFFSET = new THREE.Vector2(0, 0);
var EDITOR_WIDTH = 400 + 3,
    NAVBAR_HEIGHT = 64 + 3;
var LEVEL_SPACING = 256,
    ARG_ELEVATION = 1,
    ARG_SPACING = 20,
    INPUT_RADIUS = 5,
    OUTPUT_RADIUS = 5;
var DRAG_OBJECT;

var COLORS = {
    green: 0x119955,
    white: 0xffffff,
    blue: 0x113355,
    highlight: 0xffff00
};

var GRASPObject = (function () {
    function GRASPObject(geometry, material) {
        _classCallCheck(this, GRASPObject);

        this.local_index = null;
        this.meshes = {};
        this.children = {};
        if (geometry && material) {
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.object = this;
        }
        this.parent = null;
    }

    _createClass(GRASPObject, [{
        key: 'add',
        value: function add(object, local_index) {
            var _this = this;

            this.mesh.add(object.mesh);
            object.parent = this;
            var first = true;

            var _loop = function _loop(proto) {
                var type = proto.constructor.name;
                if (_this.children[type]) {
                    if (first) {
                        local_index = local_index || _this.children[type].length;
                        _this.children[type].splice(local_index, 0, object);
                        for (var j = local_index; j < _this.children[type].length; j++) {
                            _this.children[type][j].local_index = j;
                        }
                    } else _this.children[type].push(object);
                } else {
                    _this.children[type] = [object];
                    if (first) object.local_index = 0;
                }
                object.mesh.traverseAncestors(function (mesh) {
                    if (mesh.object.meshes[type]) mesh.object.meshes[type].push(object.mesh);else mesh.object.meshes[type] = [object.mesh];
                });
                first = false;
            };

            for (var proto = object.__proto__; proto; proto = proto.__proto__) {
                _loop(proto);
            }
            object.mesh.traverseAncestors(function (mesh) {
                for (var _type in object.meshes) {
                    if (object.meshes.hasOwnProperty(_type)) {
                        //if (mesh.object.meshes[type]) mesh.object.meshes[type] = [...object.meshes[type]];
                        if (mesh.object.meshes[_type]) mesh.object.meshes[_type] = mesh.object.meshes[_type].concat(object.meshes[_type]);else mesh.object.meshes[_type] = object.meshes[_type].slice();
                    }
                }
            });
            return object;
        }
    }, {
        key: 'remove',
        value: function remove() {
            var _this2 = this;

            // remove children
            for (var _type2 in this.children) {
                if (this.children.hasOwnProperty(_type2)) this.children[_type2].forEach(function (object) {
                    object.remove();
                });
            }
            var _loop2 = function _loop2(proto) {
                var type = proto.constructor.name;
                // update parent's .children[type] list
                var siblings = _this2.parent.children[type];
                siblings.splice(_this2.local_index, 1);
                // update siblings' indices
                for (var j = _this2.local_index; j < siblings.length; j++) {
                    siblings[j].local_index = j;
                } // update all ancestor's .meshes[type] lists
                var m = _this2.mesh;
                _this2.mesh.traverseAncestors(function (mesh) {
                    var index = mesh.object.meshes[type].indexOf(m);
                    if (index > -1) mesh.object.meshes[type].splice(index, 1);
                });
            };

            for (var proto = this.__proto__; proto; proto = proto.__proto__) {
                _loop2(proto);
            }
            // remove self
            this.mesh.geometry.dispose();
            if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
            // return parent for easy chaining
            return this.parent;
        }
    }, {
        key: 'getAbsolutePosition',
        value: function getAbsolutePosition() {
            var position = new THREE.Vector3(0, 0, 0);
            var current = this;
            while (current.parent) {
                position.add(current.position);
                current = current.parent;
            }
            return position;
        }
    }, {
        key: 'setColor',
        value: function setColor(hex) {
            this.mesh.material.color.setHex(hex);
        }
    }, {
        key: 'setPosition',
        value: function setPosition(x, y, z) {
            this.mesh.position.set(x, y, z);
        }
    }, {
        key: 'position',
        set: function set(v) {
            this.setPosition(v.x, v.y, v.z);
        },
        get: function get() {
            return this.mesh.position;
        }
    }, {
        key: 'type',
        get: function get() {
            return this.constructor.name;
        }
    }]);

    return GRASPObject;
})();

var Scene = (function (_GRASPObject) {
    _inherits(Scene, _GRASPObject);

    function Scene() {
        var _ret3;

        _classCallCheck(this, Scene);

        //this.type = 'Scene';

        var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(Scene).call(this));

        _this3.mesh = new THREE.Scene();
        _this3.mesh.object = _this3;
        _this3.mesh.fog = new THREE.FogExp2(0xcccccc, 0.001);
        _this3.renderer = new THREE.WebGLRenderer();
        _this3.renderer.setClearColor(_this3.mesh.fog.color);
        _this3.width = window.innerWidth - EDITOR_WIDTH;
        _this3.height = window.innerHeight - NAVBAR_HEIGHT;
        _this3.renderer.setSize(_this3.width, _this3.height);
        _this3.renderer.setPixelRatio(_this3.width / _this3.height);
        _this3.container = document.getElementById('content');
        _this3.container.appendChild(_this3.renderer.domElement);
        _this3.camera = new THREE.PerspectiveCamera(60, _this3.width / _this3.height, 50, 10000);
        _this3.camera.position.z = 500;

        _this3.controls = new THREE.TrackballControls(_this3.camera);
        _this3.controls.noZoom = false;
        _this3.controls.noPan = false;

        _this3.raycaster = new THREE.Raycaster();

        var scene = _this3;

        // mouse and resize listeners
        window.addEventListener('resize', function () {
            scene.width = window.innerWidth - EDITOR_WIDTH;
            scene.height = window.innerHeight - NAVBAR_HEIGHT;
            scene.camera.aspect = scene.width / scene.height;
            scene.camera.updateProjectionMatrix();
            scene.renderer.setSize(scene.width, scene.height);
        }, false);
        _this3.container.addEventListener("touchstart", onTouchStart, false);
        _this3.container.addEventListener("touchend", onTouchEnd, false);
        _this3.container.addEventListener("touchcancel", onTouchCancel, false);
        _this3.container.addEventListener("touchmove", onTouchMove, false);
        _this3.container.addEventListener('mouseup', onMouseUp, false);
        _this3.container.addEventListener('mousemove', onMouseMove, false);
        _this3.container.addEventListener('mousedown', onMouseDown, false);
        _this3.container.addEventListener('mousewheel', onMouseScroll, false);

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
        _this3.mesh.add(light);
        return _ret3 = _this3, _possibleConstructorReturn(_this3, _ret3);
    }

    _createClass(Scene, [{
        key: 'remove',
        value: function remove() {
            // remove everything
            while (this.mesh.children.length > 1) {
                this.mesh.children[this.mesh.children.length - 1].object.remove();
            }delete this.meshes;
            this.meshes = [];
            delete this.children;
            this.children = [];
        }
    }, {
        key: 'addPlane',
        value: function addPlane(index) {
            var plane = this.add(new Plane(), index);
            this.children.Plane.forEach(function (plane) {
                plane.setPosition(0, 0, LEVEL_SPACING * plane.local_index);
            });
            return plane;
        }
    }, {
        key: 'addEdge',
        value: function addEdge(start, end) {
            var edge = this.add(new Edge(start, end));
            start.parent.parent.edges.push(edge);
            end.parent.parent.edges.push(edge);
            return edge;
        }
    }]);

    return Scene;
})(GRASPObject);

var Plane = (function (_GRASPObject2) {
    _inherits(Plane, _GRASPObject2);

    function Plane(width, height) {
        var _ret4;

        _classCallCheck(this, Plane);

        width = width || 1000;
        height = height || 1000;
        var geometry = new THREE.PlaneGeometry(width, height, 1, 1);
        geometry.dynamic = true;
        var material = new THREE.MeshBasicMaterial({ visible: false });

        //this.type = 'Plane';

        var _this4 = _possibleConstructorReturn(this, Object.getPrototypeOf(Plane).call(this, geometry, material));

        _this4.width = width;
        _this4.height = height;
        return _ret4 = _this4, _possibleConstructorReturn(_this4, _ret4);
    }

    _createClass(Plane, [{
        key: 'setSize',
        value: function setSize(width, height) {
            var g = this.mesh.geometry;
            geometry.vertices.forEach(function (vertex) {
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
    }, {
        key: 'extend',
        value: function extend(top, right, bottom, left) {
            this.setSize(this.width + left + right, this.height + top + bottom);
            for (var i = 0; i < this.mesh.children.length; i++) {
                var child = this.mesh.children[i];
                var shiftX = (left - right) / 2;
                var shiftY = (bottom - top) / 2;
                child.position.x += shiftX;
                child.position.y += shiftY;
            }
        }
    }]);

    return Plane;
})(GRASPObject);

var Scope = (function (_GRASPObject3) {
    _inherits(Scope, _GRASPObject3);

    function Scope(level, width, height) {
        var _ret5;

        _classCallCheck(this, Scope);

        level = level || 0;
        width = width || 200;
        height = height || 200;
        var points = [new THREE.Vector2(-0.5 * width, -0.5 * height), new THREE.Vector2(-0.5 * width, 0.5 * height), new THREE.Vector2(0.5 * width, 0.5 * height), new THREE.Vector2(0.5 * width, -0.5 * height)];
        var geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), { amount: 1, bevelEnabled: false, steps: 1 });
        geometry.dynamic = true;
        var material = new THREE.MeshPhongMaterial({ color: COLORS.white, shading: THREE.FlatShading, transparent: true, opacity: 0.5 });

        //this.type = 'Scope';

        var _this5 = _possibleConstructorReturn(this, Object.getPrototypeOf(Scope).call(this, geometry, material));

        _this5.width = width;
        _this5.height = height;
        _this5.level = level;
        _this5.setSize(200, 200);
        _this5.scope = {};
        _this5.parent_scope = null;
        _this5.edges = [];
        return _ret5 = _this5, _possibleConstructorReturn(_this5, _ret5);
    }

    _createClass(Scope, [{
        key: 'setSize',
        value: function setSize(width, height) {
            var g = this.mesh.geometry;
            g.vertices.forEach(function (vertex) {
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
    }, {
        key: 'extend',
        value: function extend(top, right, bottom, left) {
            this.setSize(this.width + left + right, this.height + top + bottom);
            var position = this.position;
            this.setPosition(position.x + (right - left) / 2, position.y + (top - bottom) / 2, 0);
            for (var i = 0; i < this.mesh.children.length; i++) {
                var child = this.mesh.children[i];
                var shiftX = (left - right) / 2;
                var shiftY = (bottom - top) / 2;
                child.position.x += shiftX;
                child.position.y += shiftY;
            }
        }
    }, {
        key: 'addScope',
        value: function addScope() {
            var plane = this.parent;
            if (plane) {
                var level = plane.local_index;
                if (level == this.level) {
                    var new_plane = SCENE.children.Plane[level + 1] || SCENE.addPlane();
                    var new_scope = new_plane.add(new Scope(level + 1));
                    new_scope.parent_scope = this;
                    return new_scope;
                } else console.error('levels don\'t match', level, this.level);
            } else console.error('scope does not have parent');
        }
    }, {
        key: 'addEdge',
        value: function addEdge(start, end) {
            return this.add(new Edge(start, end));
        }
    }, {
        key: 'updateEdges',
        value: function updateEdges() {
            for (var i = 0; i < this.edges.length; i++) {
                this.edges[i].update();
            }
        }
    }, {
        key: 'findBinding',
        value: function findBinding(label) {
            for (var scope = this; scope; scope = scope.parent_scope) {
                if (scope.scope[label]) return scope.scope[label];
            }return null;
        }
    }, {
        key: 'addVariable',
        value: function addVariable(name, hide_label) {
            var variable = this.add(new Variable(name, hide_label));
            this.scope[name] = variable;
            return variable;
        }
    }, {
        key: 'addForm',
        value: function addForm(name) {
            var form = this.add(new Form());
            if (name) form.addInput(name, COLORS.blue);
            return form;
        }
    }]);

    return Scope;
})(GRASPObject);

var Node = (function (_GRASPObject4) {
    _inherits(Node, _GRASPObject4);

    function Node() {
        var _ret6;

        _classCallCheck(this, Node);

        var width = 20;
        var height = 25;
        var points = [new THREE.Vector2(-0.5 * width, -0.5 * height), new THREE.Vector2(-0.5 * width, 0.5 * height), new THREE.Vector2(0.5 * width, 0.5 * height), new THREE.Vector2(0.5 * width, -0.5 * height)];
        var geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), { amount: 5, bevelEnabled: false, steps: 1 });
        geometry.dynamic = true;
        var material = new THREE.MeshPhongMaterial({ shading: THREE.FlatShading });

        //this.type = 'Node';

        var _this6 = _possibleConstructorReturn(this, Object.getPrototypeOf(Node).call(this, geometry, material));

        _this6.width = width;
        _this6.height = height;
        return _ret6 = _this6, _possibleConstructorReturn(_this6, _ret6);
    }

    _createClass(Node, [{
        key: 'setSize',
        value: function setSize(width, height) {
            var g = this.mesh.geometry;
            g.vertices.forEach(function (vertex) {
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
    }, {
        key: 'updateEdges',
        value: function updateEdges() {
            if (this.children.Input) this.children.Input.forEach(function (input) {
                if (input.edge) input.edge.update();
            });
            if (this.children.Output) this.children.Output.forEach(function (output) {
                if (output.edge) output.edge.update();
            });
        }
    }, {
        key: 'addInput',
        value: function addInput(label, color, radius, index) {
            radius = radius || INPUT_RADIUS;
            var scope = this.parent;
            var input = undefined;
            if (label && scope) {
                var value = scope.findBinding(label);
                if (value) {
                    var real_label = null;
                    if (document.getElementById('labels').checked) real_label = label;
                    input = this.add(new Input(real_label, color, radius), index);
                    if (scope.scope[label]) scope.addEdge(value.addOutput(), input, COLORS.blue).update();else SCENE.addEdge(value.addOutput(), input, COLORS.blue).update();
                } else input = this.add(new Input(label, color, radius), index);
            } else input = this.add(new Input(null, color, radius), index);
            if (this.updateSize) this.updateSize();
            return input;
        }
    }, {
        key: 'addOutput',
        value: function addOutput(index) {
            var output = new Output();
            this.add(output, index);
            if (this.updateSize) this.updateSize();
            if (this.type == 'Variable') output.setColor(COLORS.blue);
            return output;
        }
    }]);

    return Node;
})(GRASPObject);

var Form = (function (_Node) {
    _inherits(Form, _Node);

    function Form() {
        var _ret7;

        _classCallCheck(this, Form);

        //this.type = 'Form';

        var _this7 = _possibleConstructorReturn(this, Object.getPrototypeOf(Form).call(this));

        _this7.setColor(COLORS.green);
        _this7.output = _this7.add(new Output());
        _this7.output.setPosition(0, -_this7.height / 2, ARG_ELEVATION);
        return _ret7 = _this7, _possibleConstructorReturn(_this7, _ret7);
    }

    _createClass(Form, [{
        key: 'updateSize',
        value: function updateSize() {
            if (this.children.Input) {
                var input_width = 0;
                var length = this.children.Input.length;
                for (var i = 1; i < length; i++) {
                    input_width += this.children.Input[i].width + ARG_SPACING + this.children.Input[i].radius;
                }var first = this.children.Input[0];
                var width = Math.max(this.height, first.width + ARG_SPACING, input_width);
                // position function reference
                first.setPosition(-width / 2, 0, ARG_ELEVATION);
                // position function args
                var position = -(width / 2) - INPUT_RADIUS;
                for (var i = 1; i < length; i++) {
                    var input = this.children.Input[i];
                    input.setPosition(position + (ARG_SPACING + input.radius) / 2, this.height / 2, ARG_ELEVATION);
                    position += ARG_SPACING + input.width + input.radius;
                }
                this.setSize(width, this.height);
            } else console.error('form has no inputs');
            // position return output if it exists
            if (this.children.Output && this.children.Output.length > 1) this.children.Output[1].setPosition(this.width / 2, 0, ARG_ELEVATION);
            this.updateEdges();
        }
    }]);

    return Form;
})(Node);

var Variable = (function (_Node2) {
    _inherits(Variable, _Node2);

    function Variable(name, hide_label) {
        var _ret8;

        _classCallCheck(this, Variable);

        //this.type = 'Variable';

        var _this8 = _possibleConstructorReturn(this, Object.getPrototypeOf(Variable).call(this));

        _this8.setColor(COLORS.blue);
        _this8.name = name;
        if (hide_label) _this8.label = null;else _this8.label = _this8.add(new Text(name, 10, 5.1));
        _this8.updateSize();
        return _ret8 = _this8, _possibleConstructorReturn(_this8, _ret8);
    }

    _createClass(Variable, [{
        key: 'setName',
        value: function setName(name) {
            if (this.parent && this.parent.scope) {
                this.parent.scope[this.name] = null;
                this.parent.scope[name] = this;
            }
            this.label.remove();
            this.label = this.add(new Text(name));
            this.name = name;
            this.updateSize();
        }
    }, {
        key: 'updateSize',
        value: function updateSize() {
            var text_width = this.label ? this.label.width : 0;
            var input_width = 0;
            if (this.children.Input) for (var i = 0; i < this.children.Input.length; i++) {
                input_width += this.children.Input[i].width + ARG_SPACING;
            }var output_length = this.children.Output ? this.children.Output.length : 0;
            var output_width = ARG_SPACING * output_length;
            var width = Math.max(this.height, output_width, input_width, text_width);
            var position = -width / 2;
            // position variable inputs
            if (this.children.Input) for (var i = 0; i < this.children.Input.length; i++) {
                var input = this.children.Input[i];
                input.setPosition(position + ARG_SPACING / 2, this.height / 2, ARG_ELEVATION);
                if (input.edge) input.edge.update();
                position += ARG_SPACING + input.width;
            }
            var output_spacing = width / output_length;
            // position variable outputs
            if (this.children.Output) for (var i = 0; i < this.children.Output.length; i++) {
                var output = this.children.Output[i];
                output.setPosition(i * output_spacing - width / 2 + output_spacing / 2, -this.height / 2, ARG_ELEVATION);
                if (output.edge) output.edge.update();
            }
            this.setSize(width, this.height);
            this.updateEdges();
        }
    }]);

    return Variable;
})(Node);

var Edge = (function (_GRASPObject5) {
    _inherits(Edge, _GRASPObject5);

    function Edge(start, end, color) {
        var _ret9;

        _classCallCheck(this, Edge);

        color = color || COLORS.green;
        var getCurve = THREE.Curve.create(function () {}, function (t) {
            return new THREE.Vector3(0, t, 0);
        });
        var geometry = new THREE.TubeGeometry(new getCurve(), 8, 2, 8, true);
        var material = new THREE.MeshPhongMaterial({ shading: THREE.FlatShading, color: color });

        //this.type = 'Edge';

        var _this9 = _possibleConstructorReturn(this, Object.getPrototypeOf(Edge).call(this, geometry, material));

        if (start.edge) console.error('start.edge already exists');
        if (end.edge) console.error('end.edge already exists');
        _this9.start = start;
        _this9.end = end;
        start.edge = _this9;
        end.edge = _this9;
        _this9.update();
        return _ret9 = _this9, _possibleConstructorReturn(_this9, _ret9);
    }

    _createClass(Edge, [{
        key: 'update',
        value: function update() {
            var direction = undefined,
                length = undefined,
                start = undefined,
                end = undefined,
                axis = undefined,
                angle = undefined;
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
                var yaxis = new THREE.Vector3(0, 1, 0);
                axis = new THREE.Vector3().subVectors(end, start);
                angle = yaxis.angleTo(axis);
                axis.cross(yaxis).normalize();
                this.mesh.rotateOnAxis(axis, -angle);
            } else {
                start = new THREE.Vector3().addVectors(this.start.position, this.start.parent.position);
                end = new THREE.Vector3().addVectors(this.end.position, this.end.parent.position);
                direction = new THREE.Vector3().subVectors(end, start);
                length = start.distanceTo(end);
                this.length = length;
                this.direction = direction;
                this.setPosition(start.x, start.y, start.z);
                this.mesh.rotation.z = 0;
                this.mesh.scale.set(1, length * 1.15, 1);
                this.mesh.rotation.z = (start.x > end.x ? 1 : -1) * this.mesh.up.angleTo(direction);
            }
        }
    }]);

    return Edge;
})(GRASPObject);

var Arg = (function (_GRASPObject6) {
    _inherits(Arg, _GRASPObject6);

    function Arg(radius) {
        var _ret10;

        _classCallCheck(this, Arg);

        var geometry = new THREE.SphereGeometry(radius);
        var material = new THREE.MeshPhongMaterial({ shading: THREE.FlatShading });

        //this.type = 'Arg';

        var _this10 = _possibleConstructorReturn(this, Object.getPrototypeOf(Arg).call(this, geometry, material));

        _this10.radius = radius;
        _this10.edge = null;
        _this10.width = 0;
        return _ret10 = _this10, _possibleConstructorReturn(_this10, _ret10);
    }

    return Arg;
})(GRASPObject);

var Input = (function (_Arg) {
    _inherits(Input, _Arg);

    function Input(label, color, radius) {
        var _ret11;

        _classCallCheck(this, Input);

        radius = radius || INPUT_RADIUS;

        //this.type = 'Input';

        var _this11 = _possibleConstructorReturn(this, Object.getPrototypeOf(Input).call(this, radius));

        color = color || COLORS.white;
        _this11.setColor(color);
        _this11.label_text = label;
        _this11.label = null;
        _this11.width = 0;
        if (label) {
            _this11.label = _this11.add(new Label(label, 2 * radius));
            _this11.width = _this11.label.width;
        }
        return _ret11 = _this11, _possibleConstructorReturn(_this11, _ret11);
    }

    return Input;
})(Arg);

var Output = (function (_Arg2) {
    _inherits(Output, _Arg2);

    function Output(radius, color) {
        var _ret12;

        _classCallCheck(this, Output);

        radius = radius || OUTPUT_RADIUS;

        //this.type = 'Output';

        var _this12 = _possibleConstructorReturn(this, Object.getPrototypeOf(Output).call(this, radius));

        color = color || COLORS.green;
        _this12.setColor(color);
        return _ret12 = _this12, _possibleConstructorReturn(_this12, _ret12);
    }

    return Output;
})(Arg);

var Label = (function (_GRASPObject7) {
    _inherits(Label, _GRASPObject7);

    function Label(name, height) {
        var _ret13;

        _classCallCheck(this, Label);

        var text = new Text(name, height - 2, 4.2);

        var w = text.width + height;
        var h = height || 10;
        var shape = new THREE.Shape();

        shape.moveTo(0, h / 2);
        shape.lineTo(w, h / 2);
        shape.absarc(w, 0, h / 2, 5 * Math.PI / 2.0, 3 * Math.PI / 2.0, true);
        shape.lineTo(0, -h / 2);
        shape.lineTo(0, h / 2);

        var settings = { amount: 4.1, bevelEnabled: false, steps: 1 };
        var geometry = new THREE.ExtrudeGeometry(shape, settings);

        geometry.dynamic = true;

        var material = new THREE.MeshPhongMaterial({ color: COLORS.blue, shading: THREE.FlatShading });

        var _this13 = _possibleConstructorReturn(this, Object.getPrototypeOf(Label).call(this, geometry, material));

        _this13.width = text.width;
        _this13.add(text);
        text.setPosition(w / 2, 0, 0);
        return _ret13 = _this13, _possibleConstructorReturn(_this13, _ret13);
    }

    return Label;
})(GRASPObject);

var Text = (function (_GRASPObject8) {
    _inherits(Text, _GRASPObject8);

    function Text(text, size, height) {
        var _ret14;

        _classCallCheck(this, Text);

        text = text || ' ';
        size = size || 10;
        height = height || 6;
        var geometry = new THREE.TextGeometry(text, { font: "droid sans mono", height: height, size: size, style: "normal" });
        geometry.computeBoundingBox();
        var width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-width / 2, -size / 2, 0));
        geometry.dynamic = true;
        geometry.verticesNeedUpdate = true;
        var material = new THREE.MeshPhongMaterial({ color: COLORS.white, shading: THREE.FlatShading });

        //this.type = 'Text';

        var _this14 = _possibleConstructorReturn(this, Object.getPrototypeOf(Text).call(this, geometry, material));

        _this14.width = width;
        _this14.text = text;
        return _ret14 = _this14, _possibleConstructorReturn(_this14, _ret14);
    }

    return Text;
})(GRASPObject);

function down(x, y) {
    MOUSE.x = (x - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH) * 2 - 1;
    MOUSE.y = -((y - NAVBAR_HEIGHT) / (window.innerHeight - NAVBAR_HEIGHT)) * 2 + 1;
    SCENE.raycaster.setFromCamera(MOUSE, SCENE.camera);

    var intersects = SCENE.raycaster.intersectObjects(SCENE.meshes.GRASPObject || []);
    for (var i = 0; i < intersects.length; i++) {
        var intersect = intersects[i].object.object;
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
    MOUSE.x = (x - EDITOR_WIDTH) / (window.innerWidth - EDITOR_WIDTH) * 2 - 1;
    MOUSE.y = -((y - NAVBAR_HEIGHT) / (window.innerHeight - NAVBAR_HEIGHT)) * 2 + 1;
    SCENE.raycaster.setFromCamera(MOUSE, SCENE.camera);

    if (DRAG_OBJECT) {
        var intersects = SCENE.raycaster.intersectObject(DRAG_OBJECT.parent.mesh);
        if (intersects.length > 0) {
            var intersect = intersects[0];

            DRAG_OBJECT.mesh.position.copy(intersect.point.sub(OFFSET));
            DRAG_OBJECT.mesh.position.z = 0;
            DRAG_OBJECT.updateEdges();
        } else if (DRAG_OBJECT instanceof Node) {
            // dragging off the scope
            intersects = SCENE.raycaster.intersectObject(DRAG_OBJECT.parent.parent.mesh);
            if (intersects.length > 0) {
                var intersect = intersects[0];

                DRAG_OBJECT.mesh.position.copy(intersect.point.sub(OFFSET));
                DRAG_OBJECT.mesh.position.z = 0;
                x = DRAG_OBJECT.mesh.position.x;
                y = DRAG_OBJECT.mesh.position.y;

                var top = 0,
                    bottom = 0,
                    right = 0,
                    left = 0;
                if (x > DRAG_OBJECT.parent.width / 2) right = x - DRAG_OBJECT.parent.width / 2;else if (-x > DRAG_OBJECT.parent.width / 2) left = -x - DRAG_OBJECT.parent.width / 2;
                if (y > DRAG_OBJECT.parent.height / 2) top = y - DRAG_OBJECT.parent.height / 2;else if (-y > DRAG_OBJECT.parent.height / 2) bottom = -y - DRAG_OBJECT.parent.height / 2;

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
function onMouseMove(event) {
    event.preventDefault();
    move(event.clientX, event.clientY, event.buttons == 1);
}
function onMouseUp(event) {
    event.preventDefault();
    up(event.clientX, event.clientY);
}
function onMouseScroll(event) {}

function updateForces() {
    var node_constant = 10000;
    var scope_constant = 100000;
    var edge_constant = 0.1;
    var max_force = 100;
    var min_force = 1;
    var extension_threshold = 1;
    if (SCENE.children.Plane) for (var a = 0; a < SCENE.children.Plane.length; a++) {
        var plane = SCENE.children.Plane[a];
        if (plane.children.Scope) for (var b = 0; b < plane.children.Scope.length; b++) {
            var scope = plane.children.Scope[b];
            var scope_force = new THREE.Vector2(0, 0);

            if (scope.children.Node) for (var c = 0; c < scope.children.Node.length; c++) {
                var node = scope.children.Node[c];
                if (node != DRAG_OBJECT) {
                    // node repellent
                    var node_force = new THREE.Vector2(0, 0);

                    for (var d = 0; d < scope.children.Node.length; d++) {
                        if (c != d) {
                            var sibling = scope.children.Node[d];
                            var force = new THREE.Vector2().subVectors(node.position, sibling.position);
                            var length = force.lengthSq();
                            if (length < 0.001) force.x = 1;
                            if (length < 1) length = 1;
                            force.setLength(node_constant).divideScalar(length);
                            node_force.add(force);
                        }
                    } // edge spring
                    if (node.children.Arg) for (var d = 0; d < node.children.Arg.length; d++) {
                        var arg = node.children.Arg[d];
                        if (arg.edge && arg.edge.parent == node.parent) {
                            var sibling_arg = arg.edge.end == arg ? arg.edge.start : arg.edge.end;
                            var sibling = sibling_arg.parent;
                            var force = new THREE.Vector2().subVectors(sibling.position.clone().add(sibling_arg.position), node.position.clone().add(arg.position));
                            node_force.add(force.multiplyScalar(edge_constant));
                        }
                    }

                    if (node_force.length() > max_force) node_force.setLength(max_force);
                    if (node_force.length() > min_force) {
                        var new_x = node.mesh.position.x + node_force.x;
                        var new_y = node.mesh.position.y + node_force.y;
                        var border_x = node.parent.width / 2;
                        var border_y = node.parent.height / 2;

                        if (new_x > border_x) {
                            // right overflow
                            var overflow = new_x - border_x;
                            if (overflow > extension_threshold) {
                                node.parent.extend(0, overflow, 0, 0);
                                node.mesh.position.x = new_x;
                                if (DRAG_OBJECT) OFFSET.x += overflow / 2;
                            }
                        } else if (new_x < -border_x) {
                            var overflow = -border_x - new_x;
                            if (overflow > extension_threshold) {
                                node.parent.extend(0, 0, 0, overflow);
                                node.mesh.position.x = new_x;
                                if (DRAG_OBJECT) OFFSET.x -= overflow / 2;
                            }
                            // left overflow
                        } else node.mesh.position.x = new_x;
                        if (new_y > border_y) {
                            // top overflow
                            var overflow = new_y - border_y;
                            if (overflow > extension_threshold) {
                                node.parent.extend(overflow, 0, 0, 0);
                                node.mesh.position.y = new_y;
                                if (DRAG_OBJECT) OFFSET.y += overflow / 2;
                            }
                        } else if (new_y < -border_y) {
                            // bottom overflow
                            var overflow = -border_y - new_y;
                            if (overflow > extension_threshold) {
                                node.parent.extend(0, 0, overflow, 0);
                                node.mesh.position.y = new_y;
                                if (DRAG_OBJECT) OFFSET.y -= overflow / 2;
                            }
                        } else node.mesh.position.y = new_y;

                        node.updateEdges();
                    }
                }
            }

            // scope repellent
            if (scope != DRAG_OBJECT) for (var c = 0; c < plane.children.Scope.length; c++) {
                if (b != c) {
                    var sibling = plane.children.Scope[c];
                    var force = new THREE.Vector2().subVectors(scope.position, sibling.position);
                    var length = force.lengthSq();
                    if (length < 0.001) force.x = 10;
                    if (length < 10) length = 10;
                    force.setLength(scope_constant).divideScalar(length);
                    scope_force.add(force);
                }
            }if (scope_force.length() > max_force) scope_force.setLength(max_force);
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

//# sourceMappingURL=content-compiled.js.map
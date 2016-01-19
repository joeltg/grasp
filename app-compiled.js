"use strict";

document.getElementById('calculate').addEventListener('click', calculate);
document.getElementById('clear').addEventListener('click', clear);
document.getElementById('center').addEventListener('click', center);
document.getElementById('labels').addEventListener('click', toggleLabels);
document.getElementById('names').addEventListener('click', toggleNames);

function center() {
    SCENE.camera.position.set(0, 0, 500);
    SCENE.camera.up = new THREE.Vector3(0, 1, 0);
    SCENE.camera.lookAt(new THREE.Vector3(0, 0, 0));
    SCENE.controls.target.set(0, 0, 0);
}
function clear() {
    SCENE.remove();
    PLANE = SCENE.addPlane();
    SCOPE = PLANE.add(new Scope());
}
function calculate() {
    clear();
    var text = editor.getValue();
    var data = paredit.parse(text);
    if (data.errors.length > 0) console.error(data);else for (var i = 0; i < data.children.length; i++) {
        add(data.children[i], SCOPE);
    }
}

function toggleLabels() {
    var labels = document.getElementById('labels').checked;
    if (SCENE.meshes.Input) for (var i = 0; i < SCENE.meshes.Input.length; i++) {
        var input = SCENE.meshes.Input[i].object;
        if (input.edge) {
            if (labels) {
                if (!input.label) {
                    input.label = input.add(new Label(input.label_text, 2 * input.radius));
                    input.width = input.label.width;
                    input.parent.updateSize();
                }
            } else {
                if (input.label) {
                    input.label.remove();
                    input.label = null;
                    input.width = 0;
                    input.parent.updateSize();
                }
            }
        }
    }
}

function toggleNames() {
    var names = document.getElementById('names').checked;
    if (SCENE.meshes.Variable) for (var i = 0; i < SCENE.meshes.Variable.length; i++) {
        var variable = SCENE.meshes.Variable[i].object;
        if (names) {
            if (!variable.label) {
                variable.label = variable.add(new Text(variable.name));
                variable.updateSize();
            }
        } else {
            if (variable.label) {
                variable.label.remove();
                variable.label = null;
                variable.updateSize();
            }
        }
    }
}

function lambda(params, body, scope) {
    var l = scope.addForm('λ');
    var new_scope = scope.addScope();
    for (var i = 0; i < params.length; i++) {
        var param = params[i];
        if (param.type == 'symbol') {
            var symbol = param.source;
            var variable = new_scope.addVariable(symbol, !document.getElementById('names').checked);
            SCENE.addEdge(l.add(new Input(symbol)), variable.addInput());
        } else return console.error('invalid params in lambda', data);
    }
    var child = undefined;
    for (var i = 0; i < body.length; i++) {
        child = add(body[i], new_scope);
    }if (child) SCENE.addEdge(l.addOutput(), child.output);else return console.error('lambda had no body', body);
    return l;
}

function define(symbol, value, scope) {
    var reference = scope.findBinding(symbol);
    if (reference) {
        // binding already exists
        if (value) {
            if (value.type == 'list') scope.addEdge(add(value, scope).output, reference.addInput());else reference.addInput(value.source);
        }
        return console.error('invalid re-definition', symbol, value);
    } else {
        // new binding
        var variable = scope.addVariable(symbol, !document.getElementById('names').checked);
        if (value) {
            if (value.type == 'list') scope.addEdge(add(value, scope).output, variable.addInput());else variable.addInput(value.source);
        }
        return variable;
    }
}

function letx(name, bindings, body, recursive, scope) {
    var l = scope.addForm(name);
    var new_scope = scope.addScope();
    for (var i = 0; i < bindings.length; i++) {
        if (bindings[i].children.length == 2 && bindings[i].children[0].type == 'symbol') {
            var symbol = bindings[i].children[0].source;
            var variable = new_scope.addVariable(symbol, !document.getElementById('names').checked);
            if (bindings[i].children[1].type == 'list') {
                // init value is expression
                if (recursive) new_scope.addEdge(add(bindings[i].children[1], new_scope).output, variable.addInput());else SCENE.addEdge(add(bindings[i].children[1], scope).output, variable.addInput());
            } else {
                // init value is atom
                variable.addInput(bindings[i].children[1].source);
            }
        } else console.error('invalid let binding');
    }
    var child = undefined;
    for (var i = 0; i < body.length; i++) {
        child = add(body[i], new_scope);
    }if (child) SCENE.addEdge(l.addOutput(), child.output);else return console.error('let had no body', body);
    return l;
}

function add(data, scope) {
    if (data.type == 'list') {
        for (var i = 0; i < data.children.length - 1; i++) {
            var child = data.children[i];
            if (child.type == 'symbol' && child.source == "'" && data.children[i + 1]) {
                data.children.splice(i, 2, {
                    type: 'list',
                    children: [{ type: 'symbol', source: 'quote' }, data.children[i + 1]]
                });
            } else if (child.type == 'special' && child.source == '#' && data.children[i + 1].type == 'symbol') {
                data.children.splice(i, 2, data.children[i + 1]);
                data.children[i].source = '#' + data.children[i].source;
            }
        }
        if (data.children && data.children[0].type == 'symbol') {
            var source = data.children[0].source;
            switch (source) {
                case 'lambda':
                    if (data.children.length > 2 && data.children[1].type == 'list') return lambda(data.children[1].children, data.children.slice(2), scope);else return console.error('invalid lambda', data);
                case 'let':
                    if (data.children.length > 2 && data.children[1].type == 'list') return letx('let', data.children[1].children, data.children.slice(2), false, scope);else return console.error('invalid let', data);
                case 'let*':
                    if (data.children.length > 2 && data.children[1].type == 'list') return letx('let*', data.children[1].children, data.children.slice(2), true, scope);else return console.error('invalid let*', data);
                case 'letrec':
                    if (data.children.length > 2 && data.children[1].type == 'list') return letx('letrec', data.children[1].children, data.children.slice(2), true, scope);else return console.error('invalid letrec', data);
                case 'define':
                    if (data.children.length > 1 && data.children[1].type == 'symbol') {
                        var symbol = data.children[1].source;
                        var value = data.children[2];
                        return define(symbol, value, scope);
                    } else if (data.children.length > 2 && data.children[1].children[0].type == 'symbol' && data.children[1].type == 'list') {
                        // function definition
                        var l = lambda(data.children[1].children.slice(1), data.children.slice(2), scope);
                        var variable = scope.addVariable(data.children[1].children[0].source, !document.getElementById('names').checked);
                        scope.addEdge(l.output, variable.addInput());
                        return l;
                    } else return console.error('invalid variable definition', data);
                    break;
                case 'set!':
                    if (data.children.length > 2 && data.children[1].type == 'symbol') {
                        var symbol = data.children[1].source;
                        var reference = scope.findBinding(symbol);
                        if (reference) {
                            var value = data.children[2];
                            if (value.type == 'list') scope.addEdge(add(value, scope).output, reference.addInput());else reference.addInput(value.source);
                            return reference;
                        } else return console.error('could not locate set! reference');
                    }
                    return console.error('invalid set!', data);
                case 'quote':
                    var quote = scope.addForm(source);
                    if (data.children.length == 2) {
                        if (data.children[1].type == 'list') {
                            // quoting list
                            quote.add(new Input(editor.getValue().substring(data.children[1].start, data.children[1].end)));
                        } else {
                            // quoting atom
                            quote.add(new Input(data.children[1].source));
                        }
                        quote.updateSize();
                        return quote;
                    } else return console.error('invalid quote');
                default:
                    var form = scope.addForm(source);
                    for (var i = 1; i < data.children.length; i++) {
                        var child = data.children[i];
                        if (child.type == 'list') scope.addEdge(add(child, scope).output, form.addInput());else form.addInput(child.source);
                    }
                    return form;
            }
        } else return console.error('first element in form was not a symbol', data);
    } else if (data.type == 'comment') return null;else return scope.addForm(data.source);
}

//# sourceMappingURL=app-compiled.js.map
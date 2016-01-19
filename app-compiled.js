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
    let text = editor.getValue();
    let data = paredit.parse(text);
    if (data.errors.length > 0) console.error(data);else for (let i = 0; i < data.children.length; i++) add(data.children[i], SCOPE);
}

function toggleLabels() {
    let labels = document.getElementById('labels').checked;
    if (SCENE.meshes.Input) for (let i = 0; i < SCENE.meshes.Input.length; i++) {
        let input = SCENE.meshes.Input[i].object;
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
    let names = document.getElementById('names').checked;
    if (SCENE.meshes.Variable) for (let i = 0; i < SCENE.meshes.Variable.length; i++) {
        let variable = SCENE.meshes.Variable[i].object;
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
    let l = scope.addForm('λ');
    let new_scope = scope.addScope();
    for (let i = 0; i < params.length; i++) {
        let param = params[i];
        if (param.type == 'symbol') {
            let symbol = param.source;
            let variable = new_scope.addVariable(symbol);
            SCENE.addEdge(l.add(new Input(symbol)), variable.addInput());
        } else return console.error('invalid params in lambda', data);
    }
    let child;
    for (let i = 0; i < body.length; i++) child = add(body[i], new_scope);
    if (child) SCENE.addEdge(l.addOutput(), child.output);else return console.error('lambda had no body', body);
    return l;
}

function define(symbol, value, scope) {
    let reference = scope.findBinding(symbol);
    if (reference) {
        // binding already exists
        if (value) {
            if (value.type == 'list') scope.addEdge(add(value, scope).output, reference.addInput());else reference.addInput(value.source);
        }
        return console.error('invalid re-definition', symbol, value);
    } else {
        // new binding
        let variable = scope.addVariable(symbol);
        if (value) {
            if (value.type == 'list') scope.addEdge(add(value, scope).output, variable.addInput());else variable.addInput(value.source);
        }
        return variable;
    }
}

function letx(name, bindings, body, recursive, scope) {
    let l = scope.addForm(name);
    let new_scope = scope.addScope();
    for (let i = 0; i < bindings.length; i++) {
        if (bindings[i].children.length == 2 && bindings[i].children[0].type == 'symbol') {
            let symbol = bindings[i].children[0].source;
            let variable = new_scope.addVariable(symbol);
            if (bindings[i].children[1].type == 'list') {
                // init value is expression
                if (recursive) new_scope.addEdge(add(bindings[i].children[1], new_scope).output, variable.addInput());else SCENE.addEdge(add(bindings[i].children[1], scope).output, variable.addInput());
            } else {
                // init value is atom
                variable.addInput(bindings[i].children[1].source);
            }
        } else console.error('invalid let binding');
    }
    let child;
    for (let i = 0; i < body.length; i++) child = add(body[i], new_scope);
    if (child) SCENE.addEdge(l.addOutput(), child.output);else return console.error('let had no body', body);
    return l;
}

function add(data, scope) {
    if (data.type == 'list') {
        if (data.children && data.children[0].type == 'symbol') {
            let source = data.children[0].source;
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
                        let symbol = data.children[1].source;
                        let value = data.children[2];
                        return define(symbol, value, scope);
                    } else if (data.children.length > 2 && data.children[1].children[0].type == 'symbol' && data.children[1].type == 'list') {
                        // function definition
                        let l = lambda(data.children[1].children.slice(1), data.children.slice(2), scope);
                        let variable = scope.addVariable(data.children[1].children[0].source);
                        scope.addEdge(l.output, variable.addInput());
                        return l;
                    } else return console.error('invalid variable definition', data);
                    break;
                case 'set!':
                    if (data.children.length > 2 && data.children[1].type == 'symbol') {
                        let symbol = data.children[1].source;
                        let reference = scope.findBinding(symbol);
                        if (reference) {
                            let value = data.children[2];
                            if (value.type == 'list') scope.addEdge(add(value, scope).output, reference.addInput());else reference.addInput(value.source);
                            return reference;
                        } else return console.error('could not locate set! reference');
                    }
                    return console.error('invalid set!', data);
                default:
                    let form = scope.addForm(source);
                    for (let i = 1; i < data.children.length; i++) {
                        let child = data.children[i];
                        if (child.type == 'list') scope.addEdge(add(child, scope).output, form.addInput());else form.addInput(child.source);
                    }
                    return form;
            }
        } else return console.error('first element in form was not a symbol', data);
    } else if (data.type == 'comment') return null;else return scope.addForm(data.source);
}

//# sourceMappingURL=app-compiled.js.map
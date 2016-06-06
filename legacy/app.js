"use strict";

// document.getElementById('calculate').addEventListener('click', calculate);
// document.getElementById('clear').addEventListener('click', clear);
// document.getElementById('center').addEventListener('click', center);
// document.getElementById('labels').addEventListener('click', toggleLabels);
// document.getElementById('names').addEventListener('click', toggleNames);

// const Interpreter = new BiwaScheme.Interpreter();

// const NAMES = !document.getElementById('names').checked;

const NAMES = true;

function center() {
    SCENE.camera.position.set(0, 0, 500);
    SCENE.camera.up = new THREE.Vector3(0,1,0);
    SCENE.camera.lookAt(new THREE.Vector3(0,0,0));
    SCENE.controls.target.set(0, 0, 0);
}

function clear() {
    SCENE.remove();
    PLANE = SCENE.addPlane();
    SCOPE = PLANE.add(new Scope());
}

function calculate() {
    const text = cm.getValue().split('\n').map(line => {
        const index = line.indexOf(';;');
        return line.substring(0, index > -1 ? index : line.length);
    }).filter(l => l.length > 0).join('');
    const parser = new SParser(text);
    for (let expr = parser.expr(); expr; expr = parser.expr())
        add(expr, SCOPE);
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
            }
            else {
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
        }
        else {
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
    for (let pair = params; S.is_pair(pair); pair = pair.cdr) {
        const param = pair.car;
        if (S.is_symbol(param)) {
            const symbol = param.value;
            const variable = new_scope.addVariable(symbol, NAMES);
            SCENE.addEdge(l.add(new Input(symbol)), variable.addInput());
        }
        else return console.error('invalid params in lambda', data);
    }
    let child;
    for (let pair = body; S.is_pair(pair); pair = pair.cdr)
        child = add(pair.car, new_scope);
    if (child) SCENE.addEdge(l.addOutput(), child.output);
    else return console.error('lambda had no body', body);
    return l;
}

function define(symbol, value, scope) {
    let reference = scope.findBinding(symbol.value);
    if (reference) {
        // binding already exists
        if (value) {
            if (value.type == 'list') scope.addEdge(add(value, scope).output, reference.addInput());
            else reference.addInput(value.value);
        }
        return console.error('re-definition', symbol, value);
    }
    else {
        // new binding
        let variable = scope.addVariable(symbol.value, NAMES);
        if (value) {
            if (S.is_pair(value))
                scope.addEdge(add(value, scope).output, variable.addInput());
            else variable.addInput(value.value);
        }
        return variable;
    }
}

function letx(name, bindings, body, recursive, scope) {
    let l = scope.addForm(name);
    let new_scope = scope.addScope();
    for (let pair = bindings; S.is_pair(pair); pair = pair.cdr) {
        let binding = pair.car;
        let symbol = binding.car.value;
        let variable = new_scope.addVariable(symbol, NAMES);
        if (S.is_pair(binding.cdr.car)) {
            if (recursive) new_scope.addEdge(add(binding.cdr.car, new_scope).output, variable.addInput());
            else SCENE.addEdge(add(binding.cdr.car, scope).output, variable.addInput());
        }
        else variable.addInput(binding.cdr.car.value);
    }
    let output = false;
    for (let pair = body; S.is_pair(pair); pair = pair.cdr) {
        const expr = pair.car;
        if (S.is_pair(expr)) {
            output = add(expr, new_scope).output;
        } else {
            // panic
            output = new_scope.findBinding(expr.value).addOutput();
        }
    }
    if (output) SCENE.addEdge(l.addOutput(), output);
    else return console.error('let had no body', body);
    return l;
}

function add(data, scope) {
    if (S.is_pair(data)) {
        switch (data.car.value) {
            case 'lambda':
                if (S.is_pair(data.cdr) && S.is_pair(data.cdr.cdr))
                    return lambda(data.cdr.car, data.cdr.cdr, scope);
                else return console.error('invalid lambda', data);
            case 'let':
                if (S.is_pair(data.cdr) && S.is_pair(data.cdr.cdr))
                    return letx('let', data.cdr.car, data.cdr.cdr, false, scope);
                else return console.error('invalid let', data);
            case 'letrec':
                if (S.is_pair(data.cdr) && S.is_pair(data.cdr.cdr))
                    return letx('letrec', data.cdr.car, data.cdr.cdr, true, scope);
                else return console.error('invalid letrec', data);
            case 'let*':
                if (S.is_pair(data.cdr) && S.is_pair(data.cdr.cdr))
                    return letx('let*', data.cdr.car, data.cdr.cdr, true, scope);
                else return console.error('invalid let*', data);
            case 'define':
                if (S.is_pair(data.cdr) && S.is_pair(data.cdr.cdr)) {
                    const symbol = data.cdr.car;
                    const value = data.cdr.cdr.car;
                    return define(symbol, value, scope);
                } else return console.error('invalid define', data);
            case 'set!':
                if (S.is_pair(data.cdr) && S.is_pair(data.cdr.cdr)) {
                    const symbol = data.cdr.car;
                    const value = data.cdr.cdr.car;
                    const reference = scope.findBinding(symbol.value);
                    if (reference) {
                        if (S.is_pair(value)) scope.addEdge(add(value, scope).output, reference.addInput());
                        else reference.addInput(value.value);
                        return reference;
                    } else return console.error('cannot find set! binding', data)
                } else return console.error('invalid set!', data);
            default:
                const form = scope.addForm(data.car.value);
                for (let pair = data.cdr; S.is_pair(pair); pair = pair.cdr) {
                    if (S.is_pair(pair.car)) scope.addEdge(add(pair.car, scope).output, form.addInput());
                    else form.addInput(pair.car.value);
                }
                return form;
        }
    } else return scope.addForm(data.value);
}
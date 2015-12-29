"use strict";
editor.getSession().on('change', function(e) {
  // e.type, etc

});

document.getElementById('center').addEventListener('click', center, false);
document.getElementById('clear').addEventListener('click', clear, false);
document.getElementById('calculate').addEventListener('click', calculate, false);

function center() {
    CAMERA.position.set(0, 0, 500);
    CAMERA.up = new THREE.Vector3(0,1,0);
    CAMERA.lookAt(new THREE.Vector3(0,0,0));
    CONTROLS.target.set(0, 0, 0);
}
function clear() {
    for (let i = 1; i < SCENE.children.plane.length; i++) {
        SCENE.children.plane[i].remove();
    }
    for (let i = 0; i < SCENE.children.edge.length; i++) {
        SCENE.children.edge[i].remove();
    }
    SCOPE.remove();
    SCOPE = PLANE.addScope();
}
function calculate() {
    clear();
    //center();
    let data = paredit.parse(editor.getValue());
    SCOPE.scope = {_parent: null};
    for (let i = 0; i < data.children.length; i++) addTree(data.children[i], null, null, SCOPE, 1);
}

function addTree(data, parent, index, scope, depth) {
    if (data.type == 'list') {
        if (data.children && data.children[0].type == 'symbol') {
            let function_name = data.children[0].source;
            let function_binding = find(function_name, scope.scope);
            let node;

            if (function_binding) {
                // function is user-defined
                node = scope.addNode();
                if (function_binding.parent == scope) {
                    // reference in the same scope
                    scope.addEdge(function_binding.addOutput(), node.addArg());
                }
                else {
                    // reference from previous scope
                    SCENE.addEdge(function_binding.addOutput(), node.addArg());
                }
            }
            else {
                // function is primitive
                node = scope.addNode(function_name);
            }

            let x = Math.floor((Math.random() - 0.5) * scope.width);
            let y = Math.floor((Math.random() - 0.5) * scope.height);
            node.setPosition(x, y);
            if (parent != null) {
                parent.addArg(index);
                scope.addEdge(node.children.output[0], parent.args[index]);
            }
            if (data.children[0].source == 'lambda') {
                node.setName('λ');
                let args = data.children[1].children;
                let plane = SCENE.children.plane.length <= depth ? SCENE.addPlane(depth) : SCENE.children.plane[depth];
                let new_scope = plane.addScope();
                new_scope.scope = {_parent: scope.scope};
                for (let i = 0; i < args.length; i++) {
                    let symbol = args[i].source;
                    let arg = new_scope.addNode(symbol);
                    arg.removeOutput();
                    new_scope.scope[symbol] = arg;
                    SCENE.addEdge(node.addArg(), arg.addArg());
                }
                let last_node;
                for (let i = 2; i < data.children.length; i++)
                    last_node = addTree(data.children[i], null, null, new_scope, depth + 1);
                SCENE.addEdge(node.addOutput(), last_node.children.output[0]);
            }
            else if (data.children[0].source == 'define') {
                if (data.children[1].type == 'list') {
                    // function definition
                    let lambda = scope.addNode('λ');
                    let args = data.children[1].children;
                    node.setName(args[0].source);
                    node.removeOutput();
                    x = Math.floor((Math.random() - 0.5) * scope.width);
                    y = Math.floor((Math.random() - 0.5) * scope.height);
                    lambda.setPosition(x, y);
                    let plane = SCENE.children.plane.length <= depth ? SCENE.addPlane(depth) : SCENE.children.plane[depth];
                    let new_scope = plane.addScope();
                    new_scope.scope = {_parent: scope.scope};
                    for (let i = 1; i < args.length; i++) {
                        let symbol = args[i].source;
                        let arg = new_scope.addNode(symbol);
                        arg.removeOutput();
                        new_scope.scope[symbol] = arg;
                        SCENE.addEdge(lambda.addArg(), arg.addArg());
                    }
                    let last_node;
                    for (let i = 2; i < data.children.length; i++)
                        last_node = addTree(data.children[i], null, null, new_scope, depth + 1);
                    SCENE.addEdge(lambda.addOutput(), last_node.children.output[0]);
                    scope.scope[args[0].source] = node;
                    scope.addEdge(lambda.children.output[0], node.addArg());
                }
                else {
                    // variable binding
                    // TODO: implement this
                    let symbol = data.children[1].source;
                    node.setName(symbol);
                    node.removeOutput();
                    if (data.children.length > 2) {
                        let value = data.children[2];
                        if (value.type == 'list') {
                            // init value is expression
                            value = addTree(value, node, 0, scope, depth);
                        }
                        else {
                            // init value is atom
                            node.addArg(null, value.source);
                        }
                    }
                    scope.scope[symbol] = node;
                }
            }
            else if (data.children[0].source == 'let' || data.children[0].source == 'let*' || data.children[0].source == 'letrec') {
                // let block
                let bindings = data.children[1].children;
                let plane = SCENE.children.plane.length <= depth ? SCENE.addPlane(depth) : SCENE.children.plane[depth];
                let new_scope = plane.addScope();
                new_scope.scope = {_parent: scope.scope};
                for (let i = 0; i < bindings.length; i++) {
                    let binding = bindings[i];
                    let symbol = binding.children[0];
                    let value = binding.children[1];
                    let arg = new_scope.addNode(symbol.source);
                    arg.removeOutput();
                    new_scope.scope[symbol] = arg;
                    SCENE.addEdge(node.addArg(), arg.addArg());
                    if (value.type == 'list') {
                        // init value is expression
                        value = addTree(value, node, (2 * i) + 1, scope, depth);
                    }
                    else {
                        // init value is atom
                        node.addArg(null, value.source);
                    }
                }
                //    SCENE.addEdge(node.addArg(), new_scope.addNode(args[i].source).addArg());
                let last_node;
                for (let i = 2; i < data.children.length; i++)
                    last_node = addTree(data.children[i], null, null, new_scope, depth + 1);
                SCENE.addEdge(node.addOutput(), last_node.children.output[0]);
            }
            else for (let i = 1; i < data.children.length; i++) {
                addTree(data.children[i], node, i - 1, scope, depth);
            }
            return node;
        }
      else {
          console.log('error parsing list', data);
          return null;
      }
    }
    else if (data.source) {
        if (parent == null) {
            // top-level atom
            return scope.add(new Atom(data.source));
        }
        else {
            // atom
            let value = find(data.source, scope.scope);
            if (value) {
                // atom is binding
                if (value.parent == scope) {
                    // reference in the same scope
                    return scope.addEdge(value.addOutput(), parent.addArg());
                }
                else {
                    // reference in a previous scope
                    return SCENE.addEdge(value.addOutput(), parent.addArg());
                }
            }
            else {
                // atom is value
                return parent.addArg(null, data.source);
            }
        }
    }
    else {
        console.log('error parsing', data);
        return null;
    }
}

function find(symbol, scope) {
    if (scope[symbol]) return scope[symbol];
    if (scope._parent) return find(symbol, scope._parent);
    return null;
}
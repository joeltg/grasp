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
    for (var i = 0; i < SCENE.children.edge.length; i++) {
        SCENE.children.edge[i].start.remove();
        SCENE.children.edge[i].end.remove();
        SCENE.children.edge[i].remove();
    }
    for (i = 1; i < SCENE.children.plane.length; i++) {
        for (var j = 0; j < SCENE.children.plane[i].children.scope.length; j++) {
            SCENE.children.plane[i].children.scope[j].remove();
        }
        SCENE.children.plane[i].remove();
    }
    SCOPE.remove();
    SCOPE = PLANE.addScope();
}
function calculate() {
    clear();
    //center();
    var data = paredit.parse(editor.getValue());
    SCOPE.scope = {_parent: null};
    for (var i = 0; i < data.children.length; i++) addTree(data.children[i], null, null, SCOPE, 1);
}

function addTree(data, parent, index, scope, depth) {
    if (data.type == 'list') {
        if (data.children && data.children[0].type == 'symbol') {
            var function_name = data.children[0].source;
            var function_binding = find(function_name, scope.scope);
            var node;

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

            var x = Math.floor((Math.random() - 0.5) * scope.width);
            var y = Math.floor((Math.random() - 0.5) * scope.height);
            node.setPosition(x, y);
            if (parent != null) {
                parent.addArg(index);
                scope.addEdge(node.children.output[0], parent.args[index]);
            }
            if (data.children[0].source == 'lambda') {
                node.setName('λ');
                var args = data.children[1].children;
                var plane = SCENE.children.plane.length <= depth ? SCENE.addPlane(depth) : SCENE.children.plane[depth];
                var new_scope = plane.addScope();
                new_scope.scope = {_parent: scope.scope};
                for (var i = 0; i < args.length; i++) {
                    var symbol = args[i].source;
                    var arg = new_scope.addNode(symbol);
                    x = Math.floor((Math.random() - 0.5) * new_scope.width);
                    y = Math.floor((Math.random() - 0.5) * new_scope.height);
                    arg.setPosition(x, y);
                    arg.removeOutput();
                    new_scope.scope[symbol] = arg;
                    SCENE.addEdge(node.addArg(), arg.addArg());
                }
                var last_node;
                for (var i = 2; i < data.children.length; i++)
                    last_node = addTree(data.children[i], null, null, new_scope, depth + 1);
                SCENE.addEdge(node.addOutput(), last_node.children.output[0]);
            }
            else if (data.children[0].source == 'define') {
                // TODO: check if symbol is already defined in the scope before making a new node
                if (data.children[1].type == 'list') {
                    // function definition
                    var lambda = scope.addNode('λ');
                    var args = data.children[1].children;
                    var symbol = args[0].source;
                    node.setName(symbol);
                    node.removeOutput();
                    x = Math.floor((Math.random() - 0.5) * scope.width);
                    y = Math.floor((Math.random() - 0.5) * scope.height);
                    lambda.setPosition(x, y);
                    var plane = SCENE.children.plane.length <= depth ? SCENE.addPlane(depth) : SCENE.children.plane[depth];
                    var new_scope = plane.addScope();
                    new_scope.scope = {_parent: scope.scope};
                    for (var i = 1; i < args.length; i++) {
                        var symbol = args[i].source;
                        var arg = new_scope.addNode(symbol);
                        x = Math.floor((Math.random() - 0.5) * new_scope.width);
                        y = Math.floor((Math.random() - 0.5) * new_scope.height);
                        arg.setPosition(x, y);
                        arg.removeOutput();
                        new_scope.scope[symbol] = arg;
                        SCENE.addEdge(lambda.addArg(), arg.addArg());
                    }
                    var last_node;
                    for (var i = 2; i < data.children.length; i++)
                        last_node = addTree(data.children[i], null, null, new_scope, depth + 1);
                    SCENE.addEdge(lambda.addOutput(), last_node.children.output[0]);
                    scope.scope[args[0].source] = node;
                    scope.addEdge(lambda.children.output[0], node.addArg());
                }
                else {
                    // variable binding
                    var symbol = data.children[1].source;
                    if (scope[symbol]) {
                        // this is just redefining an already-initialized variable
                        var new_binding = data.children[2];
                        var value = find(symbol, scope.scope);
                        if (new_binding.type == 'list') {
                            // new value is expressions
                            var new_value = addTree(new_binding, null, null, scope, depth);
                            if (value.parent == scope) {
                                // reference in the same scope
                                scope.addEdge(new_value.children.output[0], value.addArg());
                            }
                            else {
                                // reference in a previous scope
                                SCENE.addEdge(new_value.children.output[0], value.addArg());
                            }
                        }
                        else {
                            // new value is atom
                            value.addArg(null, new_binding.source);
                        }
                        node.remove();
                        return value;
                    }
                    else {
                        // this is a new variable binding
                        node.setName(symbol);
                        node.removeOutput();
                        if (data.children.length > 2) {
                            var value = data.children[2];
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
            }
            else if (data.children[0].source == 'let' || data.children[0].source == 'let*' || data.children[0].source == 'letrec') {
                // var block
                var bindings = data.children[1].children;
                var plane = SCENE.children.plane.length <= depth ? SCENE.addPlane(depth) : SCENE.children.plane[depth];
                var new_scope = plane.addScope();
                new_scope.scope = {_parent: scope.scope};
                for (var i = 0; i < bindings.length; i++) {
                    var binding = bindings[i];
                    var symbol = binding.children[0].source;
                    var value = binding.children[1];
                    var arg = new_scope.addNode(symbol);
                    x = Math.floor((Math.random() - 0.5) * new_scope.width);
                    y = Math.floor((Math.random() - 0.5) * new_scope.height);
                    arg.setPosition(x, y);
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
                var last_node;
                for (var i = 2; i < data.children.length; i++)
                    last_node = addTree(data.children[i], null, null, new_scope, depth + 1);
                SCENE.addEdge(node.addOutput(), last_node.children.output[0]);
            }
            else if (data.children[0].source == 'set!') {
                // set var
                var symbol = data.children[1].source;
                var new_binding = data.children[2];
                var value = find(symbol, scope.scope);
                if (new_binding.type == 'list') {
                    // new value is expressions
                    var new_value = addTree(new_binding, null, null, scope, depth);
                    if (value.parent == scope) {
                        // reference in the same scope
                        scope.addEdge(new_value.children.output[0], value.addArg());
                    }
                    else {
                        // reference in a previous scope
                        SCENE.addEdge(new_value.children.output[0], value.addArg());
                    }
                }
                else {
                    // new value is atom
                    value.addArg(null, new_binding.source);
                }
                node.remove();
                return value;
            }
            else for (var i = 1; i < data.children.length; i++) {
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
            var value = find(data.source, scope.scope);
            console.log(data.source, scope.scope);
            console.log(' ');
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
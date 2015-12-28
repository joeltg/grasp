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
    for (var i = 1; i < SCENE.children.plane.length; i++) {
        SCENE.children.plane[i].remove();
    }
    for (i = 0; i < SCENE.children.edge.length; i++) {
        SCENE.children.edge[i].remove();
    }
    SCOPE.remove();
    SCOPE = PLANE.addScope();
}
function calculate() {
    clear();
    //center();
    var data = paredit.parse(editor.getValue());
    for (var i = 0; i < data.children.length; i++) addTree(data.children[i], null, null, SCOPE, 1);
}

function addTree(data, parent, index, scope, depth) {
    if (data.type == 'list') {
        if (data.children && data.children[0].type == 'symbol') {
            var node = scope.addNode(data.children[0].source);
            var x = Math.floor((Math.random() - 0.5) * scope.width);
            var y = Math.floor((Math.random() - 0.5) * scope.height);
            node.setPosition(x, y);
            if (parent != null) {
                parent.addArg(index);
                scope.addEdge(node.children.output[0], parent.args[index]);
            }
            if (data.children[0].source == 'lambda') {
                var args = data.children[1].children;
                var plane;
                if (SCENE.children.plane.length <= depth) plane = SCENE.addPlane(depth);
                else plane = SCENE.children.plane[depth];
                var new_scope = plane.addScope();
                for (var i = 0; i < args.length; i++)
                    SCENE.addEdge(node.addArg(null, args[i].source), new_scope.addNode(args[i].source).addArg());
                for (i = 2; i < data.children.length; i++)
                    var last_node = addTree(data.children[i], null, null, new_scope, depth + 1);
                SCENE.addEdge(last_node.children.output[0], node.addOutput());
            }
            else for (i = 1; i < data.children.length; i++) {
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
            return parent.addArg(null, data.source);
        }
    }
    else {
        console.log('error parsing', data);
        return null;
    }
}

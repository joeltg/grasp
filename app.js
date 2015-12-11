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
  SCOPE.remove();
  SCOPE = PLANE.addScope();
}
function calculate() {
  clear();
  //center();
  var data = paredit.parse(editor.getValue());
  for (var i = 0; i < data.children.length; i++) addTree(data.children[i], null);
};

function addTree(data, parent, index) {
  if (data.type == 'list') {
    if (data.children && data.children[0].type == 'symbol') {
      var node = SCOPE.addNode(data.children[0].source);
      var x = Math.floor((Math.random() - 0.5) * SCOPE.width);
      var y = Math.floor((Math.random() - 0.5) * SCOPE.height);
      node.setPosition(x, y);
      if (parent != null) {
        parent.addArg(index);
        SCOPE.addEdge(node.children.output[0], parent.args[index]);
      }
      for (var i = 1; i < data.children.length; i++) {
        addTree(data.children[i], node, i - 1);
      }
    }
    else {
      console.log('error parsing list', data);
    }
  }
  else if (data.source) {
    if (parent == null) {
      // top-level atom
      SCOPE.add(new Atom(data.source));
    }
    else {
      // atom
      parent.addArg(null, data.source);
    }
  }
  else {
    console.log('error parsing', data);
  }
}

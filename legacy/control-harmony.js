/**
 * Created by joel on 5/28/16.
 */

function getWidth() {
    return 2 * window.innerWidth / 3.0;
}

function getHeight() {
    return window.innerHeight;
}

function attachListeners(element) {
    element.addEventListener("touchstart", onTouchStart, false);
    element.addEventListener("touchend", onTouchEnd, false);
    element.addEventListener("touchcancel", onTouchCancel, false);
    element.addEventListener("touchmove", onTouchMove, false);
    element.addEventListener('mouseup', onMouseUp, false);
    element.addEventListener('mousemove', onMouseMove, false);
    element.addEventListener('mousedown', onMouseDown, false);
    element.addEventListener('mousewheel', onMouseScroll, false );
}

function getMouseX(x) {
    const offset = window.innerWidth - SCENE.width;
    return ((x - offset) / SCENE.width) * 2 - 1;
}

function getMouseY(y) {
    return 1 - (y / SCENE.height) * 2;
}

function down(x, y) {
    console.log(x, y);
    // MOUSE.x = ((x - SCENE.width) / (window.innerWidth - SCENE.width)) * 2 - 1;
    // MOUSE.y = - (y / window.innerHeight ) * 2 + 1;
    MOUSE.x = getMouseX(x);
    MOUSE.y = getMouseY(y);
    console.log(MOUSE.x, MOUSE.y);
    console.log('------');
    SCENE.raycaster.setFromCamera(MOUSE, SCENE.camera);

    const intersects = SCENE.raycaster.intersectObjects(SCENE.meshes.GRASPObject || []);
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
    // MOUSE.x = ((x - SCENE.width) / (window.innerWidth - SCENE.width)) * 2 - 1;
    // MOUSE.y = - (y / window.innerHeight ) * 2 + 1;
    MOUSE.x = getMouseX(x);
    MOUSE.y = getMouseY(y);
    SCENE.raycaster.setFromCamera(MOUSE, SCENE.camera);

    if (DRAG_OBJECT) {
        let intersects = SCENE.raycaster.intersectObject(DRAG_OBJECT.parent.mesh);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            DRAG_OBJECT.mesh.position.copy(intersect.point.sub(OFFSET));
            DRAG_OBJECT.mesh.position.z = 0;
            DRAG_OBJECT.updateEdges();
        }
        else if (DRAG_OBJECT instanceof Node) {
            // dragging off the scope
            intersects = SCENE.raycaster.intersectObject(DRAG_OBJECT.parent.parent.mesh);
            if (intersects.length > 0) {
                const intersect = intersects[0];

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
    let node_constant = 10000;
    let scope_constant = 100000;
    let edge_constant = 0.1;
    let max_force = 100;
    let min_force = 1;
    let extension_threshold = 1;
    if (SCENE.children.Plane) SCENE.children.Plane.forEach(plane => {
        if (plane.children.Scope) plane.children.Scope.forEach(scope => {
            const scope_force = new THREE.Vector2(0, 0);
            if (scope.children.Node) scope.children.Node.forEach(node => {
                if (node !== DRAG_OBJECT) {

                    // node repellent
                    let node_force = new THREE.Vector2(0, 0);
                    scope.children.Node.forEach(sibling => {
                        if (sibling !== node) {
                            let force = new THREE.Vector2().subVectors(node.position, sibling.position);
                            let length = force.lengthSq();
                            if (length < 0.001) force.x = 1;
                            if (length < 1) length = 1;
                            force.setLength(node_constant).divideScalar(length);
                            node_force.add(force);
                        }
                    });

                    // edge spring
                    if (node.children.Arg) node.children.Arg.forEach(arg => {
                        if (arg.edge && arg.edge.parent == node.parent) {
                            let sibling_arg = arg.edge.end == arg ? arg.edge.start : arg.edge.end;
                            let sibling = sibling_arg.parent;
                            let force = new THREE.Vector2().subVectors(
                                sibling.position.clone().add(sibling_arg.position),
                                node.position.clone().add(arg.position)
                            );
                            node_force.add(force.multiplyScalar(edge_constant));
                        }
                    });

                    if (node_force.length() > max_force) node_force.setLength(max_force);
                    if (node_force.length() > min_force) {
                        const new_x = node.mesh.position.x + node_force.x;
                        const new_y = node.mesh.position.y + node_force.y;
                        const border_x = node.parent.width / 2;
                        const border_y = node.parent.height / 2;

                        if (new_x > border_x) {
                            // right overflow
                            const overflow = new_x - border_x;
                            if (overflow > extension_threshold) {
                                node.parent.extend(0, overflow, 0, 0);
                                node.mesh.position.x = new_x;
                                if (DRAG_OBJECT) OFFSET.x += overflow / 2;
                            }
                        }
                        else if (new_x < -border_x) {
                            const overflow = -border_x - new_x;
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
                            const overflow = new_y - border_y;
                            if (overflow > extension_threshold) {
                                node.parent.extend(overflow, 0, 0, 0);
                                node.mesh.position.y = new_y;
                                if (DRAG_OBJECT) OFFSET.y += overflow / 2;
                            }
                        }
                        else if (new_y < -border_y) {
                            // bottom overflow
                            const overflow = -border_y - new_y;
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
            });

            // scope repellent
            if (scope != DRAG_OBJECT) plane.children.Scope.forEach(sibling => {
                if (sibling !== scope) {
                    const force = new THREE.Vector2().subVectors(scope.position, sibling.position);
                    let length = force.lengthSq();
                    if (length < 0.001) force.x = 10;
                    if (length < 10) length = 10;
                    force.setLength(scope_constant).divideScalar(length);
                    scope_force.add(force);
                }
            });

            if (scope_force.length() > max_force) scope_force.setLength(max_force);
            if (scope_force.length() > min_force) {
                scope.mesh.position.x += scope_force.x;
                scope.mesh.position.y += scope_force.y;

                scope.updateEdges();
            }
        });
    });
}


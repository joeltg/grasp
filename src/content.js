const materials = {
    basic: color => new THREE.MeshBasicMaterial({color: color}),
    phong: color => new THREE.MeshPhongMaterial({color: color}),
    lambert: color => new THREE.MeshLambertMaterial({color: color})
};

const colors = {
    white: '#fff',
    black: '#000',
    blue: '#135',
    green: '#195'
};

class text  {
    constructor(string, size, height, color) {
        this.value = string;
        size = size || 16;
        height = height || 5;
        color = color || colors.white;
        this.geometry = new THREE.TextGeometry(string, {
            font: droid_sans_mono,
            size: size,
            height: height,
            curveSegments: 12,
            bevelEnabled: false,
            bevelThickness: 10,
            bevelSize: 8
        });
        this.geometry.computeBoundingBox();
        this.width = this.geometry.boundingBox.max.x - this.geometry.boundingBox.min.x;
        this.height = this.geometry.boundingBox.max.y - this.geometry.boundingBox.min.y;
        this.mesh = new THREE.Mesh(this.geometry, materials.lambert(color));
    }
}

class node {
    constructor(color) {
        color = color || colors.white;
        this.geometry = new THREE.SphereGeometry(12);
        this.mesh = new THREE.Mesh(this.geometry, materials.lambert(color));
    }
}

class atom {
    constructor(name, color) {
        const z = 8;

        this.height = 24;
        this.value = name;
        color = color || colors.blue;

        this.text = new text(name, this.height - 8, z + 1);

        const shape = new THREE.Shape();

        let h = this.height;
        let w = this.width = this.text.width + h / 2;
        shape.moveTo(0, h / 2);
        shape.lineTo(w, h / 2);
        shape.absarc(w, 0, h / 2, 5 * Math.PI / 2.0, 3 * Math.PI / 2.0, true);
        shape.lineTo(0, - h / 2);
        shape.lineTo(0, h / 2);

        this.geometry = new THREE.ExtrudeGeometry(shape, {
            amount: z, bevelEnabled: false, steps: 1
        });
        this.geometry.dynamic = true;

        this.mesh = new THREE.Mesh(this.geometry, materials.lambert(color));
        this.mesh.add(this.text.mesh);
        this.text.mesh.position.y -= (this.height - 8) / 2;
        this.text.mesh.position.x += h / 2;

        this.node = new node();
        this.mesh.add(this.node.mesh);
        this.node.mesh.position.z += z / 2;
    }
}

class application {
    constructor(f, args) {
        this.width = Math.max(f.object.node.width, args.fold((arg, sum) => arg.object.node.width + sum, 0));
        this.height = 36;
        this.geometry = new THREE.BoxGeometry(this.width, this.height, 8);
        this.mesh = new THREE.Mesh(this.geometry, materials.lambert(colors.green));
    }
}

class binding {
    constructor(symbol) {
        this.width = symbol.object.node.width;
        this.height = 36;
        this.geometry = new THREE.BoxGeometry(this.width, this.height, 8);
        this.mesh = new THREE.Mesh(this.geometry, materials.lambert(colors.blue));
    }
}
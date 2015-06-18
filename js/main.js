var NODES = [];
var LINKS = [];
var n = 0;

var svg = d3.select("#graph").append("svg")
    .attr("width", "100%")
    .attr("height", "100%");

var force = d3.layout.force()
    .size([600, 600])
    .gravity(0.05)
    .linkDistance(100)
    .charge(-500)
    .linkStrength(1);

// define arrow markers for graph links
svg.append("defs").selectAll("marker")
    .data(["suit", "licensing", "resolved"])
  .enter().append("marker")
    .attr("id", function(d) { return d; })
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 20)
    .attr("refY", 0)
    .attr("markerWidth", 12)
    .attr("markerHeight", 12)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5 L10,0 L0, -5")
    .style("stroke", "#4679BD")
    .style("opacity", "0.6");

var data;

d3.json("graph.json", function(error, json) {
  if (error) throw error;
  console.log(json);
  update(json);
});

function update(data) {

  if (data.nodes.length > 0) update({nodes: [], links: []});

  force
      .nodes(data.nodes)
      .links(data.links)
      .start();

  var link = svg.selectAll(".link")
      .data(data.links)

  // add new links
  link.enter().append("svg:line")
      .attr("class", "link")
      .style("marker-end",  "url(#suit)") // Modified line
  link.exit().remove();

  var node = svg.selectAll(".node")
      .data(data.nodes)

  node.enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.exit().remove();

  node.append("circle")
    .attr("r", 10.0);

  node.append("text")
      .attr("dx", 16)
      .attr("dy", ".35em")
      .text(function(d) { return d.name });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });
}

function reload() {
    var text = editor.getValue();
    getJSON(text);
    console.log(typeof NODES);
    json = {"nodes": NODES, "links": LINKS};
    console.log(json);
    update(json);
}

function getJSON(code) {
    LINKS = [];
    NODES = [];
    n = 0;
    code = code.replace("'(", "(quote ");
    code = code.replace(/(\r\n|\n|\r)/gm," ");
    while (code.indexOf("  ") > 0) code = code.replace("  ", " ");
    code = code.replace("( ", "(");
    code = code.replace(" )", ")");
    if (code.substring(0, 1) != "(" && code.substring(code.length - 2, code.length - 1) != ")") {
        code = "(" + code + ")";
    }
    parse(code, 0);
}

function parse(code) {
    console.log(code);
    code = split(code);
    var name = code[0];
    code.splice(0, 1);
    console.log("Name: " + name);
    console.log(code);
    var id = n;
    makeNode(name, id);
    var i;
    for (i in code) {
        arg = code[i];
        console.log(arg);
        n += 1;
        makeLink(n, id);
        console.log(arg.substring(0, 1));
        if (arg.substring(0, 1) === "(" && arg.substring(arg.length - 1, arg.length) === ")") {
            // Form
            console.log("Form");
            parse(arg, n);
        }
        else {
            // Atom
            console.log("Atom");
            makeNode(arg, n);
        }
    }

}

function makeNode(n, i) {
    if (n === "") n = "NIL";
    var node = {name: n, id: i};
    NODES.push(node);
}

function makeLink(s, t) {
    var link = {source: s, target: t}
    LINKS.push(link);
}

function split(code) {
    var marker = "|";

    while (code.indexOf(marker) > 0) {
        marker += "|";
    }
    console.log("Marker: " + marker);
    code = code.substring(1, code.length - 1);
    code = code.split("");
    var parens = 0;
    var c;
    for (var i in range(code.length)) {
        c = code[i];
        if (c == '(') parens += 1;
        if (c == ')') parens -= 1;
        if (c == ' ' && parens == 0) {
            code[i] = marker;
        }
    }
    code = code.join('');
    code = code.split(marker);
    return code;
}

function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
};
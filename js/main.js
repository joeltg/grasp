var width = 400,
    height = 500

var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

var force = d3.layout.force()
    .size([width, height])
    .gravity(0.05)
    .linkDistance(100)
    .charge(-500)
    .linkStrength(10);

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
    console.log(text)
    j = JSON.parse(text);
    console.log(j);
    update(j);
}
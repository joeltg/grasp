lively.require("lively.lang.Runtime").toRun(function() {

  var r = lively.lang.Runtime;
  // var project = r.Registry.default().projects["ace.improved"];
  // project.reloadAll(project, function(err) { err ? show(err.stack || String(err)) : alertOK("reloaded!"); })
  r.Registry.addProject(r.Registry.default(), {
    name: "ace.improved",
    rootDir: "/Users/robert/Lively/ace.improved",

    reloadAll: function(project, thenDo) {
      project.state = {ace: window.ace};

      var files = [
        "lib/ace.improvements.js"];

      lively.lang.fun.composeAsync(
        // function loadDeps(n) {
        //   loadFiles(["../paredit-bundle.js"], project.state, n);
        // },
        function(n) { loadProjectFiles(files, project, n); },
        function(results, n) { n(null, results); }
      )(thenDo);
    },

    resources: {
      "code": {
        matches: /(index|lib\/).*js$/,
        changeHandler: function(change, project, resource, whenHandled) {
          var state = project.state;
          evalCode(change.newSource, state, change.resourceId);
    	  whenHandled();
        }
      }
    }
  });

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function loadFiles(files, project, thenDo) {
    lively.lang.arr.mapAsyncSeries(files,
      function(fn,_,n) {
        lively.shell.cat(fn, {cwd: project.rootDir},
          function(err, c) {
            evalCode(c, project.state, fn,
              function(err, result) { n(err, result); }); });
      }, function(err, _) { thenDo && thenDo(err); });
  }

  function loadProjectFiles(files, project, thenDo) {
    lively.lang.fun.composeAsync(
      function(n) {
        lively.lang.arr.mapAsyncSeries(files,
          function(fn,_,n) {
            lively.shell.cat(fn, {cwd: project.rootDir},
            function(err, c) { n(err, {name: fn, content: c}); });
          }, n);
      },
      function(fileContents, next) {
        lively.lang.arr.mapAsyncSeries(fileContents,
          function(ea,_,n) { r.Project.processChange(project, ea.name, ea.content, n); },
          next);
      }
    )(thenDo);
  }

  function evalCode(code, state, resourceName, thenDo) {
    lively.lang.VM.runEval(code,
      {topLevelVarRecorder: state, context: state, sourceURL: resourceName},
      function(err, _result) {
    		err && show("error when updating the runtime for " + resourceName + "\n" + (err.stack || err));
    		thenDo && thenDo(err); });
  }
});

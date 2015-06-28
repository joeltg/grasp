module.exports = function (grunt) {
  grunt.initConfig({
    bower: {
      install: {
        options: {
          targetDir: 'tmp'
        }
      }
    },
    rename: {
      options: {
        ignore: true
      },
      moveThis: {
        src: 'tmp/klayjs/klay.js',
        dest: 'klay-worker.js'
      }
    },
    clean: {
     temp_dir: 'tmp'
    }
  });

  grunt.loadNpmTasks('grunt-rename');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-bower-task');

  grunt.registerTask('default', ['bower', 'rename', 'clean']);
  
};

var gulp = require('turris-gulp-tasks')([
    'serve',
    'build',
    'debug',
    'test',
    'cover',
], require('./buildConfig.js'));

gulp.task('default', ['debug', 'serve']);

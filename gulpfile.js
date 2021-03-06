const gulp = require('gulp'),
      jasmine = require('gulp-jasmine');

gulp.task('test', () =>
    gulp.src('test/**/*.spec.js')
        .pipe(jasmine({
            includeStackTrace: true,
            verbose: true
        }))
);
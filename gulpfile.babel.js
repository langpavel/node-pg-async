import babel from 'gulp-babel';
import del from 'del';
import eslint from 'gulp-eslint';
import gulp from 'gulp';
import istanbul from 'gulp-babel-istanbul';
import mocha from 'gulp-mocha';

const runEslint = () =>
  gulp.src([
    'gulpfile.babel.js',
    'src/**/*.js',
    'test/**/*.js'
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());

gulp.task('clean', () => del('lib/*'));

gulp.task('eslint', () => runEslint());

gulp.task('lint', ['eslint']);

gulp.task('test', ['eslint'], (done) => {
  gulp.src(['src/*.js'])
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', () => {
      gulp.src(['test/**/*.js'])
        .pipe(mocha({
          reporter: 'spec'
        }))
        .pipe(istanbul.writeReports()) // Creating the reports after tests ran
        .on('end', done);
    });
});

gulp.task('build', ['test'], () => {
  gulp.src('src/*.js')
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

// Default task to start development. Just type gulp.
gulp.task('default', ['build', 'test']);

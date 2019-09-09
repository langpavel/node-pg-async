import babel from 'gulp-babel';
import del from 'del';
import eslint from 'gulp-eslint';
import gulp from 'gulp';

const runEslint = () =>
  gulp
    .src(['gulpfile.babel.js', 'src/**/*.js', 'test/**/*.js'])
    .pipe(
      eslint({
        parser: 'babel-eslint',
      }),
    )
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());

gulp.task('clean', () => del('lib/*.js'));

gulp.task('eslint', () => runEslint());

gulp.task('lint', ['eslint']);

gulp.task('build', ['clean', 'lint'], () => {
  gulp
    .src('src/*.js')
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});

// Default task to start development. Just type gulp.
gulp.task('default', ['clean', 'lint', 'build']);

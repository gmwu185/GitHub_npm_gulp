var gulp = require('gulp');
const $ = require('gulp-load-plugins')();
// var jade = require('gulp-jade');
// var sass = require('gulp-sass');
// var plumber = require('gulp-plumber');
// var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require("main-bower-files");
var browserSync = require('browser-sync').create();
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');
// const imagemin = require('gulp-imagemin');

var evnOptions ={
  string: 'env',
  default: { env: "develop" }
}
var options = minimist(process.argv.slice(2), evnOptions)
console.log(options)

gulp.task("copyHTML", function(){
  return gulp.src("./source/**/*.html").pipe(gulp.dest('./output/'))
}); 

gulp.task('jade', function() {
  // var YOUR_LOCALS = {};

  gulp.src('./source/**/*.jade')
    .pipe($.plumber())
    .pipe($.jade({
      // locals: YOUR_LOCALS
      pretty : true
    }))
    .pipe(gulp.dest('./output/'))
    .pipe(browserSync.stream())
});

gulp.task('sass', function () {
  var plugins = [
    autoprefixer({browsers: ['last 3 version', '> 5%']})
  ];
  return gulp.src('./source/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    // css 已編譯完成
    .pipe($.postcss(plugins))
    .pipe($.if(options.env === 'production', $.minifyCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./output/css'))
    .pipe(browserSync.stream())
});

gulp.task('bable', () =>
  gulp.src('./source/js/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env']
    }))
    .pipe($.concat('all.js'))
    .pipe(
      $.if(options.env === 'production', $.uglify({
          compress: {
            drop_console: true
          }
        })
      )
    )
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./output/js'))
    .pipe(browserSync.stream())
);

gulp.task('bower', function() {
  return gulp.src(mainBowerFiles())
    .pipe(gulp.dest('./.tmp/vendors'))
    .pipe($.uglify())
});

gulp.task('vendorJs', ["bower"], function(){
  return gulp.src('./.tmp/vendors/**/**.js')
    .pipe($.concat('vendors.js'))
    .pipe($.uglify())
    .pipe(gulp.dest('./output/js'))
});

gulp.task('clean', function () {
  return gulp.src(['./.tmp', '/output'], {read: false})
    .pipe($.clean());
});

// Static server
gulp.task('browser-sync', function() {
  browserSync.init({
    server: {
      baseDir: "./output"
    },
    reloadDebounce: 2000
    // 此段加入以後，重新整理的間隔必須超過 2 秒，可以依據需求調整使用
  });
});

gulp.task("image-min", () =>
  gulp.src("./source/img/*")
    .pipe($.if(options.env === "production", $.imagemin()))
    .pipe(gulp.dest('./output/img'))
)

gulp.task('watch', function () {
  gulp.watch('./source/scss/**/*.scss', ['sass']);
  gulp.watch('./source/js/**/*.js', ['bable']);
  gulp.watch('./source/*.jade', ['jade']);
});


gulp.task('build', gulpSequence('clean', 'jade', 'sass', 'bable', 'vendorJs'));

// gulp.task("default", ["jade", "sass", "bable", "watch", "bower", "vendorJs"]);
gulp.task("default", ["jade", "sass", "vendorJs", "browser-sync", "image-min", "watch"]);
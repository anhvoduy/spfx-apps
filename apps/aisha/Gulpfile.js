var gulp = require('gulp');
var args = require('yargs').argv;
var del = require('del');
// load by auto by lazy
var $ = require('gulp-load-plugins')({lazy: true});
var config = require('./gulp.config')();

function log(msg){    
    if(typeof(msg)==='object'){
        for(var item in msg){
            if(msg.hasOwnProperty(item)){
                $.util.log($.util.colors.green(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.green(msg));
    }
};

// verify code js by convention rules
gulp.task('verify-code', function(){
    log('Analyzing source with JSHint and JSCS');
    return gulp
            .src(config.appJs)
            .pipe($.if(args.verbose, $.print()))
            .pipe($.jscs())
            .pipe($.jshint())
            .pipe($.jshint.reporter('jshint-stylish',{verbose: true}))
            .pipe($.jshint.reporter('fail'));
});


// compile css & js to build folder
gulp.task('build-lib-css', function(){
    log('compiling libs Css');
});

gulp.task('build-app-css', function(){
    log('compiling app Css');
});

gulp.task('build-css', function(){
    log('start to compile Less -> Css');
    
    return gulp
            .src(config.appCss)
            .pipe($.plumber())            
            .pipe($.less())
            .pipe($.autoprefixer({browers:['last 2 version', '> 5%']}))
            .pipe($.csso())
            .pipe(gulp.dest(config.buildCss));
});

gulp.task('build-lib-js', function(){
    log('compiling libs Js');
    return gulp
            .src(config.libJs)
            .pipe($.plumber())
            .pipe($.concat('libs.js'))
            .pipe($.uglify())
            .pipe(gulp.dest(config.buildJs));    
});

gulp.task('build-app-js', function(){
    log('compiling app Js');
    return gulp
            .src(config.appJs)
            .pipe($.plumber())
            .pipe($.concat('app.js'))
            .pipe($.uglify())
            .pipe(gulp.dest(config.buildJs));
});

gulp.task('build-js', [ 
    // 'build-lib-js',
    'build-app-js'
    ], function(){
    log('start to compile Js files');
});

// clean css & js in build folder
function cleanUp(path, done){
    log('cleaning path:' + path);
    del(path, done);
};

gulp.task('clean-css', function(done){
    log('clean Css in build folder');
    var files = config.buildCss + '/*.css';    
    cleanUp(files, done);
});

gulp.task('clean-js', function(done){
    log('clean Js in build folder');
    var files = config.buildJs + '/*.js';
    cleanUp(files, done);
});

// watch css & js from dev -> build
gulp.task('watcher-css', function(){
    gulp.watch([config.appCss], ['clean-css', 'build-css']);
});

gulp.task('watcher-js', function(){
    gulp.watch([config.appJs], ['clean-js', 'build-js']);
});

gulp.task('watcher-all', ['watcher-css', 'watcher-js'], function(){
    log('watcher all: css, js');
});

// Automation Build: clean -> build
gulp.task('run-all', ['clean-css', 'clean-js', 'build-css', 'build-js'], function(){
    log('run all');
});


// load by manually: checkcode()
//var jshint = require('gulp-jshint');
//var jscs = require('gulp-jscs');
//var stylish = require('jshint-stylish');
//var util = require('gulp-util');
//var gulpPrint = require('gulp-print');
//var gulpIf = require('gulp-if');

//function log(msg){
//    //console.log(msg);
//    if(typeof(msg)==='object'){
//        for(var item in msg){
//            if(msg.hasOwnProperty(item)){
//                util.log(util.colors.green(msg[item]));
//            }
//        }
//    } else {
//        util.log(util.colors.green(msg));
//    }
//}

//gulp.task('checkcode', function(){
//    log('Analyzing source with JSHint and JSCS');
//    return gulp
//        .src([
//            './js/**/*.js',
//        ])
//        .pipe(gulpIf(args.verbose, gulpPrint()))
//        //.pipe(gulpPrint())
//        .pipe(jscs())
//        .pipe(jshint())
//        .pipe(jshint.reporter('jshint-stylish',{verbose: true}))
//        .pipe(jshint.reporter('fail'));
//});
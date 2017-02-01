var gulp = require('gulp');
var args = require('yargs').argv;
var del = require('del');
var $ = require('gulp-load-plugins')({lazy: true}); // load by auto by lazy
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
    log('compiling libs css:' + 'libs.min.css');
    //TO DO: compress file: libs.min.css
});

gulp.task('build-app-css', function(){
    log('compiling app css:' + 'app.min.css');    
    return gulp
            .src(config.appCss)
            .pipe($.plumber())            
            .pipe($.less())
            .pipe($.autoprefixer({browers:['last 2 version', '> 5%']}))
            .pipe($.concat('app.min.css'))
            .pipe($.csso())
            .pipe(gulp.dest(config.buildCss));
});

gulp.task('build-lib-js', function(){
    log('compiling libs js:' + 'libs.min.js');
    return gulp
            .src(config.libJs)
            .pipe($.plumber())
            .pipe($.concat('libs.min.js'))
            .pipe($.uglify())
            .pipe(gulp.dest(config.buildJs));    
});

gulp.task('build-app-js', function(){
    log('compiling app js:' + 'app.min.js');
    return gulp
            .src(config.appJs)
            .pipe($.plumber())
            .pipe($.concat('app.min.js'))
            .pipe($.uglify())
            .pipe(gulp.dest(config.buildJs));
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
    gulp.watch([config.appCss], ['clean-css', 'build-app-css']);
});

gulp.task('watcher-js', function(){
    gulp.watch([config.appJs], ['clean-js', 'build-app-js']);
});


// Automation Build: clean -> build || watcher
gulp.task('run-all', ['clean-css', 'clean-js', 'build-app-css', 'build-app-js'], function(){
    log('run all: css, js');
});

gulp.task('watcher-all', ['watcher-css', 'watcher-js'], function(){
    log('watcher all: css, js');
});

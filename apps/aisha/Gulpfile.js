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

// check code js by convention rules
gulp.task('checkcode', function(){
    log('Analyzing source with JSHint and JSCS');
    return gulp
            .src(config.allJs)
            .pipe($.if(args.verbose, $.print()))
            .pipe($.jscs())
            .pipe($.jshint())
            .pipe($.jshint.reporter('jshint-stylish',{verbose: true}))
            .pipe($.jshint.reporter('fail'));
});


function errorLogger(error){
    log('------ Start of Error -----');
    log(error);
    log('------ End of Error -----');
    this.emit('end');
};

// build css & js to temporary folder
gulp.task('build-css', function(){
    log('compiling Less -> Css');

    return gulp
            .src(config.allCss)
            .pipe($.plumber())
            .pipe($.less())
            //.on('error', errorLogger)
            .pipe($.autoprefixer({browers:['last 2 version', '> 5%']}))
            .pipe(gulp.dest(config.tempCss));
});

gulp.task('build-js', function(){
    log('compiling Js');
});

//gulp.task('build-all', ['build-css', 'build-js'], function(){
//    log('compile all Css & Js');
//})


// clean up files
function cleanUp(path, done){
    log('cleaning path:' + path);
    del(path, done);
};

// clean css & js in temporary folder
gulp.task('clean-css', function(done){
    log('clean Css in temporary');
    var files = config.tempCss + '/*.css';    
    cleanUp(files, done);
});

gulp.task('clean-js', function(done){
    log('clean Js in temporary');
    var files = config.tempJs + '/*.js';
    cleanUp(files, done);
});

//gulp.task('clean-all', ['clean-css', 'clean-js'], function(){
//    log('clean all Css & Js');
//});


// run all automation build
gulp.task('run-all', ['clean-css', 'clean-js', 'build-css', 'build-js'], function(){
    log('run all');
});


// watch to make sure automation build
gulp.task('css-watcher', function(){
    gulp.watch([config.allCss], ['clean-css', 'build-css']);
});

gulp.task('js-watcher', function(){
    gulp.watch([config.allCss], ['clean-js', 'build-js']);
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
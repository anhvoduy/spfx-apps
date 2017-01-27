var gulp = require('gulp');
var args = require('yargs').argv;
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
}

gulp.task('checkcode', function(){
    log('Analyzing source with JSHint and JSCS');
    return gulp
            .src(config.alljs)
            .pipe($.if(args.verbose, $.print()))
            .pipe($.jscs())
            .pipe($.jshint())
            .pipe($.jshint.reporter('jshint-stylish',{verbose: true}))
            .pipe($.jshint.reporter('fail'));
});


// load by manually
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
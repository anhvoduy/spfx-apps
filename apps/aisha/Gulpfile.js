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

gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

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
gulp.task('build-css', function(){
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

gulp.task('build-css-lib', function(){
    log('compiling libs css:' + 'libs.min.css');
    //TO DO: compress file: libs.min.css
});

gulp.task('build-font', function(){
    log('copying fonts');

    return gulp
            .src(config.fonts)
            .pipe(gulp.dest(config.buildFont));
});

gulp.task('build-img', function(){
    log('copying images & compression');

    return gulp
            .src(config.images)
            .pipe($.imagemin({ optimizationLevel: 4 }))
            .pipe(gulp.dest(config.buildImg));
});

gulp.task('buid-html', function(){
	log('compiling html template cache');	
	return gulp
			.src(config.appHtml)
			.pipe(gulp.dest(config.buildHtml));
});

gulp.task('build-js', function(){
    log('compiling js:' + 'app.min.js');
    return gulp
            .src(config.appJs)
            .pipe($.plumber())
            .pipe($.concat('app.min.js'))
            .pipe($.uglify())
            .pipe(gulp.dest(config.buildJs));
});

gulp.task('build-js-lib', function(){
    log('compiling js library:' + 'libs.min.js');
    return gulp
            .src(config.libJs)
            .pipe($.plumber())
            .pipe($.concat('libs.min.js'))
            .pipe($.uglify())
            .pipe(gulp.dest(config.buildJs));    
});

// clean css & js in build folder
function cleanUp(path, done){
    log('cleaning path:' + path);
    del(path, done);
};

gulp.task('clean-css', function(done){
    log('clean Css in folder:' + config.buildCss);    
    cleanUp(config.buildCss + '/*.css', done);
});

gulp.task('clean-font', function(done){    
    log('clean Fonts in folder:' + config.buildFont);
    cleanUp(config.buildFont, done);
});

gulp.task('clean-img', function(done){    
    log('clean Images in folder:' + config.buildImg);    
    cleanUp(config.buildImg, done);
});

gulp.task('clean-html', function(done){
    log('clean html in folder:' + config.buildHtml);
    cleanUp(config.buildHtml + '/*.html', done);
});

gulp.task('clean-js', function(done){
    log('clean Js in folder:' + config.buildJs);    
    cleanUp(config.buildJs + '/*.js', done);
});

// watch css, font, image, js from dev -> build
gulp.task('watcher-css', function(){
    gulp.watch([config.appCss], ['clean-css', 'build-css']);
});

gulp.task('watcher-js', function(){
    gulp.watch([config.appJs], ['clean-js', 'build-js']);
});


// Automation Build: clean -> build || watcher
gulp.task('clean-all', function(done){
    var path = [].concat(config.build, config.temp);   
    log('clean all');
    del(path, done);
});

gulp.task('build-all', [
    'clean-css', 'clean-font', 'clean-img', 'clean-html', 'clean-js',
    'build-css', 'build-font', 'build-img', 'buid-html', 'build-js'
    ], function(){
        log('build all: css, font, img, js, html');
});

gulp.task('watcher-all', ['watcher-css', 'watcher-js'], function(){
    log('watcher all: css, js');
});

open command prompt in aisha folder:

To install gulp, bower locally: (dependecies/devDependencies)	
	npm install body-parser --save
	npm install compression --save
	npm install cors --save
	npm install express --save
	npm install morgan --save
	npm install serve-favicon --save
		
	npm install bower --save-dev
	npm install gulp  --save-dev
	npm install gulp-load-plugins  --save-dev
	npm install gulp-jshint  --save-dev
	npm install gulp-jscs  --save-dev
	npm install gulp-util  --save-dev
	npm install gulp-print  --save-dev
	npm install gulp-if  --save-dev
	npm install jshint-stylish  --save-dev	
	
	npm install gulp-less --save-dev
	npm install gulp-autoprefixer --save-dev
	npm install gulp-plumber --save-dev
	
	npm install gulp-filter --save-dev
	npm install gulp-csso --save-dev
	npm install gulp-uglify --save-dev
	npm install gulp-concat --save-dev
	
	npm install gulp-task-listing --save-dev
	npm install gulp-imagemin --save-dev	
	
	npm install concat --save-dev
	npm install jshint --save-dev
	npm install uglify --save-dev
	npm install yargs --save-dev
	npm install del --save-dev	
	npm install plumber --save-dev
	
	
	npm install serve-favicon -save
	npm install compression -save
	npm install imagemin --save
	npm install imagemin-jpegoptim --save
	npm install imagemin-jpeg-recompress --save
	
To verify installation
	gulp -v
	bower -v
	npm list  --deepth=0
  

To describe Gulp: work like a stream pipe from src to dest
Gulp APIs:
    - gulp.task
	- gulp.src
	- gulp.dest
	- gulp.task
  
To describe some javascript libraries:
	JsHint: javascript code analysis -> use to detect errors and potential problems
	JSCS: javascript code style checker
--> rule files: define JsHint & JSCS rules: .jshintrc, .jscsrc


To describe build Assets & keeping organize structure
	task listing & default tasks
	image compression
	copy fonts & css

To describe inject Html: 


To describe Minifying & Filtering
	- filter assets and minify them
	- remmove white spaces and comments
	- mangles code
	- optimize and reduce file sizes
 libraries:
	- gulp-filter: 
	- gulp-csso (Css Optimizer): remove whitespaces and comments, trailing semicolons, transformation, structural optimization
	- gulp-uglify: minifies Java Script, remove whitespaces and comments, mangles Java Script
	
module.exports = function(){
    var temp = './temp/';
    var build = './build/';

    var config = {
        /**
         * files path
         */
        // lib & app js files
        libJs:[
            './libs/**/*.js',
            './libs/*.js'                
        ],        
        appJs:[
            './js/**/*.js',
            './js/*.js'
        ],        
        // lib & app css files
        libCss:[
            './libs/**/*.css',
            './libs/*.css'
        ],
        appCss:[            
            './css/custom.css'
        ],
        // fonts
        fonts:[
            './fonts/*',
        ],
        // images
        images:[
            './images/*',
        ],


        // temporary folder
        temp: temp,        
        //tempCss: temp + 'css',
        //tempFont: temp + 'font',
        //tempImage: temp + 'img',
        //tempJs: temp + 'js',

        // build folder
        build: build,
        buildCss: build + 'css',
        buildFont: build + 'font',
        buildImg: build + 'img',
        buildJs: build + 'js'
    }
    return config;
};
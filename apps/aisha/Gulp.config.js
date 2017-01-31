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
            './css/**/*.css',
            './css/*.css'
        ],


        // temporary folder
        //temp: temp,        
        //tempCss: temp + 'css',
        //tempJs: temp + 'js',

        // build folder
        build: build,
        buildCss: build + 'css',
        buildJs: build + 'js'        
    }
    return config;
};
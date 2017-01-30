module.exports = function(){
    var temp = './temp/';
    var run = './run/';

    var config = {
        /**
         * files path
         */
        // all js files
        allJs:[
            './js/**/*.js',
            './js/*.js'
        ],

        allCss:[
            './css/**/*.css'                
        ],


        // temporary
        temp: temp,        
        tempCss: temp + 'css',
        tempJs: temp + 'jss',

        // release
        run: run,        
        runCss: run + 'css',
        runJs: run + 'js'
    }
    return config;
};
module.exports = function(){
    var temp = './temp/';
    var run = './run/';

    var config = {
        /**
         * files path
         */
        // all js files
        alljs:[
            './js/**/*.js',
            './js/*.js'
        ],

        less:[
            './css/**/*.css'                
        ],


        // temporary        
        tempCss: temp + 'css',
        tempJs: temp + 'jss',

        // release        
        runCss: run + 'css',
        runJs: run + 'js'
    }
    return config;
};
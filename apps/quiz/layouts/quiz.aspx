<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <title>Quiz</title>

    <!-- reference css -->
    <link href="/Style%20Library/apps/quiz/libs/bootstrap/css/bootstrap.min.css" rel="stylesheet">
    <!-- app -->
    <link href="/Style%20Library/apps/quiz/css/app.css" rel="stylesheet">    
</head>

<body>
    <div class="jumbotron">
        <div class="container">
            <h1>Author Book</h1>
            <p>select the book written by Author</p>
        </div>
    </div>
    
    <div class="container">
        <div id="app">
            <!-- This div's content will be managed by React. -->
        </div>
    </div>
    
    <div class="footer">
        <div class="container">
            <p class="credit text-muted">
                All images from <a href="http://laptrinh365.com">laptrinh365.com</a> 
                <br />
                React's CopyRight 2017
            </p>            
        </div>        
    </div>

    <!-- load from CDN: react, babel -->
    <script src="https://unpkg.com/react@15/dist/react.min.js"></script>
    <script src="https://unpkg.com/react-dom@15/dist/react-dom.min.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>    

    <!-- reference libraries -->
    <script src="/Style%20Library/apps/quiz/libs/jquery/jquery-1.11.3.min.js" type="text/javascript"></script>
    <script src="/Style%20Library/apps/quiz/libs/bootstrap/js/bootstrap.min.js" type="text/javascript"></script>
    <script src="/Style%20Library/apps/quiz/libs/lodash/lodash.min.js" type="text/javascript"></script>   

    <!--app -->    
    <script src="/Style%20Library/apps/quiz/app/app.js" type="text/babel"></script>
    <!--<script src="/Style%20Library/apps/quiz/app/sample.js" type="text/babel"></script>-->
</body>
</html>
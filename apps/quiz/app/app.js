/** JSX React.DOM */
(function(){
    'use strict';
    var postData = {
      title: 'React Js',
      questions:[
        { 
            name: 'What is react js?',
            answer: 'Java Script from FaceBook'
        },
        { 
            name: 'How to use react js?',
            answer: 'Very fast rendering & support Virtual DOM' 
        },
        { 
            name: 'Comparision between: react + angular + ember + knockout',
            answer: 'React Js is best'
        }
      ]
    };    

    var Quiz = React.createClass({
        render: function(){
            return (
              <div>
                <h3>Demo - Quiz: {this.props.data.title} </h3>                
              </div>
            );
        }
    });

    ReactDOM.render(
        <Quiz data={postData}></Quiz>,
        document.getElementById('app')
    );
})();
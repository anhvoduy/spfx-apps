/* Sample
ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('root')
);
*/

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

    var QuizQuestion = React.createClass({
        render: function(){
          return (
            <div>
              <span>- Question: {this.props.question.name}</span>
              <br/>
              <QuizAnswer answer={this.props.question.answer}></QuizAnswer>
            </div>
          );
        }
    });

    var QuizAnswer = React.createClass({
        render: function(){
          return (
            <div>--> Answer: {this.props.answer}</div>
          );
        }
    });

    var Quiz = React.createClass({
        render: function(){
            return (
              <div>
                <h3>TEST - Quiz: {this.props.data.title} </h3>                
                <QuizQuestion question={ this.props.data.questions[0] } />
                <QuizQuestion question={ this.props.data.questions[1] } />
                <QuizQuestion question={ this.props.data.questions[2] } />
              </div>
            );
        }
    });

    ReactDOM.render(
        <Quiz data={postData}></Quiz>,
        document.getElementById('root')
    );
})();
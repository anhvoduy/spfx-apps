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
      versions:[
        { name: 'version 1' },
        { name: 'version 2' },
        { name: 'version 3' }        
      ]
    };

    var QuizDetail = React.createClass({
        render: function(){
          return (<div>- Quiz Detail: {this.props.content}</div>);
        }
    });

    var Quiz = React.createClass({
        render: function(){
            return (
              <div>
                <h3>TEST - Quiz: {this.props.data.title} </h3>                
                <QuizDetail content={ this.props.data.versions[0].name } />
                <QuizDetail content={ this.props.data.versions[1].name } />
                <QuizDetail content={ this.props.data.versions[2].name } />
              </div>
            );
        }
    });

    ReactDOM.render(
        <Quiz data={postData}></Quiz>,
        document.getElementById('root')
    );
})();
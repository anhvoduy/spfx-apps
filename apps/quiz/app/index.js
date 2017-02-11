/* Sample
ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('root')
);
*/

/** JSX React.DOM */
(function(){
    'use strict';

    var Quiz = React.createClass(
      {
        render: function(){
            return <div>TEST: { this.props.data }</div>
        }
      }
    );

    ReactDOM.render(
        <Quiz data={"foo"}/>,
        document.getElementById('root')
    );
})();
"use strict";
var MsgCopyRight = React.createClass({
	displayName: "Msg CopyRight",
	render: function render() {
		return React.createElement("div",null,"CopyRight ",this.props.name);
	}
});

ReactDOM.render(React.createElement(MsgCopyRight, { name: "2017-08-01 - Vo Duy Anh" }), document.getElementById('aisha'));


(function(){
	"use strict";

	var Welcome = function(props){
		return <span>Hello, {props.name}</span>;
	}

	var element = (
		<div class="background: #232323;">
			<Welcome name="Vo Duy Anh"/>
			<br></br>
			<span>It is {new Date().toLocaleTimeString()}.</span>
		</div>
	);	
	ReactDOM.render(element, document.getElementById('aisha'));

})();


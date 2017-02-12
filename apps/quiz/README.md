open command prompt in quiz folder:
	npm install --save react react-dom
	npm install babel-preset-env --save-dev
	npm --version

----------------------------React Component Definition-------------------------------	
DOM: Document Object Model
	Model + Component = DOM
	Component -> Virtual DOM Component
	Nested Component -> Nested Virtual DOM Component
	
Render Component:
	Render a Component means linking it to a DOM element and populate that DOM element

Props are supplied as attributes
	
To composse component:
	a component can be nested inside other components

State
	used when a component needs to change independently of its parents
	components with state have more complexity

getInitialState
	getInitialState allows a component to populate its initial state
	
setState
	setState is the function used to update the state of a component
	setState merges the new state with the old state
	
	previous State + setState = newState

getDefaultProps
	getDefaultProps specifies property values to use if they are not explicitly supplied
	
validateProperties
	validate Props with propTypes
	supports validation of existence, data type or a custom condition
	
Mixins
	Mixins allows common code to be merged into many components

----------------------------Summary React Component -------------------------------
	used to build block in React Application
	is composable
	map to equivalent DOM nodes
	createClass define components
	render(): render a component definition into the DOM
	Props provide the immutable data for a component
	State provides multable data for a component
	propTypes allows basic validation of props
	Mixins allow reusable code between components
	
----------------------------Decide to use JSX for React Component -------------------------------
	
JSX for Custom React Component
		JSX								JavaScript
		<Hello />        ------->       Hello(null)
JSX Compiler
		var jsx = <Hello />			------->		var jsx = Hello(null)
		var jsx = <div />			------->		var jsx = div(null)		
JSX for HTML Component
		<div />						------->		React.DOM.div(null)
		
HTML custom attributes
	<div myCustomAttribute="foo" />		<-- won't work
	<div data-myAttribute="foo" />		<-- will work
	--> attributes can not use javascript reserved words
	link: http://www.w3schools.com/js/js_reserved.asp

JSX Summary:
	- JSX is the default syntax and pre-processor for React
	- JSX is optional solution
	- Elements are translated to function calls
	- Attributes:
		+ Cannot be JavaScript reserved words
		+ The values can be string or JavaScript expressions
	- Transformation can be:
		+ Just In Time
		+ PreCompiled by react-tools
	- Child expressions allow dynamic component nesting
	- use dangerouslySetInnerHTML to unescape content
	
	
	
	
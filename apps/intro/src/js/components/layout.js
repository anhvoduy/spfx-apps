import React from "react";
import Footer from "./footer";
import Header from "./header";

export default class Layout extends React.Component {
	constructor(){
		super();
		this.state = {
			title: "Welcome React Js Tutorial",
			footer: "Copyright React Js 2017"
		};
	}
	
	changeTitle(title){
		this.setState({title});
	}
	
	render(){
		return (
			<div>
				<Header changeTitle={this.changeTitle.bind(this)} title={this.state.title} />
				<Footer footer={this.state.footer} />
			</div>
		);
	}
}
import React from "react";
import Footer from "./footer";
import Header from "./header";

export default class Layout extends React.Component {
	constructor(){
		super();
		this.state = {
			name: 'IBM T60',
			title: "Welcome React Js Tutorial",
			footer: "Copyright React Js 2017"
		};
	}
	
	changeTitle(title){
		this.setState({title});
	}
	
	render(){
		setTimeout(() => {			
			this.setState({name: 'Sony Vaio 2020'});
		}, 2000)
		return (
			<div>
				{this.state.name}
				<Header changeTitle={this.changeTitle.bind(this)} title={this.state.title} />
				<Footer footer={this.state.footer} />
			</div>
		);
	}
}
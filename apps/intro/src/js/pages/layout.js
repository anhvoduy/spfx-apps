import React from "react";
import { Link } from "react-router";

import Footer from "../components/layout/footer";
import Nav from "../components/layout/nav";

export default class Layout extends React.Component {
	render() {
        const { location } = this.props;
        const containerStyle = {
            marginTop: "60px"
        };
        console.log(' layout ');

		return (
            <div>                
                <Nav location={location} />
                <div class="container" style={containerStyle}>
                    <div class="row">
                        <div class="col-lg-12">
                            <h1>laptrinh365.com</h1>
                            {this.props.children}
                        </div>
                    </div>
                    
                    <Footer/>

                    {/*
                        <h1>laptrinh365.com</h1>
                        { this.props.children }
                        <Link to="archived">archived</Link>
                        <Link to="settings">settings</Link>
                    */}
                </div>
            </div>            
		);
	}
}


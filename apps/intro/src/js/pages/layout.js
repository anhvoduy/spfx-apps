import React from "react";
import { Link } from "react-router";

export default class Layout extends React.Component {
	render() {
		return (
            <div>
                <h1>laptrinh365.com</h1>
                { this.props.children }
                <Link to="archived">archived</Link>
                <Link to="settings">settings</Link>
            </div>			
		);
	}
}


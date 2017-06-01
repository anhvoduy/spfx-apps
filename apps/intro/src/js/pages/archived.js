import React from "react";

import Article from "../components/article";

export default class Archived extends React.Component {
	render() {
		const { query } = this.props.location;
    	const { params } = this.props;
    	const { article } = params;
    	const { date, filter } = query;

		const Articles = [
			"Some Article",
			"Some Other Article",
			"Yet Another Article",
			"Still More",
			"Fake Article",
			"Partial Article",
			"American Article",
			"Mexican Article",
		].map((title, i) => <Article key={i} title={title}/> );

		return (
			<div>
				<h1>Archived</h1>
				article: {article}, date: {date}, filter: {filter}
				<div class="row">{Articles}</div>
			</div>			
		);
	}
}


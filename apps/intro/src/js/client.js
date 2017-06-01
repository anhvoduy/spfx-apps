import React from "react";
import ReactDOM from "react-dom";
import { Router, Route, IndexRoute, hashHistory } from "react-router";

import Bootstrap from "./vendor/bootstrap-without-jquery";

import Archived from "./pages/archived";
import Featured from "./pages/featured";
import Layout from "./pages/layout";
import Settings from "./pages/settings";

const app = document.getElementById('app');

//ReactDOM.render(<Layout/>, app);
ReactDOM.render(
    <Router history={hashHistory}>
        <Route path="/" component={Layout}>
            <IndexRoute component={Featured}></IndexRoute>
            <Route path="archived" name="archived" component={Archived}></Route>
            <Route path="settings" name="settings" component={Settings}></Route>
            <Route path="layout" name="layout" component={Layout}></Route>
        </Route>
    </Router>
, app);
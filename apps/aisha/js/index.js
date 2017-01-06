//SpEncounters namespace
var SpEncounters = SpEncounters || {};

SpEncounters.GetFollowedSites = (function () {
    
 var Main = React.createClass({
    getInitialState: function(){
      //we store the information we want to render in the state of the component
      return {sites:[]};
    }, 
    componentWillMount: function(){
      //execute this method before to mount the component
      //here in this case is where I'm going to include the call to the api
      //to get the Followed sites for the connected user
      var component = this;
      //call the Rest API to get the sites
      jQuery.getJSON(_spPageContextInfo.webAbsoluteUrl + "/_api/social.following/my/followed(types=4)", function(data) {
        //in the data object there is an array with the info about the followed docs
        //we assign it to the sites array in the state
        component.setState({sites: data.value});
      });
    },
    render: function(){
      //in the render method, we get the sites array and format ir using the map function
      //the map function get each element of the array, apply the logic we pass as a param
      //and return a new array with the all the elements after applying the method
      var siteReact = this.state.sites.map(function(site){
        //I apply some Office UI Fabric styles to the elements
        //We don't have a lot of information about the followed sites, only the name and the url
        //and some more data just in case we want to implement the unfollow action in our interface
        //We are not using JSX, which in React allow us to include directly the html in our javascript
        //Here we use the createElement methods to generate the html
        var linkSite = React.createElement('a', { href: site.ContentUri }, site.ContentUri);
        var spanPrimary = React.createElement('span', { className: 'ms-ListItem-primaryText' }, site.Name);
        var spanSecondary = React.createElement('span', { className: 'ms-ListItem-secondaryText' }, linkSite);                
        
        return React.createElement('div', { className: 'ms-ListItem is-unread is-selectable' }, spanPrimary, spanSecondary)
       })
       //We create here one parent div. Under this div we have all the followed docs
       return React.createElement('div', null, siteReact);
     }
 })


 var init = function () {
   //Init method called to the render method of the component
   React.render(React.createElement(Main, null), document.getElementById("followedDocs"));
 }

 return {
   Init: init
 }
	
})();
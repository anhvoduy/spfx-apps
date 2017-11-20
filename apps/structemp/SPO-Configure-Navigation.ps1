[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Runtime")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.DocumentManagement")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Publishing")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Taxonomy")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Search")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.UserProfiles")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.WorkflowServices")

$SiteUrl = "https://structemp.sharepoint.com/sites/Projects/"
$AdminUsername = "IT.Admin@structemp.co.uk"

Write-Host "Please enter password for $($SiteUrl):"
#$AdminPassword = Read-Host -AsSecureString
$AdminPassword = "sonyv@io2020"
$AdminPassword = ConvertTo-SecureString $AdminPassword -AsPlainText -Force
#https://www.sharepoint-journey.com/adding-links-to-global-navigation-in-Office-365-using-powershell-and-csom.html

# Default Language is English
$lcid = "1033"


# connect/authenticate to SharePoint Online and get ClientContext object.. 
$ctx = New-Object Microsoft.SharePoint.Client.ClientContext($SiteUrl)
$credentials = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($AdminUsername, $AdminPassword)
$ctx.Credentials = $credentials


function Get-SPOContext([string]$Url,[string]$UserName,$SecurePassword){
   $context = New-Object Microsoft.SharePoint.Client.ClientContext($Url)   
   $credentials = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($UserName, $SecurePassword)
   $context.Credentials = $credentials
   return $context
}

function FindNavigationNodeByTitle([Microsoft.SharePoint.Client.NavigationNodeCollection] $nodeCollection, [String]$title){
    try
    {
        Write-Host "- Start querying FindNavigationNodeByTitle() by Title:" $title -ForegroundColor Cyan;
        $context = $nodeCollection.Context;
        $context.Load($nodeCollection);
        $context.ExecuteQuery();
        $node = $nodeCollection | Where-Object { $_.Title -eq $title };
        return $node;
    }
    catch{
        Write-Host "Error while select FindNavigationNodeByTitle():" $_.Exception.Message -ForegroundColor Red
    }    
}

function AddNavigationSubNode([Microsoft.SharePoint.Client.NavigationNode]$parentNode,[string]$title,[string]$url){
    try
    {
        Write-Host "- Start executing AddNavigationSubNode() with Title:" $title -ForegroundColor Cyan;
        Write-Host "- Title:" $title;
        Write-Host "- Link:" $url;
        $context = $parentNode.Context;
        $node = New-Object Microsoft.SharePoint.Client.NavigationNodeCreationInformation;
        $node.Title = $title;
        $node.Url = $url;
        $node.AsLastNode = $true;
        $context.Load($parentNode.Children.Add($node));
        $context.ExecuteQuery();
        Write-Host "- Executed AddNavigationSubNode() with Title:" $title " success" -ForegroundColor Green
    }
    catch{
        Write-Host "Error while executing AddNavigationSubNode() with Title:" $_.Exception.Message -ForegroundColor Red
    }
}

function AddNavigationNode([Microsoft.SharePoint.Client.NavigationNodeCollection]$navigationBar,[string]$title,[string]$url){
    try
    {
        Write-Host "- Start executing AddNavigationNode() with Title:" $title -ForegroundColor Cyan;
        Write-Host "- Title:" $title;
        Write-Host "- Link:" $url;
        $context = $navigationBar.Context;
        $node = New-Object Microsoft.SharePoint.Client.NavigationNodeCreationInformation;
        $node.Title = $title;
        $node.Url = $url;
        $node.AsLastNode = $true;        
        $context.Load($navigationBar.Add($node));
        $context.ExecuteQuery();
        Write-Host "- Executed AddNavigationNode() with Title:" $title " success" -ForegroundColor Green
    }
    catch{
        Write-Host "Error while executing AddNavigationNode() with Title:" $_.Exception.Message -ForegroundColor Red
    }
}


function Update-Global-Navigation($web){
    Write-Host " 2.Start to update GlobalNavigation at sub site:" $web.Title -ForegroundColor Magenta

    $context = Get-SPOContext -Url $web.Url -UserName $AdminUsername -SecurePassword $AdminPassword
    Write-Host "- authenticate to SharePoint Online success at Url:" $web.Url -ForegroundColor Green

    $topNavigationBar = $context.Web.Navigation.TopNavigationBar
    $context.Load($topNavigationBar)
    $context.ExecuteQuery()    
    Write-Host "- loading TopNavigationBar success with TopNavigationBar.Count(s):" $topNavigationBar.Count
    #Write-Host "- QuickLaunch.AreItemsAvailable:" $quickLaunch.AreItemsAvailable

    # clean up old TopNavigationBar
    if($topNavigationBar.AreItemsAvailable -eq $true -and $topNavigationBar.Count -gt 0){        
        do
        {                        
            [Microsoft.SharePoint.Client.NavigationNode] $topNavigationItem = $topNavigationBar[0];
            Write-Host "- clean up topNavigationItem.Title:" $topNavigationItem.Title;
            $topNavigationItem.DeleteObject();
            $context.ExecuteQuery();
        }
        while($topNavigationBar.Count -gt 0);
        Write-Host "- clean up TopNavigationBar is success" -ForegroundColor Green
    }

    # looking for TopNavigationBar from xml definition
    Write-Host "- looking for TopNavigationBar from xml definition"
    $isGlobalNavigation = $false;
    $globalNavigation = {};
    $xmlContent.sites.site | ForEach-Object {
        # format url before comparison
        if($_.Url.LastIndexOf('/')){
            $_.Url = $_.Url.TrimEnd('/');
        }

        if($_.Url -eq $web.Url){
            Write-Host '- Found xml definition for site collection:' $_.Url -ForegroundColor Yellow;
            $isGlobalNavigation = $true;
            $globalNavigation = $_.globalnav;
        }
    }

    # update TopNavigationBar from xml definition
    if($isGlobalNavigation -eq $true -and $globalNavigation.ChildNodes.Count -gt 0){
        $globalNavigation.ChildNodes | ForEach-Object{
            # update TopNavigationBar.Items from xml definition            
            AddNavigationNode -navigationBar $topNavigationBar -title $_.Title -url $_.Url;

            # update TopNavigationBar.Item.SubItems from xml definition
            if($_.ChildNodes.Count -gt 0){
                # select current parent node by title
                $parentNode = FindNavigationNodeByTitle -nodeCollection $topNavigationBar -title $_.Title;
                if($parentNode){
                    for ($i=0; $i -lt $_.ChildNodes.Count; $i++) {
                        AddNavigationSubNode -parentNode $parentNode -title $_.ChildNodes[$i].Title -url $_.ChildNodes[$i].Url;
                    }
                }
            }
        }
    }
}


function Update-Current-Navigation($web){
    Write-Host " 3.Start to update CurrentNavigation at sub site:" $web.Title -ForegroundColor Magenta
    
    $context = Get-SPOContext -Url $web.Url -UserName $AdminUsername -SecurePassword $AdminPassword
    Write-Host "- authenticate to SharePoint Online success at Url:" $web.Url -ForegroundColor Green

    $quickLaunch = $context.Web.Navigation.QuickLaunch;
    $context.Load($quickLaunch);
    $context.ExecuteQuery();
    Write-Host "- loading QuickLaunch success with QuickLaunch.Count(s):" $quickLaunch.Count
    #Write-Host "- QuickLaunch.AreItemsAvailable:" $quickLaunch.AreItemsAvailable

    # clean up old QuickLaunch
    if($quickLaunch.AreItemsAvailable -eq $true -and $quickLaunch.Count -gt 0){
        do
        {
            [Microsoft.SharePoint.Client.NavigationNode] $quickLaunchItem = $quickLaunch[0];
            Write-Host "- clean up quickLaunchItem.Title:" $quickLaunchItem.Title;
            $quickLaunchItem.DeleteObject();
            $context.ExecuteQuery();
        }
        while($quickLaunch.Count -gt 0);
        Write-Host "- clean up QuickLaunch is success" -ForegroundColor Green
    }    
        
    # looking for QuickLaunch from xml definition
    Write-Host "- looking for QuickLaunch from xml definition"
    $isLeftNavigation = $false;
    $leftNavigation = {};
    $xmlContent.sites.site | ForEach-Object {
        # format url before comparison
        if($_.Url.LastIndexOf('/')){
            $_.Url = $_.Url.TrimEnd('/');
        }

        if($_.Url -eq $web.Url){
            Write-Host '- Found xml definition for site collection:' $_.Url -ForegroundColor Yellow;
            $isLeftNavigation = $true;
            $leftNavigation = $_.currentnav;
        }
    }

    # update for QuickLaunch from xml definition
    if($isLeftNavigation -eq $true -and $leftNavigation.ChildNodes.Count -gt 0){
        $leftNavigation.ChildNodes | ForEach-Object{
            # update QuickLaunch.Items from xml definition            
            AddNavigationNode -navigationBar $quickLaunch -title $_.Title -url $_.Url;

            # update QuickLaunch.Item.SubItems from xml definition            
            if($_.ChildNodes.Count -gt 0){
                # select current parent node by title
                $parentNode = FindNavigationNodeByTitle -nodeCollection $quickLaunch -title $_.Title;
                if($parentNode){
                    for ($i=0; $i -lt $_.ChildNodes.Count; $i++) {
                        AddNavigationSubNode -parentNode $parentNode -title $_.ChildNodes[$i].Title -url $_.ChildNodes[$i].Url;
                    }
                }
            }            
        }        
    }
}

# update navigationSettings
function Update-Site-Navigation-Setting($web, $isRootWeb){

    # loading left navigation configuration
    Write-Host " 1.Loading navigation settings at sub site:" $web.Title -ForegroundColor Magenta
    Write-Host "- url:" $web.Url
    $taxonomySession = [Microsoft.SharePoint.Client.Taxonomy.TaxonomySession]::GetTaxonomySession($ctx)
    $navigationSettings = New-Object Microsoft.SharePoint.Client.Publishing.Navigation.WebNavigationSettings $ctx, $web    
    try
    {   
        if($isRootWeb -eq $true)
        {
            $navigationSettings.GlobalNavigation.Source = "portalProvider"
            $navigationSettings.CurrentNavigation.Source = "portalProvider"
        }
        else
        {
            # 1.for display the same navigation items as the parent site
            $navigationSettings.GlobalNavigation.Source = "inheritFromParentWeb"
            #$navigationSettings.CurrentNavigation.Source = "inheritFromParentWeb"            

            # 2.set both current and global navigation settings to structural
            #$navigationSettings.GlobalNavigation.Source = "portalProvider"
            $navigationSettings.CurrentNavigation.Source = "portalProvider"

            # 3.for Managed Navigation
            #$navigationSettings.CurrentNavigation.Source = "taxonomyProvider"
            #$navigationSettings.GlobalNavigation.Source = "taxonomyProvider"
        }
                
        $navigationSettings.Update($taxonomySession)
        $ctx.ExecuteQuery();
        Write-Host "- setting both CurrentNavigation and GlobalNavigation settings completed" -ForegroundColor Green 
    }
    catch
    {
        Write-Host "Error while setting both CurrentNavigation and GlobalNavigation settings:" $_.Exception.Message -ForegroundColor Red
    }

    # disable quick launch navigation including subsites and pages
    $ctx.Load($web.AllProperties)
    $ctx.ExecuteQuery()
    $web.AllProperties["__IncludeSubSitesInNavigation"] = "False"
    $web.Update()
    $ctx.ExecuteQuery()
    Write-Host "- update property: [__IncludeSubSitesInNavigation] completed"

    $web.AllProperties["__IncludePagesInNavigation"] = "False"
    $web.Update()
    $ctx.ExecuteQuery()
    Write-Host "- update property: [__IncludePagesInNavigation] completed"

    # set dynamic child limit for CurrentNavigation
    $web.AllProperties["__CurrentDynamicChildLimit"] = 30
    $web.Update()
    $ctx.ExecuteQuery()
    Write-Host "- update property: [__CurrentDynamicChildLimit] completed"

    # set dynamic child limit for GlobalNavigation
    $web.AllProperties["__GlobalDynamicChildLimit"] = 30
    $web.Update()
    $ctx.ExecuteQuery()
    Write-Host "- update property: [__GlobalDynamicChildLimit] completed"
}


# main function
if (!$ctx.ServerObjectIsNull.Value) {
    # connect to SharePoint Online
    Write-Host "Connected to SharePoint Online: " $ctx.Url -ForegroundColor Green
    
    # load current Site
    $site = $ctx.Site
    $ctx.Load($site)
    $ctx.ExecuteQuery()
    Write-Host "Loading current site: "  $site.Url -ForegroundColor Cyan

    # load current Web
    $web = $ctx.Web
    $subWebs = $ctx.Web.Webs;
    $ctx.Load($web)    
    $ctx.Load($subWebs)
    $ctx.ExecuteQuery()
    Write-Host "Loading current web:" $web.Url -ForegroundColor Cyan
    Write-Host "Total sub webs:" $subWebs.Count -ForegroundColor Green

    # read configuration from navigation.xml
    Write-Host "Load configuration from file: navigation.xml"
    $xmlFilePath = "$PSScriptRoot\navigation.xml"
    [xml]$xmlContent = (Get-Content $xmlFilePath)
    if(-not $xmlContent){
        Write-Host "File Xml was not loaded success." -ForegroundColor Red
        return;
    }

    Write-Host "File Xml loaded success." -ForegroundColor Green
    $xmlContent.sites.site | ForEach-Object {
        Write-Host "- try to authenticate SharePoint Online site url:" $_.Url
        $clientContext = Get-SPOContext -Url $_.Url -UserName $AdminUsername -SecurePassword $AdminPassword
        $clientWeb = $clientContext.Web;
        $clientSite = $clientContext.Site;
        $clientContext.Load($clientWeb);
        $clientContext.Load($clientSite);
        try
        {
            $clientContext.ExecuteQuery();
            Write-Host "- authenticate to SharePoint Online site url success:" $_.Url "and get ClientContext object" -ForegroundColor Green
        }
        catch
        {
            Write-Host "- Not able to authenticate to SharePoint Online site url:" $_.Url "$_.Exception.Message" -ForegroundColor Red
        }
    }


    # update CurrentNavigation & GlobalNavigation for Root Site
    Write-Host "========== RootWeb:" $web.Title "==========" -ForegroundColor Yellow
    Write-Host "========== Url:" $web.Url -ForegroundColor Yellow
    Update-Site-Navigation-Setting -web $web -isRootWeb $true
    Update-Global-Navigation -web $web
    Update-Current-Navigation -web $web
    
    
    # update CurrentNavigation & GlobalNavigation for Sub Sites
    foreach ($subWeb in $subWebs){
        Write-Host "========== SubWeb:" $subWeb.Title "==========" -ForegroundColor Yellow
        Write-Host "========== Url:" $subWeb.Url -ForegroundColor Yellow
        Update-Site-Navigation-Setting -web $subWeb -isRootWeb $false
        Update-Global-Navigation -web $subWeb
        Update-Current-Navigation -web $subWeb
    }
}
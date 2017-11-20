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

function Get-SPOContext([string]$Url,[string]$UserName,$SecurePassword)
{
   $context = New-Object Microsoft.SharePoint.Client.ClientContext($Url)   
   $credentials = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($UserName, $SecurePassword)
   $context.Credentials = $credentials
   return $context
}

function Update-Global-Navigation($web){
    Write-Host "- start to update GlobalNavigation at sub site:" $web.Url -ForegroundColor Cyan
    $context = Get-SPOContext -Url $web.Url -UserName $AdminUsername -SecurePassword $AdminPassword
    $topNavigationBar = $context.Web.Navigation.TopNavigationBar
    $context.Load($topNavigationBar)
    $context.ExecuteQuery()
    Write-Host "- loading TopNavigationBar success" -ForegroundColor Green
    Write-Host "- total items:" $topNavigationBar.Count
    Write-Host "- AreItemsAvailable:" $topNavigationBar.AreItemsAvailable

    # clean up old navigation
    if($topNavigationBar.AreItemsAvailable -eq $true -and $topNavigationBar.Count -gt 0){
        foreach ($nav in $topNavigationBar){
            Write-Host "- clean up TopNavigationBar.Item:" $nav.Title
            $nav.DeleteObject()            
        }
        $context.ExecuteQuery()
        Write-Host "- clean up TopNavigationBar is success" -ForegroundColor Green
    }

    # update TopNavigationBar from xml definition
    Write-Host "- update TopNavigationBar from xml definition"
}

function Update-Current-Navigation($web){
    Write-Host "- start to update CurrentNavigation at sub site:" $web.Url -ForegroundColor Cyan    
    $context = Get-SPOContext -Url $web.Url -UserName $AdminUsername -SecurePassword $AdminPassword
    $quickLaunch = $context.Web.Navigation.QuickLaunch
    $context.Load($quickLaunch)
    $context.ExecuteQuery()
    Write-Host "- loading QuickLaunch success" -ForegroundColor Green
    Write-Host "- total items:" $quickLaunch.Count 

    # clean up old navigation
    if($quickLaunch.AreItemsAvailable -eq $true -and $quickLaunch.Count -gt 0){
        foreach ($nav in $quickLaunch){
            Write-Host "- clean up QuickLaunch.Item:" $nav.Title
            $nav.DeleteObject()            
        }
        $context.ExecuteQuery()
        Write-Host "- clean up QuickLaunch is success" -ForegroundColor Green
    }

    # update QuickLaunch from xml definition
    Write-Host "- update QuickLaunch from xml definition"
}

# update navigationSettings
function Update-Site-Navigation($web){

    # loading left navigation configuration
    Write-Host "- loading CurrentNavigation & GlobalNavigation at sub site:" $web.Title
    Write-Host "- site url:" $web.Url
    $taxonomySession = [Microsoft.SharePoint.Client.Taxonomy.TaxonomySession]::GetTaxonomySession($ctx)
    $navigationSettings = New-Object Microsoft.SharePoint.Client.Publishing.Navigation.WebNavigationSettings $ctx, $web    
    try
    {        
        # 1.for display the same navigation items as the parent site
        #$navigationSettings.CurrentNavigation.Source = "inheritFromParentWeb"
        #$navigationSettings.GlobalNavigation.Source = "inheritFromParentWeb"

        # 2.set both current and global navigation settings to structural
        $navigationSettings.CurrentNavigation.Source = "portalProvider"
        $navigationSettings.GlobalNavigation.Source = "portalProvider"

        # 3.for Managed Navigation
        #$navigationSettings.CurrentNavigation.Source = "taxonomyProvider"
        #$navigationSettings.GlobalNavigation.Source = "taxonomyProvider"
                
        $navigationSettings.Update($taxonomySession)
        $ctx.ExecuteQuery();
        Write-Host "- setting both CurrentNavigation and GlobalNavigation settings completed" -ForegroundColor Green 
    }
    catch
    {
        Write-Host "Error while setting both CurrentNavigation and GlobalNavigation settings:" $_.Exception.Message -foregroundcolor black -backgroundcolor Red
    }

    # disable quick launch navigation including subsites and pages
    $ctx.Load($web.AllProperties)
    $ctx.ExecuteQuery()
    $web.AllProperties["__IncludeSubSitesInNavigation"] = "False"
    $web.Update()
    $ctx.ExecuteQuery()

    $web.AllProperties["__IncludePagesInNavigation"] = "False"
    $web.Update()
    $ctx.ExecuteQuery()

    # set dynamic child limit for CurrentNavigation
    $web.AllProperties["__CurrentDynamicChildLimit"] = 30
    $web.Update()
    $ctx.ExecuteQuery()

    # set dynamic child limit for GlobalNavigation
    $web.AllProperties["__GlobalDynamicChildLimit"] = 30
    $web.Update()
    $ctx.ExecuteQuery()    
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
        return
    }

    Write-Host "File Xml loaded success." -ForegroundColor Green
    $xmlContent.sites.site | ForEach-Object {
        Write-Host "- authenticate to SharePoint Online site collection" $xmlContent.sites.site.Url " and get ClientContext object"
        $ctx1 = New-Object Microsoft.SharePoint.Client.ClientContext($_.Url)
        $ctx1.Credentials = $credentials
        $ctx1.RequestTimeOut = 5000 * 60 * 10;
        $web1 = $ctx1.Web
        $site1 = $ctx1.Site
        $ctx1.Load($web1)
        $ctx1.Load($site1)
        try
        {
            $ctx1.ExecuteQuery()
            Write-Host "authenticate to SharePoint Online site collection" $xmlContent.sites.site.Url "and get ClientContext object" -ForegroundColor Green
        }
        catch{
            Write-Host "Not able to authenticate to SharePoint Online site collection" $xmlContent.sites.site.Url "$_.Exception.Message" -ForegroundColor Red
        }
        return;
    }


    # update CurrentNavigation & GlobalNavigation for Root Site
    #Write-Host "======================== Web:" $web.Title "========================" -ForegroundColor Yellow
    #Update-Site-Navigation -web $web
    #Update-Global-Navigation -web $web
    #Update-Current-Navigation -web $web
    
    
    # update CurrentNavigation & GlobalNavigation for Sub Sites        
    foreach ($subWeb in $subWebs){
        Write-Host "======================== SubWeb:" $subWeb.Title "========================" -ForegroundColor Yellow        
        #Update-Site-Navigation -web $subWeb
        if($subWeb.Title -eq "Structemp Project"){
            Update-Global-Navigation -web $subWeb
            Update-Current-Navigation -web $subWeb
        }
    }
}
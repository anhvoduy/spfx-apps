[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Runtime")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.DocumentManagement")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Publishing")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Taxonomy")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Search")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.UserProfiles")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.WorkflowServices")

# Reference: https://www.sharepoint-journey.com/adding-links-to-global-navigation-in-Office-365-using-powershell-and-csom.html

$SiteUrl = "https://structemp.sharepoint.com/sites/Projects/"
$AdminUsername = "IT.Admin@structemp.co.uk"

Write-Host "Please enter password for $($SiteUrl):"
$AdminPassword = Read-Host -AsSecureString
#$AdminPassword = ""
#$AdminPassword = ConvertTo-SecureString $AdminPassword -AsPlainText -Force

# Default Language is English
$lcid = "1033"


# connect/authenticate to SharePoint Online and get ClientContext object.. 
$ctx = New-Object Microsoft.SharePoint.Client.ClientContext($SiteUrl)
$credentials = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($AdminUsername, $AdminPassword)
$ctx.Credentials = $credentials


# main function
if (!$ctx.ServerObjectIsNull.Value) {
    # connect to SharePoint Online
    Write-Host "Connected to SharePoint Online: " $ctx.Url -ForegroundColor Green
    
    # load root site
    $site = $ctx.Site
    $ctx.Load($site)
    $ctx.ExecuteQuery()
    Write-Host "Loading root site: "  $site.Url -ForegroundColor Cyan

    # load root web
    $web = $ctx.Web
    $ctx.Load($web)
    $ctx.ExecuteQuery()
    Write-Host "Loading root web:" $web.Title " with url:" $web.Url -ForegroundColor Cyan
    
    # load root folder
    $webContext = $web.Context
    $rootFolder = $web.RootFolder
    $webContext.Load($rootFolder)
    $webContext.ExecuteQuery()
    Write-Host "Loading root folder success." -ForegroundColor Cyan

    # update default page
    $rootFolder.WelcomePage = "SitePages/ProjectList.aspx"
    $rootFolder.Update()
    $webContext.ExecuteQuery()
    Write-Host "Setting welcome page for root site success." -ForegroundColor Green
}
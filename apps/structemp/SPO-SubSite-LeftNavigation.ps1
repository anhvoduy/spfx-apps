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
$AdminPassword = Read-Host -AsSecureString
#$AdminPassword = ""

# Default Language is English
$lcid = "1033"

# connect/authenticate to SharePoint Online and get ClientContext object.. 
$ctx = New-Object Microsoft.SharePoint.Client.ClientContext($SiteUrl)
$credentials = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($AdminUsername, $AdminPassword)
$ctx.Credentials = $credentials

# get all lists in site
function Update-LeftNavigation($web){
    # loading left navigation configuration
    Write-Host "Loading Left Navigation at Sub Site:" $web.Title -ForegroundColor Yellow    
}

# main function
if (!$ctx.ServerObjectIsNull.Value) {
    # connect to SharePoint Online
    Write-Host "Connected to SharePoint Online: " $ctx.Url -ForegroundColor Green
    
    # load Current Site
    $site = $ctx.Site
    $ctx.Load($site)
    $ctx.ExecuteQuery()
    Write-Host "Loading Current Site: "  $site.Url -ForegroundColor Cyan

    # load Current Web
    $web = $ctx.Web
    $ctx.Load($web)
    $ctx.ExecuteQuery()
    Write-Host "Loading Current Web:" $web.Url -ForegroundColor Cyan
    
    # get all Sub Current Web (Sub Sites)
    $subWebs = $web.Webs;
    $ctx.Load($subWebs)
    $ctx.ExecuteQuery()
    foreach ($subWeb in $subWebs){
        Write-Host "============ SubWeb:" $subWeb.Title "============" -ForegroundColor Green

        # update left navigation for SubWeb
        Update-LeftNavigation -web $subWeb
    }
}
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
#$AdminPassword = "sonyv@io2020"

# Default Language is English
$lcid = "1033"

# connect/authenticate to SharePoint Online and get ClientContext object.. 
$ctx = New-Object Microsoft.SharePoint.Client.ClientContext($SiteUrl)
$credentials = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($AdminUsername, $AdminPassword)
$ctx.Credentials = $credentials

# get all lists in site
function Update-List($web){
    # load all lists of Site Collection
    $lists = $web.Lists
    $ctx.Load($lists)
    $ctx.ExecuteQuery()
    Write-Host "Loading all lists of Site Collection :" $lists.Count " item(s)" -ForegroundColor Yellow

    # get all Lists
    $lists = $web.Lists
    $ctx.Load($lists)
    $ctx.ExecuteQuery()
        
    foreach ($list in $lists){
        #Write-Host "- Title :" $list.Title
        #Write-Host "- Name:" $list.EntityTypeName 
        #Write-Host "- Title:" $list.Title 
        #Write-Host "- List Guid:" $list.Id
        #Write-Host "- Base Template:" $list.BaseTemplate
        #Write-Host "- Base Type:" $list.BaseType        
        
        # update list information
        if($list.Title -eq 'Publish Document' -or $list.Title -eq '02-Shared Document'){
            Write-Host "- Title:" $list.Title
            Write-Host "- ImageUrl:" $list.ImageUrl
            $list.Title    = '02-Shared Document'
            $list.ImageUrl = '/sites/Projects/SiteAssets/lpublish.png'
            $list.Update()
            $ctx.ExecuteQuery()
        } 
        elseif($list.Title -eq 'Work In Project Document' -or $list.Title -eq '01-Work In Project Document'){            
            Write-Host "- Title:" $list.Title
            Write-Host "- ImageUrl:" $list.ImageUrl
            $list.Title    = '01-Work In Project Document'
            $list.ImageUrl = '/sites/Projects/SiteAssets/lpending.png'
            $list.Update()
            $ctx.ExecuteQuery()
        }
    }
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
        Write-Host "============ SubWeb:" $subWeb.Title -ForegroundColor Green

        # load list in sub web
        Update-List -web $subWeb
    }
}
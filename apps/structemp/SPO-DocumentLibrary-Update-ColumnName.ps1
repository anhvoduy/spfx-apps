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
#$AdminPassword = "sonyv@io2018"

# Default Language is English
$lcid = "1033"

# connect/authenticate to SharePoint Online and get ClientContext object.. 
$ctx = New-Object Microsoft.SharePoint.Client.ClientContext($SiteUrl)
$credentials = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($AdminUsername, $AdminPassword)
$ctx.Credentials = $credentials


function Update-SiteColumnName($web){
    # load fields
    $fields = $web.Fields
    $ctx.Load($fields)
    $ctx.ExecuteQuery()

    foreach ($field in $fields){
        if($field.InternalName -eq 'Statuss'){
            Write-Host '========================================' -ForegroundColor Yellow
            Write-Host '- InternalName:    ' $field.InternalName
            Write-Host '- StaticName:      ' $field.StaticName
            Write-Host '- Title:           ' $field.Title

            $field.Title = 'Status'
            $field.Update()
            $ctx.ExecuteQuery()
        }
        elseif($field.InternalName -eq 'Typee'){
            Write-Host '========================================' -ForegroundColor Yellow
            Write-Host '- InternalName:    ' $field.InternalName
            Write-Host '- StaticName:      ' $field.StaticName
            Write-Host '- Title:           ' $field.Title

            $field.Title = 'Type'            
            $field.Update()
            $ctx.ExecuteQuery()
        }
        elseif($field.InternalName -eq 'Rolee'){
            Write-Host '========================================' -ForegroundColor Yellow
            Write-Host '- InternalName:    ' $field.InternalName
            Write-Host '- StaticName:      ' $field.StaticName
            Write-Host '- Title:           ' $field.Title

            $field.Title = 'Role'            
            $field.Update()
            $ctx.ExecuteQuery()
        }
        elseif($field.InternalName -eq 'Revisionn'){
            Write-Host '========================================' -ForegroundColor Yellow
            Write-Host '- InternalName:    ' $field.InternalName
            Write-Host '- StaticName:      ' $field.StaticName
            Write-Host '- Title:           ' $field.Title

            $field.Title = 'Revision'
            $field.Update()
            $ctx.ExecuteQuery()
        }
    }
}

function Update-ListColumnName($subWeb){
    # load lists
    $lists = $subWeb.Lists
    $ctx.Load($lists)
    $ctx.ExecuteQuery()

    foreach ($list in $lists){
        if($list.Title -eq '02-Shared Document'){
            Write-Host '- ListName:' $list.Title
            $ctx.Load($list)
            $ctx.ExecuteQuery()

            $columns = $list.Fields
            $ctx.Load($columns)
            $ctx.ExecuteQuery()

            foreach($column in $columns){
                if($column.InternalName -eq 'Statuss'){
                    Write-Host '========================================' -ForegroundColor Yellow
                    Write-Host '----- InternalName:' $column.InternalName
                    Write-Host '----- StaticName:' $column.StaticName
                    Write-Host '----- Title:' $column.Title

                    $column.Title = 'Status'
                    $column.Update()
                    $ctx.ExecuteQuery()
                }
                elseif($column.InternalName -eq 'Typee'){
                    Write-Host '========================================' -ForegroundColor Yellow
                    Write-Host '----- InternalName:' $column.InternalName
                    Write-Host '----- StaticName:' $column.StaticName
                    Write-Host '----- Title:' $column.Title

                    $column.Title = 'Type'
                    $column.Update()
                    $ctx.ExecuteQuery()
                }
                elseif($column.InternalName -eq 'Rolee'){
                    Write-Host '========================================' -ForegroundColor Yellow
                    Write-Host '----- InternalName:' $column.InternalName
                    Write-Host '----- StaticName:' $column.StaticName
                    Write-Host '----- Title:' $column.Title

                    $column.Title = 'Role'
                    $column.Update()
                    $ctx.ExecuteQuery()
                }
                elseif($column.InternalName -eq 'Revisionn'){
                    Write-Host '========================================' -ForegroundColor Yellow
                    Write-Host '----- InternalName:' $column.InternalName
                    Write-Host '----- StaticName:' $column.StaticName
                    Write-Host '----- Title:' $column.Title

                    $column.Title = 'Revision'
                    $column.Update()
                    $ctx.ExecuteQuery()
                }
            }
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

    # update site colums
    Write-Host 'Starting to update Site Column' -ForegroundColor Green
    Update-SiteColumnName -web $web
    
    # get all Sub Current Web (Sub Sites)    
    Write-Host 'Starting to update List Column' -ForegroundColor Green 
    $subWebs = $web.Webs;
    $ctx.Load($subWebs)
    $ctx.ExecuteQuery()
    foreach ($subWeb in $subWebs){
        Write-Host "===== SubWeb:" $subWeb.Title -ForegroundColor Cyan        
        
        # update list columns in sub webs
        Update-ListColumnName -subWeb $subWeb
    }    
}
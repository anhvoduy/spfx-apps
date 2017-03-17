[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Runtime")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.DocumentManagement")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Publishing")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Taxonomy")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.Search")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.UserProfiles")
[System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint.Client.WorkflowServices")

$SiteUrl = "https://development365.sharepoint.com"
$AdminUsername = "voduyanh@development365.onmicrosoft.com"

Write-Host "Please enter password for $($SiteUrl):"
$AdminPassword = Read-Host -AsSecureString
#$AdminPassword = "AdminPassword"

# Default Language is English
$lcid = "1033"

# Local Folder & Document Library
#$localFolderPath = "D:\Projects\sharepoint\spapp\apps\aisha"
$localFolderPath = "D:\Projects\sharepoint\spapp\apps\aisha\build"
$onlineFolderPath = $SiteUrl + "/Style%20Library" + "/apps" + "/aisha/build"
$documentLibrary = "Style Library"

# connect/authenticate to SharePoint Online and get ClientContext object.. 
$ctx = New-Object Microsoft.SharePoint.Client.ClientContext($SiteUrl)
$credentials = New-Object Microsoft.SharePoint.Client.SharePointOnlineCredentials($AdminUsername, $AdminPassword)
$ctx.Credentials = $credentials


# get all lists of Site Collection
function Write-List($lists, $web){
    # load all lists of Site Collection
    $lists = $web.Lists
    $ctx.Load($lists)
    $ctx.ExecuteQuery()
    Write-Host "Loading all lists of Site Collection :" $lists.Count " item(s)" -ForegroundColor Yellow

    # loop lists need to Restore
    foreach ($list in $lists){
        Write-Host "List's Title:" $list.Title -ForegroundColor Green

        Write-Host "- Name:" $list.EntityTypeName 
        Write-Host "- Title:" $list.Title 
        Write-Host "- List Guid:" $list.Id
        Write-Host "- Base Template:" $list.BaseTemplate
        Write-Host "- Base Type:" $list.BaseType
    }
}

# read all folders in local folder
function ReadFolders ($folderPath, $folderRelativeUrl){    
    $folders  = ([System.IO.DirectoryInfo] (Get-Item $folderPath)).EnumerateDirectories()
    # read files & upload files
    ReadFiles -folderPath $folderPath -folderRelativeUrl $folderRelativeUrl
    
    ForEach($folder in $folders){
        # create folder
        $subFolderRelativeUrl = $folderRelativeUrl + "/" + $folder.Name
        CreateFolder -web $web -folderRelativeUrl $subFolderRelativeUrl        

        # read sub folders
        $subFolderPath = $folderPath + "\" + $folder.Name
        Write-Host "Read Files & Folders in:" $subFolderPath        
        ReadFolders -folderPath $subFolderPath -folderRelativeUrl $subFolderRelativeUrl
    }
}

# read all files in local folder
function ReadFiles ($folderPath, $folderRelativeUrl){
    $files = ([System.IO.DirectoryInfo] (Get-Item $folderPath)).GetFiles()
    Write-Host "Total Files:" $files.Count

    ForEach($file in $files){        
        #Write-Host "Read File:" $file.FullName
        CreateFile -file $file -folderRelativeUrl $folderRelativeUrl
    }
}

# create folder
function CreateFolder([Microsoft.SharePoint.Client.Web] $web, $folderRelativeUrl){    
    $folder = $web.Folders.Add($folderRelativeUrl);
    $ctx.Load($folder);    
    $ctx.ExecuteQuery();
    Write-Host "Create Folder is success." -ForegroundColor Green
}

# create file
function CreateFile($file, $folderRelativeUrl){
    $url = $folderRelativeUrl + "/" + $file.Name
    Write-Host "From location:" $file.FullName
    Write-Host "To location:" $url

    # retrieve document library
    $library = $ctx.Web.Lists.GetByTitle($documentLibrary)
    $ctx.Load($library)
    $ctx.ExecuteQuery()

    # open FileStream
    $fileStream = ([System.IO.FileInfo] (Get-Item $file.FullName)).OpenRead()
    $fileCreationInfo = New-Object Microsoft.SharePoint.Client.FileCreationInformation
    $fileCreationInfo.Overwrite = $true
    $fileCreationInfo.ContentStream = $fileStream
    $fileCreationInfo.Url = $url
    
    # upload file to SharePoint
    $uploadFile = $library.RootFolder.Files.Add($fileCreationInfo)    
    $ctx.Load($uploadFile.ListItemAllFields)
    $ctx.ExecuteQuery()
    Write-Host "Upload File is success." -ForegroundColor Green
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
    
    # get all lists of Site Collection
    #Write-List -lists $lists -web $web  

    #create folder SiteAssets in document library    
    CreateFolder -web $web -folderRelativeUrl $onlineFolderPath
    
    ## read folders
    Write-Host "Reading local folder:" $localFolderPath -ForegroundColor Green
    $folders  = ([System.IO.DirectoryInfo] (Get-Item $localFolderPath)).EnumerateDirectories()
    ForEach($folder in $folders){
        $folderPath = $localFolderPath + "\" + $folder.Name
        $folderRelativeUrl = $onlineFolderPath + "/" + $folder.Name
        CreateFolder -web $web -folderRelativeUrl $folderRelativeUrl
        
        Write-Host "Path:" $folderPath -ForegroundColor Cyan
        ReadFolders -folderPath $folderPath -folderRelativeUrl $folderRelativeUrl
    }
}
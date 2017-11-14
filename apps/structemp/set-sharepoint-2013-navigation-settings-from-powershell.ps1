################################################################
#
# Powershell script by Jesper M. Christensen
# Blog: http://JesperMChristensen.wordpress.com
#
# Set the SharePoint 2010 and 2013 Navigation Settings on Sites
#
# SetupNavigationSettings.ps1 version 1.0 - Edited January 2013
#
################################################################
Write-Host -ForegroundColor White "Set the SharePoint 2010 and 2013 Navigation Settings on Sites"

#Set the Site Collection
$SPSite = Get-SPSite -Identity "http://extrico-demo2.dev.extrico.local/sites/demo1"

#Go through each site in the Site Collection
foreach ($SPWeb in $SPSite.AllWebs)
{
    if ($SPWeb.IsRootWeb)
    {
        #Process the root web
        Write-Host -ForegroundColor Gray $SPWeb.Url":" -NoNewLine

        #Save the AllowUnsafeUpdatesStatus property value
        $AllowUnsafeUpdatesStatus = $SPWeb.AllowUnsafeUpdates
        $SPWeb.AllowUnsafeUpdates = $true

        #Set the Publishing Web
        $SPPubWeb = [Microsoft.SharePoint.Publishing.PublishingWeb]::GetPublishingWeb($SPWeb)

        #Global Navigation Settings
        $SPPubWeb.Navigation.InheritGlobal = $false
        $SPPubWeb.Navigation.GlobalIncludeSubSites = $true
        $SPPubWeb.Navigation.GlobalIncludePages = $false
        $SPPubWeb.Navigation.GlobalDynamicChildLimit = 21

        #Current Navigation Settings
        #
        # -Display the same navigation items as the parent site: InheritCurrent = $true and ShowSiblings = $false
        # -Structural Navigation: Display the current site, the navigation items below the current site, and the current site's siblings: InheritCurrent = $false and ShowSiblings = $true
        # -Structural Navigation: Display only the navigation items below the current site: InheritCurrent = $false and ShowSiblings = $false
        #
        $SPPubWeb.Navigation.InheritCurrent = $false
        $SPPubWeb.Navigation.ShowSiblings = $true
        $SPPubWeb.Navigation.CurrentIncludeSubSites = $false
        $SPPubWeb.Navigation.CurrentIncludePages = $false
        $SPPubWeb.Navigation.CurrentDynamicChildLimit = 21

        # Sorting
        $SPPubWeb.Navigation.OrderingMethod = "Manual" # "Automatic" "ManualWithAutomaticPageSorting"
        $SPPubWeb.Navigation.AutomaticSortingMethod = "Title" # "CreatedDate" "CreatedDate" "LastModifiedDate"
        $SPPubWeb.Navigation.SortAscending = $true

        #Update the Publishing Web Navigation Settings
        $SPPubWeb.Update()
        Write-Host -ForegroundColor Green " Done"
    }
    else
    {
        
        #Process all sub-webs to the root web
        Write-Host -ForegroundColor Gray $SPWeb.Url":" -NoNewLine

        #Save the AllowUnsafeUpdatesStatus property value
        $AllowUnsafeUpdatesStatus = $SPWeb.AllowUnsafeUpdates
        $SPWeb.AllowUnsafeUpdates = $true

        #Set the Publishing Web
        $SPPubWeb = [Microsoft.SharePoint.Publishing.PublishingWeb]::GetPublishingWeb($SPWeb)

        #Global Navigation Settings
        $SPPubWeb.Navigation.InheritGlobal = $true
        $SPPubWeb.Navigation.GlobalIncludeSubSites = $true
        $SPPubWeb.Navigation.GlobalIncludePages = $false
        $SPPubWeb.Navigation.GlobalDynamicChildLimit = 21

        #Current Navigation Settings
        $SPPubWeb.Navigation.InheritCurrent = $false
        $SPPubWeb.Navigation.ShowSiblings = $true
        $SPPubWeb.Navigation.CurrentIncludeSubSites = $false
        $SPPubWeb.Navigation.CurrentIncludePages = $false
        $SPPubWeb.Navigation.CurrentDynamicChildLimit = 21

        # Sorting
        $SPPubWeb.Navigation.OrderingMethod = "Manual" # "Automatic" "ManualWithAutomaticPageSorting"
        $SPPubWeb.Navigation.AutomaticSortingMethod = "Title" # "CreatedDate" "CreatedDate" "LastModifiedDate"
        $SPPubWeb.Navigation.SortAscending = $true

        #Update the Publishing Web Navigation Settings
        $SPPubWeb.Update()
        Write-Host -ForegroundColor Green " Done"
    }

    #Revert the AllowUnsafeUpdatesStatus property value
    $SPWeb.AllowUnsafeUpdates = $AllowUnsafeUpdatesStatus

    #Dispose the SPWeb object
    $SPWeb.Dispose()
}

#Dispose the SPSite object
$SPSite.Dispose()
# Customizing the Inventory Application

## Setting Up Custom orgConfig.json

In the customization directory create an orgConfig.json file you can customize the application for your organization.
Attributes:
* name - the name of the organization, ex: Troop 123
* location - the city/state of the organization incase there is other organizations that use that name in other states/countries
* type - the type of organization, ex: Scouts BSA Troop, Girl Scout Troop, Lion's Club
* clientId - this is the google API client ID.  To create one, go to Google Cloud -> Google Auth Platform -> Clients and create a new Client.
* rosterSheetId - this is the ID of the Google Sheet to hold the roster of who can interact with the inventory of objects.
                  This is not the list of people who can use the application, just who can use the inventory of things.
                  This sheet should have a minimum the column "Name".
* rosterTabName - The name of the tab with in the roster sheet that has the list of people with the "Name" column.
* inventory - is a list of object types to inventory.  You will need a google sheet per type of object you want to inventory.  My
              troop had both tents and kayaks.
* inventory.name - the singular name of the objects in the inventory.  Ex: Tent
* inventory.namePlural - the name used when describing multiple objects in the inventory.  Ex: Tents
* inventory.icon - the flaticon to use for the inventory object.  See: https://www.flaticon.com/free-icon-font
* inventory.sheetId - the ID of the Google Sheet for this inventory object.  I suggest a sheet per type of object as this
                      app adds sheets for history of objects.  The columns should be: "ID, Description, Status, Who, Date, Notes" other columns are ignored.
                      ID is a unique identifier, ex: Tent-2022-006.  The description is something that makes sense to the user, ex: "Alps Extreme 3P".
                      Status for all entries should be "Available", "In Use", or "Broken".  The other columns will be controlled by the application.
* inventory.tabName - the tab name in the sheet IDed above that contains the columns specified.
* location - The location of the objects. This does assume that the location of the objects are all the same while they are available.
* informationLinks - This is just a list of informational links do display on the page displayed when you log in.  Its not required, but I did not want a blank page.
* informationLinks.name - the display name for a URL.
* informationLinks.url - the URL of the link.

```customizations/orgConfig.json
{
    "name": "Troop 123",
    "location": "City, ST",
    "type": "Scouts BSA Troop",
    "clientId": "123456789012-x1x2x3x4x5x6x7x8x9x0x1x2x3x4x5x6.apps.googleusercontent.com",
    "rosterSheetId": "r1r2r3r4r5r6r7r8r9r0r1r2r3r4r5r6r7r8r9r0r1r2",
    "rosterTabName": "Roster",
    "inventory": [
        {
            "name": "Tent",
            "namePlural": "Tents",
            "icon": "<i class=\"fi fi-ts-tents\"></i>",
            "sheetId": "t1t2t3t4t5t6t7t8t9t0t1t2t3t4t5t6t7t8t9t0t1t2",
            "tabName": "Inventory",
            "location": "Troop Garage: 123 Scout St, City, ST"
        },
        {
            "name": "Kayak",
            "namePlural": "Kayaks",
            "icon": "<i class=\"fi fi-ts-sailboat\"></i>",
            "sheetId": "k1k2k3k4k5k6k7k8k9k0k1k2k3k4k5k6k7k8k9k0k1k2",
            "tabName": "Inventory",
            "location": "Troop Garage: 123 Scout St, City, ST"
        }
    ],
    "informationLinks": [
        {
            "name": "Troop Website",
            "url": "https://sites.google.com/view/troop123citystate/"
        },
        {
            "name": "Troop Calendndar",
            "url": "https://calendar.google.com/calendar/u/0/r/month?cid=c1c2c3c4c5c6c7c8c9c0c1c2c3c4c5c6"
        },
        {
            "name": "Troop Facebook Page",
            "url": "https://www.facebook.com/Troop123citystate/"
        },
        {
            "name": "Troop Instagram Page",
            "url": "https://www.instagram.com/troop123citystate"
        }
    ]
}
```

## Customizing images

You can add 3 images to customize the application for your organization.  If these image files exist in your customizations directory they will override the stock ones shipped with the repository.

 * customizations/favicon.ico - the favicon is used for image displayed for tabs in the browser.
 * customizations/logo192.png - the 192x192 sized logo for your organization
 * customizations/logo512.png - the 512x512 sized logo for your organization



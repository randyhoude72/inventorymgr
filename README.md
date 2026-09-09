# Inventory Application

## Purpose

This application was designed to fit the need of a youth organization that was managing tents.  
Tents were being brought home to dry and never returned or being returned damaged without ever being
logged anywhere.  We needed some way to keep the youth accountable when using group gear. When
writing this application, I made it generic so the organization can be any type of organization
and the items can be any type of shared gear that gets loaned out to individuals within the
organization.  Basic branding was also added to allow other groups to make it there own.

To make this application fit the budget of a youth organization though, it really need to be able to
be hosted completely for free.  This meant no custom back end services and/or database.  
With those goals I built a React based client that uses the V4 API of Google Sheets as its backend.
This means that with limited use you can no pay for the backend for this application.

This is not meant to service millions of items owned with in many locations used by 1000s of people.
Its meant for a smaller organization to manage a smaller set of items, less than 100.

To host free you are allowed a large number of API calls prior to having to pay.  The use of the
Google Sheets API paired with Google Authentication also allows you to use the Google Sheets security
to grant access to certain users to be able to modify the sheets.

# Setting Up, Customizing, Building and Deploying

## Google User to Manage Everything

You need a Google user This user should belong to the organization you are setting this up for.  This
user will own the Google Sheets, Google Cloud Setup and the Google Firebase Hosting.

## Setup Google Sheets

Configure the datastore for your inventory application by creating a couple Google Sheets.  
See: [Google Sheet Setup](docs/googlesheetssetup.md).

## Setup Google Cloud Client ID.

Configure the Google Cloude Authentication Client ID for your inventory application.  This allows Google's
authentication to describe to the user what they are logging into.
See: [Google Cloud Authentication Setup](docs/googlecloudsetup.md).

## Setup Google Firebase Application Hosting

Google Firebase is a web application hosting that you can use to host the files for the application.
Please see [Setting Up Google Firebase](docs/googlefirebase.md)

## Customize the Application For Your Organization

Refer to [Customization Guide](docs/customizations.md)

## Build And Deploy Your Application

You will want to first build your application:

### `npm run build`

Then to deploy you will run 

### `firebase deploy`



----------------------------------------------------------------------------

# Getting Started with Create React App On Local Sytem

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

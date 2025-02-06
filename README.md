# capi-ui-extension
Rancher Extension used in [rancher/dashboard](https://github.com/rancher/dashboard) for [Rancher Turtles](https://turtles.docs.rancher.com/turtles/v0.16/en/getting-started/install-rancher-turtles/using_rancher_dashboard.html) CAPI Provisioning UI.

## Running for Development
This is what you probably want to get started.
```bash
# Install dependencies
yarn install

# For development, serve with hot reload at https://localhost:8005
# using the endpoint for your Rancher API
API=https://your-rancher yarn dev
# or put the variable into a .env file
# Goto https://localhost:8005
```

## Updating @shell package
This is about updating the @shell package which is the base from rancher/dashboard
```bash
# Update
yarn create @rancher/update
```

## Building the extension for production
Bump the app version on `package.json` file, then run:
```bash
# Build for production
./scripts/publish -g 
# add flag -f if you need to overwrite an existing version


# If you need to test the built extension
yarn serve-pkgs
```

## Installing released versions of the CAPI UI
NOTE: This UI is currently in tech preview. Follow instructions [here](https://turtles.docs.rancher.com/turtles/v0.16/en/getting-started/install-rancher-turtles/using_rancher_dashboard.html#_capi_ui_extension_installation) to install the capi ui. 



License
=======
Check CAPI UI Apache License details [here](LICENSE)# capi-ui-extension
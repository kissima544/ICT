# Deployment Guide

This repository contains a Next.js frontend (`ictvisitorsfrontendsystem`) and a .NET backend (`ICTVisitorsManagementSystem`). This document shows how to deploy the frontend to Vercel and the backend to Azure App Service using the provided GitHub Actions workflow.

Frontend — Vercel (recommended)

- Go to https://vercel.com/new and connect your GitHub account.
- Select the `kissima544/ICT` repository and set the project root to `ictvisitorsfrontendsystem` (change the Root Directory in the Vercel project settings).
- Build command: `npm run build`
- Output directory: leave empty (Next.js auto-detects), or use default.
- Vercel will build and deploy automatically on pushes to `master`.

Backend — Azure App Service (GitHub Actions)

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-backend-azure.yml`. To enable deployments:

1. Create an Azure App Service (Linux or Windows) and note the App name.
2. In the Azure Portal, go to your App Service > "Get publish profile" and download the publish profile (an XML file).
3. In your GitHub repository settings, go to `Settings > Secrets and variables > Actions` and add two repository secrets:
   - `AZURE_WEBAPP_PUBLISH_PROFILE` — the full contents of the publish profile XML file.
   - `AZURE_WEBAPP_NAME` — the App Service name (string).
4. Push to `master`. The workflow will run and deploy the published output to the App Service.

Alternative: use a Service Principal

If you prefer a service principal (recommended for automation at scale), create one and add `AZURE_CREDENTIALS` as a secret. See Azure docs: https://learn.microsoft.com/azure/actions/deploy-webapps

Notes
- The workflow uses the path `ICTVisitorsManagementSystem/ICTVisitorsManagementSystem/ICTVisitorsManagementSystem.csproj` — change it if your project file is elsewhere.
- If you want me to add the publish profile secret to the repo, provide the publish profile content here (sensitive). Alternatively, add the secret yourself in the GitHub UI.

# ☁️ Amazon Web Services (AWS) Deployment & API Transfer Guide

This guide explains how to deploy your **Smart AI Campus Navigation System** directly to **AWS** (S3 + CloudFront / Amplify) using the AWS CLI and API integration.

---

## 🛠️ Step 1: Add AWS Credentials to `.env`

Open your local [`.env`](file:///Users/deepeshpatel/college-navigation-system/.env) file and enter your AWS IAM Access Keys:

```env
# Amazon Web Services (AWS) Deployment Credentials
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_DEFAULT_REGION=us-east-1
AWS_S3_BUCKET=college-navigation-system-live
```

---

## 🚀 Step 2: Deploy Direct Changes to AWS (One-Command)

Whenever you make changes to your codebase locally, deploy them directly to AWS by running:

```bash
npm run deploy:aws
```

### What `npm run deploy:aws` does automatically:
1. Builds the static production web bundle (`npm run build`).
2. Checks AWS S3 bucket `college-navigation-system-live` (creates it if needed).
3. Configures static website hosting policy on S3.
4. Syncs the production bundle directly to AWS S3 (`aws s3 sync dist/ s3://...`).
5. Prints your **Live AWS URL** (e.g. `http://college-navigation-system-live.s3-website-us-east-1.amazonaws.com/`).

---

## 🔄 Alternative: AWS Amplify Automatic GitHub CI/CD

If you prefer AWS to deploy **automatically every time you push code to GitHub**:

1. Log in to the [AWS Amplify Console](https://console.aws.amazon.com/amplify).
2. Click **Host web app** ➔ Select **GitHub** ➔ Authorize repository `deepesh-45/college-navigation-system`.
3. Select `main` branch.
4. Click **Save and Deploy**.

> 🎉 AWS Amplify will automatically build and publish live changes on every Git push!

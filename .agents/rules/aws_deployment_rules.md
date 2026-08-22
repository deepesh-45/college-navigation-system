# ☁️ Amazon Web Services (AWS) Deployment Rules

This rule specification maintains AWS API configuration and deployment automation for this project.

---

## 🔒 Environment Variable Standards (`.env`):
- `AWS_ACCESS_KEY_ID`: IAM User Access Key ID with S3 permissions.
- `AWS_SECRET_ACCESS_KEY`: IAM User Secret Access Key.
- `AWS_DEFAULT_REGION`: AWS Region (default: `us-east-1` or `ap-south-1`).
- `AWS_S3_BUCKET`: Target S3 Bucket name (default: `college-navigation-system-live`).

---

## ⚡ One-Command AWS Deployment:
To push direct changes to AWS:
```bash
npm run deploy:aws
```

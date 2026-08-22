import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config();

function deployToAWS() {
  console.log('🚀 Initiating Smart AI Campus Navigation AWS Direct API Deployment...\n');

  const awsKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_DEFAULT_REGION || 'us-east-1';
  const awsBucket = process.env.AWS_S3_BUCKET || 'college-navigation-system-live';

  if (!awsKey || awsKey.includes('EXAMPLE') || !awsSecret || awsSecret.includes('EXAMPLE')) {
    console.error('❌ AWS API Credentials Missing in .env file!');
    console.error('👉 Please update your .env file with valid AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY credentials.\n');
    process.exit(1);
  }

  // 1. Build Production Bundle
  console.log('📦 Step 1/3: Building Production Web Application Bundle (npm run build)...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Bundle built successfully into dist/\n');
  } catch (err) {
    console.error('❌ Failed to build production bundle.');
    process.exit(1);
  }

  // 2. Configure AWS CLI Env variables
  const envVars = {
    ...process.env,
    AWS_ACCESS_KEY_ID: awsKey,
    AWS_SECRET_ACCESS_KEY: awsSecret,
    AWS_DEFAULT_REGION: awsRegion
  };

  // 3. Create S3 Bucket if it doesn't exist
  console.log(`☁️ Step 2/3: Ensuring AWS S3 Bucket "${awsBucket}" exists...`);
  try {
    const checkBucketCmd = `aws s3api head-bucket --bucket ${awsBucket} 2>/dev/null || aws s3 mb s3://${awsBucket} --region ${awsRegion}`;
    execSync(checkBucketCmd, { env: envVars, stdio: 'inherit' });
  } catch (err) {
    console.log(`ℹ️ Bucket "${awsBucket}" checked.`);
  }

  // 4. Configure Static Website Hosting on S3
  try {
    const websiteCmd = `aws s3 website s3://${awsBucket}/ --index-document index.html --error-document index.html`;
    execSync(websiteCmd, { env: envVars, stdio: 'ignore' });
  } catch (err) {
    // Ignore if policy requires manual bucket policy
  }

  // 5. Sync Assets directly to AWS S3 Bucket
  console.log(`📤 Step 3/3: Syncing web assets directly to AWS S3 bucket s3://${awsBucket}...`);
  try {
    const syncCmd = `aws s3 sync dist/ s3://${awsBucket} --delete`;
    execSync(syncCmd, { env: envVars, stdio: 'inherit' });
    console.log('\n🎉 AWS DEPLOYMENT COMPLETE!');
    console.log(`🌐 Live AWS App URL: http://${awsBucket}.s3-website-${awsRegion}.amazonaws.com/`);
  } catch (err) {
    console.error('❌ AWS CLI sync failed. Make sure AWS CLI is installed and AWS credentials in .env have S3 permissions.');
    process.exit(1);
  }
}

deployToAWS();

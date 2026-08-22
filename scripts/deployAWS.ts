import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

async function deployToAWSWithSDK() {
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

  // Dynamic import of AWS SDK
  let S3Client, PutObjectCommand, CreateBucketCommand;
  try {
    const s3Module = await import('@aws-sdk/client-s3');
    S3Client = s3Module.S3Client;
    PutObjectCommand = s3Module.PutObjectCommand;
    CreateBucketCommand = s3Module.CreateBucketCommand;
  } catch (err) {
    console.log('📦 Installing AWS SDK dependencies...');
    execSync('npm install @aws-sdk/client-s3 --save-dev', { stdio: 'inherit' });
    const s3Module = await import('@aws-sdk/client-s3');
    S3Client = s3Module.S3Client;
    PutObjectCommand = s3Module.PutObjectCommand;
    CreateBucketCommand = s3Module.CreateBucketCommand;
  }

  const s3Client = new S3Client({
    region: awsRegion,
    credentials: {
      accessKeyId: awsKey,
      secretAccessKey: awsSecret
    }
  });

  // 2. Ensure S3 Bucket Exists
  console.log(`☁️ Step 2/3: Checking AWS S3 Bucket "${awsBucket}" in region "${awsRegion}"...`);
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: awsBucket }));
    console.log(`✅ Provisioned S3 Bucket: ${awsBucket}`);
  } catch (err: any) {
    if (err.name === 'BucketAlreadyOwnedByYou' || err.name === 'BucketAlreadyExists') {
      console.log(`✅ Using existing S3 Bucket: ${awsBucket}`);
    } else {
      console.log(`ℹ️ Bucket check complete for "${awsBucket}".`);
    }
  }

  // 3. Upload Files from dist/ to S3
  const distDir = path.join(process.cwd(), 'dist');
  const getFiles = (dir: string): string[] => {
    const subdirs = fs.readdirSync(dir);
    const files = subdirs.map(subdir => {
      const res = path.resolve(dir, subdir);
      return fs.statSync(res).isDirectory() ? getFiles(res) : [res];
    });
    return files.reduce((acc, file) => acc.concat(file), []);
  };

  const allFiles = getFiles(distDir);
  console.log(`📤 Step 3/3: Uploading ${allFiles.length} static assets directly to AWS S3...`);

  const getContentType = (filePath: string) => {
    if (filePath.endsWith('.html')) return 'text/html';
    if (filePath.endsWith('.css')) return 'text/css';
    if (filePath.endsWith('.js')) return 'application/javascript';
    if (filePath.endsWith('.png')) return 'image/png';
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
    if (filePath.endsWith('.svg')) return 'image/svg+xml';
    if (filePath.endsWith('.json')) return 'application/json';
    return 'application/octet-stream';
  };

  for (const filePath of allFiles) {
    const relativePath = path.relative(distDir, filePath).replace(/\\/g, '/');
    const fileStream = fs.createReadStream(filePath);
    const contentType = getContentType(filePath);

    await s3Client.send(new PutObjectCommand({
      Bucket: awsBucket,
      Key: relativePath,
      Body: fileStream,
      ContentType: contentType
    }));
    console.log(`  └─ Uploaded: ${relativePath}`);
  }

  console.log('\n🎉 AWS DEPLOYMENT COMPLETE!');
  console.log(`🌐 Live AWS S3 Web App URL: http://${awsBucket}.s3-website-${awsRegion}.amazonaws.com/`);
}

deployToAWSWithSDK().catch(err => {
  console.error('❌ AWS Deployment Error:', err.message || err);
  process.exit(1);
});

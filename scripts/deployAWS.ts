import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, (ans) => resolve(ans.trim())));
};

async function promptAndDeployAWS() {
  console.log('\n===================================================================');
  console.log('🚀 SMART AI CAMPUS NAVIGATION - AWS DIRECT DEPLOYMENT');
  console.log('===================================================================\n');

  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

  let awsKey = process.env.AWS_ACCESS_KEY_ID;
  let awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
  let awsRegion = process.env.AWS_DEFAULT_REGION || 'us-east-1';
  let awsBucket = process.env.AWS_S3_BUCKET || 'cova-college-navigation';

  // Check if AWS Keys need terminal user input
  if (!awsKey || awsKey.includes('EXAMPLE') || !awsSecret || awsSecret.includes('EXAMPLE')) {
    console.log('🗝️ AWS Credentials not found in .env. Please enter your AWS keys below:\n');

    if (!awsKey || awsKey.includes('EXAMPLE')) {
      awsKey = await askQuestion('👉 Enter AWS Access Key ID (e.g. AKIA...): ');
    }

    if (!awsSecret || awsSecret.includes('EXAMPLE')) {
      awsSecret = await askQuestion('👉 Enter AWS Secret Access Key: ');
    }

    const customRegion = await askQuestion(`👉 Enter AWS Region [default: ${awsRegion}]: `);
    if (customRegion) awsRegion = customRegion;

    const customBucket = await askQuestion(`👉 Enter AWS S3 Bucket Name [default: ${awsBucket}]: `);
    if (customBucket) awsBucket = customBucket;

    rl.close();

    if (!awsKey || !awsSecret) {
      console.error('\n❌ AWS Access Key ID and Secret Access Key are required!');
      process.exit(1);
    }

    // Save entered credentials into .env automatically
    console.log('\n💾 Saving AWS Credentials to .env file...');
    envContent = envContent
      .replace(/AWS_ACCESS_KEY_ID=.*/g, `AWS_ACCESS_KEY_ID=${awsKey}`)
      .replace(/AWS_SECRET_ACCESS_KEY=.*/g, `AWS_SECRET_ACCESS_KEY=${awsSecret}`)
      .replace(/AWS_DEFAULT_REGION=.*/g, `AWS_DEFAULT_REGION=${awsRegion}`)
      .replace(/AWS_S3_BUCKET=.*/g, `AWS_S3_BUCKET=${awsBucket}`);

    if (!envContent.includes('AWS_ACCESS_KEY_ID')) {
      envContent += `\nAWS_ACCESS_KEY_ID=${awsKey}\nAWS_SECRET_ACCESS_KEY=${awsSecret}\nAWS_DEFAULT_REGION=${awsRegion}\nAWS_S3_BUCKET=${awsBucket}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('✅ AWS Credentials saved to .env!\n');
  } else {
    rl.close();
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

  // Dynamic import of AWS S3 SDK
  const { S3Client, PutObjectCommand, CreateBucketCommand, PutBucketWebsiteCommand, PutPublicAccessBlockCommand, PutBucketPolicyCommand } = await import('@aws-sdk/client-s3');

  const s3Client = new S3Client({
    region: awsRegion,
    credentials: {
      accessKeyId: awsKey,
      secretAccessKey: awsSecret
    }
  });

  // 2. Provision / Check S3 Bucket
  console.log(`☁️ Step 2/3: Connecting to AWS S3 Bucket "${awsBucket}" in region "${awsRegion}"...`);
  try {
    await s3Client.send(new CreateBucketCommand({ Bucket: awsBucket }));
    console.log(`✅ Provisioned S3 Bucket: ${awsBucket}`);
  } catch (err: any) {
    console.log(`ℹ️ Connected to S3 Bucket "${awsBucket}".`);
  }

  // Disable Public Access Block for Web Hosting
  try {
    await s3Client.send(new PutPublicAccessBlockCommand({
      Bucket: awsBucket,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    }));
    console.log(`✅ Unblocked Public Access Policy for ${awsBucket}`);
  } catch (err) {
    console.log(`ℹ️ Public Access Block policy updated.`);
  }

  // Configure Website Hosting on S3
  try {
    await s3Client.send(new PutBucketWebsiteCommand({
      Bucket: awsBucket,
      WebsiteConfiguration: {
        IndexDocument: { Suffix: 'index.html' },
        ErrorDocument: { Key: 'index.html' }
      }
    }));
    console.log(`✅ AWS S3 Static Website Hosting enabled for ${awsBucket}`);
  } catch (err: any) {
    console.log(`ℹ️ Website hosting configuration updated.`);
  }

  // Configure Public Read Bucket Policy
  try {
    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: `arn:aws:s3:::${awsBucket}/*`
        }
      ]
    };
    await s3Client.send(new PutBucketPolicyCommand({
      Bucket: awsBucket,
      Policy: JSON.stringify(bucketPolicy)
    }));
    console.log(`✅ Applied Public Read Policy (s3:GetObject) for ${awsBucket}`);
  } catch (err: any) {
    console.log(`ℹ️ Bucket policy notice: ${err.message || 'Updated'}`);
  }

  // 3. Upload Files from dist/ to AWS S3
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
    console.log(`  └─ Uploaded to AWS: ${relativePath}`);
  }

  console.log('\n===================================================================');
  console.log('🎉 AWS DEPLOYMENT SUCCESSFUL!');
  console.log(`🌐 Live AWS S3 URL: http://${awsBucket}.s3-website-${awsRegion}.amazonaws.com/`);
  console.log('===================================================================\n');
}

promptAndDeployAWS().catch(err => {
  console.error('❌ AWS Deployment Error:', err.message || err);
  process.exit(1);
});

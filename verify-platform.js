import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:5005';
const FRONTEND_URL = 'http://localhost:3000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function checkEndpoint(name, url) {
  try {
    const response = await fetch(url, { timeout: 5000 });
    if (response.ok) {
      console.log(`${colors.green}✅ ${name}: Working${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠️  ${name}: Responded with status ${response.status}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ${name}: Not responding${colors.reset}`);
    return false;
  }
}

async function verifyPlatform() {
  console.log(`\n${colors.blue}🔍 Verifying EcoPower EaaS Platform...${colors.reset}\n`);

  const checks = [
    { name: 'Backend Health', url: `${BACKEND_URL}/api/health` },
    { name: 'Energy Plans API', url: `${BACKEND_URL}/api/plans` },
    { name: 'Frontend', url: FRONTEND_URL }
  ];

  let allPassed = true;

  for (const check of checks) {
    const passed = await checkEndpoint(check.name, check.url);
    if (!passed) allPassed = false;
  }

  console.log('');

  if (allPassed) {
    console.log(`${colors.green}🎉 All systems operational!${colors.reset}`);
    console.log(`\n${colors.blue}📝 Next Steps:${colors.reset}`);
    console.log(`1. Open ${colors.yellow}http://localhost:3000${colors.reset} in your browser`);
    console.log(`2. Login with test credentials:`);
    console.log(`   ${colors.yellow}admin@ecopower.com / password123${colors.reset}`);
    console.log(`3. Explore the platform features\n`);
  } else {
    console.log(`${colors.red}⚠️  Some services are not running${colors.reset}`);
    console.log(`\n${colors.blue}Troubleshooting:${colors.reset}`);
    console.log(`1. Make sure you ran: ${colors.yellow}npm run server${colors.reset}`);
    console.log(`2. Make sure you ran: ${colors.yellow}npm run dev${colors.reset}`);
    console.log(`3. Check if ports 3000 and 5005 are available`);
    console.log(`4. Verify .env.local file exists with MongoDB URI\n`);
  }
}

verifyPlatform();

// Import from the official package
const { checkDrift, parseEnv, loadConfig, report } = require('env-drift-check');
const path = require('path');

/**
 * Ensures the environment is valid before the app starts.
 * This is a 'fail-fast' mechanism.
 */
function bootstrap() {
    console.log('🔍 Validating environment...');
    
    const config = loadConfig();
    const baseEnv = parseEnv(path.resolve(__dirname, '../.env.example'));
    
    let targetEnv;
    try {
        targetEnv = parseEnv(path.resolve(__dirname, '../.env'));
    } catch (e) {
        console.error('❌ Error: .env file is missing!');
        console.log('👉 Run "npm run setup" to create it.');
        process.exit(1);
    }

    const result = checkDrift(baseEnv, targetEnv, config);

    if (result.missing.length || result.errors.length) {
        console.error('❌ Environment drift detected!');
        report(result);
        console.log('\n👉 Run "npm run setup" to synchronize your environment.');
        process.exit(1);
    }

    console.log('✅ Environment is healthy. Starting application...\n');
}

module.exports = bootstrap;

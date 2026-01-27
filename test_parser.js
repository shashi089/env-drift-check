const { parseEnv } = require('./dist/engine/envParser');
const path = require('path');

try {
    // Rebuild first to make sure dist is updated
    const result = parseEnv(path.resolve('test.env'));
    console.log('--- Parser Results ---');
    console.log(JSON.stringify(result, null, 2));

    if (result.PASS_WORD === "mypass#word" && result.USER_NAME === "shashi#naik" && result.SIMPLE_VAR === "value") {
        console.log('✅ Refined parser passed hashing test!');
    } else {
        console.log('❌ Refined parser failed hashing test.');
        process.exit(1);
    }
} catch (err) {
    console.error(err);
}

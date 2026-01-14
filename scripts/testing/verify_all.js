const { execSync } = require('child_process');

console.log("🚀 Starting Comprehensive Feature Verification...\n");

// Updated test suite after cleanup
const tests = [
    { name: "Public API Config", script: "verify_config.js" },
    { name: "App Hardening", script: "verify_hardening.js" },
    { name: "Role-Based Access Control", script: "verify_rbac.js" },
    { name: "User Admin E2E", script: "verify_admin_e2e.js" },
    { name: "Inventory Integration", script: "verify_inventory.js" },
    { name: "Subscription Templates", script: "verify_templates.js" },
    { name: "API Linkage Static Check", script: "check_api_linkage.js" }
];

let failed = false;

for (const test of tests) {
    console.log(`\n---------------------------------------------------`);
    console.log(`Running: ${test.name} (${test.script})`);
    console.log(`---------------------------------------------------`);
    try {
        execSync(`node scripts/testing/${test.script}`, { stdio: 'inherit' });
        console.log(`\n✅ ${test.name} PASSED`);
    } catch (e) {
        console.error(`\n❌ ${test.name} FAILED`);
        failed = true;
    }
}

if (failed) {
    console.log("\n❌ SOME TESTS FAILED. Please review logs.");
    process.exit(1);
} else {
    console.log("\n✨ ALL SYSTEMS OPERATIONAL");
}

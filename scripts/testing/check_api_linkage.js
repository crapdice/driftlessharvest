const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SERVER_ROUTES_DIR = path.join(ROOT_DIR, 'server', 'routes');
const CLIENT_DIRS = [
    path.join(ROOT_DIR, 'js'),
    path.join(ROOT_DIR, 'public', 'admin', 'js')
];

// Helper to get all files
function getAllFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (file.endsWith('.js') || file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

// 1. Extract Server Endpoints
const serverEndpoints = new Set();

// Hardcoded explicit routes in app.js
serverEndpoints.add('GET /api/admin/test');

// Route files
const routeFiles = fs.readdirSync(SERVER_ROUTES_DIR).filter(f => f.endsWith('.js'));
routeFiles.forEach(file => {
    const content = fs.readFileSync(path.join(SERVER_ROUTES_DIR, file), 'utf-8');
    const regex = /router\.(get|post|put|delete|patch)\(\s*['"`](.*?)['"`]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        let method = match[1].toUpperCase();
        let routePath = match[2];

        // Normalize route path
        if (routePath === '/') routePath = '';

        // Assumption: All route files in this dir are mounted at /api
        let fullPath = '/api' + routePath;

        // Normalize params (e.g. /:id) -> /{param} for looser matching if needed, 
        // but for now let's keep it exact or handle it in comparison loops.
        // Actually, let's keep it as declared.

        serverEndpoints.add(`${method} ${fullPath}`);
    }
});

console.log(`Found ${serverEndpoints.size} server endpoints.`);

// 2. Extract Client Calls
const clientCalls = [];

const clientFiles = [];
CLIENT_DIRS.forEach(d => getAllFiles(d, clientFiles));

clientFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');

    // Regex for fetch
    // fetch('/api/...')
    // fetch(`/api/${id}`) -> Need to be careful with templates.
    // For assessment, we'll try to match static strings first, and maybe warns on templates.

    const fetchRegex = /fetch\(\s*['"`](.*?)['"`]/g;
    let match;
    while ((match = fetchRegex.exec(content)) !== null) {
        clientCalls.push({
            url: match[1],
            file: path.relative(ROOT_DIR, file),
            method: 'UNKNOWN' // fetch default is GET, usually.
        });
    }

    // Regex for fetch with method
    // fetch(url, { method: 'POST' }) -- hard to parse with regex reliably.
    // We will assume GET if unknown, or mark as "Needs verification".
});

console.log(`Found ${clientCalls.length} client (fetch) calls.`);

// 3. Compare
const potentialBrokenLinks = [];

clientCalls.forEach(call => {
    // If it's a relative path . or .., skip (asset)
    if (call.url.startsWith('.')) return;

    // If it's template literal (has ${...}), skip or try to generalize.
    if (call.url.includes('${')) {
        // e.g. /api/products/${id} -> /api/products/:id
        // Try to verify if a matching pattern exists.
        return;
    }

    // Filter for /api calls
    if (!call.url.startsWith('/api')) return;

    // Check if exists in server endpoints
    // We check against all methods because we didn't extract method from client well.
    let found = false;
    for (const endpoint of serverEndpoints) {
        const [method, route] = endpoint.split(' ');

        // Exact match
        if (route === call.url) {
            found = true;
            break;
        }

        // Param match: /api/products/:id vs /api/products/123 (if hardcoded)
        // ...
    }

    if (!found) {
        potentialBrokenLinks.push(call);
    }
});

// 4. Report
console.log("\n--- Potential Broken API Links ---");
if (potentialBrokenLinks.length === 0) {
    console.log("None found (ignoring template literals).");
} else {
    potentialBrokenLinks.forEach(l => {
        console.log(`[${l.file}] fetches '${l.url}' - No exact match in server routes.`);
    });
}

console.log("\n--- Server Endpoints ---");
Array.from(serverEndpoints).sort().forEach(e => console.log(e));

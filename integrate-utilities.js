const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'public/admin/index.html');
const utilitiesViewPath = path.join(__dirname, 'public/admin/utilities-view.html');
const utilitiesFunctionsPath = path.join(__dirname, 'public/admin/js/utilities-functions.js');

console.log('Adding Admin Utilities to index.html...\n');

// Read files
let indexHtml = fs.readFileSync(indexPath, 'utf8');
const utilitiesView = fs.readFileSync(utilitiesViewPath, 'utf8');

// 1. Add sidebar link after Admin Configuration button
const sidebarLink = `                    
                    <button onclick="setTab('utilities')" id="nav-utilities"
                        class="w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 text-gray-600 hover:bg-gray-50 transition-colors">
                        <span>🛠️</span> <span class="font-medium">Admin Utilities</span>
                    </button>
`;

// Find the Admin Configuration button and add utilities link after it
const adminConfigPattern = /<button onclick="setTab\('settings'\)"[^>]*>[\s\S]*?Admin Configuration[\s\S]*?<\/button>/;
const match = indexHtml.match(adminConfigPattern);

if (match) {
    const insertPosition = indexHtml.indexOf(match[0]) + match[0].length;
    indexHtml = indexHtml.slice(0, insertPosition) + sidebarLink + indexHtml.slice(insertPosition);
    console.log('✓ Added sidebar link');
} else {
    console.log('✗ Could not find Admin Configuration button');
}

// 2. Add utilities view before closing main content div
// Find a good insertion point - after the last view div
const lastViewPattern = /<\/div>\s*<\/div>\s*<!-- Main Content -->/;
const viewMatch = indexHtml.match(lastViewPattern);

if (viewMatch) {
    const viewInsertPosition = indexHtml.indexOf(viewMatch[0]);
    indexHtml = indexHtml.slice(0, viewInsertPosition) + '\n' + utilitiesView + '\n' + indexHtml.slice(viewInsertPosition);
    console.log('✓ Added utilities view');
} else {
    console.log('✗ Could not find insertion point for view');
}

// 3. Add script include before closing body tag
const scriptInclude = `    <script src="/admin/js/utilities-functions.js"></script>\n`;
const bodyClosePattern = /<\/body>/;

if (indexHtml.match(bodyClosePattern)) {
    indexHtml = indexHtml.replace(bodyClosePattern, scriptInclude + '</body>');
    console.log('✓ Added script include');
} else {
    console.log('✗ Could not find closing body tag');
}

// Write modified index.html
fs.writeFileSync(indexPath, indexHtml, 'utf8');

console.log('\n✅ Admin Utilities integration complete!');
console.log('The utilities page is now accessible from the admin sidebar.');

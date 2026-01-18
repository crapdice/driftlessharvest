const app = require('./server/app');
const listEndpoints = (router, path = '') => {
    const endpoints = [];
    router.stack.forEach(layer => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
            endpoints.push(`${methods} ${path}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle.stack) {
            const newPath = path + (layer.regexp.source.replace('\\/', '/').replace('^', '').replace('(?=\\/|$)', '').replace('\\/?', ''));
            endpoints.push(...listEndpoints(layer.handle, newPath));
        }
    });
    return endpoints;
};

console.log('Registered API Endpoints:');
listEndpoints(app._router)
    .filter(e => e.includes('/api'))
    .sort()
    .forEach(e => console.log(e));

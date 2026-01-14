async function checkConfig() {
    try {
        const res = await fetch('http://localhost:3000/api/config');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const config = await res.json();

        const loginImage = config.auth?.login?.image;
        const expected = "/images/ridge_valley_farm.png";

        console.log(`Auth Login Image: "${loginImage}"`);

        if (loginImage === expected) {
            console.log("SUCCESS: Image match verified.");
        } else {
            console.error(`FAILURE: Expected "${expected}", got "${loginImage}"`);
            process.exit(1);
        }
    } catch (e) {
        console.error("Fetch failed:", e.message);
        process.exit(1);
    }
}

checkConfig();

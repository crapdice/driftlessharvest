import 'dotenv/config';
import fetch from 'node-fetch';

async function testResend() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('❌ RESEND_API_KEY missing');
        process.exit(1);
    }

    console.log('--- Testing Resend API ---');
    console.log(`Key start: ${apiKey.substring(0, 10)}...`);

    try {
        const response = await fetch('https://api.resend.com/emails', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('✅ Success');
        } else {
            console.log('❌ Failed');
            if (response.status === 403 && data.message?.includes('restricted')) {
                console.log('💡 Confirmed: It is a restricted key error.');
            }
        }
    } catch (error) {
        console.error('❌ Request Error:', error.message);
    }
}

testResend();

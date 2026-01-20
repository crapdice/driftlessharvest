import 'dotenv/config';
import Stripe from 'stripe';

async function testStripe() {
    const key = process.env.STRIPE_SECRET_KEY;

    if (!key) {
        console.error('❌ STRIPE_SECRET_KEY is missing from process.env');
        process.exit(1);
    }

    console.log(`--- Testing Stripe Connection ---`);
    console.log(`Key Length: ${key.length}`);
    console.log(`Key Start: "${key.substring(0, 7)}..."`);
    console.log(`Key Hex: ${Buffer.from(key).toString('hex').substring(0, 20)}...`);

    // Log char codes for potential hidden characters
    const codes = [];
    for (let i = 0; i < key.length; i++) codes.push(key.charCodeAt(i));
    console.log(`First 10 char codes: ${codes.slice(0, 10)}`);
    console.log(`Last 10 char codes: ${codes.slice(-10)}`);

    if (key.includes('\r') || key.includes('\n')) {
        console.warn('⚠️ Warning: Key contains newline characters');
    }

    const stripe = new Stripe(key.trim());

    try {
        const balance = await stripe.balance.retrieve();
        console.log('✅ Success: Balance retrieved');
        console.log('Livemode:', balance.livemode);
        process.exit(0);
    } catch (error) {
        console.error('❌ Stripe Error:', error.message);
        console.error('Error Code:', error.code);
        process.exit(1);
    }
}

testStripe();

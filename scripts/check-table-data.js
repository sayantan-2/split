#!/usr/bin/env node

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'myuser',
    password: process.env.POSTGRES_PASSWORD || 'mypassword',
    database: process.env.POSTGRES_DB || 'mydatabase',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTables() {
    const client = await pool.connect();
    try {
        const tables = [
            'users',
            'friendships',
            'payment_requests',
            'bills',
            'bill_items',
            'bill_participants',
            'bill_item_splits',
            'sessions',
            'accounts',
            'verification_tokens',
            'users_nextauth'
        ];

        console.log('📊 Table Data Analysis:\n');
        console.log('TABLE NAME           | ROWS  | STATUS');
        console.log('---------------------|-------|------------------');

        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                const count = parseInt(result.rows[0].count);
                const status = count > 0 ? '✅ HAS DATA' : '⚪ EMPTY';
                console.log(`${table.padEnd(20)} | ${count.toString().padStart(5)} | ${status}`);
            } catch (error) {
                console.log(`${table.padEnd(20)} | ERROR | ❌ ${error.message}`);
            }
        }

        console.log('\n📋 Analysis Summary:');

        // Check which empty tables should have data
        const shouldHaveData = ['bills', 'bill_items', 'bill_participants', 'bill_item_splits'];

        console.log('\n🤔 Empty Tables Analysis:');
        for (const table of shouldHaveData) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                const count = parseInt(result.rows[0].count);
                if (count === 0) {
                    console.log(`  • ${table}: This indicates bills functionality hasn't been used yet`);
                }
            } catch (error) {
                console.log(`  • ${table}: Error checking - ${error.message}`);
            }
        }

        // Check NextAuth tables
        console.log('\n🔐 NextAuth Tables (may be empty if using different auth):');
        const nextAuthTables = ['sessions', 'accounts', 'verification_tokens'];
        for (const table of nextAuthTables) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                const count = parseInt(result.rows[0].count);
                if (count === 0) {
                    console.log(`  • ${table}: Empty (normal if using custom auth or no OAuth)`);
                }
            } catch (error) {
                console.log(`  • ${table}: Error - ${error.message}`);
            }
        }

    } finally {
        client.release();
        await pool.end();
    }
}

checkTables().catch(console.error);

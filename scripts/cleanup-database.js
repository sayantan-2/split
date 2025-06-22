#!/usr/bin/env node

/**
 * Database cleanup script - removes unused tables from the database
 * This script will drop tables that are not used by the application
 */

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

async function cleanupDatabase() {
    const client = await pool.connect();
    
    try {
        console.log('🧹 Starting database cleanup...\n');

        // List of unused tables to drop
        const tablesToDrop = [
            'settlements',
            'payment_reminders', 
            'payment_disputes'
        ];

        // List of unused views to drop
        const viewsToDrop = [
            'payment_summary'
        ];

        // Drop views first (they may depend on tables)
        for (const viewName of viewsToDrop) {
            try {
                await client.query(`DROP VIEW IF EXISTS ${viewName} CASCADE`);
                console.log(`✅ Dropped view: ${viewName}`);
            } catch (error) {
                console.log(`⚠️  View ${viewName} doesn't exist or couldn't be dropped: ${error.message}`);
            }
        }

        // Drop unused tables
        for (const tableName of tablesToDrop) {
            try {
                await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
                console.log(`✅ Dropped table: ${tableName}`);
            } catch (error) {
                console.log(`⚠️  Table ${tableName} doesn't exist or couldn't be dropped: ${error.message}`);
            }
        }

        // Check what tables remain
        console.log('\n📋 Remaining tables in database:');
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        result.rows.forEach(row => {
            console.log(`  • ${row.table_name}`);
        });

        // Check what views remain
        console.log('\n📋 Remaining views in database:');
        const viewResult = await client.query(`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        if (viewResult.rows.length > 0) {
            viewResult.rows.forEach(row => {
                console.log(`  • ${row.table_name} (view)`);
            });
        } else {
            console.log('  (no custom views)');
        }

        console.log('\n🎉 Database cleanup completed successfully!');
        console.log('\n✅ Remaining tables are:');
        console.log('  • users - User authentication and profiles');
        console.log('  • payment_requests - Core payment tracking');
        console.log('  • bills - Bill management');
        console.log('  • bill_items - Bill line items');
        console.log('  • bill_item_splits - How items are split');
        console.log('  • bill_participants - Who participates in bills');
        console.log('  • friendships - Friends/connections between users');
        console.log('  • sessions - NextAuth session management');
        console.log('  • accounts - NextAuth account linking');
        console.log('  • verification_tokens - NextAuth email verification');

    } catch (error) {
        console.error('❌ Error during database cleanup:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await cleanupDatabase();
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to cleanup database:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { cleanupDatabase };

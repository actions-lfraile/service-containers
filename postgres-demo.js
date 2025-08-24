#!/usr/bin/env node

const { Client } = require('pg');

async function main() {
	const client = new Client({
		host: process.env.PGHOST,
		port: Number(process.env.PGPORT || 5432),
		user: process.env.PGUSER || 'postgres',
		password: process.env.PGPASSWORD ,
		database: process.env.PGDATABASE,
	});

	await client.connect();

	try {
		await client.query(`
			CREATE TABLE IF NOT EXISTS customers (
				id SERIAL PRIMARY KEY,
				name TEXT NOT NULL,
				company_name TEXT NOT NULL,
				vat TEXT NOT NULL UNIQUE
			);
		`);

		await client.query(`TRUNCATE TABLE customers RESTART IDENTITY;`);

		const demo = [
			{ name: 'Alice Johnson', company: 'Acme Corp', vat: 'B5837291' },
			{ name: 'Bob Smith', company: 'Beta LLC', vat: 'B93047582' },
			{ name: 'Carol Davis', company: 'Contoso', vat: 'B174029583' },
			{ name: 'Daniel Lee', company: 'Fabrikam', vat: 'B6041932' },
			{ name: 'Eve Clark', company: 'Globex', vat: 'B85731049' },
		];

		const values = [];
		const params = [];
		demo.forEach((row, i) => {
			const base = i * 3;
			values.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
			params.push(row.name, row.company, row.vat);
		});

		await client.query(
			`INSERT INTO customers (name, company_name, vat) VALUES ${values.join(', ')}
			 ON CONFLICT (vat) DO NOTHING;`,
			params
		);

		const res = await client.query(
			`SELECT name, company_name, vat FROM customers ORDER BY id;`
		);

		const sanitize = (v) =>
			String(v).replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
		for (const r of res.rows) {
			process.stdout.write(
				[sanitize(r.name), sanitize(r.company_name), sanitize(r.vat)].join('\t') + '\n'
			);
		}
	} finally {
		await client.end();
	}
}

main().catch((err) => {
	console.error('Error:', err.message);
	process.exit(1);
});

import {Pool} from 'pg';
import dotenv from 'dotenv';
dotenv.config();


const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST ,  // or your database host
    database: process.env.DB_NAME,  // replace with your database name
    password: process.env.DB_PASSWORD  ,  // replace with your database password
    port: 5432,  // default PostgreSQL port     
});


export default pool;
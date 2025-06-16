import "dotenv/config"
import * as mysql from "mysql2"

const connection = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  database: process.env.MYSQL_DATABASE,
  password:process.env.MYSQL_PASSWORD,
})

export { connection }

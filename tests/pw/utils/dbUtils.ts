import { expect } from '@playwright/test';
import { MySqlConnection, DbContext } from 'mysqlconnector';
import { serialize, unserialize } from 'php-serialize';
const { DB_HOST_NAME, DB_USER_NAME, DB_USER_PASSWORD, DATABASE, DB_PORT, DB_PREFIX } = process.env;

const mySql = new MySqlConnection({
    hostname: DB_HOST_NAME,
    username: DB_USER_NAME,
    password: DB_USER_PASSWORD,
    db: DATABASE,
    port: Number(DB_PORT),
});

const dbPrefix = DB_PREFIX;

export const dbUtils = {
    // execute db query
    async dbQuery(query: string): Promise<any> {
        const dbContext: DbContext = new DbContext(mySql);
        return await dbContext.inTransactionAsync(async dbContext => {
            try {
                const result = await dbContext.executeAsync(query);
                const res = JSON.parse(JSON.stringify(result));
                expect(res).not.toHaveProperty('errno');
                return res;
            } catch (err: unknown) {
                // console.log('dbError:', err);
                return err;
            }
        });
    },

    // get max id
    async getMaxId(columnName: string, tableName: string): Promise<any> {
        const querySelect = `SELECT MAX(${columnName}) as id FROM ${dbPrefix}_${tableName};`;
        const res = await dbUtils.dbQuery(querySelect);
        // console.log(res);
        const id = res[0].id;
        return id;
    },

    // update option table
    async updateWpOptionTable(optionName: string, optionValue: object | string, serializeData?: string): Promise<any> {
        optionValue = serializeData ? serialize(optionValue) : optionValue;
        const queryUpdate = `UPDATE ${dbPrefix}_options SET option_value = '${optionValue}' WHERE option_name = '${optionName}';`;
        const res = await dbUtils.dbQuery(queryUpdate);
        // console.log(res);
        return res;
    },

    // create user meta
    async createUserMeta(userId: string, metaKey: string, metaValue: object | string, serializeData?: string): Promise<any> {
        metaValue = serializeData ? serialize(metaValue) : metaValue;
        const metaExists = await dbUtils.dbQuery(`SELECT EXISTS (SELECT 1 FROM ${dbPrefix}_usermeta WHERE user_id = '${userId}' AND meta_key = '${metaKey}') AS row_exists;`);
        const queryUpdate = metaExists[0].row_exists
            ? `UPDATE ${dbPrefix}_usermeta SET meta_value = '${metaValue}'  WHERE user_id = '${userId}' AND meta_key = '${metaKey}';`
            : `INSERT INTO ${dbPrefix}_usermeta VALUES ( NULL, '${userId}', '${metaKey}', '${metaValue}');`;
        const res = await dbUtils.dbQuery(queryUpdate);
        // console.log(res);
        return res;
    },

    // delete a table
    async deleteTable(table: string): Promise<any> {
        const queryDelete = `TRUNCATE TABLE ${dbPrefix}_${table};`;
        const res = await dbUtils.dbQuery(queryDelete);
        // console.log(res);
        return res;
    },

    // delete a table
    async deleteLoginData(table: string, userId: string): Promise<any> {
        const queryDelete = `DELETE FROM ${dbPrefix}_${table} WHERE user_id = ${userId};`;
        const res = await dbUtils.dbQuery(queryDelete);
        // console.log(res);
        return res;
    },

    // get wepos settings
    async getWeposSettings(optionName: string): Promise<any> {
        const querySelect = `Select option_value FROM ${dbPrefix}_options WHERE option_name = '${optionName}';`;
        const res = await dbUtils.dbQuery(querySelect);
        // console.log(res[0].option_value);
        // console.log(unserialize(res[0].option_value));
        return unserialize(res[0].option_value);
    },

    // set wepos settings
    async setWeposSettings(optionName: string, optionValue: object | string): Promise<any> {
        optionValue = typeof optionValue == 'object' ? serialize(optionValue) : optionValue;
        const queryInsert = `INSERT INTO ${dbPrefix}_options VALUES ( NULL, '${optionName}', '${optionValue}', 'yes');`;
        let res = await dbUtils.dbQuery(queryInsert);
        if (res.code === 'ER_DUP_ENTRY') {
            const queryUpdate = `UPDATE ${dbPrefix}_options SET option_value = '${optionValue}' WHERE option_name = '${optionName}';`;
            res = await dbUtils.dbQuery(queryUpdate);
        }
        // console.log(res);
        return res;
    },
};

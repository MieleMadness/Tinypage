import {DatabaseManager} from "../data/database-manager";
import {DatabaseService} from "./database-service";
import {DbTypeConverter} from "../utils/db-type-converter";
import {HttpError} from "../utils/http-error";
import {StatusCodes} from "http-status-codes";

/**
 * This service takes care of transactional tasks for Analytics.
 */
export class AdminService extends DatabaseService {

    constructor(databaseManager: DatabaseManager) {
        super(databaseManager);
    }

    /**
     * Returns analytics data from the database.
     *
     * Returns all data as -1 if the database was unable to be queried.
     */
    async getPermGroup(userId: string): Promise<PermissionGroup> {
        let queryResult = await this.pool.query<DbPermissionGroup>("select * from app.perm_groups where user_id=$1", [userId]);

        if (queryResult.rowCount < 1) {
            return {
                id: '',
                userId: '',
                groupName: ''
            };
        }

        let dbPermissionGroup = queryResult.rows[0];

        return DbTypeConverter.toPermGroup(dbPermissionGroup);
    }

    /**
     * Bans or unbans a user. Returns a DbBanned Object if banned, null if unbanned.
     *
     * @param userId
     * @param banned
     * @param reason
     */
    async setBanned(userId: string, banned: boolean, reason?: string): Promise<DbBanned | { user_id: string; banned: boolean, message: string }> {
        if (banned) {
            let queryResult = await this.pool.query<DbBanned>("insert into security.banned(user_id, reason) values ($1, $2) on conflict(user_id) do update set reason=$2 returning *",
                [
                    userId,
                    reason ?? null
                ]);

            if (queryResult.rowCount < 1)
                throw new HttpError(StatusCodes.NOT_FOUND, "The user couldn't be found.");

            return queryResult.rows[0];
        } else {
            await this.pool.query("delete from security.banned where user_id=$1", [userId]);

            return {user_id: userId, banned: false, message: "User unbanned."};
        }
    }

    /**
     * Returns a list of all banned users.
     */
    async listBanned(): Promise<{ ban: DbBanned, userData: SensitiveUser | undefined }[]> {
        let queryResult = await this.pool.query<DbBanned>("select * from security.banned");

        let bannedRows = queryResult.rows;
        let userRows: DbSensitiveUserWithPassword[] = [];

        if (queryResult.rowCount > 0) {
            let userData = await this.pool.query<DbSensitiveUserWithPassword>("select * from app.users where id = any($1)",
                [
                    queryResult.rows.map(x => x.user_id)
                ]);

            userRows = userData.rows;
        }

        let final: { ban: DbBanned, userData: SensitiveUser | undefined }[] = [];

        for (let bannedRow of bannedRows) {
            let find = userRows.find(x => x.id === bannedRow.user_id);

            final.push({
                ban: bannedRow,
                userData: find ? DbTypeConverter.toSensitiveUser(find) : undefined
            });
        }

        return final;
    }
}

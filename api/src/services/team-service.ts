import {DatabaseService} from "./database-service";
import {DatabaseManager} from "../data/database-manager";

export class TeamService extends DatabaseService {

    constructor(databaseManager: DatabaseManager) {
        super(databaseManager);
    }

    async listTeamMembers(userId: string) {
        let dbProfileMember: DbProfileMember[] = [];

        let profiles = await this.pool.query<{ id: string }>("select id from app.profiles where user_id=$1", [userId]);

        for (let row of profiles.rows) {
            let queryResult = await this.pool.query<DbProfileMember>("select * from enterprise.profile_members where profile_id=$1", [row.id]);

            for (let row of queryResult.rows) {
                dbProfileMember.push(row);
            }
        }

        return dbProfileMember;
    }

    async addTeamMember(profileId: string, memberId: string, role?: string) {
        await this.pool.query("insert into enterprise.profile_members(user_id, profile_id, role) values($1, $2, $3) on conflict(user_id, profile_id) do update set user_id=$1, profile_id=$2, role=$3",
            [
                memberId,
                profileId,
                role
            ]);
    }

    async removeTeamMember(profileId: string, memberId: string) {
        await this.pool.query("delete from enterprise.profile_members where user_id=$1 and profile_id=$2",
            [
                memberId,
                profileId
            ]);
    }
}

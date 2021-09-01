import {Pool} from "pg";
import {ProfileService} from "../services/profile-service";
import {ThemeService} from "../services/theme-service";
import {DbTypeConverter} from "./db-type-converter";

export class ProfileSerializer {
    /**
     * Private pool instance for Job Manager.
     * @private
     */
    private static pool: Pool;
    private static profileService: ProfileService;
    private static themeService: ThemeService;

    /**
     * Initialize Job System.
     * @param pool
     */
    static initialize(pool: Pool) {
        this.pool = pool;
    }

    static async exportProfile(id: string): Promise<SerializedProfile | null> {
        let serializedProfile: SerializedProfile = {
            profile: {
                id: '',
                handle: '',
                userId: '',
                imageUrl: null,
                headline: null,
                subtitle: null,
                social: {
                    icon: '',
                    link: '',
                    alt: ''
                },
                showWatermark: true,
                customCss: '',
                customHtml: '',
                customDomain: '',
                themeId: '',
                visibility: 'unpublished',

                // The metadata tag will grow over time as functionality is added.
                metadata: {},

                createdOn: ''
            },
            links: [],
            themes: []
        };

        let profileQuery = await this.pool.query<DbProfile>("select * from app.profiles where id=$1", [id]);

        if (profileQuery.rowCount < 1)
            return null;

        let profile = DbTypeConverter.toProfile(profileQuery.rows[0]);

        serializedProfile.profile.imageUrl = profile.imageUrl;
        serializedProfile.profile.headline = profile.headline;
        serializedProfile.profile.subtitle = profile.subtitle;
        serializedProfile.profile.social = profile.social;
        serializedProfile.profile.showWatermark = profile.showWatermark;
        serializedProfile.profile.customCss = profile.customCss;
        serializedProfile.profile.customHtml = profile.customHtml;
        serializedProfile.profile.metadata = profile.metadata;

        let userId = profile.userId;

        let themes = [];
        let themesQuery = await this.pool.query<DbTheme>("select * from app.themes where user_id=$1 and global=false", [userId]);

        for (let row of themesQuery.rows) {
            let theme = DbTypeConverter.toTheme(row);

            if (theme.id == profile.themeId) {
                serializedProfile.profile.themeId = theme.id;
            }

            themes.push(theme);
        }

        serializedProfile.themes = themes;

        let links = [];
        let linksQuery = await this.pool.query<DbLink>("select * from app.links where profile_id=$1", [profile.id]);

        for (let row of linksQuery.rows) {
            let link = DbTypeConverter.toLink(row);
            links.push(link);
        }

        serializedProfile.links = links;

        return serializedProfile;
    }

    static async importProfile(userId: string, profileId: string, data: SerializedProfile) {
        for (let theme of data.themes) {
            let exists = await this.pool.query("select 1 from app.themes where label=$1 and user_id=$2", [theme.label, theme.userId]);

            if (exists.rowCount > 1) {
                // theme is already in database, ignore
                continue;
            }

            try {
                await this.pool.query("insert into app.themes(label, custom_css, custom_html, user_id) values ($1, $2, $3, $4) on conflict do nothing",
                    [
                        theme.label,
                        theme.customCss,
                        theme.customHtml,
                        userId
                    ]);
            } catch (e) {
                // it's likely the theme already exists if this fails, ignore
            }
        }

        await this.pool.query("update app.profiles set image_url=$1, headline=$2, subtitle=$3, social=$4, custom_css=$5, custom_html=$6, metadata=$7, theme_id=$8 where id=$9",
            [
                data.profile.imageUrl,
                data.profile.headline,
                data.profile.subtitle,
                data.profile.social,
                data.profile.customCss,
                data.profile.customHtml,
                data.profile.metadata,
                data.profile.themeId || null,
                profileId
            ]);

        // Wipe links
        await this.pool.query("delete from app.links where profile_id=$1", [profileId]);

        for (let link of data.links) {
            try {
                await this.pool.query<DbLink>(`insert into app.links (profile_id, label, type, url,
                                                                      sort_order,
                                                                      subtitle, style, custom_css,
                                                                      metadata)
                                               values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        profileId,
                        link.label,
                        link.type ?? "link",
                        link.url,
                        link.sortOrder,
                        link.subtitle,
                        link.style,
                        link.customCss,
                        link.metadata ?? {}
                    ]);
            } catch (e) {
                // it's likely the theme already exists if this fails, ignore
            }
        }
    }

}

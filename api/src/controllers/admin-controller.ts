import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {DatabaseManager} from "../data/database-manager";
import {Controller} from "./controller";
import {AdminRequest, Auth, AuthenticatedRequest} from "../utils/auth";
import {AdminService} from "../services/admin-service";
import {StatusCodes} from "http-status-codes";
import {ReplyUtils} from "../utils/reply-utils";
import {HttpError} from "../utils/http-error";
import {UserService} from "../services/user-service";
import {SubscriptionService} from "../services/subscription-service";
import {config} from "../config/config";
import {Stripe} from "stripe";

interface GetGroupRequest extends AuthenticatedRequest {
    Body: {} & AuthenticatedRequest["Body"];
}

interface SetBannedRequest extends AuthenticatedRequest {
    Body: {
        email: string,
        banned: boolean,
        reason?: string,
    } & AdminRequest["Body"];
}

interface SetGodModeRequest extends AuthenticatedRequest {
    Body: {
        email: string,
        set: boolean,
    } & AdminRequest["Body"];
}

/**
 * This controller maps and provides for all the controllers under /admin.
 */
export class AdminController extends Controller {
    private readonly adminService: AdminService;
    private readonly userService: UserService;
    private readonly subService: SubscriptionService;

    private readonly stripe: Stripe;

    constructor(fastify: FastifyInstance, databaseManager: DatabaseManager) {
        super(fastify, databaseManager);

        this.stripe = new Stripe(config.payments.stripeSecret, {
            apiVersion: '2020-08-27',
        });

        this.adminService = new AdminService(databaseManager);
        this.userService = new UserService(databaseManager);
        this.subService = new SubscriptionService(databaseManager, this.stripe);
    }

    registerRoutes(): void {
        // Authenticated
        this.fastify.post<GetGroupRequest>('/admin/perm-group', Auth.ValidateWithData, this.GetPermGroup.bind(this));

        this.fastify.post<SetBannedRequest>('/admin/set-banned', Auth.ValidateAdminWithData, this.SetBanned.bind(this));
        this.fastify.post<AdminRequest>('/admin/bans', Auth.ValidateAdminWithData, this.ListBans.bind(this));

        this.fastify.post<SetGodModeRequest>('/admin/set-godmode-user', Auth.ValidateAdminWithData, this.SetGodMode.bind(this));
        this.fastify.post<SetGodModeRequest>('/admin/godmode-users', Auth.ValidateAdminWithData, this.ListGodModeUsers.bind(this));
    }

    async ListGodModeUsers(request: FastifyRequest<AdminRequest>, reply: FastifyReply) {
        return this.adminService.listGodModeUsers();
    }

    async SetGodMode(request: FastifyRequest<SetGodModeRequest>, reply: FastifyReply) {
        try {
            if (!request.body.email) {
                reply.code(StatusCodes.BAD_REQUEST);
                return ReplyUtils.error("The 'email' field was not set.");
            }

            let sensitiveUser = await this.userService.getSensitiveUserByEmail(request.body.email);

            return this.adminService.setGodMode(sensitiveUser.id, request.body.set);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /admin/perm-group
     *
     * @param request
     * @param reply
     * @constructor
     */
    async GetPermGroup(request: FastifyRequest<GetGroupRequest>, reply: FastifyReply) {
        return this.adminService.getPermGroup(request.body.authUser.id);
    }

    async SetBanned(request: FastifyRequest<SetBannedRequest>, reply: FastifyReply) {
        try {
            if (!request.body.email) {
                reply.code(StatusCodes.BAD_REQUEST);
                return ReplyUtils.error("The 'email' field was not set.");
            }

            let sensitiveUser = await this.userService.getSensitiveUserByEmail(request.body.email);

            if (request.body.authUser.id === sensitiveUser.id) {
                reply.code(StatusCodes.FORBIDDEN);
                return ReplyUtils.error("You cannot ban yourself!");
            }

            if ((await this.adminService.getPermGroup(sensitiveUser.id)).groupName === "admin") {
                reply.code(StatusCodes.FORBIDDEN);
                return ReplyUtils.error("You cannot ban users with admin privileges!");
            }

            return this.adminService.setBanned(sensitiveUser.id, request.body.banned, request.body.reason);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * List all the banned users.
     *
     * @param request
     * @param reply
     * @constructor
     */
    async ListBans(request: FastifyRequest<AdminRequest>, reply: FastifyReply) {
        return this.adminService.listBanned();
    }
}

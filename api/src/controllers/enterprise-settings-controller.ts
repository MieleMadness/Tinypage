import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {DatabaseManager} from "../data/database-manager";
import {Controller} from "./controller";
import {AdminRequest, Auth} from "../utils/auth";
import {AdminService} from "../services/admin-service";
import {EnterpriseSettingsService} from "../services/enterprise-settings-service";
import {HttpError} from "../utils/http-error";
import {ReplyUtils} from "../utils/reply-utils";
import {StatusCodes} from "http-status-codes";

interface SetSettingsRequest extends AdminRequest {
  Body: {
    customization: DbServerCustomization | null | undefined,
    settings: DbServerSettings | null | undefined
  } & AdminRequest["Body"]
}

/**
 * This controller maps and provides for all the controllers under /admin/customization.
 */
export class EnterpriseSettingsController extends Controller {
  private readonly customizationService: EnterpriseSettingsService;
  private readonly adminService: AdminService;

  constructor(fastify: FastifyInstance, databaseManager: DatabaseManager) {
    super(fastify, databaseManager);

    this.customizationService = new EnterpriseSettingsService(databaseManager);
    this.adminService = new AdminService(databaseManager);
  }

  registerRoutes(): void {
    // Authenticated
    this.fastify.post<SetSettingsRequest>('/admin/set-settings', Auth.ValidateAdminWithData, this.SetSettings.bind(this));
    this.fastify.all<AdminRequest>('/admin/settings', this.GetAdminSettings.bind(this));

    this.fastify.all('/app/settings', this.GetSettings.bind(this));
  }

  /**
   * Route for /admin/settings
   *
   * @param request
   * @param reply
   * @constructor
   */
  async SetSettings(request: FastifyRequest<SetSettingsRequest>, reply: FastifyReply) {
    try {
      reply.type('application/json');

      if (!request.body.customization && !request.body.settings) {
        reply.status(StatusCodes.BAD_REQUEST).send(ReplyUtils.error("The request was empty! You must specify the 'customization' or 'settings' fields."));
      }

      return this.customizationService.setSettings(request.body.customization ?? undefined, request.body.settings ?? undefined);
    } catch (e) {
      if (e instanceof HttpError) {
        reply.code(e.statusCode);
        return ReplyUtils.error(e.message, e);
      }

      throw e;
    }
  }

  /**
   * Route for /admin/set-settings
   *
   * Returns ALL the settings available, including private ones.
   *
   * @param request
   * @param reply
   * @constructor
   */
  async GetAdminSettings(request: FastifyRequest<AdminRequest>, reply: FastifyReply) {
    try {
      reply.type('application/json');
      return this.customizationService.getAdminSettings();
    } catch (e) {
      if (e instanceof HttpError) {
        reply.code(e.statusCode);
        return ReplyUtils.error(e.message, e);
      }

      throw e;
    }
  }

  /**
   * Route for /app/settings
   *
   * Returns public facing settings.
   *
   * @param request
   * @param reply
   * @constructor
   */
  async GetSettings(request: FastifyRequest, reply: FastifyReply) {
    try {
      reply.type('application/json');
      return this.customizationService.getSettings();
    } catch (e) {
      if (e instanceof HttpError) {
        reply.code(e.statusCode);
        return ReplyUtils.error(e.message, e);
      }

      throw e;
    }
  }
}

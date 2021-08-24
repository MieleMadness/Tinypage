import {Auth, AuthenticatedRequest, SensitiveAuthenticatedRequest} from "../utils/auth";
import {Controller} from "./controller";
import {SubscriptionService} from "../services/subscription-service";
import {DatabaseManager} from "../data/database-manager";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import Stripe from "stripe";
import {HttpError} from "../utils/http-error";
import {ReplyUtils} from "../utils/reply-utils";
import {config} from "../config/config";
import {StatusCodes} from "http-status-codes";
import Mixpanel from "mixpanel";
import {UserService} from "../services/user-service";

interface SetCardInfoRequest extends SensitiveAuthenticatedRequest {
    Body: {
        card?: {
            number: string;
            expDate: string;
            cvc: string
        }
    } & SensitiveAuthenticatedRequest["Body"]
}

interface SetBillingInfoRequest extends SensitiveAuthenticatedRequest {
    Body: {
        billing?: {
            fullName?: string,
            companyName?: string,
            phone?: string,
            address?: string,
            city?: string,
            zipCode?: string,
            country?: string,
        }
    } & SensitiveAuthenticatedRequest["Body"]
}

interface SubscribeRequest extends SensitiveAuthenticatedRequest {
    Body: {
        tier: SubscriptionTier | null | undefined
    } & SensitiveAuthenticatedRequest["Body"]
}

/**
 * Add/Update a seat.
 *
 * @field seatMemberId The id of the user being added/changed on the main account. Use either this or the email.
 * @field seatMemberEmail The email of the user being added/changed on the main account.
 * @field role The role the user should have.
 */
interface UpdateSeatMemberRequest extends SensitiveAuthenticatedRequest {
    Body: {
        seatMemberId: string,
        seatMemberEmail: string,
        role?: string
    } & SensitiveAuthenticatedRequest["Body"]
}

/**
 * Remove a seat member.
 *
 * @field seatMemberId The id of the user being added/changed on the main account. Use either this or the email.
 * @field seatMemberEmail The email of the user being added/changed on the main account.
 * @field role The role the user should have.
 */
interface RemoveSeatMemberRequest extends SensitiveAuthenticatedRequest {
    Body: {
        seatMemberId: string,
        seatMemberEmail: string,
    } & SensitiveAuthenticatedRequest["Body"]
}

interface BuySeatsRequest extends SensitiveAuthenticatedRequest {
    Body: {
        amount: number,
    } & SensitiveAuthenticatedRequest["Body"]
}

interface CancelSeatsRequest extends SensitiveAuthenticatedRequest {
    Body: {
        amount: number,
    } & SensitiveAuthenticatedRequest["Body"]
}

interface ExpireSeatRequest extends SensitiveAuthenticatedRequest {
    Body: {
        seatMemberId: string,
        seatMemberEmail: string,
        expired: boolean
    } & SensitiveAuthenticatedRequest["Body"]
}

/**
 * This controller maps and provides for all the controllers under /payments and /seats.
 */
export class SubscriptionController extends Controller {
    private readonly subService: SubscriptionService;
    private readonly userService: UserService;

    private readonly mixpanel = config.analytics.mixpanelToken ? Mixpanel.init(config.analytics.mixpanelToken) : null;

    private readonly stripe: Stripe;

    constructor(fastify: FastifyInstance, databaseManager: DatabaseManager) {
        super(fastify, databaseManager);

        this.stripe = new Stripe(config.payments.stripeSecret, {
            apiVersion: '2020-08-27',
        });

        this.subService = new SubscriptionService(databaseManager, this.stripe);
        this.userService = new UserService(databaseManager);

        console.log("Stripe subscription controller enabled");
    }

    registerRoutes(): void {
        // Authenticated
        // Payments
        this.fastify.post<SensitiveAuthenticatedRequest>('/payments/get-card-info', Auth.ValidateSensitiveWithData, this.GetCardInfo.bind(this));
        this.fastify.post<SensitiveAuthenticatedRequest>('/payments/get-billing-info', Auth.ValidateSensitiveWithData, this.GetBillingInfo.bind(this));
        this.fastify.post<SetCardInfoRequest>('/payments/set-card-info', Auth.ValidateSensitiveWithData, this.SetCardInfo.bind(this));
        this.fastify.post<SetBillingInfoRequest>('/payments/set-billing-info', Auth.ValidateSensitiveWithData, this.SetBillingInfo.bind(this));

        this.fastify.post<AuthenticatedRequest>('/payments/sub-info', Auth.ValidateWithData, this.GetSubInfo.bind(this));
        this.fastify.post<SubscribeRequest>('/payments/sub', Auth.ValidateSensitiveWithData, this.Subscribe.bind(this));

        // Seats
        this.fastify.post<UpdateSeatMemberRequest>('/seats/add', Auth.ValidateSensitiveWithData, this.AddSeat.bind(this));
        this.fastify.post<RemoveSeatMemberRequest>('/seats/remove', Auth.ValidateSensitiveWithData, this.RemoveSeat.bind(this));
        this.fastify.post<UpdateSeatMemberRequest>('/seats/set-role', Auth.ValidateSensitiveWithData, this.SetSeatRole.bind(this));
        this.fastify.post<AuthenticatedRequest>('/seats', Auth.ValidateWithData, this.ListSeats.bind(this));
        this.fastify.post<SensitiveAuthenticatedRequest>('/seats/total', Auth.ValidateSensitiveWithData, this.GetTotalSeats.bind(this));
        this.fastify.post<SensitiveAuthenticatedRequest>('/seats/remaining', Auth.ValidateSensitiveWithData, this.GetRemainingSeats.bind(this));

        this.fastify.post<BuySeatsRequest>('/seats/buy', Auth.ValidateSensitiveWithData, this.BuyAdditionalSeats.bind(this));
        this.fastify.post<CancelSeatsRequest>('/seats/cancel', Auth.ValidateSensitiveWithData, this.CancelAdditionalSeats.bind(this));
        this.fastify.post<ExpireSeatRequest>('/seats/set-expired', Auth.ValidateSensitiveWithData, this.ExpireSeatRequest.bind(this));
    }

    async GetCardInfo(request: FastifyRequest<SensitiveAuthenticatedRequest>, reply: FastifyReply) {
        try {
            let cardInfo = await this.subService.getCardInfo(request.body.authUser);

            reply.status(StatusCodes.OK);

            return cardInfo ?? {};
        } catch (e) {
            if (e instanceof HttpError) {
                if (e.statusCode !== StatusCodes.NOT_FOUND) {
                    reply.code(e.statusCode);
                    return ReplyUtils.error(e.message, e);
                }
            }
        }
    }

    async GetBillingInfo(request: FastifyRequest<SensitiveAuthenticatedRequest>, reply: FastifyReply) {
        try {
            let billingInfo = await this.subService.getBillingInfo(request.body.authUser);

            reply.status(StatusCodes.OK);

            return billingInfo ?? {};
        } catch (e) {
            if (e instanceof HttpError) {
                if (e.statusCode !== StatusCodes.NOT_FOUND) {
                    reply.code(e.statusCode);
                    return ReplyUtils.error(e.message, e);
                }
            }
        }
    }

    /**
     * Route for /payment/set-card-info
     *
     * @param request
     * @param reply
     * @constructor
     */
    async SetCardInfo(request: FastifyRequest<SetCardInfoRequest>, reply: FastifyReply) {
        try {
            await this.subService.setCardInfo(request.body.authUser, request.body.card);

            reply.status(StatusCodes.OK).send();
        } catch (e) {
            if (e instanceof HttpError) {
                if (e.statusCode !== StatusCodes.NOT_FOUND) {
                    reply.code(e.statusCode);
                    return ReplyUtils.error(e.message, e);
                }
            }
        }
    }

    /**
     * Route for /payment/set-billing-info
     *
     * @param request
     * @param reply
     * @constructor
     */
    async SetBillingInfo(request: FastifyRequest<SetBillingInfoRequest>, reply: FastifyReply) {
        try {
            await this.subService.setBillingInfo(request.body.authUser, request.body.billing);

            reply.status(StatusCodes.OK).send();
        } catch (e) {
            if (e instanceof HttpError) {
                if (e.statusCode !== StatusCodes.NOT_FOUND) {
                    reply.code(e.statusCode);
                    return ReplyUtils.error(e.message, e);
                }
            }
        }
    }

    /**
     * Route for /payment/sub-info
     *
     * @param request
     * @param reply
     * @constructor
     */
    async GetSubInfo(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        reply.type('application/json');
        return this.subService.getDetailedSubscriptionInfo(request.body.authUser);
    }

    /**
     * Route for /payment/subscribe
     *
     * @param request
     * @param reply
     * @constructor
     */
    async Subscribe(request: FastifyRequest<SubscribeRequest>, reply: FastifyReply) {
        try {
            let body = request.body;

            reply.type('application/json');

            if (body.tier == "enterprise") {
                return reply.code(StatusCodes.FORBIDDEN).send(ReplyUtils.error("Enterprise tier cannot be added through the API! It must be done directly through the Stripe backend."))
            }

            return await this.subService.setStripeSubscription(request.body.authUser, body.tier ?? "free");
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /seat/add
     *
     * @param request
     * @param reply
     * @constructor
     */
    async AddSeat(request: FastifyRequest<UpdateSeatMemberRequest>, reply: FastifyReply) {
        try {
            reply.type('application/json');

            let seatMemberId = request.body.seatMemberId;

            if (!seatMemberId) {
                let seatMember = await this.userService.getSensitiveUserByEmail(request.body.seatMemberEmail);
                seatMemberId = seatMember.id;
            }

            if (!seatMemberId) {
                return ReplyUtils.error("This user doesn't exist!");
            }

            return this.subService.addSeatMember(request.body.authUser, seatMemberId, request.body.role);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /seat/remove
     *
     * @param request
     * @param reply
     * @constructor
     */
    async RemoveSeat(request: FastifyRequest<RemoveSeatMemberRequest>, reply: FastifyReply) {
        try {
            reply.type('application/json');

            let seatMemberId = request.body.seatMemberId;

            if (!seatMemberId) {
                let seatMember = await this.userService.getSensitiveUserByEmail(request.body.seatMemberEmail);
                seatMemberId = seatMember.id;
            }

            if (!seatMemberId) {
                return ReplyUtils.error("This user doesn't exist!");
            }

            return this.subService.removeSeatMember(request.body.authUser, seatMemberId);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /seat/set-role
     *
     * @param request
     * @param reply
     * @constructor
     */
    async SetSeatRole(request: FastifyRequest<UpdateSeatMemberRequest>, reply: FastifyReply) {
        try {
            reply.type('application/json');

            let seatMemberId = request.body.seatMemberId;

            if (!seatMemberId) {
                let seatMember = await this.userService.getSensitiveUserByEmail(request.body.seatMemberEmail);
                seatMemberId = seatMember.id;
            }

            if (!seatMemberId) {
                return ReplyUtils.error("This user doesn't exist!");
            }

            return this.subService.setRole(request.body.authUser.id, seatMemberId, request.body.role);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /seats
     *
     * @param request
     * @param reply
     * @constructor
     */
    async ListSeats(request: FastifyRequest<AuthenticatedRequest>, reply: FastifyReply) {
        try {
            reply.type('application/json');
            return this.subService.listSeats(request.body.authUser.id);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /seats/total
     *
     * @param request
     * @param reply
     * @constructor
     */
    async GetTotalSeats(request: FastifyRequest<SensitiveAuthenticatedRequest>, reply: FastifyReply) {
        try {
            reply.type('application/json');
            return {total: await this.subService.getTotalSeats(request.body.authUser)};
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /seats/remaining
     *
     * @param request
     * @param reply
     * @constructor
     */
    async GetRemainingSeats(request: FastifyRequest<SensitiveAuthenticatedRequest>, reply: FastifyReply) {
        try {
            reply.type('application/json');
            return {remaining: await this.subService.getRemainingSeats(request.body.authUser)};
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /seats/buy
     *
     * @param request
     * @param reply
     * @constructor
     */
    async BuyAdditionalSeats(request: FastifyRequest<BuySeatsRequest>, reply: FastifyReply) {
        try {
            reply.type('application/json');
            return this.subService.buyAdditionalSeats(request.body.authUser, request.body.amount);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /seats/cancel
     *
     * @param request
     * @param reply
     * @constructor
     */
    async CancelAdditionalSeats(request: FastifyRequest<CancelSeatsRequest>, reply: FastifyReply) {
        try {
            reply.type('application/json');
            return this.subService.cancelAdditionalSeats(request.body.authUser, request.body.amount);
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }

    /**
     * Route for /seats/set-expired
     *
     * @param request
     * @param reply
     * @constructor
     */
    async ExpireSeatRequest(request: FastifyRequest<ExpireSeatRequest>, reply: FastifyReply) {
        try {
            reply.type('application/json');
            let total = await this.subService.getTotalSeats(request.body.authUser);
            let dbSeats = await this.subService.listSeats(request.body.authUser.id);

            let seatMemberId = request.body.seatMemberId;

            if (!seatMemberId) {
                let seatMember = await this.userService.getSensitiveUserByEmail(request.body.seatMemberEmail);
                seatMemberId = seatMember.id;
            }

            if (!seatMemberId) {
                return ReplyUtils.error("This user doesn't exist!");
            }

            if ((dbSeats.length < total && !request.body.expired) || (request.body.expired)) {
                return this.subService.setSeatExpired(request.body.authUser.id, seatMemberId, request.body.expired);
            } else {
                return ReplyUtils.error("You cannot unexpire a seat if you do not have enough remaining seats!");
            }
        } catch (e) {
            if (e instanceof HttpError) {
                reply.code(e.statusCode);
                return ReplyUtils.error(e.message, e);
            }

            throw e;
        }
    }
}

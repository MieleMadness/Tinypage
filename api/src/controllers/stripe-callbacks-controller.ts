import {Controller} from "./controller";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {DatabaseManager} from "../data/database-manager";
import Mixpanel from "mixpanel";
import {config} from "../config/config";
import {Stripe} from "stripe";
import {SubscriptionService} from "../services/subscription-service";
import {StatusCodes} from "http-status-codes";
import {UserService} from "../services/user-service";

/**
 * Contains routes for stripe webhook callbacks.
 */
export class StripeCallbacksController extends Controller {
  private readonly userService: UserService;
  private readonly paymentsService: SubscriptionService;

  private readonly stripe: Stripe;
  private readonly mixpanel = config.analytics.mixpanelToken ? Mixpanel.init(config.analytics.mixpanelToken) : null;

  constructor(fastify: FastifyInstance, databaseManager: DatabaseManager) {
    super(fastify, databaseManager);

    this.stripe = new Stripe(config.payments.stripeSecret, {
      apiVersion: '2020-08-27',
    });

    this.userService = new UserService(databaseManager);
    this.paymentsService = new SubscriptionService(databaseManager, this.stripe);
  }

  registerRoutes(): void {
    // Unauthenticated
    this.fastify.post(
      '/stripe/webhooks',
      {
        config: {
          rawBody: true
        }
      }, async (request, reply) => {
        return await this.ParseWebhooks(request, reply);
      }
    );
  }

  async ParseWebhooks(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    const sig: string | string[] | undefined = request.headers['stripe-signature'];
    let rawBody: Buffer = (<any>request).rawBody;
    let event: Stripe.Event;

    reply.type("application/json");

    if (!sig) {
      console.log("Payload signature was invalid for request: " + request.id);
      reply.status(StatusCodes.BAD_REQUEST);
      return {error: "Payload didn't contain signature!"};
    }

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, config.payments.stripeWebhookSecret);
    } catch (err) {
      console.error(`Error while constructing event: ${err}`);
      reply.status(StatusCodes.BAD_REQUEST);
      return {error: err.message};
    }

    if (await this.hasEventBeenLogged(event)) {
      reply.status(StatusCodes.ACCEPTED);
      return {message: "The event has already been logged."};
    }

    const eventObject: any = event.data.object;

    // Event type check
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'invoice.payment_action_required':
        break;
      default:
        reply.status(StatusCodes.OK);
        return {message: "Webhook is not for Singlelink."};
    }

    let customerId = eventObject.customer;
    let customer: Stripe.Customer | Stripe.DeletedCustomer = await this.stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      reply.status(StatusCodes.OK);
      console.log(`User not found: Deleted: ${customer.deleted} Email: ${(<any>customer).id}`);
      return {error: "User not found."};
    }

    let user = await this.userService.getSensitiveUserByStripeId(customer.id);

    if (!user) {
      reply.status(StatusCodes.OK);
      console.log(`User not found for id: ${customer.id}`);
      return {error: "User not found."};
    }

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_action_required':
      case 'invoice.payment_failed':
        await this.paymentsService.setSubscriptionTier(user, 'free');
        await this.paymentsService.checkSeatsExpiryStatuses(user);
        break;

      case 'customer.subscription.deleted':
        // If the subscription was a downgrade, resubscribe, otherwise, cancel
        let downgradePriceId = eventObject.metadata.downgrade;

        if (downgradePriceId) {
          let selectedPrice = await this.stripe.prices.retrieve(downgradePriceId);

          if (selectedPrice?.nickname) {
            await this.paymentsService.setStripeSubscription(user, selectedPrice.nickname?.toLowerCase());
          }
        } else {
          await this.paymentsService.setSubscriptionTier(user, 'free');
        }

        await this.paymentsService.checkSeatsExpiryStatuses(user);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        let tier = eventObject.items.data[0].price.nickname.toLowerCase();
        await this.paymentsService.setSubscriptionTier(user, tier, eventObject.id);
        await this.paymentsService.checkSeatsExpiryStatuses(user);
        break;
    }

    // Return a response to acknowledge receipt of the event
    reply.status(StatusCodes.OK);
    return reply.send({received: true});
  }

  /**
   * Check if the event has already been logged by another server.
   * This is necessary to prevent an event from firing multiple times.
   *
   * @param event
   * @returns True if the event has been logged before
   */
  async hasEventBeenLogged(event: Stripe.Event): Promise<boolean> {
    let queryResult = await this.pool.query("select event_id from enterprise.stripe_history_events where event_id=$1", [event.id]);

    if (queryResult.rowCount <= 0) {
      await this.pool.query("insert into enterprise.stripe_history_events(event_id) values ($1)", [event.id]);
      return false;
    }

    return true;
  }
}

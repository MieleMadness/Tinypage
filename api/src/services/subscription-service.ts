/**
 * This service takes care of transactional tasks for Subscriptions.
 */
import {DatabaseService} from "./database-service";
import {DatabaseManager} from "../data/database-manager";
import Stripe from "stripe";
import {HttpError} from "../utils/http-error";
import {StatusCodes} from "http-status-codes";
import {QueryResult} from "pg";

/**
 * Handles payment stuff.
 */
export class SubscriptionService extends DatabaseService {
  stripe: Stripe;

  constructor(databaseManager: DatabaseManager, stripe: Stripe) {
    super(databaseManager);

    this.stripe = stripe;
  }

  /**
   * Sets the Stripe Id for an account.
   * Set null to disable.
   *
   * @param userId
   * @param stripeId
   */
  async setStripeId(userId: string, stripeId?: string) {
    let queryResult = await this.pool.query<{ stripe_id: string | null | undefined }>("update app.users set private_metadata = jsonb_set(private_metadata::jsonb, '{stripeId}', $1, true) where id=$2 returning private_metadata->>'stripeId' as stripe_id",
      [
        JSON.stringify(stripeId),
        userId
      ]);

    if (queryResult.rowCount < 1)
      throw new HttpError(StatusCodes.NOT_FOUND, "The user couldn't be found.");

    return queryResult.rows[0].stripe_id;
  }

  async getBillingInfo(user: SensitiveUser) {
    let customer = await this.getOrCreateStripeCustomer(user);

    if (!customer || customer.deleted)
      throw new HttpError(StatusCodes.NOT_FOUND, "The customer data couldn't be found for this user!");

    return {
      fullName: customer.name,
      companyName: customer.metadata.company,
      phone: customer.phone,
      address: customer.address?.line1,
      city: customer.address?.city,
      zipCode: customer.address?.postal_code,
      country: customer.address?.country,
    };
  }

  async getCardInfo(user: SensitiveUser) {
    let customer = await this.getOrCreateStripeCustomer(user);

    if (!customer)
      throw new HttpError(StatusCodes.NOT_FOUND, "The customer data couldn't be found for this user!");

    if (customer.deleted) {
      return {
        deleted: true
      };
    }

    let payments = (await this.stripe.paymentMethods.list({type: "card", customer: customer.id, limit: 1})).data;

    let paymentInfo;

    for (let payment of payments) {
      let card = payment.card as Stripe.PaymentMethod.Card & { name: string } | undefined;

      let name = card?.name;
      let last4 = card?.last4;
      let expMonth = String(card?.exp_month ?? "0");
      let expYear = String(card?.exp_year ?? "0000");

      paymentInfo = {
        name,
        last4,
        expDate: expMonth + '/' + expYear.substr(-2)
      };
    }

    return paymentInfo;
  }

  /**
   * Sets the billing information for a customer.
   * billing.companyName and billing.phone are optional
   * @param user
   * @param billing
   */
  async setBillingInfo(user: SensitiveUser, billing: { fullName?: string; companyName?: string; phone?: string; address?: string; city?: string; zipCode?: string; country?: string } | undefined) {
    if (!billing) {
      throw new HttpError(StatusCodes.BAD_REQUEST, "The field 'billing' cannot be undefined!");
    } else if (billing) {

      switch (billing) {
        case !billing.fullName:
          throw new HttpError(StatusCodes.BAD_REQUEST, "The field 'billing.fullName' cannot be undefined!");
        case !billing.address:
          throw new HttpError(StatusCodes.BAD_REQUEST, "The field 'billing.address' cannot be undefined!");
        case !billing.city:
          throw new HttpError(StatusCodes.BAD_REQUEST, "The field 'billing.city' cannot be undefined!");
        case !billing.zipCode:
          throw new HttpError(StatusCodes.BAD_REQUEST, "The field 'billing.zipCode' cannot be undefined!");
        case !billing.country:
          throw new HttpError(StatusCodes.BAD_REQUEST, "The field 'billing.country' cannot be undefined!");
      }

      let customer = await this.getOrCreateStripeCustomer(user);

      if (!customer)
        throw new HttpError(StatusCodes.NOT_FOUND, "The customer data couldn't be found for this user!");

      await this.setStripeId(user.id, customer.id);

      let newCustomer = await this.stripe.customers.update(customer.id, {
        name: billing.fullName,
        address: billing.address ? <Stripe.AddressParam>{
          line1: billing.address,
          city: billing.city,
          postal_code: billing.zipCode,
          country: billing.country
        } : undefined,
        phone: billing.phone,
        metadata: {
          product: "Singlelink Enterprise",
          company: billing.companyName ?? null
        }
      });

      console.log("Customer billing info updated: " + newCustomer.id);
      return;
    }
  }

  async setCardInfo(user: SensitiveUser, card?: { number: string | null; expDate: string | null; cvc: string | null; }) {
    let customer = await this.getOrCreateStripeCustomer(user);

    if (!customer)
      throw new HttpError(StatusCodes.NOT_FOUND, "The customer data couldn't be found for this user!");

    await this.setStripeId(user.id, customer.id);

    let payments = (await this.stripe.paymentMethods.list({type: "card", customer: customer.id, limit: 1})).data;

    if (!card || !card.number || !card.expDate || !card.cvc) {
      let promises = [];

      for (let payment of payments) {
        promises.push(this.stripe.paymentMethods.detach(payment.id));
      }

      await Promise.all(promises);

      console.log("Payment methods deleted for user: " + user.id);
      return;
    }

    let expirations = card.expDate.split("/");

    let paymentParams: Stripe.PaymentMethodCreateParams = {
      card: {
        number: card.number,
        exp_month: Number.parseInt(expirations[0]),
        exp_year: Number.parseInt(expirations[1]),
        cvc: card.cvc,
      },
      type: "card"
    };

    let paymentMethod = await this.stripe.paymentMethods.create(paymentParams);

    if (paymentMethod.created)
      console.log("New payment method created at: " + paymentMethod.created);

    await this.stripe.paymentMethods.attach(paymentMethod.id, {customer: customer.id});
    await this.stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id
      }
    });

    let promises = [];

    for (let payment of payments) {
      promises.push(this.stripe.paymentMethods.detach(payment.id));
    }

    await Promise.all(promises);

    console.log("Payment method attached to customer: " + customer.id);
  }

  async setStripeSubscription(user: SensitiveUser, tier: SubscriptionTier) {
    let customer = await this.getOrCreateStripeCustomer(user);

    if (!customer)
      throw new HttpError(StatusCodes.NOT_FOUND, `The customer couldn't be found or created for user: ${user.id}`);

    if (customer.deleted)
      throw new HttpError(StatusCodes.GONE, `The customer is a DeletedCustomer and no longer exists.`);

    let product: Stripe.Product | undefined = (await this.stripe.products.list({active: true})).data.find(x => x.metadata.product === "Singlelink Enterprise");

    if (!product)
      throw new HttpError(StatusCodes.NOT_FOUND, "The product metadata 'Singlelink Enterprise' couldn't be found in Stripe. Please ensure Stripe is setup.");

    let priceApiList = await this.stripe.prices.list({product: product.id, active: true});
    let selectedPriceId: string | undefined;

    for (let price of priceApiList.data) {
      const priceName = price.nickname?.toLowerCase();

      if (priceName === tier) {
        selectedPriceId = price.id;
      }
    }

    let defaultPaymentMethod = customer.invoice_settings.default_payment_method;

    if (!defaultPaymentMethod) {
      throw new HttpError(StatusCodes.NOT_FOUND, "This user has no default payment method!");
    }

    let customerSub = (await this.stripe.subscriptions.list({customer: customer.id})).data;

    // Upgrade/downgrade/cancel current subscription
    if (customerSub.length > 0) {
      let currentSubId: string | undefined;

      findSub:
        for (const sub of customerSub) {
          for (let item of sub.items.data) {
            let productId = <string>item.price.product;
            let product = await this.stripe.products.retrieve(productId);

            if (!product.deleted && product.metadata.product) {
              currentSubId = sub.id;
              break findSub;
            }
          }
        }

      if (!currentSubId) {
        await this.setSubscriptionTier(user, "free");
        throw new HttpError(StatusCodes.NOT_FOUND, "Could not find the related subscription id in Stripe, even though the customer is apparently subscribed to a plan!");
      }

      if (selectedPriceId) {
        let sub = await this.stripe.subscriptions.retrieve(currentSubId);
        let subItem = sub.items.data[0];
        let currentPriceId = subItem.price.id;
        let currentPrice = subItem.price;
        let selectedPrice = await this.stripe.prices.retrieve(selectedPriceId);

        // Check for schedules
        await this.stripe.subscriptionSchedules.list({customer: customer.id,});

        if (currentPriceId === selectedPriceId) {

          // No change, but make sure we update metadata
          await this.stripe.subscriptions.update(
            currentSubId,
            {
              items: [
                {
                  id: subItem.id,
                  price: currentPriceId
                }
              ],
              cancel_at_period_end: false,
              metadata: {
                downgrade: null,
                downgradeTier: null
              }
            },
          );

          console.log(`Activated/didn't change subscription for user ${user.id}`);

          return {
            action: 'activated/no change',
            details: await this.createSubscriptionDetails(sub.id)
          };
        } else if (currentPrice.metadata.index > selectedPrice.metadata.index) {

          let quantity = subItem.quantity;

          if (subItem.price.billing_scheme !== "tiered") {
            quantity = 1;
          }

          // Downgrade
          await this.stripe.subscriptions.update(
            currentSubId,
            {
              items: [
                {
                  id: subItem.id,
                  price: currentPriceId,
                  quantity: quantity
                }
              ],
              proration_behavior: 'none',
              cancel_at_period_end: true,
              metadata: {
                downgrade: selectedPriceId,
                downgradeTier: selectedPrice.nickname,
              }
            },
          );

          console.log(`User ${user.id} is downgrading to a lower subscription at the end of their billing period`);

          return {
            action: 'downgrade',
            details: await this.createSubscriptionDetails(sub.id)
          };
        } else {

          let quantity = subItem.quantity;

          if (subItem.price.billing_scheme !== "tiered") {
            quantity = 1;
          }

          // Upgrade
          let sub = await this.stripe.subscriptions.update(
            currentSubId,
            {
              items: [
                {
                  id: subItem.id,
                  price: selectedPriceId,
                  quantity: quantity
                }
              ],
              proration_behavior: 'always_invoice',
              cancel_at_period_end: false,
              metadata: {
                downgrade: null,
                downgradeTier: null
              }
            }
          );

          console.log(`Modified subscription for user ${user.id}`);

          return {
            action: 'upgrade',
            details: await this.createSubscriptionDetails(sub.id)
          };
        }
      } else {

        // Cancel
        let sub = await this.stripe.subscriptions.update(
          currentSubId,
          {
            cancel_at_period_end: true,
            metadata: {
              downgrade: null,
              downgradeTier: null
            }
          }
        );

        console.log(`Subscription for user ${user.id} is canceled and will end.`);

        return {
          action: 'canceled',
          details: await this.createSubscriptionDetails(sub.id)
        };
      }
    }

    // Create new sub if it doesn't exist
    if (tier !== "free" && selectedPriceId) {
      let selectedPrice = await this.stripe.prices.retrieve(selectedPriceId);
      let quantity = Number.parseInt(selectedPrice.metadata.startQuantity) ?? 1;

      let sub = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: selectedPriceId,
            quantity: quantity
          }
        ],
      });

      await this.setSubscriptionTier(user, tier);
      console.log(`Set new subscription ${sub.id} for user ${user.id} with payment method: ${defaultPaymentMethod}`);

      return {
        action: 'created',
        details: await this.createSubscriptionDetails(sub.id)
      };

    } else {
      return {
        action: 'none'
      };
    }
  }

  async buyAdditionalSeats(user: SensitiveUser, amount: number) {
    if (!user.privateMetadata?.stripeId) {
      throw new HttpError(StatusCodes.PAYMENT_REQUIRED, `User isn't subscribed!`);
    }

    if (amount < 0) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, `Amount be a positive integer!`);
    }

    amount = Math.floor(amount);

    return await this.appendSeatCount(user, amount);
  }

  async cancelAdditionalSeats(user: SensitiveUser, amount: number) {
    if (!user.privateMetadata?.stripeId) {
      throw new HttpError(StatusCodes.PAYMENT_REQUIRED, `User isn't subscribed!`);
    }

    if (amount < 0) {
      throw new HttpError(StatusCodes.BAD_REQUEST, `Amount be a positive integer!`);
    }

    amount = Math.floor(amount);

    return await this.appendSeatCount(user, -amount);
  }

  private async appendSeatCount(user: SensitiveUser, amount: number) {
    if (amount === 0) {
      throw new HttpError(StatusCodes.BAD_REQUEST, `Amount cannot be zero.`);
    }

    if (!user.privateMetadata?.stripeId) {
      throw new HttpError(StatusCodes.PAYMENT_REQUIRED, `User isn't subscribed!`);
    }

    let subscriptions = (await this.stripe.subscriptions.list({customer: user.privateMetadata.stripeId})).data;

    if (subscriptions.length < 1) {
      throw new HttpError(StatusCodes.PAYMENT_REQUIRED, `User isn't subscribed!`);
    }

    let sub = subscriptions[0];
    let subItem = sub.items.data[0];
    const currentQuantity = subItem.quantity ?? 0;
    const startQuantity = Number.parseInt(subItem.price.metadata.startQuantity) ?? 0;

    let newQuantity = Math.max(currentQuantity + amount, startQuantity);

    let newSub = await this.stripe.subscriptions.update(sub.id, {
      items: [
        {
          id: subItem.id,
          price: subItem.price.id,
          quantity: newQuantity
        }
      ],
      proration_behavior: "always_invoice"
    });

    let remaining = await this.getRemainingSeats(user);

    return {
      action: 'updated',
      totalSeatCount: newSub.items.data[0].quantity,
      seatsRemaining: remaining,
      details: await this.createSubscriptionDetails(sub.id)
    };
  }

  /**
   * Check for seat status and expire/unexpire seats based on remaining seat count.
   */
  async checkSeatsExpiryStatuses(user: SensitiveUser) {
    let total = await this.getTotalSeats(user);
    let dbSeats = await this.listSeats(user.id);

    // expire seats if they are overstaying their welcome
    if (dbSeats.length > total) {
      let expireCount = dbSeats.length - total;

      for (let i = 0; i < dbSeats.length && i < expireCount; i++) {
        let dbSeat = dbSeats[i];

        if (!dbSeat.expired)
          await this.setSeatExpired(dbSeat.owner_user_id, dbSeat.seat_member_user_id, true);
      }
    }
  }

  async setSeatExpired(userId: string, seatMemberId: string, expired: boolean) {
    let result = await this.pool.query<DbSeat>("update enterprise.seat_members set expired=$1 where owner_user_id=$2 and seat_member_user_id=$3 returning *",
      [
        expired,
        userId,
        seatMemberId
      ]);

    if (result.rowCount < 1)
      throw new HttpError(StatusCodes.NOT_FOUND, `The seat couldn't be found.`);

    return result.rows[0];
  }

  async addSeatMember(user: SensitiveUser, toAddUserId: string, role?: string) {
    const remainingSeats = await this.getRemainingSeats(user);

    if (remainingSeats <= 0) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, `This user has no more remaining seats!`);
    }

    let queryResult = await this.pool.query<DbSeat>("insert into enterprise.seat_members(owner_user_id, seat_member_user_id, role) values ($1, $2, coalesce($3, 'member')) returning *",
      [
        user.id,
        toAddUserId,
        role
      ]);

    if (queryResult.rowCount < 1)
      throw new HttpError(StatusCodes.NOT_FOUND, `The seat couldn't be added for the user requested.`);

    return {
      remaining: remainingSeats - 1,
      seat: queryResult.rows[0]
    };
  }

  async removeSeatMember(user: SensitiveUser, toRemoveUserId: string) {
    const remainingSeats = await this.getRemainingSeats(user);

    let queryResult = await this.pool.query<DbSeat>("delete from enterprise.seat_members where owner_user_id=$1 and seat_member_user_id=$2 returning *",
      [
        user.id,
        toRemoveUserId
      ]);

    if (queryResult.rowCount < 1)
      return [];

    return {
      remaining: remainingSeats + 1,
      seat: queryResult.rows[0]
    };
  }

  async setRole(userId: string, seatUserId: string, role: "member" | "admin" | "owner" | string = "member") {
    role = role.toLowerCase();

    switch (role) {
      case "member":
      case "admin":
      case "owner":
        break;
      default:
        role = "member";
    }

    let queryResult = await this.pool.query<DbSeat>("update enterprise.seat_members set role=coalesce($3, 'member') where owner_user_id=$1 and seat_member_user_id=$2 returning *",
      [
        userId,
        seatUserId,
        role
      ]);

    if (queryResult.rowCount < 1)
      throw new HttpError(StatusCodes.NOT_FOUND, `The seat role couldn't be set for the user requested.`);

    return queryResult.rows[0];
  }

  async listSeats(userId: string, includeExpired: boolean | null = false) {
    let queryResult: QueryResult<DbSeat>;

    if (includeExpired === null) {
      queryResult = await this.pool.query<DbSeat>("select * from enterprise.seat_members where owner_user_id=$1",
        [
          userId
        ]);
    } else {
      queryResult = await this.pool.query<DbSeat>("select * from enterprise.seat_members where owner_user_id=$1 and expired=$2",
        [
          userId,
          includeExpired
        ]);
    }

    return queryResult.rows;
  }

  async getTotalSeats(user: SensitiveUser) {
    if (!user.privateMetadata?.stripeId) {
      return 0;
    }

    let subscriptions = (await this.stripe.subscriptions.list({
      customer: user.privateMetadata.stripeId,
      expand: ["data.items.data"]
    })).data;

    if (subscriptions.length < 1) {
      return 0;
    }

    let quantity = subscriptions[0].items.data[0].quantity ?? 1;

    return Math.max(quantity, 0);
  }

  async getRemainingSeats(user: SensitiveUser) {
    if (!user.privateMetadata?.stripeId) {
      return 0;
    }

    let subscriptions = (await this.stripe.subscriptions.list({
      customer: user.privateMetadata.stripeId,
      expand: ["data.items.data"]
    })).data;

    if (subscriptions.length < 1) {
      return 0;
    }

    let queryResult = await this.pool.query<{ count: number }>("select count(*) from enterprise.seat_members where owner_user_id=$1 and expired=false",
      [
        user.id
      ]);

    let seatsUsed = queryResult.rows[0].count;
    let quantity = subscriptions[0].items.data[0].quantity ?? 1;

    return quantity - seatsUsed;
  }

  async getSubscription(user: User): Promise<DbSubscription> {
    let queryResult = await this.pool.query<DbSubscription>("select * from enterprise.subscriptions where user_id=$1", [user.id]);

    if (queryResult.rowCount <= 0) {
      return {
        user_id: user.id,
        tier: "free",
        stripe_sub_id: null
      };
    }

    return queryResult.rows[0];
  }

  async setSubscriptionTier(user: User, tier: SubscriptionTier, stripeSubId?: string) {
    let queryResult = await this.pool.query<DbUser>("insert into enterprise.subscriptions(user_id, tier, stripe_sub_id) values ($1, $2, $3) on conflict(user_id) do update set user_id=$1, tier=$2, stripe_sub_id=$3", [user.id, tier, stripeSubId]);

    if (queryResult.rowCount <= 0) {
      throw new HttpError(StatusCodes.NOT_FOUND, "The user couldn't be found.");
    }
  }

  async getDetailedSubscriptionInfo(user: User) {
    let sub = await this.getSubscription(user);

    return this.createSubscriptionDetails(sub.tier !== "free" && sub.stripe_sub_id ? sub.stripe_sub_id : undefined);
  }

  async createSubscriptionDetails(subId?: string) {
    let subInfo = {
      type: <string | null>'',
      status: '',
      billingDisplay: '',
      amountDue: <number>0,
      amountPaid: <number>0,
      amountRemaining: <number>0,
      periodEndDate: <string | undefined>'',
      dueDate: <string | undefined>'',
      cancelAtPeriodEnd: <boolean | undefined>false,
      downgrading: false,
      downgradeDate: <string | undefined>undefined,
      downgradingTier: <string | undefined>undefined,
    };

    if (!subId) {
      subInfo.type = "Free";
      subInfo.billingDisplay = "$0/month";
      subInfo.status = "active";
      subInfo.dueDate = '';
      subInfo.cancelAtPeriodEnd = false;

      return subInfo;
    }

    let stripeSub = await this.stripe.subscriptions.retrieve(subId, {expand: ["latest_invoice.charge", "items.data.price.tiers"]});

    let subItem = stripeSub.items.data[0];
    let price = subItem.price;
    subInfo.type = price.nickname;
    let interval = price.recurring?.interval;

    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    let invoice: Stripe.Invoice | undefined = undefined;

    try {
      invoice = await this.stripe.invoices.retrieveUpcoming({
        customer: <string>stripeSub.customer,
      });
    } catch (e) {
      if (e.type === "StripeInvalidRequestError") {
        // no invoice was found, ignore
        // this can happen when the user downgrades their subscription to free tier
      }
    }

    subInfo.status = stripeSub.status;

    if (invoice) {
      subInfo.billingDisplay = `${formatter.format(invoice.amount_due / 100)}/${interval}`;

      subInfo.amountDue = invoice.amount_due;
      subInfo.amountPaid = invoice.amount_paid;
      subInfo.amountRemaining = invoice.amount_remaining;

      subInfo.periodEndDate = new Date(stripeSub.current_period_end * 1000).toISOString();
      subInfo.dueDate = new Date(stripeSub.current_period_end * 1000).toISOString();
      subInfo.cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
    }

    if (stripeSub.metadata.downgrade) {
      subInfo.cancelAtPeriodEnd = undefined;
      subInfo.downgrading = true;

      let downgradeTier = stripeSub.metadata.downgradeTier;
      subInfo.periodEndDate = new Date(stripeSub.current_period_end * 1000).toISOString();
      subInfo.downgradeDate = new Date(stripeSub.current_period_end * 1000).toISOString();
      subInfo.downgradingTier = downgradeTier;
    }

    if (subInfo.cancelAtPeriodEnd) {
      subInfo.periodEndDate = new Date(stripeSub.current_period_end * 1000).toISOString();
      subInfo.dueDate = undefined;
    }

    return subInfo;
  }

  private async getOrCreateStripeCustomer(user: SensitiveUser): Promise<Stripe.Customer | Stripe.DeletedCustomer | undefined> {
    let id = user.privateMetadata.stripeId ?? null;

    if (id) {
      let cus = await this.stripe.customers.retrieve(id);

      if (!cus.deleted) {
        return cus;
      }
    }

    try {
      let newCustomer = await this.stripe.customers.create({
        email: user.email,
        description: 'Singlelink Enterprise Customer',
        metadata: {
          product: "Singlelink Enterprise"
        }
      }, undefined);

      await this.setStripeId(user.id, newCustomer.id);

      return newCustomer;
    } catch (e) {
      await this.setStripeId(user.id);
    }
  }
}

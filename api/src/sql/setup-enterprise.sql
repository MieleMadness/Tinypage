------------
-- Enterprise
------------

create schema if not exists enterprise;

create table if not exists enterprise.stripe_history_events
(
    id       bigserial primary key,
    event_id text unique
);

create table if not exists enterprise.subscriptions
(
    user_id       bigint unique references app.users (id),
    tier          subscription_t,
    stripe_sub_id text unique
);

create index if not exists enterprise_subscriptions_index on enterprise.subscriptions (stripe_sub_id);

create table if not exists enterprise.seat_members
(
    owner_user_id       bigint references app.users (id),
    seat_member_user_id bigint references app.users (id),
    role                text not null default 'member',
    expired             bool not null default false,
    unique (owner_user_id, seat_member_user_id),

    check (owner_user_id != seat_member_user_id)
);

create table if not exists enterprise.profile_members
(
    owner_user_id bigint references app.users (id),
    profile_id    bigint references app.profiles,
    role          text not null default 'member',
    unique (owner_user_id, profile_id)
);

create index if not exists enterprise_seats_owner_user_id on enterprise.seat_members (owner_user_id);
create index if not exists enterprise_seats_seat_user_id on enterprise.seat_members (seat_member_user_id);
create index if not exists enterprise_seats_expired on enterprise.seat_members (expired);

create table if not exists enterprise.customization
(
    id               bool primary key default true,
    public_settings  jsonb not null   default '{
      "title": "",
      "brandName": "",
      "productName": "",
      "company": "",
      "contactEmail": "",
      "icons": {
        "mainIcon": "",
        "favicon": ""
      },
      "colors": {
        "mainColor": "",
        "secondaryColor": "",
        "mainTextColor": "",
        "secondaryTextColor": ""
      },
      "metaTitle": "",
      "metaDescription": "",
      "metaImageUrl": "",
      "customHtml": "",
      "customCss": "",
      "metadata": {}
    }',
    private_settings jsonb not null   default '{
      "mergePublicMarketplace": "",
      "messages": {
        "passwordResetEmail": "",
        "inviteConfirmationEmail": "",
        "referralEmail": ""
      },
      "metadata": {}
    }',
    constraint enterprise_customization_id_constraint check (id)
);

-- Create a default row to hold the settings. There will never be more than one row for this table.
insert into enterprise.customization default
values
on conflict do nothing;

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
    user_id      bigint unique references app.users (id),
    tier         text,
    product_id   text unique,
    created_on   timestamp not null default current_timestamp,
    last_updated timestamp not null default current_timestamp
);

create index if not exists enterprise_subscriptions_user_id on enterprise.subscriptions (user_id);
create index if not exists enterprise_subscriptions_index on enterprise.subscriptions (product_id);

create table if not exists enterprise.products
(
    user_id    bigint references app.users (id),
    tier       text,
    product_id text unique,
    created_on timestamp not null default current_timestamp
);

create index if not exists enterprise_products_user_id on enterprise.products (user_id);
create index if not exists enterprise_products_index on enterprise.products (product_id);

create table if not exists enterprise.profile_members
(
    user_id    bigint references app.users (id),
    profile_id bigint references app.profiles (id),
    role       text not null default 'member',
    unique (user_id, profile_id)
);

create table if not exists enterprise.god_mode
(
    user_id bigint references app.users (id) primary key
);

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

# GPT Assistant

An experiment to give an autonomous GPT agent access to a browser and have it accomplish tasks.

Built with [Qwik](https://qwik.builder.io/) and [Puppeteer](https://github.com/puppeteer/puppeteer)

## Setup

### Install dependencies

```bash
npm install
```

### Create a `.env` file

Copy the `.env.example` file to `.env`

```bash
cp .env.example .env
```

### Add your OpenAI API key

Retrieve your API key from [OpenAI](https://platform.openai.com/account/api-keys) and add it to the `.env` file as `OPENAI_KEY`

> Note: If you haven't already, you'll have to create an account and set up billing.

```diff
+ OPENAI_KEY=sk-...
```

### Add a Postgres database URL

In `.env` add a Postgres database URL it as `DATABASE_URL`. YOu can easily set one up with [supabase](https://supabase.io/) if needed.

```diff
+ DATABASE_URL=postgres://user:password@host:port/database
```

### Generate the tables

You can use the `prisma` CLI to generate the tables in your database.

```bash
npx prisma migrate dev --name init
```

## Run

```bash
# Run the dev server
npm run dev
```

Now, go enter a prompt for the assistant, and let it run!

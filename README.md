# GPT Assistant

An experiment to give an autonomous GPT agent access to a browser and have it accomplish tasks.

Built with [Qwik](https://qwik.builder.io/) and [Puppeteer](https://github.com/puppeteer/puppeteer)

You can see it in action below in these two video examples, with a description of how it works:

![Gif example](https://user-images.githubusercontent.com/844291/231894320-68de1fa0-b5a8-418a-9018-a50318c5980b.gif)

## Video examples

Watch the tool in action as I describe what is going on:

| Example Video 1  | Example Video 2 |
| ------------- | ------------- |
| <video src="https://user-images.githubusercontent.com/844291/231892525-adcb1797-d0f2-4a18-8a90-c49256f31a11.mp4">  | <video src="https://user-images.githubusercontent.com/844291/231892541-de438996-e25f-4c6c-b3b8-dcc52534f2dc.mp4">|


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

You can [prisma migrate](https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases/using-prisma-migrate-typescript-postgres) to generate the tables in your database.

```bash
npx prisma migrate dev --name init
```

## Run

```bash
# Run the dev server
npm run dev
```

Now, go enter a prompt for the assistant, and let it run!

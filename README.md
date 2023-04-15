# GPT Assistant

An experiment to give an autonomous GPT agent access to a browser and have it accomplish tasks.

Built with [Qwik](https://qwik.builder.io/) and [Puppeteer](https://github.com/puppeteer/puppeteer).

You can see it in action below in these two video examples, with a description of how it works:

## Examples

| "go to the qwik repo readme and add 'steve is awesome'"                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------- |
| <img alt="Gif example" src="https://user-images.githubusercontent.com/844291/231930927-da19c100-cd4c-47e7-9cd9-5a8d66cbbf82.gif"> |

| "Book me a table for 3 at 8pm for indian food"                                                                                    | "What dog breed is best for me"                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| <img alt="Gif example" src="https://user-images.githubusercontent.com/844291/231897086-241a03df-3f7d-4d85-8eca-aeb3643cd314.gif"> | <img alt="Gif example 2" src="https://user-images.githubusercontent.com/844291/231894320-68de1fa0-b5a8-418a-9018-a50318c5980b.gif" > |

## Setup

### Requirements

- Node.js 14+
- [OpenAI API key](#add-your-openai-api-key)
- [Postgres database](#add-a-postgres-database-url)
- Access to GPT-4

### Clone the repo

```bash
git clone https://github.com/BuilderIO/gpt-assistant.git
cd gpt-assistant
```

### Install dependencies

```bash
npm install
```

### Create a `.env` file

Copy the `.env.example` file to `.env`

```bash
cp .env.template .env
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

## Contributing

If you want to help fix a bug or implement a feature, don't hesitate to send a pull request!

Just know that these are the very early days of this project, documentation is sparse, and the code is a bit messy. We're working on it!

## Community

Come join the [Builder.io discord](https://discord.gg/EMx6e58xnw) and chat with us over in the `#gpt-assistant` channel

<br><br>

<p align="center">
   <a href="https://www.builder.io/m/developers">
      <picture>
         <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/844291/230786554-eb225eeb-2f6b-4286-b8c2-535b1131744a.png">
         <img width="250" alt="Made with love by Builder.io" src="https://user-images.githubusercontent.com/844291/230786555-a58479e4-75f3-4222-a6eb-74c5af953eac.png">
       </picture>
   </a>
</p>

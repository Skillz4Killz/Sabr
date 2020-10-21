# Sabr

[![Discord](https://img.shields.io/discord/223909216866402304?color=7289da&logo=discord&logoColor=white)](https://discord.gg/J4NqJ72)
[![nest.land](https://nest.land/badge-large.svg)](https://nest.land/package/Sabr)

Deno database using JSON files for quick prototyping with amazing TypeScript support!

## Uses

This should not be used in large scale production projects. This is only meant to be used as a tool to help prototype and get your projects off the floor. You can build your projects with this as you go and switch over to your new database once a driver is ready.

## Examples

```ts
// database.ts file

import { Sabr, SabrTable } from "https://deno.land/x/Sabr@v1.0.0/mod.ts";

// Create the database class
const sabr = new Sabr();

// Creates a db object that can be imported in other files.
export const db = {
	// This will allow us to access table methods easily as we will see below.
	sabr,
	// Sets up a table. If this table did not exist, it will create one.
	users: new SabrTable(sabr, "users"),
	// These examples also show how to provide clean TypeScript interfaces to have a much better TS experience.
	client: new SabrTable<ClientSchema>(sabr, "client"),
	// When you run methods on this like `db.guilds.get("someid")` It will show give you a GuildSchema type object.
	guilds: new SabrTable<GuildSchema>(sabr, "guilds"),
};

// This is important as it prepares all the tables.
await sabr.init();
```

## Queries

### Table Methods

```ts
// somefile.ts

import { db } from "./database.ts";

// Check if a table exists
if (db.sabr.hasTable("example")) {
	// Delete a table
	db.sabr.deleteTable("example");
} else {
	// Create a table manually
	await db.sabr.createTable("example");
	console.log("Table was created");
}
```

### Document Methods

```ts
// someotherfile.ts

import { db } from "./database.ts";

// Get a single document
const single = await db.guilds.get("example");
// Get all documents in a table. Returns a Map!
const all = await db.guilds.getAll();
// Incase you want an array and not a Map
const array = await db.guilds.getAll(true);
// Get all documens with a match filter
const matchObjs = await db.guilds.findMany({ test: "123", test2: "456" });
const matchObjsArray = await db.guilds.findMany({ test: "123", test2: "456" }, true);
// Get the first matching document
const matchObj = await db.guilds.findOne({ test: "123", test2: "456" });
// Check if a document exists
const exists = db.guilds.has("example");
// Create a document. Note you do not need to add `id: example` in the payload but you can if you so choose.
db.guilds.create("example", { test: "strings", numbs: 123, arrays: ["123", 123] });
// Update a document or create if it does not exist.
await db.guilds.update("example", { test: "new string" });
// Update a document that matches a filter
await db.guilds.updateOne({ test: "123" }, { test: "new string" });
// Delete a document
db.guilds.delete("example");
// Delete a document that matches a filter
await db.guilds.deleteOne({ test: "123" });
// Delete all document that matches a filter
await db.guilds.deleteMany({ test: "123" });
```

## Advanced Customizations

Customizing the database folder path is possible.

```ts
import { Sabr, SabrTable } from "https://deno.land/x/Sabr@v1.0.0/mod.ts";

// Create the database class
const sabr = new Sabr();

// By default Sabr will create a folder called `db` in the same directory where you ran your code, using deno run .... mod.ts
// If you wish to change the directory, you can override the path as shown below
// The 7 index removes file:// which does not let it work. The last / index remove the mod.ts file name
sabr.directoryPath = `${Deno.mainModule.substring(7, Deno.mainModule.lastIndexOf("/"))}/database/`;
```

Customizing the error handling.
```ts
import { Sabr, SabrTable } from "https://deno.land/x/Sabr@v1.0.0/mod.ts";

class CustomSabr extends Sabr {
	error(...data: any[]) {
		// However you want to handle errors.
	}
}

const sabr = new CustomSabr();
```

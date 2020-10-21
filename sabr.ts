import { SabrTable } from "./table.ts";

export class Sabr {
  // The 7 index removes file:// which does not let it work. The last / index remove the mod.ts file name
  directoryPath = `${
    Deno.mainModule.substring(7, Deno.mainModule.lastIndexOf("/"))
  }/db/`;
  tables = new Map<string, SabrTable<unknown>>();

  /** Initializes the database which makes sure that the folder exists. */
  async init() {
    // Must make the db folder before making the tables themselves
    await Deno.mkdir(this.directoryPath).catch(() => undefined);
    // Make the folders for each table
    this.tables.forEach((table) =>
      Deno.mkdir(`${this.directoryPath}/${table.name}`).catch(() => undefined)
    );

    return this;
  }

  /** This method allows you to customize how to handle errors from Sabr. */
  async error(...data: any[]) {
    console.error(...data);
  }

  /** Checks if a table exists. */
  hasTable(tableName: string) {
    try {
      Deno.readDirSync(`${this.directoryPath}/${tableName}`);
      return true;
    } catch {
      return false;
    }
  }

  /** Creates a new table. */
  async createTable<T>(tableName: string) {
    try {
      await Deno.mkdir(`${this.directoryPath}/${tableName}`);
      const table = new SabrTable<T>(this, tableName);
      return table;
    } catch {
      // Something went wrong
    }
  }

  /** Deletes a table. */
  deleteTable(tableName: string) {
    Deno.removeSync(`${this.directoryPath}/${tableName}`, { recursive: true });
  }
}

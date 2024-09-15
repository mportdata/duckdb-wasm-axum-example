import * as duckdb from "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@latest/+esm";

let db;

// Initialize DuckDB with custom worker creation
async function initDuckDB() {
  try {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {
        type: "text/javascript",
      })
    );

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);

    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    URL.revokeObjectURL(worker_url);
    console.log("DuckDB-Wasm initialized successfully.");
  } catch (error) {
    console.error("Error initializing DuckDB-Wasm:", error);
  }
}

// Function to process the uploaded file and run queries
window.processFile = async function processFile() {
  try {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    console.log("File loaded:", file.name);

    if (!db) {
      console.error("DuckDB-Wasm is not initialized");
      return;
    }

    const conn = await db.connect();
    console.log("Database connection established");

    const fileType = file.name.split(".").pop().toLowerCase();

    if (fileType === "csv" || fileType === "parquet" || fileType === "json") {
      // Register the file in DuckDB's virtual file system
      const virtualFileName = `/${file.name}`;
      await db.registerFileBuffer(virtualFileName, new Uint8Array(arrayBuffer));

      let query = "";
      if (fileType === "csv") {
        query = `CREATE TABLE my_table AS SELECT * FROM read_csv_auto('${virtualFileName}')`;
      } else if (fileType === "parquet") {
        query = `CREATE TABLE my_table AS SELECT * FROM read_parquet('${virtualFileName}')`;
      } else if (fileType === "json") {
        query = `CREATE TABLE my_table AS SELECT * FROM read_json_auto('${virtualFileName}')`;
      }

      // Execute the query
      await conn.query(query);
      console.log("File data loaded into DuckDB");

      // Query the data and display results
      const result = await conn.query("SELECT * FROM my_table LIMIT 10");
      document.getElementById("results").innerText = JSON.stringify(
        result,
        null,
        2
      );
    } else {
      alert("Unsupported file format");
    }

    await conn.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error processing file or querying data:", error);
  }
};

// Initialize DuckDB on page load
document.addEventListener("DOMContentLoaded", () => {
  initDuckDB();
});

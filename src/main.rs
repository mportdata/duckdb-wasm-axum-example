use askama_axum::Template;
use axum::{
    routing::get,
    Router
};
use dirs::home_dir;
use std::fs;
use std::path::PathBuf;

#[tokio::main]
async fn main() {
    let app = Router::new().route("/:path", get(index));
    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// templates
#[derive(Template)]
#[template(path = "index.html")]
struct IndexTemplate {
    local_storage_string: Vec<String>,
}
// handlers
async fn index(path: Option<String>) -> IndexTemplate {
    let directory_contents = match path {
        Some(p) => list_directory(&p).await,
        None => list_directory("").await,  // Empty string for home directory
    };

    IndexTemplate { local_storage_string: directory_contents }
}


// local storage

async fn list_directory(path: &str) -> Vec<String> {
    // Get the directory path (either home or a given path)
    let path = if path.is_empty() {
        home_dir().unwrap_or_else(|| PathBuf::from("/"))
    } else {
        PathBuf::from(path)
    };

    // Attempt to read the directory contents
    match fs::read_dir(&path) {
        Ok(entries) => {
            let mut filenames = Vec::new(); // Initialize an empty vector to store filenames
            for entry in entries {
                let entry = entry.unwrap();
                let file_name = entry.file_name().into_string().unwrap();

                // Check if it's a directory and format it as a link to navigate
                if entry.file_type().unwrap().is_dir() {
                    filenames.push(format!("<a href=\"/{}\">{}/</a>", file_name, file_name));
                } else {
                    filenames.push(file_name);  // Add the filename as is
                }
            }
            filenames  // Return the vector of filenames
        }
        Err(_) => Vec::new(),  // In case of error, return an empty vector
    }
}

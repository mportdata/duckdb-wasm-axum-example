mod modules;

use axum::{
    routing::get,
    routing::get_service,
    Router,
};
use modules::handlers::index;
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    // Serve static files from the "static" directory
    let static_files = get_service(ServeDir::new("static"));

    // Create the application router
    let app = Router::new()
        .route("/", get(index))
        .nest_service("/static", static_files);

    // run our app with hyper, listening globally on port 3000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

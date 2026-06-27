use axum::{
    extract::State,
    http::{self, Method},
    routing::{get, post},
    Json, Router,
};
use dotenvy::dotenv;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::env;
use tower_http::cors::{Any, CorsLayer};

// Estructuras de datos para serializar/deserializar (JSON <-> Rust)
#[derive(Deserialize)]
struct CrearMensajeInput {
    contenido: String,
}

#[derive(Serialize, sqlx::FromRow)]
struct MensajeDto {
    id: i32,
    contenido: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Cargar entorno (.env)
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL no definida");

    // 1. Inicializar el Pool de conexiones a tu Postgres en Docker
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // 2. Correr migraciones automáticamente al levantar el servidor
    sqlx::migrate!("./migrations").run(&pool).await?;
    println!("✅ Migraciones aplicadas correctamente.");

    // 3. Configurar CORS (Punto 6 del Backlog)
    // En producción deberías restringir 'allow_origin', pero para Sprint 0 'Any' es perfecto.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([http::header::CONTENT_TYPE]);

    // 4. Definir rutas y pasar el Pool como Estado compartido
    let app = Router::new()
        .route("/health", get(health_check)) // Endpoint de salud
        .route("/api/mensajes", post(crear_mensaje).get(listar_mensajes)) // Endpoint que lee y escribe
        .layer(cors)
        .with_state(pool);

    // 5. Iniciar el servidor Axum
    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await?;
    println!("🚀 Servidor Axum corriendo en http://localhost:8080");
    axum::serve(listener, app).await?;

    Ok(())
}

// Handler: Endpoint de salud
async fn health_check() -> &'static str {
    "OK"
}

// Handler: Escribir en Postgres (POST /api/mensajes)
async fn crear_mensaje(
    State(pool): State<PgPool>,
    Json(payload): Json<CrearMensajeInput>,
) -> Result<Json<MensajeDto>, (axum::http::StatusCode, String)> {
    let mensaje = sqlx::query_as::<_, MensajeDto>(
        "INSERT INTO mensajes (contenido) VALUES ($1) RETURNING id, contenido",
    )
    .bind(payload.contenido)
    .fetch_one(&pool)
    .await
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(mensaje))
}

// Handler: Leer de Postgres (GET /api/mensajes)
async fn listar_mensajes(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<MensajeDto>>, (axum::http::StatusCode, String)> {
    let mensajes = sqlx::query_as::<_, MensajeDto>("SELECT id, contenido FROM mensajes ORDER BY id DESC")
        .fetch_all(&pool)
        .await
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(mensajes))
}
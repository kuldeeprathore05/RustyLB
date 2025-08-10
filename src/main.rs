use hyper::{Body, Client, Request, Response, Uri};
use std::sync::{Arc, Mutex};
use hyper::{server::conn::AddrStream, service::{make_service_fn, service_fn}};
use std::{convert::Infallible, net::SocketAddr};

#[derive(Clone)]
pub struct LoadBalancer {
    servers: Vec<String>,
    index: Arc<Mutex<usize>>,
}

impl LoadBalancer {
    pub fn new(servers: Vec<String>) -> Self {
        Self {
            servers,
            index: Arc::new(Mutex::new(0)),
        }
    }

    fn next_server(&self) -> String {
        let mut idx = self.index.lock().unwrap();
        let server = self.servers[*idx].clone();
        *idx = (*idx + 1) % self.servers.len();
        server
    }

    /// Forward an incoming request to a backend
    pub async fn forward_request(&self, req: Request<Body>) -> Response<Body> {
        let target = self.next_server();
        let uri_string = format!(
            "{}{}",
            target,
            req.uri().path_and_query().map(|pq| pq.as_str()).unwrap_or("")
        );
        let uri: Uri = uri_string.parse().unwrap();

        let new_req = Request::builder()
            .method(req.method())
            .uri(uri)
            .body(req.into_body())
            .unwrap();

        let client = Client::new();
        match client.request(new_req).await {
            Ok(res) => res,
            Err(e) => Response::builder()
                .status(500)
                .body(Body::from(format!("Backend error: {}", e)))
                .unwrap(),
        }
    }
}

#[tokio::main]
async fn main() {
    let lb = LoadBalancer::new(vec![
        "http://localhost:8001".to_string(),
        "http://localhost:8002".to_string(),
        "http://localhost:8003".to_string(),
    ]);

    let lb = Arc::new(lb);
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));

    let make_svc = make_service_fn(move |_conn: &AddrStream| {
        let lb = lb.clone();
        async move {
            Ok::<_, Infallible>(service_fn(move |req| {
                let lb = lb.clone();
                async move { Ok::<_, Infallible>(lb.forward_request(req).await) }
            }))
        }
    });

    println!("Load balancer running at http://{}", addr);
    hyper::Server::bind(&addr).serve(make_svc).await.unwrap();
}
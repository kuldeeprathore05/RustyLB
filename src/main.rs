use reqwest::blocking::{Client, Response};
use serde_json::json;
use std::time::Duration;
use std::error::Error;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

struct LoadBalancer {
    route: String,
    servers: Vec<String>,
    map: Arc<Mutex<HashMap<String, i32>>>,
}

impl LoadBalancer {
    pub fn new(route: String, servers: Vec<String>) -> Self {
        let mut map = HashMap::new();
        for s in &servers {
            map.insert(s.clone(), 0);
        }
        LoadBalancer { 
            route, 
            servers, 
            map: Arc::new(Mutex::new(map))
        }
    }

    pub fn req_ayi_hai(&self) -> Result<Response, Box<dyn Error>> {
        let client = Client::new();
        
        // Find server with minimum connections
        let (selected_server, _min_connections) = {
            let map_guard = self.map.lock().unwrap();
            let mut server = &self.servers[0];
            let mut min = map_guard[server];
            
            for s in &self.servers {
                if map_guard[s] < min {
                    min = map_guard[s];
                    server = s;
                }
            }
            (server.clone(), min)
        };

        // Increment active connections
        {
            let mut map_guard = self.map.lock().unwrap();
            *map_guard.get_mut(&selected_server).unwrap() += 1;
        }

        // Make the request
        let result = client
            .get(&selected_server)
            .timeout(Duration::from_secs(30))
            .send();

        // Decrement active connections (cleanup)
         std::thread::sleep(Duration::from_secs(30));
        
        {
            let mut map_guard = self.map.lock().unwrap();
            *map_guard.get_mut(&selected_server).unwrap() -= 1;
            println!("Decremented connections for {} after 30 seconds: {}", selected_server, map_guard[&selected_server]);
        }
        result.map_err(|e| e.into())
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let route = String::from("/");
    let servers: Vec<String> = vec![
        "http://localhost:8001".to_string(),
        "http://localhost:8002".to_string(),
        "http://localhost:8003".to_string()
    ];
    
    let lb = LoadBalancer::new(route, servers);
    
    match lb.req_ayi_hai() {
        Ok(response) => {
            println!("Status: {}", response.status());
            match response.text() {
                Ok(text) => println!("Response: {}", text),
                Err(e) => println!("Error reading response text: {}", e),
            }
        }
        Err(e) => {
            println!("Request failed: {}", e);
        }
    }
    match lb.req_ayi_hai() {
        Ok(response) => {
            println!("Status: {}", response.status());
            match response.text() {
                Ok(text) => println!("Response: {}", text),
                Err(e) => println!("Error reading response text: {}", e),
            }
        }
        Err(e) => {
            println!("Request failed: {}", e);
        }
    }
    match lb.req_ayi_hai() {
        Ok(response) => {
            println!("Status: {}", response.status());
            match response.text() {
                Ok(text) => println!("Response: {}", text),
                Err(e) => println!("Error reading response text: {}", e),
            }
        }
        Err(e) => {
            println!("Request failed: {}", e);
        }
    }
    Ok(())
}
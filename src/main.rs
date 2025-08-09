use reqwest::blocking::{Client, Response};
use serde_json::json;
use std::error::Error;

struct LoadBalancer{
    route : String,
    servers : Vec<String>
}
impl LoadBalancer{
    pub fn reqAyiHai(&self)->Response{
        let client = Client::new();

        let response = client
        .get("http://localhost:8080")
        .send().unwrap(); // Send request
        // let text = response.text().unwrap();
        // println!("Response: {}", text);
        return response; 
    }
}










fn main() -> Result<(), Box<dyn Error>> {
    

    let loda:LoadBalancer;
    let route = String::from("/");
    let server: Vec<String> = vec!["http://localhost:8080".to_string()];
    loda = LoadBalancer { route: (route), servers: (server) };
    let respose = loda.reqAyiHai();
    println!("{:?}",respose.text().unwrap());
    Ok(())
}

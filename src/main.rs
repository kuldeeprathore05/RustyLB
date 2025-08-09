use reqwest::blocking::{Client, Response};
use serde_json::json;
use std::error::Error;
use std::collections::HashMap;

struct LoadBalancer{
    route : String,
    servers : Vec<String>,
    map: HashMap<String, i32>
    for(int i=0;i<servers.len();i++){
        map.insert(servers[i],0);
    }
}
impl LoadBalancer{
    pub fn reqAyiHai(&self)->Response{
        let client = Client::new();
        let mut server = self.servers[0];
        let mut min =self.map[&server];
        for i in 0..self.servers.len(){
            if self.map[&self.servers[i]]<min{
                min = self.map[&self.servers[i]];
                server = self.servers[i];
            }
        }
        self.map[&server] += 1;
        try{
            let response = client
            .get(server)
            .timeout(Duration::from_secs(30))
            .send().unwrap(); // Send request
            return response;
        }           
        catch{
            return self.reqAyiHai();
        }
        finally{
            self.map[&server] -= 1;
        }
        
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

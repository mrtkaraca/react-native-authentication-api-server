import "dotenv/config"
import * as http from "http"
import { getRouter } from "./router.js"

var http_IP = process.env.SERVER_IP;
var http_port = process.env.SERVER_PORT;

var server = http.createServer(function(req, res) {
  
  getRouter(req, res);
});
server.listen(http_port, http_IP);
console.log('listening to http://' + http_IP + ':' + http_port);
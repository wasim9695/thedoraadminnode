require('dotenv').config()
const express = require('express');
const app = express();
const router = express.Router();
const PORT = process.env.PORT || 9000;
const cors = require('cors');
const bodyParser = require('body-parser');
// const db = require('./config/db')
const fs = require('fs');
const http = require('http');
// for capturing device type
const device = require('express-device');
app.use(device.capture());

app.use(bodyParser.json({ limit: '100mb', type: 'application/json' }));
app.use(bodyParser.urlencoded({
	limit: '100mb',
	extended: true
}));
const server = http.createServer(app);
const path = require('path');


const crossOption = {
	methods: ["GET", "POST", "PUT", "DELETE", "OPTION"],
	credentials: true
};

app.use(function (req, res, next) {
	req.header("Access-Control-Allow-Origin", "*");
	req.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use(cors(crossOption));
app.use(express.static(__dirname +'/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
// app.use(cookie('JSLover'));
app.set('view engine','ejs');

require('./config/routes')(router, app);
app.use(router);


server.listen(PORT, () => console.log(`running on port ${PORT}`));
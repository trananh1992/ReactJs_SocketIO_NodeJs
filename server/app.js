const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const bodyParser = require("body-parser");

const port = process.env.PORT || 4001;
const index = require('./index');
const fs = require('fs');

const app= express();
//app.use(index);

const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


app.get('/', (req, res) => res.send('Hello World!').status(200));
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "07041992";

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {

          // Responds with the challenge token from the request
          console.log('WEBHOOK_VERIFIED');
          res.status(200).send(challenge);

      } else {
          // Responds with '403 Forbidden' if verify tokens do not match
          res.sendStatus(403);
      }
  }
});

app.post('/webhook',(req,res)=>{
  let body = req.body;
  console.log(body);
  if(body.object === 'page'){
    body.entry.forEach(function(entry){
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);
      let recipient_psid = webhook_event.recipient.id;
      let text = webhook_event.message.text;
      console.log('Your message: ' + text);
      var data  = {
        sender: sender_psid,
        recipient: recipient_psid,
        text
      }
      writeJson(JSON.stringify(data,null,2));
    })
  }

  res.status(200).send('OK');
})
const getApiFB = async socket=>{
  fs.readFile('./fb.json',(err,fileData)=>{
    if(err) throw err;
    try{
      const dataMess = JSON.parse(fileData);
      socket.emit('FromAPI',dataMess);
    }catch(error){
      throw error;
    }
  })
  
}

const writeJson = (json) =>{
  fs.writeFile('./fb.json',json,err=>{
    if(err){
      console.log('Error write file ',err);
    }else {
      console.log('Successfully wrote file !');
    }
  })
}
let interval;
io.on('connection',function(socket){
  if(socket.connected){
    console.log("New client connected",socket.id);
    if(interval){
      clearInterval(interval);
    }
    interval = setInterval(()=> getApiFB(socket),10000);
  }
  socket.on("disconnect",()=>{
    console.log("Client disconnected",socket.id);
  });
})

server.listen(port, () => console.log(`Listening on port ${port}`));
// const getApiAndEmit = async socket => {
//   try {
//     const res = await axios.get(
//       "https://api.darksky.net/forecast/0c6fdda69d932f27aa15860a34bb4338/10.8233,106.6298"
//     ); // Getting the data from DarkSky
//     socket.emit("FromAPI", res.data.currently.temperature); // Emitting a new message. It will be consumed by the client
//   } catch (error) {
//     console.error(`Error: ${error.code}`);
//   }
// };

// let interval;

// io.on('connection',socket =>{
//   console.log("New client connected");
//   if(interval){
//     clearInterval(interval);
//   }
//   interval = setInterval(()=> getApiAndEmit(socket),10000);
//   socket.on("disconnect",()=>{
//     console.log("Client disconnected")
//   });
// });

// server.listen(port, () => console.log(`Listening on port ${port}`));
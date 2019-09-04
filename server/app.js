const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const port = process.env.PORT || 4001;
const index = require('./index');

const app= express();
app.use(index);

const server = http.createServer(app);

const io = socketIo(server);

const getApiAndEmit = async socket => {
  try {
    const res = await axios.get(
      "https://api.darksky.net/forecast/0c6fdda69d932f27aa15860a34bb4338/10.8233,106.6298"
    ); // Getting the data from DarkSky
    socket.emit("FromAPI", res.data.currently.temperature); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
};

let interval;

io.on('connection',socket =>{
  console.log("New client connected");
  if(interval){
    clearInterval(interval);
  }
  interval = setInterval(()=> getApiAndEmit(socket),10000);
  socket.on("disconnect",()=>{
    console.log("Client disconnected")
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
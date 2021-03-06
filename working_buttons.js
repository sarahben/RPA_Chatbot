// 'use strict';

// Récupérer les variables d'environnement
 require('dotenv').config({ path: 'variables.env' });

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const FACEBOOK_GRAPH_API_BASE_URL = 'https://graph.facebook.com/v2.6/';
const MONGODB_URI = process.env.MONGODB_URI;
// const VERIFY_TOKEN = process.env.VERIFICATION_TOKEN;

const
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  mysql = require('mysql'),
  app = express().use(body_parser.json()); // creates express http server
// const MongoClient = require('mongodb').MongoClient;
/*
* Database initialization
*/
// mysql variables
let step,
    language,
    flight,
    flightDate,
    usr_lang;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'green_data'
});
connection.connect((err) => {
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});
// Sets server port and logs message on success
  app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
/*
 * GET
 */
// Accepts GET requests at the /webhook endpoint
  app.get('/webhook', (req, res) => {
  /** UPDATE YOUR VERIFY TOKEN **/
  let VERIFY_TOKEN = '123456';

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

    // Check the mode and token sent are correct
    if (mode  && token === VERIFY_TOKEN) {

      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
}); //fin app.get
/*
 * POST
 */
// Accepts POST requests at /webhook endpoint
  app.post('/webhook', (req, res) => {
  // Return a '200 OK' response to all events
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;
  if (body.object === 'page') {
      // Iterate over each entry
      // There may be multiple if batched
      if (body.entry && body.entry.length <= 0){
        return;
      }
      body.entry.forEach((pageEntry) => {
        // Iterate over each messaging event and handle accordingly
        pageEntry.messaging.forEach((messagingEvent) => {
          console.log({messagingEvent});
          if (messagingEvent.message) {
            processMessage(messagingEvent);
          } else if (messagingEvent.postback) {
            processPostback(messagingEvent);
          } else {
            console.log( 'Webhook received unknown messagingEvent: ', messagingEvent );
          }
        });
      });
    }
});

//function processMessage
function processMessage(event) {
  if (!event.message.is_echo) {
    let sender = event.sender.id;
    let message = event.message;
    ///// Require language files
    var fr = require('./fr');
    var en = require('./en');
    var ar = require('./ar');

    switch (message.text){
      case "fr":
        // console.log(typeof fr.setMenu, "++++++++++++++++++++++++++++++++++++++");
        let menu_fr = {
                   "type":"template",
                   // "text":"hi",
                   "payload":{
                       "template_type":"button",
                       "text": 'hi',
                       "buttons":[
                           {
                               "type":"postback",
                               "title":"1",
                               "payload":"resa"
                           },
                           {
                               "type":"postback",
                               "title":"2",
                               "payload":"stat_vol"
                           },
                           {
                               "type":"postback",
                               "title":"3",
                               "payload":"suiv_bag"
                           }
                       ]
                   }
               };
        console.log(menu_fr, "----------------------------------");
        sendQuickReply(sender, 'Hi', menu_fr);
        step = '0';
        language = 'fr';
        // console.log(sender, step, language);
        // mysqlData(sender, step, '','', language);
        // sendTextMessage(sender, menu_fr);
      break;

      case 'OPT-OUT':
      break;
      default:
        const plane = "✈";
        // Message N°2
        const africa = "🌍";
        let text_plane = plane + " Bienvenue / Welcome to " + "Royal Air Maroc" + " on Whatsapp " + plane;

        console.log("Received message from senderId: " + sender); //  Get senders ID
        console.log("Message is: " + JSON.stringify(message)); //
        sendTextMessage(sender, text_plane);

        let text_africa = africa + " Enter en for English " + "\n" +
                          africa + " Pour continuer en français, tapez FR ";
        console.log(text_africa, "Africaaa!!");
        setTimeout(function(){
          sendTextMessage(sender, text_africa)
        }, 500);
      }
    }
} // end function processMessage

// Send text message
const sendTextMessage = async (senderID, text) => {
  var messageData = {
    recipient: {
      id: senderID
    },
    message: {
      text: text
    }
  };
  console.log(messageData);
  await callSendAPI(messageData);
} // end const sendTextMessage

const sendQuickReply = async (recipientId, text, replies, metadata) => {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: replies
      // attachment: {
  //       type: "template",
  //       payload: {
  //         template_type:"button",
  //         // "text": text,
  //         buttons: replies
  //     }
  //   }
  }
  };
  await callSendAPI(messageData);
}
// Graph API
function callSendAPI(messageData) {
  console.log(PAGE_ACCESS_TOKEN);//test
  request({
    "url": `${FACEBOOK_GRAPH_API_BASE_URL}me/messages`,
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json" : messageData
    // "json": request_body
  }, (err, res, body) => {
    console.log("Message Sent Response body:", body);
    if (err) {
      console.error("Unable to send message:", err);
    }
  });
} // end function callSendAPI

function mysqlData(sender, step, flight, flightDate, lang){
  let date = new Date();
  date = date.toJSON().slice(0, 19).replace(/[-]/g, ':');
  date = date.replace(/[T]/g, ' ');
  //Define the data to insert in database !!
  let data = {sender_id: sender, step: step, lastMsgDate: date, flight: flight, flightDate: flightDate, language: lang };
  // Check if there's a row with the same sender_id
  connection.query('SELECT * FROM flight WHERE sender_id = ?', [sender], (err,rows) => {
    // if (true) {
    //   console.log(data, '--------------------------------');
    //   console.log(JSON.stringify(rows), '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    //   connection.query( 'UPDATE flight SET ? Where sender_id = ?', [data, sender],(err, result) => {
    //     if (err) throw err;
    //     console.log('Data updated', '???????????????????????????????????????????,');
    //   });
    // } else {
      connection.query('INSERT INTO flight SET ?', data, (err, res) => {
      if(err) throw err;
      console.log('Data inserted', '+++++++++++++++++++++++++++++++++++');
      });
    // }
  });

}
// Vérifier la langue choisie par l'utilisateur
// Elle permettra de définir le texte à envoyer en réponse
  function checkLang(sender){
    let rowLang;
  connection.query('SELECT * FROM flight WHERE sender_id = ?', [sender], (err,rows) => {
    // console.log(rows[0].language, 'ROWSROWSROWSROWS');
    rowLang = rows[0].language;
  });
  return rowLang;
}


// Supprimer ligne user si OPT-OUT

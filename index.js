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
let step, language, flight, flightDate, usr_lang, tagBag, boardpass, safar, claim;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
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

  connection.query('SELECT * FROM flight WHERE sender_id = ?', [sender], (err,rows) => {
    console.log("ROW0 : ", rows[0]);
    if(!rows[0]){
      const plane = "✈";
      // Message N°2
      const africa = "🌍";
      let text_plane = plane + " Bienvenue / Welcome to " + "Royal Air Maroc" + " on Messenger " + plane;

      console.log("Received message from senderId: " + sender); //  Get senders ID
      console.log("Message is: " + JSON.stringify(message)); //
      sendTextMessage(sender, text_plane);

      let text_lang = africa + " Enter EN for English " + "\n" +
                      africa + " Tapez FR pour le Français " + "\n";
      var replies = [{
                        "content_type": "text",
                        "title": "FR",
                        "payload": "fr",
                        },
                        {
                        "content_type": "text",
                        "title": "EN",
                        "payload": "en",
                        }];
      console.log(text_lang, "Africaaa!!");
      setTimeout(function(){
        sendQuickReply(sender, text_lang, replies)
      }, 500);
      step = '0';
      // tagBag = rows[0].tagBag;
      mysqlData(sender, step, '','', '','','','','','');
    } else {
      // Mettre les messages texte UpperCase
      message.text = message.text.toUpperCase();
      /*
      * Initialiser les données de la table
      */
      step = rows[0].step; language = rows[0].language; reservation = rows[0].reservation;
      flight = rows[0].flight; flightDate = rows[0].flightDate; tagBag = rows[0].tagBag;
      boardpass = rows[0].boardpass; safar = rows[0].safar; claim = rows[0].claim;
      /*Fin de l'initialisation */

      /* Récupérer les messages */
      // if (step == '0'){
        if(message.text == 'FR'){
          let menu_fr = fr.setMenu();
          reply = [{
                            "content_type": "text",
                            "title": "OPT-OUT",
                            "payload": "OPT-OUT",
                          }];
          // tagBag = rows[0].tagBag;
          language = message.text;
          step = '0';
          updateDB(sender, step, language , reservation ,flight, flightDate, tagBag,boardpass, safar, claim);
          sendQuickReply(sender, menu_fr, reply);
        } else if(message.text == 'EN'){
          let menu_en = en.setMenu();
          reply = [{
                            "content_type": "text",
                            "title": "OPT-OUT",
                            "payload": "OPT-OUT",
                          }];
          language = message.text;
          step = '0';
          updateDB(sender, step, language , reservation ,flight, flightDate, tagBag,boardpass, safar, claim);
          sendQuickReply(sender, menu_en, reply);
        } else if(message.text == '1'){
          let req = exportReq(language);
          let pnr = req.setPNR();
          step = '1';
          updateDB(sender, step, language , reservation ,flight, flightDate, tagBag,boardpass, safar, claim);
          sendTextMessage(sender, pnr);
        } else if (message.text == '2') {
          let req = exportReq(language);
          let stat = req.setFlightStat();
          step = '2';
          updateDB(sender, step, language , reservation ,flight, flightDate, tagBag,boardpass, safar, claim);
          sendTextMessage(sender, stat);
        } else if (message.text == '3') {
          let req = exportReq(language);
          let track = req.setTrackBag();
          step = '3';
          updateDB(sender, step, language , reservation ,flight, flightDate, tagBag,boardpass, safar, claim);
          sendTextMessage(sender, track);
        } else if (message.text == '4') {
          let req = exportReq(language);
          let pnr = req.setPNR();
          step = '4';
          updateDB(sender, step, language , reservation ,flight, flightDate, tagBag,boardpass, safar, claim);
          sendTextMessage(sender, pnr);
        } else if (message.text == '5') {
          let req = exportReq(language);
          let miles = req.setMiles();
          step = '5';
          updateDB(sender, step, language , reservation ,flight, flightDate, tagBag,boardpass, safar, claim);
          sendTextMessage(sender, miles);
        } else if (message.text == 'OPT-OUT') {
          let req = exportReq(language);
          let out = req.optOut();
          connection.query('DELETE FROM flight WHERE sender_id = ?', [sender], (err, result) => {
          if (err) throw err;
            sendTextMessage(sender, out);
          });
          }  else {
            if(message.text == '0'){
              let req = exportReq(language);
              let menu = req.setMenu();
              reply = [{
                            "content_type": "text",
                            "title": "OPT-OUT",
                            "payload": "OPT-OUT",
                          }];
           step = '0';
            updateDB(sender, step, language , reservation ,flight, flightDate, tagBag,boardpass, safar, claim);
            sendQuickReply(sender, menu, reply);
        } // texte = 0

          if (step == '1'){
          var tr = require('./retrievePNR.js');
            let pnrDetails = tr.callPNR(message.text, sender, language);
            updateDB(sender, step, language , message.text , flight , flightDate, tagBag,boardpass, safar, claim);
          }
          if (step == '2'){
          var tr = require('./statutVol.js');
            let statutvol = tr.callStatut(message.text, sender, language);
            updateDB(sender, step, language , reservation ,message.text, flightDate, tagBag,boardpass, safar, claim);
          }
          if (step == '3'){
          var tr = require('./trackBag.js');
            let track = tr.callTrack(message.text, sender, language);
            updateDB(sender, step, language , reservation , flight, flightDate, message.text ,boardpass, safar, claim);
          }
          if (step == '4'){
          var tr = require('./boardingPass.js');
          // var tr = require('./pdf.js');
          let file = tr.sendFile(message.text, sender, language);
          updateDB(sender, step, language , reservation , flight, flightDate, tagBag , message, safar, claim);
          }
          if (step == '5'){
          const callSafar = require('./safarFlyer.js');
            callSafar(message.text, sender, language);
            updateDB(sender, step, language , reservation , flight, flightDate, tagBag ,boardpass, message.text, claim);
          }
        }
    }; //if(!rows[0])
  }); //connection.query

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
      text: text,
      // metadata: isDefined(metadata) ? metadata : "",
      quick_replies: replies
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

function mysqlData(sender, step, lang, reservation, flight, flightDate, tagBag, boardpass, safar, claim){
  let date = new Date();
  date = date.toJSON().slice(0, 19).replace(/[-]/g, ':');
  date = date.replace(/[T]/g, ' ');
  //Define the data to insert in database !!
  let data = {sender_id: sender, step: step, lastMsgDate: date, language: lang, reservation: reservation, flight: flight,
    flightDate: flightDate, tagBag: tagBag, boardpass: boardpass, safar: safar, claim: claim};
  // Check if there's a row with the same sender_id
  connection.query('SELECT * FROM flight WHERE sender_id = ?', [sender], (err,rows) => {
      connection.query('INSERT INTO flight SET ?', data, (err, res) => {
      if(err) throw err;
      console.log('Data inserted');
      });
  });

}
// Update data inmysql
function updateDB(sender, step, lang, reservation, flight, flightDate, tagBag, boardpass, safar, claim){
  let date = new Date();
  date = date.toJSON().slice(0, 19).replace(/[-]/g, ':');
  date = date.replace(/[T]/g, ' ');
  let data = {sender_id: sender, step: step, lastMsgDate: date, language: lang, reservation: reservation, flight: flight,
    flightDate: flightDate, tagBag: tagBag, boardpass: boardpass, safar: safar, claim: claim};
  connection.query( 'UPDATE flight SET ? Where sender_id = ?', [data, sender],(err, result) => {
      if (err) throw err;
      console.log('Data updated');
    });
}
// Vérifier la langue choisie par l'utilisateur
// Elle permettra de définir le texte à envoyer en réponse
  function checkLang(sender){
    let rowLang;
  connection.query('SELECT * FROM flight WHERE sender_id = ?', [sender], (err,rows) => {
    console.log(rows[0].language);
    if (rows[0].language == 'FR'){
      rowLang = 'FR';
    } else if(rows[0].language == 'EN') {
      rowLang = 'EN';
    } else if(rows[0].language == 'AR') {
      rowLang = 'AR';
    }
  });
  console.log(rowLang, 'TEST');
  return rowLang;
}
//Dynamiser la récupération de texte par langue choisie
function exportReq (lang){
  ///// Require language files
  var fr = require('./fr');
  var en = require('./en');
  // var ar = require('./ar');
  let req;
    if (lang == 'FR'){
      req = fr;
    } else if(lang == 'EN') {
      req = en;
    } else if(lang == 'AR') {
      req = ar;
    }
    return req;
}

// Supprimer ligne user si OPT-OUT
function backToZero(sender, text){
  setTimeout(function(){
    sendTextMessage(sender, text);
  }, 2000);
}

require('dotenv').config();
const client = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID || 'AC_PLACEHOLDER',
  process.env.TWILIO_AUTH_TOKEN || 'AUTH_TOKEN_PLACEHOLDER'
);

client.messages
  .create({
    body: 'Hello from Twilio!',
    from: '+15076328540',   // Twilio number
    to: '+915753081309783'    // MSISDN
  })
  .then(message => console.log(message.sid))
  .catch(err => console.error(err));
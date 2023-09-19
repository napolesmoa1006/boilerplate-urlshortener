require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose')
const dns = require('dns');
const urlparser = require('url');


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }));


mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Now connected to MongoDB!')
  })
  .catch((err) => {
    console.error('Something went wrong', err)
  })



app.use('/public', express.static(`${process.cwd()}/public`));


const urlSchema = new mongoose.Schema({
  url: String,
  short_url: String
})

const Url = mongoose.model('Url', urlSchema)

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ 
    greeting: 'hello API'
  });
});


app.post('/api/shorturl', async (req, res) => {
  const url = req.body.url

  const aux = await Url.findOne({url: url})
  if (aux) {
    res.json({
      original_url: aux.url,
      short_url: aux.short_url
    })
    return
  }

  const dnslookup = dns.lookup(urlparser.parse(url).hostname, 
    async (err, address) => {
      if (!address) {
        res.send('Bad request')
        return
      }

      const urls = await Url.find()

      const model = new Url({
        url: req.body.url,
        short_url: urls.length + 1
      })

      const result = await model.save()

      res.json({
        original_url: result.url,
        short_url: result.short_url
      })
    }
  )
})


app.get('/api/shorturl/:short_url', async (req, res) => {
  const short_url = req.params.short_url
  try {
    const url = await Url.findOne({ short_url: +short_url })
    res.redirect(url.url)
  } catch (err) {
    res.send(`Bad request. Error: ${err}`)
  }
})

app.listen(port, function() {
  console.log(`Listening on http://localhost:${port}`);
});

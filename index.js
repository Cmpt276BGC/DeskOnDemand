//Patrick Pulled / pushed successfully 
// harsh's commit
//Matt's commit

const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))

  .get('/login', (req, res) => {
    res.render('pages/loginPage')
  })

  .get('/register', (req, res) => {
    res.render('pages/registerPage')
  })

  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

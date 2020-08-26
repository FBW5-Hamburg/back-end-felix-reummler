const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')

const User = require('../models/user')

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: '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'
  }
}))

exports.getLogin = (req, res, next) => {
  let message = req.flash('error')
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMsg: message
  })
}

exports.getSignup = (req, res, next) => {
  let message = req.flash('error')
  if (message.length > 0) {
    message = message[0]
  } else {
    message = null
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMsg: message
  })
}

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  User.findOne({
      email: email
    })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid Login!')
        return res.redirect('/login')
      }
      bcrypt.compare(password, user.password).then(match => {
        if (match) {
          req.session.isLoggedIn = true
          req.session.user = user
          return req.session.save(err => {
            console.log(err)
            res.redirect('/')
          })
        }
        req.flash('error', 'Invalid Login!')
        res.redirect('/login')
      }).catch(err => {
        console.log(err)
        res.redirect('login')
      })

    })
    .catch(err => console.log(err))
}

exports.postSignup = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  const confirmPassword = req.body.confirmPassword
  User.findOne({
      email: email
    })
    .then(userDoc => {
      if (userDoc) {
        req.flash('error', 'Account with this E-mail already exists!')
        return res.redirect('/signup')
      }
      return bcrypt.hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: {
              items: []
            }
          })
          return user.save()
        })
        .then(result => {
          res.redirect('/login')
          transporter.sendMail({
            to: email,
            from: 'chuanqi.felix@gmail.com',
            subject: 'Signup Success!',
            html: '<h1>You successfully signed up!</h1>'
          })
        }).catch(err => {
          console.log(err)
        })
    })
    .catch(err => console.log(err))
}

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err)
    res.redirect('/')
  })
}
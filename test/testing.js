var chai = require('chai')
var chaiHttp = require('chai-http')
var server = require('../index')
var should = chai.should()

chai.use(chaiHttp)

describe('Register', function() {
    it('should register', function(done) {
        chai.request(server).post('/register')
            .send({
                firstNameInput: "test",
                lastNameInput: "test",
                emailInput: "test@test.com",
                passwordInput: "test1234",
                confirmPasswordInput: "test1234"
            })
            .end(function(err, res) {
                res.should.has.status(200)
                res.should.be.html
                res.body.should.be.a('object')
                done()
            })
    })
})

describe('Login', function() {
    it('should login', function() {             // done was taken out as it is async
        chai.request(server).post('/login')
            .send({
                userEmailInput:'test@test.com',
                userPasswordInput:'test1234'
            })
            .end(function(err, res) {
                res.should.has.status(200)
                res.should.be.html
                res.body.should.be.a('object')
            })
    })
})
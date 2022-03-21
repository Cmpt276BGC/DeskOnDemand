const { expect } = require('chai')
var chai = require('chai')
var chaiHttp = require('chai-http')
var server = require('../index')
var should = chai.should()
const { Pool } = require('pg');
var pool = new Pool({
//   connectionString: 'postgres://postgres:root@localhost/bgcusers'
});

chai.use(chaiHttp)

before(function() {
    pool.query(`delete from bgcusers where upass='test1234'`)
})

describe('Register', function() {
    pool.query(`delete from bgcusers where upass='test1234'`)

    it('should register a new account', function(done) {
        chai.request(server).post('/register')
            .send({
                firstNameInput: "test",
                lastNameInput: "test",
                emailInput: "test@test.com",
                passwordInput: "test1234",
                confirmPasswordInput: "test1234"
            })
            .redirects(0)
            .end(function(err, res) {
                should.not.exist(err)
                res.should.have.status(302)
                res.should.redirectTo('/login')
                res.should.be.text
                res.body.should.be.a('object')
                done()
            })
    })
})

describe('Login', function() {
    it('should successfully login as a normal user and redirect to /userPage', function(done) {
        chai.request(server).post('/login')
            .send({
                userEmailInput: 'test@test.com',
                userPasswordInput: 'test1234'
            })
            .redirects(0)
            .end(function(err, res) {
                should.not.exist(err)
                res.should.have.status(302)
                res.should.redirectTo('/userPage')
                res.should.be.text
                res.body.should.be.a('object')
                done()
            })
    })

    it('should successfully login as an admin user and redirect to /adminPage', function(done) {
        chai.request(server).post('/login')
            .send({
                userEmailInput: 'admin@admin.com',
                userPasswordInput: 'admin123'
            })
            .redirects(0)
            .end(function(err, res) {
                should.not.exist(err)
                res.should.have.status(302)
                res.should.redirectTo('/adminPage')
                res.should.be.text
                res.should.be.a('object')
                done()
            })
    })
})
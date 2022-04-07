const { expect } = require('chai')
var chai = require('chai')
var chaiHttp = require('chai-http')
var server = require('../index')
var should = chai.should()
const { Pool } = require('pg');
var pool = new Pool({
  connectionString: 'postgres://postgres:root@localhost/bgcusers'
//   connectionString: 'postgres://postgres:Jojek2020.@localhost/dod' //Matts connection string
});

chai.use(chaiHttp)
// chai.use(require('chai-json'))
// chai.use(require('chai-things'))

before(function() {
    pool.query(`delete from bgcusers where fname='test'`)
})

describe('Register', function() {
    pool.query(`delete from bgcusers where fname='test'`)

    it('should register a new account', function(done) {
        chai.request(server).post('/users/register')
            .send({
                fname: "test",
                lname: "test",
                email: "test@test.com",
                password: "test1234",
                confirmpw: "test1234"
            })
            .redirects(0)
            .end(function(err, res) {
                should.not.exist(err)
                res.should.have.status(302)
                res.should.redirectTo('/users/login')
                res.should.be.text
                res.body.should.be.a('object')
                done()
            })
    })
})

describe('Login', function() {
    it('should successfully login as a normal user and redirect to /users/login', function(done) {
        chai.request(server).post('/users/login')
            .send({
                email: 'test@test.com',
                password: 'test1234'
            })
            .redirects(0)
            .end(function(err, res) {
                should.not.exist(err)
                res.should.have.status(302)
                res.should.redirectTo('/users/dashboard')
                res.should.be.text
                res.body.should.be.a('object')
                done()
            })
    })

    it('should not login when given an incorrect email/password', function(done) {
        chai.request(server).post('/users/login')
            .send({
                email: 'testdoesnotexist@test.com',
                password: 'test1234'
            })
            .redirects(0)
            .end(function(err, res) {
                should.not.exist(err)
                res.should.have.status(302)
                res.should.redirectTo('/users/login')
                res.should.be.text
                res.body.should.be.a('object')
                done()
            })
    })

    it('should successfully login as a admin user and redirect to /users/admindash', function(done) {
        chai.request(server).post('/users/adminlogin')
            .send({
                email: 'admin@admin.com',
                password: 'admintest'
            })
            .redirects(0)
            .end(function(err, res) {
                should.not.exist(err)
                res.should.have.status(302)
                res.should.redirectTo('/users/admindash')
                res.should.be.text
                res.body.should.be.a('object')
                done()
            })
    })

    it('should not login when given an incorrect admin email/password', function(done) {
        chai.request(server).post('/users/adminlogin')
            .send({
                email: 'admindoesnotexist@admin.com',
                password: 'admintest'
            })
            .redirects(0)
            .end(function(err, res) {
                should.not.exist(err)
                res.should.have.status(302)
                res.should.redirectTo('/users/adminlogin')
                res.should.be.text
                res.body.should.be.a('object')
                done()
            })
    })
})

describe('Dashboard', function() {
    it('should display admin dashboard to a admin user', function(done) {
        chai.request(server).get('/users/admindash')
            .end(function(err, res){
                should.not.exist(err)
                res.should.have.status(200)
                res.should.be.html
                res.body.should.be.a('object')
                done()
            })
    })

    it('should display user dashboard to a regular user', function(done) {
        chai.request(server).get('/users/dashboard')
            .end(function(err, res){
                should.not.exist(err)
                res.should.have.status(200)
                res.should.be.html
                res.body.should.be.a('object')
                done()
            })
    })
})

describe('Database', function() {
    it('should output all users registered in the database on /db', function(done) {
        chai.request(server).get('/db')
            .end(function(err, res) {
                should.not.exist(err)
                res.should.have.status(200)
                res.should.be.html
                res.body.should.be.a('object')
                done()
            })
    })
})

describe('Search for workstations', function() {
    it('should present the user to the dashboard page where they choose a workstation', function(done) {
        chai.request(server).get('/users/dashboard')
        .end(function(err, res) {
            should.not.exist(err)
            res.should.have.status(200)
            res.should.be.html
            res.body.should.be.a('object')
            done()
        })
    })
})

describe('Book a workstations', function() {
    it('should display all workstations with one date', function(done) {
        chai.request(server).post('/users/dashboard')
            .send({
                specificDate: '2022-04-16',
                floor: 'any',
                workstationType: 'any',
                window: 'false',
                corner: 'false',
                permanent: 'false'
            })
            .end(function(err, res){
                should.not.exist(err)
                res.should.be.html
                res.body.should.be.a('object')
                done()
            })
    })

    it('should allow the user to book a workstation from a range of dates', function(done) {
        chai.request(server).get('/userPageRangeOfDates')
            .end(function(err, res){
                should.not.exist(err)
                res.should.have.status(200)
                res.should.be.html
                res.body.should.be.a('object')
                done()
            })
    })

    it('should display all workstations when searching with a range of dates', function(done) {
        chai.request(server).post('/userPageRangeOfDates')
            .send({
                fromDate: '2022-04-18',
                toDate: '2022-04-19',
                floor: 'any',
                workstationType: 'any',
                window: 'false',
                corner: 'false',
            })
            .end(function(err, res){
                should.not.exist(err)
                res.should.be.html
                res.body.should.be.a('object')
                done()
            })
    })
})

describe('See workstations', function() {
    it('should display the workstations that the user has booked', function(done) {
        chai.request(server).get('/bookedworkstations')
            .end(function(err, res){
                should.not.exist(err)
                res.should.have.status(200)
                res.should.be.html
                res.body.should.be.a('object')
                done()
            })
    })

    it('should display all workstations in database for admins', function(done) {
        chai.request(server).get('/manageDesks')
            .end(function(err, res){
                should.not.exist(err)
                res.should.have.status(200)
                res.should.be.html
                res.body.should.be.a('object')
                done()
            })
    })

    it('should cancel a booking', function(done) {
        chai.request(server).post('/cancelBooking')
            .send({
                title: 'true'
            })
            .end(function(err, res){
                should.not.exist(err)
                res.should.be.json
                res.body.should.be.a('object')
                done()
            })
    })
})

const { expect } = require('chai')
var chai = require('chai')
var chaiHttp = require('chai-http')
var server = require('../index')
var should = chai.should()
const { Pool } = require('pg');
var pool = new Pool({
//   connectionString: 'postgres://postgres:root@localhost/bgcusers'
//   connectionString: 'postgres://postgres:Jojek2020.@localhost/dod' //Matts connection string
});

chai.use(chaiHttp)
chai.use(require('chai-json'))
chai.use(require('chai-things'))

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

// //not complete
// describe('Search', function(){
//     it('should search for available workstations on a particular date with no specific floor or attributes', function(done){
//         chai.request(server).post('/searchTablesSpecificDate')
//             .send({
//                 specificDateISOString: '2022-03-16',
//                 specificDateEndISOString: '2022-03-17',
//                 floor: 'any',
//                 office: 'false',
//                 window: 'false',
//                 corner: 'false',
//                 cubicle: 'false',
//                 single: 'false',
//                 double: 'false'
//             })
//             .end(function(err, res){
//                 should.not.exist(err)
//                 res.should.have.status(200)
//                 res.should.be.json
//                 done()
//             })
//     })
// })
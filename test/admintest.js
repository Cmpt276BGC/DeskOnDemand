// var chai = require('chai')
// var chaiHttp = require('chai-http')
// var server = require('../index')
// var should = chai.should()

// chai.use(chaiHttp);

// // emmii's temporary tests

// describe('Admins', function(){
//   // tests associated with administrative users
//   it('should log in as admin and redirect to html page', function(){
//     chai.request(server).post('/login').send({userEmailInput:'admin@mail.com', userPasswordInput:'admin'})
//       .end(function(err, res) {
//         res.should.has.status(200);
//         res.should.be.html;
//         res.body.should.be.a('object');
//       });
//   });

//   it('should allow admin user to access regular user page', function(){
//     chai.request(server).get('/userPage').send()
//       .end(function(err, res) {
//         res.should.has.status(200);
//         res.should.be.html;
//       });
//   });
// });
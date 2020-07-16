const request = require('supertest')
const bcrypt = require('bcryptjs')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOneId, userOne, setupDatabase } = require('./fixtures/db')
 
beforeEach(setupDatabase)

test('Should signup a new user', async () => {
  const response = await request(app).post('/users').send({
    name: 'Andrew',
    email: 'andrew@example.com',
    password: 'MyPass777!'
  }).expect(201)
  
  // Assert that hte database was changed correctly
  const user = await User.findById(response.body.user._id)
  expect(user).not.toBeNull()

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'Andrew',
      email: 'andrew@example.com',
    },
    token: user.tokens[0].token
  })
  expect(user.password).not.toBe('MyPass777!')
})

test('Should login existing user', async () => {
  const response = await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200)
  const user = await User.findById(userOneId)
  expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexistent user', async () => {
  await request(app).post('/users/login').send({
    email: userOne.email,
    password: 'thisisnotmypass',
  }).expect(400)
})

test('Should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete account for user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200) 
  const user = await User.findById(userOneId)
  expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
  await request(app)
  .delete('/users/me')
  .send()
  .expect(401)
})

test('Should upload avatar image', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200)
  const user = await User.findById(userOneId)
  expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: 'Jen' })
    .expect(200)

  const user = await User.findById(userOneId)
  expect(user.name).toBe('Jen')
})

test('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ location: 'Brisbane' })
    .expect(400)
})

// Additinal tests
test('Should not signup user with invalid name', async () => {
  await request(app)
    .post('/users')
    .send({
      name: '',
      email: 'ysk@example.com',
      password: 'pass123@@@',
    })
    .expect(400)
  const user = await User.findOne({ email: 'ysk@example.com' })
  expect(user).toBeNull()
})

test('Should not signup user with invalid email', async () => {
  await request(app)
    .post('/users')
    .send({
      name: 'Yasuko',
      email: 'thisisinvalidaddress',
      password: 'pass123@@@',
    })
    .expect(400)
  const user = await User.findOne({ name: 'Yasuko' })
  expect(user).toBeNull()
})

test('Should not signup user with invalid password', async () => {
  await request(app)
    .post('/users')
    .send({
      name: 'Yasuko',
      email: 'ysk@example.com',
      password: 'password',
    })
    .expect(400)
  const user = await User.findOne({ name: 'Yasuko' })
  expect(user).toBeNull()
})

test('Should not update user if unauthenticated', async () => {
  await request(app)
    .patch('/users/me')
    .send({ name: 'Jen' })
    .expect(401)
})

test('Should not update user with invalid name', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ name: '' })
    .expect(400)
  const user = await User.findById(userOneId)
  expect(user.name).toBe('Mike')
})

test('Should not update user with invalid email', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ email: 'thisisinvalidaddress' })
    .expect(400)
  const user = await User.findById(userOneId)
  expect(user.email).toBe('mike@example.com')
})

test('Should not update user with invalid password', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ password: 'password' })
    .expect(400)
  const user = await User.findById(userOneId)
  const isMatch = await bcrypt.compare('56what!!', user.password)
  expect(isMatch).toEqual(true)
})
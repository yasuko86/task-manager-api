const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const { 
  userOneId, 
  userOne, 
  userTwoId, 
  userTwo, 
  taskOne,
  taskTwo,
  taskThree, 
  setupDatabase 
} = require('./fixtures/db')
const { send } = require('@sendgrid/mail')
 
beforeEach(setupDatabase)

test('Should create task for user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'From my test'
    })
    .expect(201)
  const task = await Task.findById(response.body._id)
  expect(task).not.toBeNull()
  expect(task.completed).toEqual(false)
})

test('Should fetch user tasks', async () => {
  const response = await request(app)
    .get(`/tasks`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
  expect(response.body.length).toEqual(2)
})

test('Should not delete other users tasks', async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404)
  const task = await Task.findById(taskOne._id)
  expect(task).not.toBeNull()
})

// Additinal tests
test('Should not create task with invalid description/completed', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ description: "" })
    .expect(400)
  const task = await Task.findById(response.body._id)
  expect(task).toBeNull()
})

test('Should not update task with invalid description/completed', async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({ description: "" })
    .expect(400)
  const task = await Task.findById(taskOne._id)
  expect(task.description).toBe('First task')
})

test('Should delete user task', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
  const task = await Task.findById(taskOne._id)
  expect(task).toBeNull()
})

test('Should not delete task if unauthenticated', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .send()
    .expect(401)
  const task = await Task.findById(taskOne._id)
  expect(task).not.toBeNull()
})

test('Should not update other users task', async () => {
  const response = await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send({ completed: true })
    .expect(404)
  const task = await Task.findById(taskOne._id)
  expect(task.completed).toEqual(false)
})

test('Shoulf fetch user task by id', async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
  const task = await Task.findById(response.body._id)
  expect(task).toMatchObject(taskOne)
})

test('Should not fetch user task by id if unauthenticated', async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .send()
    .expect(401)
})

test('Should not fetch other users task by id', async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404)
})

test('Should fetch only completed tasks', async () => {
  const response = await request(app)
    .get('/tasks?completed=true')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
  expect(response.body.length).toBe(1)
})

test('Should fetch only incomplete tasks', async () => {
  const response = await request(app)
    .get('/tasks?completed=false')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200)
  expect(response.body.length).toBe(1)
})

// Task Test Ideas
// 
// Should sort tasks by description/completed/createdAt/updatedAt
// Should fetch page of tasks
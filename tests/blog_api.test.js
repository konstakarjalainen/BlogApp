const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5
  },
  {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12
  },
  {
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 10
  },
  {
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0
  } 
]

beforeEach(async () => {
  await Blog.deleteMany({})
  let blogObject = new Blog(initialBlogs[0])
  await blogObject.save()
  blogObject = new Blog(initialBlogs[1])
  await blogObject.save()
  blogObject = new Blog(initialBlogs[2])
  await blogObject.save()
  blogObject = new Blog(initialBlogs[3])
  await blogObject.save()
  blogObject = new Blog(initialBlogs[4])
  await blogObject.save()
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('all blogs are returned', async () => {
  const response = await api.get('/api/blogs')


  expect(response.body).toHaveLength(initialBlogs.length)
})

test('a specific blog is within the returned blogs', async () => {
  const response = await api.get('/api/blogs')

  const titles = response.body.map(r => r.title)

  expect(titles).toContain(
    'First class tests'
  )
})

test('blog is identifed with "id"', async () => {
  const response = await api.get('/api/blogs')
  const ids = response.body.map(r => r.id)
  expect(ids).toBeDefined()
})

test('a valid blog can be added ', async () => {
  const newBlog = {
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')

  const titles = response.body.map(r => r.title)

  expect(response.body).toHaveLength(initialBlogs.length + 1)
  expect(titles).toContain(
    'Type wars'
  )
})

test('blog without title is not added', async () => {
  const newBlog = {
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 10
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(initialBlogs.length)
})

test('blog without url is not added', async () => {
  const newBlog = {
    title: 'Type wars',
    author: 'Robert C. Martin',
    likes: 10
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)

  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(initialBlogs.length)
})

test('blog without likes is added with 0 likes', async () => {
  const newBlog = {
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html'
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)

  const response = await api.get('/api/blogs')
  const addedBlog = response.body.filter(blog => blog.title === newBlog.title)[0]
  console.log('added blog', addedBlog)
  expect(addedBlog.likes).toBe(0)
  expect(response.body).toHaveLength(initialBlogs.length + 1)
})

test('deletion of the blog succeeds', async () => {
  const response = await api.get('/api/blogs')
  const blogsAtStart = response.body
  console.log('blogs', blogsAtStart)
  const blogToDelete = blogsAtStart[0]
  console.log('deleting', blogToDelete)

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(204)

  const blogsAfterDelete = await api.get('/api/blogs')
  console.log('After delete', blogsAfterDelete.body)
  expect(blogsAfterDelete.body).toHaveLength(initialBlogs.length - 1)

  const titles = blogsAfterDelete.body.map(r => r.title)
  expect(titles).not.toContain(blogToDelete.title)
})

test('updating the likes of the blog succeeds', async () => {
  const response = await api.get('/api/blogs')
  const blogsAtStart = response.body
  const blogToUpdate = blogsAtStart[0]
  console.log('Original blog', blogToUpdate)
  const updatedBlog = {...blogToUpdate, likes: blogToUpdate.likes + 10}
  console.log('Updated blog', updatedBlog)
  await api
    .put(`/api/blogs/${updatedBlog.id}`)
    .send(updatedBlog)
    .expect(200)

  const blogsAfterUpdate = await api.get('/api/blogs')
  expect(blogsAfterUpdate.body).toHaveLength(initialBlogs.length)

  const blog = blogsAfterUpdate.body.filter(r => r.title === blogToUpdate.title)[0]
  expect(blog.likes).toBe(blogToUpdate.likes + 10)
})

afterAll(async () => {
  await mongoose.connection.close()
})
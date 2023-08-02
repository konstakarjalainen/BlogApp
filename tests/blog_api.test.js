const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

const Blog = require('../models/blog')

const bcrypt = require('bcryptjs')
const User = require('../models/user')

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

describe('when there is initially one user at db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const response = await api.get('/api/users')
    const usersAtStart = response.body

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await api.get('/api/users')
    expect(usersAtEnd.body).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.body.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const response = await api.get('/api/users')
    const usersAtStart = response.body

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await api.get('/api/users')
    expect(usersAtEnd.body).toHaveLength(usersAtStart.length)
  })
  test('creation fails with too short username', async () => {
    const response = await api.get('/api/users')
    const usersAtStart = response.body

    const newUser = {
      username: 'as',
      name: 'Arto Salainen',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    
    expect(result.body.error).toContain('username must at least 3 characters')

    const usersAtEnd = await api.get('/api/users')
    expect(usersAtEnd.body).toHaveLength(usersAtStart.length)
  })
  test('creation fails with too short password', async () => {
    const response = await api.get('/api/users')
    const usersAtStart = response.body

    const newUser = {
      username: 'artos',
      name: 'Arto Salainen',
      password: 'as',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    
    expect(result.body.error).toContain('password must at least 3 characters')

    const usersAtEnd = await api.get('/api/users')
    expect(usersAtEnd.body).toHaveLength(usersAtStart.length)
  })
})

describe('when login is needed', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await Blog.deleteMany({})
    const passwordHash = await bcrypt.hash('test', 10)

    const testUser = new User ({
      username: 'test',
      name: 'Test User',
      passwordHash
    })
    await testUser.save()

    const otherUser = new User ({
      username: 'other',
      name: 'Test User',
      passwordHash
    })
    await otherUser.save()

    const userId = (await api.get('/api/users')).body[0].id

    const newBlog = new Blog ({
      title: 'React',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      likes: 2,
      user: userId
    })
    await newBlog.save()

  })
  test('a valid blog can be added ', async () => {

    const testLogin = await api
      .post('/api/login')
      .send({username: 'test', password: 'test'})
    console.log('login', testLogin.body.token)
    const token = testLogin.body.token
    
    const newBlog = {
      title: 'Type wars',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      likes: 10
    }
    const blogsBefore = (await api.get('/api/blogs')).body
  
    await api
      .post('/api/blogs')
      .set('Authorization', token)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  
    const blogsAfter = (await api.get('/api/blogs')).body
  
    const titles = blogsAfter.map(r => r.title)
  
    expect(blogsAfter).toHaveLength(blogsBefore.length + 1)
    expect(titles).toContain('Type wars')
  })
  
  test('blog without title is not added', async () => {
    const testLogin = await api
      .post('/api/login')
      .send({username: 'test', password: 'test'})

    const token = testLogin.body.token
    const newBlog = {
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
      likes: 10
    }
    const blogsBefore = (await api.get('/api/blogs')).body

    await api
      .post('/api/blogs')
      .set('Authorization', token)
      .send(newBlog)
      .expect(400)
  
    const blogsAfter = (await api.get('/api/blogs')).body
  
    expect(blogsAfter).toHaveLength(blogsBefore.length)
  })
  
  test('blog without url is not added', async () => {
    const testLogin = await api
      .post('/api/login')
      .send({username: 'test', password: 'test'})
    
    const token = testLogin.body.token
    const newBlog = {
      title: 'React',
      author: 'Robert C. Martin',
      likes: 10
    }
    const blogsBefore = (await api.get('/api/blogs')).body

    await api
      .post('/api/blogs')
      .set('Authorization', token)
      .send(newBlog)
      .expect(400)
  
    const blogsAfter = (await api.get('/api/blogs')).body
  
    expect(blogsAfter).toHaveLength(blogsBefore.length)
  })
  
  test('blog without likes is added with 0 likes', async () => {
    const testLogin = await api
      .post('/api/login')
      .send({username: 'test', password: 'test'})
    const token = testLogin.body.token
    const newBlog = {
      title: 'Sing',
      author: 'Robert C. Martin',
      url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html'
    }
    const blogsBefore = (await api.get('/api/blogs')).body

    await api
      .post('/api/blogs')
      .set('Authorization', token)
      .send(newBlog)
      .expect(201)
  
    const blogsAfter = (await api.get('/api/blogs')).body
    const addedBlog = blogsAfter.filter(blog => blog.title === newBlog.title)[0]
    expect(addedBlog.likes).toBe(0)
    expect(blogsAfter).toHaveLength(blogsBefore.length + 1)
  })

  test('deletion of someone elses blog fails', async () => {
    
    const otherLogin = await api
      .post('/api/login')
      .send({username: 'other', password: 'test'})

    const otherToken = otherLogin.body.token
    console.log('Other token', otherToken)
    const blogsAtStart = (await api.get('/api/blogs')).body
    const blogToDelete = blogsAtStart[blogsAtStart.length - 1]
    console.log('deleting', blogToDelete)
  
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', otherToken)
      .expect(401)
  
    const blogsAfterDelete = await api.get('/api/blogs')
    expect(blogsAfterDelete.body).toHaveLength(blogsAtStart.length)
  
    const titles = blogsAfterDelete.body.map(r => r.title)
    expect(titles).toContain(blogToDelete.title)
  })
  
  test('deletion of own blog succeeds', async () => {
    const testLogin = await api
      .post('/api/login')
      .send({username: 'test', password: 'test'})
    const token = testLogin.body.token
    const response = await api.get('/api/blogs')
    const blogsAtStart = response.body
    console.log(blogsAtStart)
    const blogToDelete = blogsAtStart[blogsAtStart.length - 1]
    console.log('deleting', blogToDelete)
  
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', token)
      .expect(204)
  
    const blogsAfterDelete = await api.get('/api/blogs')
    expect(blogsAfterDelete.body).toHaveLength(blogsAtStart.length - 1)
  
    const titles = blogsAfterDelete.body.map(r => r.title)
    expect(titles).not.toContain(blogToDelete.title)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
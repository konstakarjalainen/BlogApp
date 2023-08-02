const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const { tokenExtractor, userExtractor } = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
})

blogsRouter.post('/', tokenExtractor, userExtractor, async (request, response) => {
  const body = request.body
  const user = request.user
  console.log('User posting:', user.id)

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    user: user._id
  })
  const savedBlog = await blog.save()
  user.blogs = user.blogs.concat(savedBlog)
  await user.save()

  response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', tokenExtractor, userExtractor, async (request, response) => {
  const blogId = request.params.id
  const blogToRemove = await Blog.findById(blogId)
  if (!blogToRemove) {
    return response.status(404).json({ error: 'Blog not found' })
  }
  const user = request.user
  console.log('User trying to delete:', user.id)
  console.log('User who added blog:', blogToRemove.user.id.toString('hex'))
  if (user.id !== blogToRemove.user.id.toString('hex')){
    return response.status(401).json({ error: 'No rights to delete' })
  }
  await Blog.findByIdAndRemove(blogId)
  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {
  const body = request.body

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  }
  const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
  response.json(updatedBlog)
})

module.exports = blogsRouter
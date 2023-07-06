const dummy = (blogs) => {
  return blogs.length ** 0
}

const totalLikes = (blogs) => {
  const reducer = (sum, object) => {
    return sum + object.likes
  }
  return blogs.length == 0
    ? 0
    : blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
  let favorite = null
  let maxLikes = -1
  for (let i = 0; i < blogs.length; i++) {
    const currentBlog = blogs[i]
    const currentLikes = currentBlog.likes
    if (currentLikes > maxLikes) {
      maxLikes = currentLikes
      favorite = currentBlog
    }
  }
  return {
    title: favorite.title,
    author: favorite.author,
    likes: favorite.likes
  }
}

const _ = require('lodash')

const mostBlogs = (blogs) => {
  const blogCounter = _.countBy(blogs,'author')
  console.log('counter', blogCounter)
  const mostBlogsName = _.maxBy(_.keys(blogCounter), name => blogCounter[name])
  return {
    author: mostBlogsName,
    blogs: blogCounter[mostBlogsName]
  }
}

const mostLikes = (blogs) => {
  const blogsGrouped = _.groupBy(blogs,'author')
  console.log('counter', blogsGrouped)
  const mostLikesName = _.maxBy(_.keys(blogsGrouped), name => _.sumBy(blogsGrouped[name], 'likes'))
  const summedLikes = _.sumBy(blogsGrouped[mostLikesName], 'likes')
  return blogs.length === 0 
    ? 
    {
      author: undefined,
      likes: undefined
    }
    :
    {
      author: mostLikesName,
      likes: summedLikes
    }
}


module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}
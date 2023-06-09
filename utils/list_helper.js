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


module.exports = {
  dummy,
  totalLikes
}
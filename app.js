const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()
let db = null
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')
const initializeServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('SERVER STARTED !!!')
    })
  } catch (e) {
    console.log(`DB ERROR :${e.message}`)
    process.exit(-1)
  }
}
initializeServer()
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body

  const queryExists = `SELECT * FROM user
  WHERE username ='${username}';`
  const result1 = await db.get(queryExists)
  let givenPassword = `'${password}'`

  const lengthPassword = givenPassword.length
  if (result1 !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else if (lengthPassword < 5) {
    response.status(400)
    response.send('Password is too short')
  } else {
    const hashedpassword = await bcrypt.hash(givenPassword, 10)
    console.log(hashedpassword)
    const query2 = `
    INSERT INTO user (username,name,password,gender,location)
    VALUES('${username}','${name}','${hashedpassword}','${gender}','${location}');`
    await db.run(query2)
    response.status(200)
    response.send('User created successfully')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const query2 = `
  SELECT * FROM user WHERE username = '${username}';`

  const result2 = await db.get(query2)
  console.log(result2)
  if (result2 === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    console.log(result2.password)
    console.log(password)
    const passVer = await bcrypt.compare(password, result2.password)
    console.log(passVer)
    console.log(result2.password)
    if (passVer === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  let query1 = `
  SELECT * FROM user WHERE username = '${username}'`
  const result = await db.get(query1)
  const verPassword = await bcrypt.compare(oldPassword, result.password)
  console.log(verPassword)
  if (verPassword !== true) {
    response.status(400)
    response.send('Invalid current password')
  } else if (newPassword.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } else {
    const query2 = `
    UPDATE user 
    SET password = '${newPassword}'
    WHERE 
    username = '${username}';`
    await db.run(query2)
    response.status(200)
    response.send('Password updated')
  }
})
module.exports = app

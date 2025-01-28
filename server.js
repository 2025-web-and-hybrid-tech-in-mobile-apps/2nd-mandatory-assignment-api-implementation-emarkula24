const express = require("express");
const jwt = require("jsonwebtoken")
const passport = require("passport");
const passportJWT = require("passport-jwt");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const Ajv = require('ajv');
const ajv = new Ajv();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET_KEY = "secret"
const userArray = []
const highScores = []
app.use(express.json()); // for parsing application/json

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

const url = "https://stoplight.io/mocks/lassehav-oamk/gamehighscoreexercisespecification/330888982"

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET_KEY,
};

passport.use(jwtOptions, function (jwt_payload, done) {
  
})
const requestBodySchema = {
  type: "object",
  properties: {
    userHandle: { type: "string", minLength: 6 },
    password: { type: "string", minLength: 6 },
  },
  required: ["userHandle", "password"],
  additionalProperties: false,
};

const HighScoreRequestBodySchema = {
  type: "object",
  properties: {
    level: {type: "string"},
    userHandle: {type: "string"},
    score: {type: "integer"},
    timestamp: {type: "string"}
  },
  required: ["level", "userHandle", "score", "timestamp"], 
  additionalProperties: false,
};

function validateBody(schema) {
  return (req, res, next) => {
    // step 1 check if the request has a body
    const body = req.body;
    if(body === undefined) {
      res.status(400).send('Invalid request body');
      return;
    }

    // step 2 use AJV to validate the request body
    const validate = ajv.compile(schema);
    const valid = validate(body);

    // step 3 if the request body is invalid, send a 400 response with the errors
    if(!valid) {
      res.status(400).send(validate.errors);
      return;
    }
    // step 4 if the request body is valid, call next()
    next();
  }
};

function validateJWT(req, res, next) {
  const authHeader = req.get("Authorization");
  next();
}

app.post("/signup", validateBody(requestBodySchema), (req, res) => {
  const {userHandle, password} = req.body
    userArray.push({
      username: userHandle, 
      password: password
    });

    res.status(201).send("User registered successfully")
})

app.post("/login", validateBody(requestBodySchema), (req, res) => {
  const {userHandle, password} = req.body
  const user = userArray.find(
    (u) => u.username === userHandle && u.password === password
  );

  if (!user) {
    res.status(401).send("Unauthorized, incorrect username or password")
    return;
  }

  if (user) {
    const jsonwebtoken = jwt.sign({ username: userHandle }, JWT_SECRET_KEY);
    res.status(200).send({
      jsonWebToken: jsonwebtoken
    });
    return;

  } else {
    res.status(400).send("Bad request")
  }
})

app.post("/high-scores", validateBody(HighScoreRequestBodySchema), (req, res) => {
  try {
    const authHeader = req.get("Authorization");
    if (authHeader === undefined || !authHeader.startsWith("Bearer ")) {
      throw new Error;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET_KEY);

    const userExists = userArray.some(user => user.username === decoded.username);
    if (!userExists) {
      throw new Error;
    } 

    highScores.push(req.body)
    res.status(201).send("High score posted successfully")

  } catch(error) {
    res.status(401).send("Unauthorized, JWT token is missing or invalid")
    return;
  }
})

app.get("/high-scores", (req, res) => {
  const { level, page } = req.query

  const filteredScores = highScores.filter(score => score.level === level);

  const sortedScores = filteredScores.sort((a, b) => b.score - a.score);
  const pageSize = 20; 
  const pageNumber = page ? parseInt(page, 10) : 1;

  const startIndex = (pageNumber - 1) * pageSize;
  const paginatedScores = sortedScores.slice(startIndex, startIndex + pageSize);

   
  const response = paginatedScores.map(score => ({
    level: score.level,
    userHandle: score.userHandle,
    score: score.score,
    timestamp: score.timestamp,
  }));

  res.status(200).send(response);
})
//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};

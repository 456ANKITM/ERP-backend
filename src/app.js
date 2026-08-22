import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: "*", // Any origin can access this server
    credentials: true, // for cookies
  }),
);

// Expects every request to be json
app.use(express.json());

// This Middleware allows our server to read data sent from HTML forms, It parses incomming request bodies and put the data inside req.body
app.use(express.urlencoded({extended:true}))

// This middleware parses the cookies if sent from the frontend 
app.use(cookieParser())

// Routes 

// Test Route 
app.get("/", (req, res) => {
    res.status(200).json({
        message:"ERP API Running"
    })
})

export default app;

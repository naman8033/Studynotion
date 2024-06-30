//npm i express
//npm i mongoose
//npm i dotenv
//npm i nodemon
//npm i cookie-parser
//npm i jsonwebtoken
//npm i nodemailer
//npm i otp-generator
//npm i bcrpt

const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payment");
const courseRoutes = require("./routes/Course");

const database = require("./config/database");
const cookieParser = require("cookie-parser");

const {cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 4000;

//database connect
database.connect();
//middlewares
app.use(express.json());
app.use(cookieParser());


const cors = require('cors');
app.use(cors({ origin: 'http://localhost:3000' }));  //jo bhi req frontend s aarhi h usko aapko entertain krna h
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	next();
  });
app.use(
	fileUpload({
		useTempFiles:true,
		tempFileDir:"/tmp",
	})
)
//cloudinary connection
cloudinaryConnect();

//routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/course", courseRoutes);


//def route

app.get("/", (req, res) => {
	return res.json({
		success:true,
		message:'Your server is up and running....',
	});
});

app.listen(PORT, () => {
	console.log(`App is running at ${PORT}`)
})

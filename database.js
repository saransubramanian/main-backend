let mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/ticketApp")
  .then((m) => {
    console.log("Mongo Db Connected Successfully");
  })
  .catch((e) => {
    console.error("Mongo Db Not Connected...");
  });

const BookTic = new mongoose.Schema({
 
  selectcountry: { type: String, required: true },
  storeName: { type: String, required: true },
  booking: { type: String, required: true},
  stores: { type: String, required: true },
  bookingsummary: { type: String, required: true },
  title: { type: String, required: true },
  DateandTime: { type: Date, required: true, default: Date.now },
  ticketid: { type: String, required: true },         
  expectedEndDate: { type: Date, required: true },
  category: { type: String, required: true },
  jobDescription: { type: String, required: true },
  location: { type: String, required: true },
  beforeAttachments: { type: String, required: true }, 
  afterAttachments: { type: String, required: true },  
  ticketStatus: { type: String, required: true },
  totalbookings: { type: Number, required: true }
}, { timestamps: true });

const Users = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    countryCode: { type: String, required: true },
    mobileNumber: { type: Number, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true }

);
const ImageSchema = new mongoose.Schema({
filename:{type:String,required:true},
 data: {type: Buffer, required: true},
 contentType: {type: String, required: true},
  uploadedAt: {type: Date, default: Date.now}, 
  path: {type: String, required: true},
}, 
{timestamps:true}
);
const Image = mongoose.model('Image', ImageSchema);
const BookingTicket = mongoose.model("BookTickets", BookTic);
const UserDetail = mongoose.model("UserDetails", Users);


module.exports = { BookingTicket, UserDetail, Image };

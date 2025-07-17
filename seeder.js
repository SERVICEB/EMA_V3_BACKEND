/* --------- File: ema-residences-backend/seeder.js (optionnel) --------- */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Residence from "./models/Residence.js";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const residences = [
  {
    title: "Appartement Moderne",
    price: 40000,
    location: "Cocody, Abidjan",
    imageUrl: "https://source.unsplash.com/400x300/?apartment"
  },
  {
    title: "Studio Cosy",
    price: 30000,
    location: "Plateau, Abidjan",
    imageUrl: "https://source.unsplash.com/400x300/?studio"
  }
];

const importData = async () => {
  try {
    await Residence.deleteMany();
    await Residence.insertMany(residences);
    console.log("Données importées !");
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();


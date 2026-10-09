require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Travel Buddy Schema
const buddySchema = new mongoose.Schema({
    buddyId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    budget: {
        type: Number,
        required: true,
        min: 0
    },
    tripDuration: {
        type: Number,
        required: true,
        min: 1
    }
});

const Buddy = mongoose.model("Buddy", buddySchema);

// 1. Insert a travel buddy
app.post("/api/buddies", async (req, res) => {
    try {
        const buddy = await Buddy.create(req.body);
        res.status(201).json(buddy);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 2. Display all buddies, sorted by budget descending
app.get("/api/buddies", async (req, res) => {
    try {
        const buddies = await Buddy.find().sort({ budget: -1 });
        res.json(buddies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Filter by destination and minimum budget using $gt
app.get("/api/buddies/filter/search", async (req, res) => {
    try {
        const query = {};

        if (req.query.destination) {
            query.destination = {
                $regex: req.query.destination,
                $options: "i"
            };
        }

        if (req.query.minBudget !== undefined) {
            const amount = Number(req.query.minBudget);

            if (!Number.isFinite(amount) || amount < 0) {
                return res.status(400).json({
                    message: "Enter a valid minimum budget"
                });
            }

            query.budget = { $gt: amount };
        }

        const buddies = await Buddy.find(query).sort({ budget: -1 });
        res.json(buddies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. Find one buddy by Buddy ID
app.get("/api/buddies/:buddyId", async (req, res) => {
    try {
        const buddy = await Buddy.findOne({
            buddyId: req.params.buddyId
        });

        if (!buddy) {
            return res.status(404).json({
                message: "Travel buddy not found"
            });
        }

        res.json(buddy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 5. Projection: display selected fields only
app.get("/api/summary", async (req, res) => {
    try {
        const buddies = await Buddy.find()
            .select("name destination budget tripDuration -_id")
            .sort({ budget: -1 });

        res.json(buddies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 6. Find buddies within a budget range
app.get("/api/buddies-range/search", async (req, res) => {
    try {
        const min = Number(req.query.min);
        const max = Number(req.query.max);

        if (
            req.query.min === undefined ||
            req.query.max === undefined ||
            !Number.isFinite(min) ||
            !Number.isFinite(max) ||
            min < 0 ||
            max < min
        ) {
            return res.status(400).json({
                message: "Enter a valid minimum and maximum budget"
            });
        }

        const buddies = await Buddy.find({
            budget: { $gte: min, $lte: max }
        }).sort({ budget: -1 });

        res.json(buddies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 7. Update one buddy's destination and budget
app.put("/api/buddies/:buddyId", async (req, res) => {
    try {
        const { destination, budget } = req.body;

        if (
            typeof destination !== "string" ||
            !destination.trim() ||
            budget === undefined ||
            !Number.isFinite(Number(budget)) ||
            Number(budget) < 0
        ) {
            return res.status(400).json({
                message: "Enter a destination and valid budget"
            });
        }

        const buddy = await Buddy.findOneAndUpdate(
            { buddyId: req.params.buddyId },
            {
                $set: {
                    destination: destination.trim(),
                    budget: Number(budget)
                }
            },
            { new: true, runValidators: true }
        );

        if (!buddy) {
            return res.status(404).json({
                message: "Travel buddy not found"
            });
        }

        res.json(buddy);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 8. Update multiple buddies using $inc
app.patch("/api/buddies/bulk/increase-budget", async (req, res) => {
    try {
        const { destination, amount } = req.body;

        if (
            typeof destination !== "string" ||
            !destination.trim() ||
            amount === undefined ||
            !Number.isFinite(Number(amount))
        ) {
            return res.status(400).json({
                message: "Enter a destination and valid amount"
            });
        }

        const result = await Buddy.updateMany(
            {
                destination: {
                    $regex: "^" + destination.trim() + "$",
                    $options: "i"
                }
            },
            {
                $inc: { budget: Number(amount) }
            }
        );

        res.json({
            message: "Budget update completed",
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// 9. Delete a buddy by Buddy ID
app.delete("/api/buddies/:buddyId", async (req, res) => {
    try {
        const buddy = await Buddy.findOneAndDelete({
            buddyId: req.params.buddyId
        });

        if (!buddy) {
            return res.status(404).json({
                message: "Travel buddy not found"
            });
        }

        res.json({ message: "Travel buddy deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Connect to MongoDB and start the server
const PORT = process.env.PORT || 3000;

if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Check your .env file.");
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Travel Buddy Finder running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    });
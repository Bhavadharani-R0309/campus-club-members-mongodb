const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// Member Schema
// ===============================

const memberSchema = new mongoose.Schema({
    memberId: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    clubName: {
        type: String,
        required: true
    },

    yearOfStudy: {
        type: Number,
        required: true
    },

    role: {
        type: String,
        required: true
    },

    points: {
        type: Number,
        required: true
    },

    interests: {
        type: [String],
        default: []
    },

    status: {
        type: String,
        required: true
    }
});

const Member = mongoose.model("Member", memberSchema);


// ===============================
// Home Page
// ===============================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


// ===============================
// 1. Insert Member
// ===============================

app.post("/members", async (req, res) => {
    try {
        const member = new Member(req.body);

        await member.save();

        res.json({
            message: "Member added successfully",
            member: member
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ===============================
// 2. Display All Members
// ===============================

app.get("/members", async (req, res) => {
    try {
        const members = await Member.find();

        res.json(members);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ===============================
// 3. Filter by Club and Points
// ===============================

app.get("/members/filter/:clubName/:points", async (req, res) => {
    try {
        const members = await Member.find({
            clubName: req.params.clubName,
            points: {
                $gte: Number(req.params.points)
            }
        });

        res.json(members);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ===============================
// 4. Find One Member using Member ID
// ===============================

app.get("/members/id/:memberId", async (req, res) => {
    try {
        const member = await Member.findOne({
            memberId: req.params.memberId
        });

        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json(member);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ===============================
// 5. Display Only Name, Club, Role and Points
// ===============================

app.get("/members/details/:memberId", async (req, res) => {
    try {
        const member = await Member.findOne(
            {
                memberId: req.params.memberId
            },
            {
                _id: 0,
                name: 1,
                clubName: 1,
                role: 1,
                points: 1
            }
        );

        if (!member) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json(member);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ===============================
// 6. Delete Member using Member ID
// ===============================

app.delete("/members/:memberId", async (req, res) => {
    try {
        const result = await Member.deleteOne({
            memberId: req.params.memberId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Member not found"
            });
        }

        res.json({
            message: "Member deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ===============================
// MongoDB Connection
// ===============================

mongoose.connect(process.env.MONGO_URI)
    .then(() => {

        console.log("MongoDB Connected Successfully");

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log("Server running on port 3000");
        });

    })
    .catch((error) => {

        console.log("MongoDB Connection Error:");
        console.log(error.message);

    });
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
const SECRET_KEY = "task-management-secret";

app.use(cors());
app.use(express.json());
app.use(express.static("public"));


app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const users = JSON.parse(
        fs.readFileSync("./data/users.json", "utf8")
    );

    const existingUser = users.find(user => user.email === email);

    if (existingUser) {
        return res.status(400).json({
            message: "User already exists"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: Date.now(),
        name,
        email,
        password: hashedPassword
    };

    users.push(newUser);

    fs.writeFileSync(
        "./data/users.json",
        JSON.stringify(users, null, 2)
    );

    res.status(201).json({
        message: "Registration successful"
    });
});
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const users = JSON.parse(
        fs.readFileSync("./data/users.json", "utf8")
    );

    const user = users.find(user => user.email === email);

    if (!user) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    const passwordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!passwordMatch) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        SECRET_KEY,
        {
            expiresIn: "1h"
        }
    );

    res.json({
        message: "Login successful",
        token: token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
});
app.post("/api/tasks", (req, res) => {
    const { title, description, dueDate, userId } = req.body;

    if (!title || !userId) {
        return res.status(400).json({
            message: "Title and user ID are required"
        });
    }

    const tasks = JSON.parse(
        fs.readFileSync("./data/tasks.json", "utf8")
    );

    const newTask = {
        id: Date.now(),
        title,
        description: description || "",
        dueDate: dueDate || "",
        completed: false,
        userId
    };

    tasks.push(newTask);

    fs.writeFileSync(
        "./data/tasks.json",
        JSON.stringify(tasks, null, 2)
    );

    res.status(201).json({
        message: "Task created successfully",
        task: newTask
    });
});
app.get("/api/tasks/:userId", (req, res) => {
    const userId = Number(req.params.userId);

    const tasks = JSON.parse(
        fs.readFileSync("./data/tasks.json", "utf8")
    );

    const userTasks = tasks.filter(task => task.userId === userId);

    res.json(userTasks);
});
app.put("/api/tasks/:id", (req, res) => {
    const taskId = Number(req.params.id);
    const { title, description, dueDate, completed } = req.body;

    const tasks = JSON.parse(
        fs.readFileSync("./data/tasks.json", "utf8")
    );

    const task = tasks.find(task => task.id === taskId);

    if (!task) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (completed !== undefined) task.completed = completed;

    fs.writeFileSync(
        "./data/tasks.json",
        JSON.stringify(tasks, null, 2)
    );

    res.json({
        message: "Task updated successfully",
        task: task
    });
});
app.delete("/api/tasks/:id", (req, res) => {
    const taskId = Number(req.params.id);

    const tasks = JSON.parse(
        fs.readFileSync("./data/tasks.json", "utf8")
    );

    const newTasks = tasks.filter(task => task.id !== taskId);

    if (newTasks.length === tasks.length) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    fs.writeFileSync(
        "./data/tasks.json",
        JSON.stringify(newTasks, null, 2)
    );

    res.json({
        message: "Task deleted successfully"
    });
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
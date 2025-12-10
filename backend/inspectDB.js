const mongoose = require('mongoose');
require('dotenv').config();

const Course = require('./models/Course');
const Lecture = require('./models/Lecture');

const inspectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/ritik-platform');
        console.log('MongoDB connected');

        const courses = await Course.find().populate('lectures');
        const lectures = await Lecture.find();

        console.log('--- ALL LECTURES IN COLLECTION ---');
        lectures.forEach(l => {
            console.log(`ID: ${l._id}, Title: "${l.title}", URL: "${l.videoUrl}", Course: ${l.course}`);
        });

        console.log('\n--- COURSE -> LECTURE CONSISTENCY ---');
        courses.forEach(c => {
            console.log(`Course: "${c.title}" (ID: ${c._id})`);
            console.log(`  Expected Lectures (IDs in Course.lectures): ${c.lectures.length}`);

            c.lectures.forEach((l, index) => {
                if (!l) {
                    console.log(`  [${index}] NULL (Broken Reference!)`);
                } else {
                    console.log(`  [${index}] ID: ${l._id}, Title: "${l.title}", URL: "${l.videoUrl}"`);
                }
            });
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

inspectDB();

const express = require('express');
const app = express();
const authMiddleware = require('../middleware/auth'); 
const authController =require('../controllers/authController')
const productController =require('../controllers/productController')
const Category = require('../models/Category');
const Product = require('../models/Product');
const Banner = require('../models/Banner');
const Testimonial = require('../models/Testimonial');
const Blogs = require('../models/Blog');
const Users = require('../models/User');
const Order = require('../models/Order');



// Admin Login Page
app.get('/login', (req, res) => {
    res.render('admin-login', { title: 'Admin Login' });
});
app.get('/logout', authController.logout);


// Admin Dashboard (Protected Route)
app.get('/dashboard', authMiddleware, (req, res) => {
    res.render('admin-dashboard', { title: 'Admin Dashboard' });
});

// Manage banners (Protected Route)
app.get('/admin-banner', authMiddleware, async (req, res) => {
    try {
        const banners = await Banner.find();
        res.render('admin-banner', { title: 'Manage Banners', banners }); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving banners' });
    }
});
// Manage banners (Protected Route)
app.get('/admin-orders', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find();
        res.render('admin-orders', { title: 'Manage Banners', orders }); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving banners' });
    }
});
app.get('/admin-edit-banner/:id', authMiddleware, async (req, res) => {
    try {
        const bannerId = req.params.id; 
        const banner = await Banner.findById(bannerId); 
        if (!banner) {
            return res.status(404).send('Banner not found');
        }
        res.render('admin-edit-banner', { title: 'Edit Banner', banner }); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving banner' });
    }
});
app.get('/admin-add-banner', authMiddleware, (req, res) => {
    res.render('admin-add-banner', { title: 'Manage Banners' });
});


// manage proucts 
app.get('/admin-add-product', authMiddleware, async (req, res) => {
    try {
        res.render('admin-add-product', { title: 'Manage products' }); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/admin-products-list', authMiddleware, productController.listProducts);
app.get('/admin-edit-products/:id', authMiddleware, async (req, res) => {
    try {
        const productId = req.params.id; 
        const product = await Product.findById(productId); 
        const categories = await Category.find(); 
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('admin-edit-product', {
            title: 'Edit Product',
            product,
            categories
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// manage categories 
app.get('/admin-category-list', authMiddleware, (req, res) => {
    res.render('admin-category-list', { title: 'Manage categories' });
});
app.get('/admin-new-category', authMiddleware, (req, res) => {
    res.render('admin-new-category', { title: 'Manage categories' });
});
app.get('/admin-edit-category/:id', authMiddleware, async (req, res) => {
    try {
        const categoryId = req.params.id; 
        const category = await Category.findById(categoryId); 
        if (!category) {
            return res.status(404).send('Category not found');
        }
        res.render('admin-edit-category', {
            title: 'Edit Category',
            category
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// manage clients 

// manage testimonials 
app.get('/admin-testimonial', authMiddleware, async (req, res) => {
    try {
        const testimonials = await Testimonial.find();
        res.render('admin-testimonial', { title: 'Manage testimonials', testimonials });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/admin-edit-testimonial/:id', authMiddleware, async (req, res) => {
    try {
        const testimonialId = req.params.id;
        const testimonial = await Testimonial.findById(testimonialId);
        if (!testimonial) {
            return res.status(404).send('Testimonial not found');
        }
        res.render('admin-edit-testimonials', {
            title: 'Edit Testimonial',
            testimonial
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/admin-add-testimonials', authMiddleware, (req, res) => {
    res.render('admin-add-testimonials', { title: 'Manage testimonials' });
});

// manage blogs 
app.get('/admin-blogs', authMiddleware, async (req, res) => {
    try {
        const blogs = await Blogs.find();
        res.render('admin-blogs', { title: 'Manage testimonials', blogs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/admin-edit-blog/:id', authMiddleware, async (req, res) => {
    try {
        const blogId = req.params.id;
        const blog = await Blogs.findById(blogId);
        if (!blog) {
            return res.status(404).send('blog not found');
        }
        res.render('admin-edit-blog', {
            title: 'Edit blogs',
            blog
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/admin-add-blogs', authMiddleware, (req, res) => {
    res.render('admin-add-blogs', { title: 'Manage blogs' });
});

app.get('/admin-users', authMiddleware, async (req, res) => {
    try {
        const users = await Users.find();
        res.render('admin-users', { title: 'Manage users', users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/admin-block-user/:id', authMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        user.blocked = true;
        await user.save();
        res.redirect('/admin-users');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/admin-new-users', authMiddleware, (req, res) => {
    res.render('admin-new-users', { title: 'Manage user' });
});

module.exports = app;
